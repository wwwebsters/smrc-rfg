/**
 * Rebuild ../Runner_Name_Mapping.xlsx from the current database.
 *
 * Sheet 1 "Name Mapping" keeps the contract scripts/seed.ts depends on:
 *   col A = nickname, col B = "Last, First", col C = "*" on the preferred
 *   nickname for that person. Extra columns are ignored by the seed.
 * Sheets 2 and 3 are reference only: the attendance roster link and the
 * RSVP email mapping.
 *
 * Reads from .env.dev by default (a mirror of live); pass --live to read .env.
 * Never writes to the database.
 *
 * Run with: node scripts/build-name-mapping.mjs [--live]
 */

import { createClient } from '@libsql/client';
import { readFileSync, copyFileSync, existsSync } from 'fs';
import xlsx from 'xlsx';

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const envFile = process.argv.includes('--live') ? '.env' : '.env.dev';
const env = loadEnv(envFile);
const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

const OUT = '../Runner_Name_Mapping.xlsx';

/**
 * Historical / alternate nicknames that must collapse onto the live nickname.
 * Keyed alias -> live RFG nickname. Anything in here that no longer resolves
 * to a live runner is reported and dropped, so the file cannot drift silently.
 */
const ALIASES = {
  'Chip': 'Hamma',
  'Timmy': '.75',
  'Joe Dirt': 'Joe Durt',
  'Joe D.': 'Joe Durt',
  'Emily D.': 'Emily',
  "Flyin'": 'Flyin Brian',
  '0Dark': '0Dark30',
  'Kenji': 'MG',
  'Goat': 'MG',
  'Logan': 'Taz',
  'Wolverine': 'Taz',
  'Grace': 'KGB',
  'Brian Jordan': 'Hulk',
  '3Ball': '3 Ball',
  'DMac': 'Dmac',
  'JMil': 'J-Mill',
  'Cindy': 'C-Rich',
  'CRich': 'C-Rich',
  'Crich': 'C-Rich',
  'Captn': 'Captain',
  'MDub': 'M-Dub',
  'Joe Z': 'JZ',
  'Scott': 'Stewy',
  'Hidetake': 'Luke',
};

// "Mike Webster" -> "Webster, Mike"
function lastFirst(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length < 2) return fullName || '';
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
}

const q = async (sql, args = []) => (await db.execute({ sql, args })).rows.map((r) => ({ ...r }));

async function main() {
  console.log(`Reading ${envFile} -> ${env.TURSO_DATABASE_URL.replace('libsql://', '').split('.')[0]}\n`);

  const runners = await q('SELECT id, nickname, full_name, hidden FROM runners ORDER BY id');
  const attendance = await q(
    `SELECT ar.id, ar.nickname, ar.full_name, ar.rfg_runner_id, r.nickname AS rfg_nickname, r.full_name AS rfg_full_name
     FROM attendance_runners ar
     LEFT JOIN runners r ON r.id = ar.rfg_runner_id
     ORDER BY ar.nickname COLLATE NOCASE`
  );
  const emails = await q(
    `SELECT em.email, em.attendance_nickname, em.runner_id,
            ar.nickname AS linked_attendance_nickname, r.nickname AS rfg_nickname
     FROM attendance_email_mappings em
     LEFT JOIN attendance_runners ar ON ar.id = em.runner_id
     LEFT JOIN runners r ON r.id = ar.rfg_runner_id
     ORDER BY em.email`
  );

  const byNickname = new Map(runners.map((r) => [r.nickname, r]));
  const attendanceByRfgId = new Map();
  for (const a of attendance) {
    if (a.rfg_runner_id) attendanceByRfgId.set(a.rfg_runner_id, a.nickname);
  }

  // ---- Sheet 1: Name Mapping ----
  const rows = [];

  for (const r of runners) {
    rows.push({
      nickname: r.nickname,
      fullName: lastFirst(r.full_name),
      preferred: '*',
      attendance: attendanceByRfgId.get(r.id) || '',
      notes: r.hidden ? 'hidden from leaderboard' : '',
      sortKey: lastFirst(r.full_name),
    });
  }

  for (const [alias, preferred] of Object.entries(ALIASES)) {
    const target = byNickname.get(preferred);
    if (!target) {
      console.log(`  WARNING: alias "${alias}" -> "${preferred}" has no live runner, dropped`);
      continue;
    }
    if (alias === preferred) continue;
    rows.push({
      nickname: alias,
      fullName: lastFirst(target.full_name),
      preferred: '',
      attendance: '',
      notes: `alias for ${preferred}`,
      sortKey: lastFirst(target.full_name),
    });
  }

  // Group by person (last, first), preferred row first within each group.
  rows.sort((a, b) => {
    const k = a.sortKey.localeCompare(b.sortKey);
    if (k !== 0) return k;
    if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
    return a.nickname.localeCompare(b.nickname);
  });

  const nameSheet = [
    ['Nickname', 'Full Name', 'Preferred Nickname', 'Attendance Nickname', 'Notes'],
    ...rows.map((r) => [r.nickname, r.fullName, r.preferred, r.attendance, r.notes]),
  ];

  // ---- Sheet 2: Attendance Mapping ----
  const attSheet = [
    ['Attendance Nickname', 'Attendance Full Name', 'RFG Nickname', 'RFG Full Name', 'RFG Runner ID', 'Linked'],
    ...attendance.map((a) => [
      a.nickname,
      a.full_name || '',
      a.rfg_nickname || '',
      a.rfg_full_name || '',
      a.rfg_runner_id || '',
      a.rfg_runner_id ? 'yes' : 'attendance only',
    ]),
  ];

  // ---- Sheet 3: Email Mapping ----
  const emailSheet = [
    ['Email', 'Attendance Nickname', 'Linked Attendance Runner', 'RFG Nickname', 'Status'],
    ...emails.map((e) => {
      let status = 'ok';
      if (!e.linked_attendance_nickname) status = 'NOT LINKED — runner_id missing';
      else if (e.linked_attendance_nickname !== e.attendance_nickname) {
        status = `MISMATCH — runner_id points to ${e.linked_attendance_nickname}`;
      } else if (!e.rfg_nickname) status = 'ok (attendance only)';
      return [e.email, e.attendance_nickname, e.linked_attendance_nickname || '', e.rfg_nickname || '', status];
    }),
  ];

  const wb = xlsx.utils.book_new();
  const s1 = xlsx.utils.aoa_to_sheet(nameSheet);
  s1['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 26 }];
  const s2 = xlsx.utils.aoa_to_sheet(attSheet);
  s2['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 16 }];
  const s3 = xlsx.utils.aoa_to_sheet(emailSheet);
  s3['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 24 }, { wch: 16 }, { wch: 38 }];
  xlsx.utils.book_append_sheet(wb, s1, 'Name Mapping');
  xlsx.utils.book_append_sheet(wb, s2, 'Attendance Mapping');
  xlsx.utils.book_append_sheet(wb, s3, 'Email Mapping');

  // Only ever back up once, so re-running never overwrites the original file.
  const bak = OUT.replace(/\.xlsx$/, '_backup.xlsx');
  if (existsSync(OUT) && !existsSync(bak)) {
    copyFileSync(OUT, bak);
    console.log(`  Backed up previous file to ${bak}`);
  }
  xlsx.writeFile(wb, OUT);

  const problems = emailSheet.slice(1).filter((r) => r[4].startsWith('MISMATCH') || r[4].startsWith('NOT LINKED'));
  console.log(`\nWrote ${OUT}`);
  console.log(`  Name Mapping        ${nameSheet.length - 1} rows (${runners.length} runners + ${nameSheet.length - 1 - runners.length} aliases)`);
  console.log(`  Attendance Mapping  ${attSheet.length - 1} rows (${attendance.filter((a) => a.rfg_runner_id).length} linked to RFG)`);
  console.log(`  Email Mapping       ${emailSheet.length - 1} rows (${problems.length} needing attention)`);
  for (const p of problems) console.log(`    ${p[0]} -> ${p[1]}: ${p[4]}`);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
