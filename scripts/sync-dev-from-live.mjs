/**
 * Sync DEV database from LIVE.
 *
 * Reads schema + all rows from the LIVE Turso DB (.env) and replaces the
 * contents of the DEV Turso DB (.env.dev). LIVE is only ever read from.
 *
 * Backs the DEV database up to backups/devdb-before-sync-<stamp>.json first.
 *
 * Run with: node scripts/sync-dev-from-live.mjs [--yes]
 */

import { createClient } from '@libsql/client';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const liveEnv = loadEnv('.env');
const devEnv = loadEnv('.env.dev');

if (liveEnv.TURSO_DATABASE_URL === devEnv.TURSO_DATABASE_URL) {
  console.error('ABORT: .env and .env.dev point at the same database.');
  process.exit(1);
}

const live = createClient({ url: liveEnv.TURSO_DATABASE_URL, authToken: liveEnv.TURSO_AUTH_TOKEN });
const dev = createClient({ url: devEnv.TURSO_DATABASE_URL, authToken: devEnv.TURSO_AUTH_TOKEN });

const short = (u) => u.replace('libsql://', '').split('.')[0];

async function objects(db, type) {
  const r = await db.execute({
    sql: `SELECT name, sql FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY name`,
    args: [type],
  });
  return r.rows.map((row) => ({ name: row.name, sql: row.sql }));
}

/**
 * Order tables parents-first, so inserts never violate a foreign key.
 * libsql opens a fresh connection per request, so `PRAGMA foreign_keys = OFF`
 * does not survive to the batch inserts — ordering is the reliable fix.
 */
async function topoSort(db, tables) {
  const names = tables.map((t) => t.name);
  const deps = new Map();
  for (const name of names) {
    const r = await db.execute(`PRAGMA foreign_key_list("${name}")`);
    const parents = new Set(
      r.rows.map((row) => row.table).filter((p) => names.includes(p) && p !== name)
    );
    deps.set(name, parents);
  }

  const ordered = [];
  const placed = new Set();
  while (ordered.length < names.length) {
    const ready = names.filter(
      (n) => !placed.has(n) && [...deps.get(n)].every((p) => placed.has(p))
    );
    if (!ready.length) {
      // Cycle — emit the rest in their original order and let it fail loudly.
      const rest = names.filter((n) => !placed.has(n));
      console.log(`   warning: FK cycle among ${rest.join(', ')}`);
      ordered.push(...rest);
      break;
    }
    for (const n of ready) {
      ordered.push(n);
      placed.add(n);
    }
  }
  return ordered.map((n) => tables.find((t) => t.name === n));
}

async function main() {
  console.log(`\nSOURCE (live): ${short(liveEnv.TURSO_DATABASE_URL)}`);
  console.log(`TARGET (dev):  ${short(devEnv.TURSO_DATABASE_URL)}\n`);

  const liveTables = await objects(live, 'table');
  const liveIndexes = await objects(live, 'index');
  const liveViews = await objects(live, 'view');
  const liveTriggers = await objects(live, 'trigger');

  // ---- 1. Back up the dev database as it stands ----
  const devTables = await objects(dev, 'table');
  const backupDir = 'backups';
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = `${backupDir}/devdb-before-sync-${stamp}.json`;

  // Never overwrite an existing backup — a re-run after a partial sync would
  // otherwise replace the good pre-sync copy with the half-written state.
  if (existsSync(backupFile)) {
    console.log(`1. Backup already exists, keeping it: ${backupFile}\n`);
  } else {
    console.log('1. Backing up current DEV data...');
    const devBackup = { created: new Date().toISOString(), source: devEnv.TURSO_DATABASE_URL, schema: devTables, tables: {} };
    for (const t of devTables) {
      const r = await dev.execute(`SELECT * FROM "${t.name}"`);
      devBackup.tables[t.name] = r.rows.map((row) => ({ ...row }));
      console.log(`   ${t.name.padEnd(28)} ${String(r.rows.length).padStart(6)} rows`);
    }
    writeFileSync(backupFile, JSON.stringify(devBackup, null, 2));
    console.log(`   Saved: ${backupFile}\n`);
  }

  // ---- 2. Read everything from live ----
  console.log('2. Reading LIVE data...');
  const data = {};
  for (const t of liveTables) {
    const r = await live.execute(`SELECT * FROM "${t.name}"`);
    data[t.name] = r.rows.map((row) => ({ ...row }));
    console.log(`   ${t.name.padEnd(28)} ${String(r.rows.length).padStart(6)} rows`);
  }

  // ---- 3. Rebuild dev schema to match live ----
  console.log('\n3. Rebuilding DEV schema...');
  // Drop children before parents, create parents before children.
  const devOrder = await topoSort(dev, devTables);
  for (const t of [...devOrder].reverse()) {
    await dev.execute(`DROP TABLE IF EXISTS "${t.name}"`);
  }
  for (const v of liveViews) {
    await dev.execute(`DROP VIEW IF EXISTS "${v.name}"`);
  }
  const insertOrder = await topoSort(live, liveTables);
  for (const t of insertOrder) {
    await dev.execute(t.sql);
  }
  console.log(`   Created ${liveTables.length} tables`);

  // ---- 4. Copy rows ----
  console.log('\n4. Copying rows into DEV...');
  for (const t of insertOrder) {
    const rows = data[t.name];
    if (!rows.length) {
      console.log(`   ${t.name.padEnd(28)}      0 rows`);
      continue;
    }
    const columns = Object.keys(rows[0]);
    const sql = `INSERT INTO "${t.name}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50).map((row) => ({
        sql,
        args: columns.map((c) => (row[c] === undefined ? null : row[c])),
      }));
      await dev.batch(batch, 'write');
    }
    console.log(`   ${t.name.padEnd(28)} ${String(rows.length).padStart(6)} rows`);
  }

  // ---- 5. Indexes, views, triggers ----
  console.log('\n5. Recreating indexes / views / triggers...');
  for (const o of [...liveIndexes, ...liveViews, ...liveTriggers]) {
    try {
      await dev.execute(o.sql);
    } catch (e) {
      console.log(`   skipped ${o.name}: ${e.message}`);
    }
  }
  console.log(`   ${liveIndexes.length} indexes, ${liveViews.length} views, ${liveTriggers.length} triggers`);

  // ---- 6. Verify ----
  console.log('\n6. Verifying row counts (live vs dev)...');
  let mismatch = 0;
  for (const t of liveTables) {
    const l = (await live.execute(`SELECT COUNT(*) AS c FROM "${t.name}"`)).rows[0].c;
    const d = (await dev.execute(`SELECT COUNT(*) AS c FROM "${t.name}"`)).rows[0].c;
    const ok = Number(l) === Number(d);
    if (!ok) mismatch++;
    console.log(`   ${ok ? 'OK  ' : 'FAIL'} ${t.name.padEnd(28)} live=${String(l).padStart(6)} dev=${String(d).padStart(6)}`);
  }

  console.log(mismatch === 0 ? '\n=== Sync complete: all tables match ===\n' : `\n=== Sync finished with ${mismatch} mismatched table(s) ===\n`);
  console.log(`Dev backup kept at: ${backupFile}\n`);
  process.exit(mismatch === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\nFAILED:', e);
  process.exit(1);
});
