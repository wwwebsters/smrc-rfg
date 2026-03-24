/**
 * Seed script: imports data from the SMRC Excel spreadsheets into Turso.
 *
 * Required files (in the SMRC parent directory):
 *   - SMRC_Incentive_Master_2025.xlsx  (main data)
 *   - Runner_Name_Mapping.xlsx         (nickname -> full name + preferred nickname)
 *
 * Required env vars (in .env):
 *   - TURSO_DATABASE_URL
 *   - TURSO_AUTH_TOKEN
 *
 * Run with: npx tsx scripts/seed.ts
 */
import { createClient } from '@libsql/client';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

config(); // Load .env

const EXCEL_PATH = path.join(process.cwd(), '..', 'SMRC_Incentive_Master_2025.xlsx');
const NAME_MAP_PATH = path.join(process.cwd(), '..', 'Runner_Name_Mapping.xlsx');

if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`ERROR: ${EXCEL_PATH} not found.`);
  process.exit(1);
}
if (!fs.existsSync(NAME_MAP_PATH)) {
  console.error(`ERROR: ${NAME_MAP_PATH} not found.`);
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('ERROR: TURSO_DATABASE_URL not set in .env');
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
  // ---- Create tables (drop first for fresh start) ----
  console.log('Creating tables...');
  await db.batch([
    { sql: 'DROP TABLE IF EXISTS race_results', args: [] },
    { sql: 'DROP TABLE IF EXISTS runner_prs', args: [] },
    { sql: 'DROP TABLE IF EXISTS pending_submissions', args: [] },
    { sql: 'DROP TABLE IF EXISTS age_grading_standards', args: [] },
    { sql: 'DROP TABLE IF EXISTS age_grading_factors', args: [] },
    { sql: 'DROP TABLE IF EXISTS runners', args: [] },
  ], 'write');

  await db.batch([
    {
      sql: `CREATE TABLE runners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        birthday TEXT,
        age INTEGER
      )`, args: []
    },
    {
      sql: `CREATE TABLE runner_prs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runner_id INTEGER NOT NULL,
        distance TEXT NOT NULL,
        pr_time_seconds REAL,
        ag_pr_time_seconds REAL,
        ag_pr_date TEXT,
        age_at_ag_pr INTEGER,
        factor_at_race REAL,
        ag_time_seconds REAL,
        todays_factor REAL,
        target_seconds REAL,
        FOREIGN KEY (runner_id) REFERENCES runners(id),
        UNIQUE(runner_id, distance)
      )`, args: []
    },
    {
      sql: `CREATE TABLE race_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runner_id INTEGER NOT NULL,
        race_name TEXT NOT NULL,
        race_date TEXT NOT NULL,
        distance TEXT NOT NULL,
        finish_time_seconds REAL NOT NULL,
        points_earned INTEGER NOT NULL,
        points_type TEXT NOT NULL,
        race_number INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved',
        FOREIGN KEY (runner_id) REFERENCES runners(id)
      )`, args: []
    },
    {
      sql: `CREATE TABLE pending_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runner_nickname TEXT NOT NULL,
        race_name TEXT NOT NULL,
        race_date TEXT NOT NULL,
        distance TEXT NOT NULL,
        finish_time_seconds REAL NOT NULL,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL DEFAULT 'pending'
      )`, args: []
    },
    {
      sql: `CREATE TABLE age_grading_factors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER NOT NULL,
        distance TEXT NOT NULL,
        factor REAL NOT NULL,
        UNIQUE(age, distance)
      )`, args: []
    },
    {
      sql: `CREATE TABLE age_grading_standards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER NOT NULL,
        distance TEXT NOT NULL,
        standard_seconds REAL NOT NULL,
        UNIQUE(age, distance)
      )`, args: []
    },
  ], 'write');

  // ---- Load Name Mapping ----
  console.log('Loading name mapping...');
  const nameWb = XLSX.readFile(NAME_MAP_PATH);
  const nameSheet = nameWb.Sheets[nameWb.SheetNames[0]];
  const nameData = XLSX.utils.sheet_to_json<string[]>(nameSheet, { header: 1 }) as unknown[][];

  function normalizeName(name: string): string {
    if (name.includes(',')) {
      const parts = name.split(',', 2);
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
    return name;
  }

  const fullNameMap: Record<string, string> = {};
  const preferredNickMap: Record<string, string> = {};
  const nonPreferredNicks: Set<string> = new Set();

  for (let r = 1; r < nameData.length; r++) {
    const row = nameData[r] as unknown[];
    if (!row || !row[0]) continue;
    const nickname = String(row[0]).trim();
    const fullName = normalizeName(String(row[1] || '').trim());
    const isPreferred = String(row[2] || '').trim() === '*';
    fullNameMap[nickname] = fullName || nickname;
    if (isPreferred) preferredNickMap[fullName] = nickname;
  }

  for (let r = 1; r < nameData.length; r++) {
    const row = nameData[r] as unknown[];
    if (!row || !row[0]) continue;
    const nickname = String(row[0]).trim();
    const fullName = normalizeName(String(row[1] || '').trim());
    const isPreferred = String(row[2] || '').trim() === '*';
    if (!isPreferred && preferredNickMap[fullName] && preferredNickMap[fullName] !== nickname) {
      nonPreferredNicks.add(nickname);
    }
  }

  const nickRemap: Record<string, string> = {};
  for (let r = 1; r < nameData.length; r++) {
    const row = nameData[r] as unknown[];
    if (!row || !row[0]) continue;
    const nickname = String(row[0]).trim();
    const fullName = normalizeName(String(row[1] || '').trim());
    if (nonPreferredNicks.has(nickname) && preferredNickMap[fullName]) {
      nickRemap[nickname] = preferredNickMap[fullName];
    }
  }

  console.log(`  Preferred: ${Object.keys(preferredNickMap).length}, Non-preferred: ${nonPreferredNicks.size}`);
  console.log('  Remap:', nickRemap);

  // ---- Load main workbook ----
  const wb = XLSX.readFile(EXCEL_PATH);

  // ---- Import Age Grading Factors ----
  console.log('Importing age grading factors...');
  const factorsSheet = wb.Sheets['AgeStdFactors'];
  const factorsData = XLSX.utils.sheet_to_json<string[]>(factorsSheet, { header: 1 }) as unknown[][];
  const distanceHeaders = factorsData[1] as string[];
  const distanceNames = distanceHeaders.slice(1);

  // Batch in chunks of ~100 to avoid hitting limits
  let factorStatements: { sql: string; args: (string | number | null)[] }[] = [];
  for (let r = 5; r < factorsData.length; r++) {
    const row = factorsData[r] as (string | number)[];
    const age = Number(row[0]);
    if (isNaN(age) || age < 5) continue;
    for (let c = 1; c < row.length; c++) {
      const factor = Number(row[c]);
      if (isNaN(factor)) continue;
      factorStatements.push({
        sql: 'INSERT OR REPLACE INTO age_grading_factors (age, distance, factor) VALUES (?, ?, ?)',
        args: [age, distanceNames[c - 1], factor],
      });
    }
  }
  // Execute in chunks
  for (let i = 0; i < factorStatements.length; i += 80) {
    await db.batch(factorStatements.slice(i, i + 80), 'write');
  }
  console.log(`  Inserted ${factorStatements.length} factor rows`);

  // ---- Import Age Grading Standards ----
  console.log('Importing age grading standards...');
  const stdSheet = wb.Sheets['AgeStdSec'];
  const stdData = XLSX.utils.sheet_to_json<string[]>(stdSheet, { header: 1 }) as unknown[][];
  const stdHeaders = stdData[1] as string[];
  const stdDistNames = stdHeaders.slice(1);

  let stdStatements: { sql: string; args: (string | number | null)[] }[] = [];
  for (let r = 4; r < stdData.length; r++) {
    const row = stdData[r] as (string | number)[];
    const age = Number(row[0]);
    if (isNaN(age) || age < 5) continue;
    for (let c = 1; c < row.length; c++) {
      const secs = Number(row[c]);
      if (isNaN(secs)) continue;
      stdStatements.push({
        sql: 'INSERT OR REPLACE INTO age_grading_standards (age, distance, standard_seconds) VALUES (?, ?, ?)',
        args: [age, stdDistNames[c - 1], secs],
      });
    }
  }
  for (let i = 0; i < stdStatements.length; i += 80) {
    await db.batch(stdStatements.slice(i, i + 80), 'write');
  }
  console.log(`  Inserted ${stdStatements.length} standard rows`);

  // ---- Import Runners ----
  console.log('Importing runners from Input Sheet...');
  const inputSheet = wb.Sheets['Input Sheet - Targets'];
  const inputData = XLSX.utils.sheet_to_json<string[]>(inputSheet, { header: 1 }) as unknown[][];

  const INPUT_DIST_TO_DB: Record<string, string> = {
    '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
    '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
    '10 mile': '10 Mile', 'H_MAR': 'H. Mar', 'F_MAR': 'Marathon',
    '50k': '50 km', '50mile': '50 Mile', '100k': '100 km', '100mile': '100 Mile',
  };
  const INPUT_DISTANCES = Object.keys(INPUT_DIST_TO_DB);

  function excelDateToISO(serial: number): string | null {
    if (!serial || serial < 1) return null;
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  function timeToSeconds(val: unknown): number | null {
    if (val === null || val === undefined || val === 0) return null;
    if (typeof val === 'number') {
      if (val < 1) return Math.round(val * 86400);
      if (val > 100 && val < 50000) return val;
      return Math.round((val % 1) * 86400) || null;
    }
    if (typeof val === 'string') {
      const parts = val.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    return null;
  }

  interface ParsedRunner {
    nickname: string;
    birthday: string | null;
    age: number | null;
    prs: Record<string, Record<string, unknown>>;
  }

  function parseRunnerBlocks(): ParsedRunner[] {
    const runners: ParsedRunner[] = [];
    for (let r = 0; r < inputData.length; r++) {
      const row = inputData[r] as unknown[];
      if (!row) continue;
      const blocks = [
        { nameCol: 2, birthdayValCol: 6, ageCol: 7, prStartCol: 3 },
        { nameCol: 14, birthdayValCol: 18, ageCol: 19, prStartCol: 15 },
      ];
      for (const block of blocks) {
        const name = row[block.nameCol];
        if (typeof name !== 'string' || !name.trim()) continue;
        if (['Example', 'Birthday', 'PR', 'AG PR'].includes(name)) continue;
        const nextRow = inputData[r + 1] as unknown[] | undefined;
        if (!nextRow) continue;
        let birthday: string | null = null;
        let age: number | null = null;
        const bdayVal = nextRow[block.birthdayValCol];
        if (typeof bdayVal === 'number' && bdayVal > 1000) birthday = excelDateToISO(bdayVal);
        const ageVal = nextRow[block.ageCol];
        if (typeof ageVal === 'number') age = ageVal;
        if (!birthday && !age) continue;
        const headerRowIdx = r + 3;
        const headerRow = inputData[headerRowIdx] as unknown[] | undefined;
        if (!headerRow) continue;
        if (headerRow[block.prStartCol] !== 'PR') continue;
        const prs: Record<string, Record<string, unknown>> = {};
        for (let d = 0; d < INPUT_DISTANCES.length; d++) {
          const distRow = inputData[headerRowIdx + 1 + d] as unknown[] | undefined;
          if (!distRow) continue;
          const distName = distRow[block.prStartCol - 1];
          if (typeof distName !== 'string') continue;
          const prCol = block.prStartCol;
          prs[INPUT_DISTANCES[d]] = {
            pr_time: distRow[prCol], ag_pr_time: distRow[prCol + 1],
            ag_pr_date: distRow[prCol + 2], age_at_ag_pr: distRow[prCol + 3],
            factor_at_race: distRow[prCol + 4], ag_time: distRow[prCol + 5],
            todays_factor: distRow[prCol + 6], target: distRow[prCol + 7],
          };
        }
        runners.push({ nickname: name.trim(), birthday, age, prs });
      }
    }
    return runners;
  }

  const runnerBlocks = parseRunnerBlocks();
  console.log(`Found ${runnerBlocks.length} runners in Input Sheet`);

  // Apply nickname remap
  for (const runner of runnerBlocks) {
    if (nickRemap[runner.nickname]) {
      console.log(`  Remapping ${runner.nickname} -> ${nickRemap[runner.nickname]}`);
      runner.nickname = nickRemap[runner.nickname];
    }
  }

  // Merge duplicates
  const mergedRunners = new Map<string, ParsedRunner>();
  for (const runner of runnerBlocks) {
    const existing = mergedRunners.get(runner.nickname);
    if (existing) {
      for (const [dist, pr] of Object.entries(runner.prs)) {
        if (!existing.prs[dist]) existing.prs[dist] = pr;
      }
      if (!existing.birthday && runner.birthday) existing.birthday = runner.birthday;
      if (!existing.age && runner.age) existing.age = runner.age;
    } else {
      mergedRunners.set(runner.nickname, { ...runner });
    }
  }

  // Insert runners and PRs
  for (const [, runner] of mergedRunners) {
    const displayName = fullNameMap[runner.nickname] || runner.nickname;
    await db.execute({
      sql: 'INSERT OR REPLACE INTO runners (nickname, full_name, birthday, age) VALUES (?, ?, ?, ?)',
      args: [runner.nickname, displayName, runner.birthday, runner.age],
    });
    const row = await db.execute({
      sql: 'SELECT id FROM runners WHERE nickname = ?',
      args: [runner.nickname],
    });
    const runnerId = row.rows[0].id as number;

    const prStatements: { sql: string; args: (string | number | null)[] }[] = [];
    for (const [inputDist, pr] of Object.entries(runner.prs)) {
      const dbDist = INPUT_DIST_TO_DB[inputDist] || inputDist;
      prStatements.push({
        sql: `INSERT OR REPLACE INTO runner_prs
              (runner_id, distance, pr_time_seconds, ag_pr_time_seconds, ag_pr_date,
               age_at_ag_pr, factor_at_race, ag_time_seconds, todays_factor, target_seconds)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          runnerId, dbDist,
          timeToSeconds(pr.pr_time), timeToSeconds(pr.ag_pr_time),
          typeof pr.ag_pr_date === 'number' ? excelDateToISO(pr.ag_pr_date) : null,
          typeof pr.age_at_ag_pr === 'number' && (pr.age_at_ag_pr as number) > 0 ? pr.age_at_ag_pr as number : null,
          typeof pr.factor_at_race === 'number' ? pr.factor_at_race as number : null,
          timeToSeconds(pr.ag_time),
          typeof pr.todays_factor === 'number' ? pr.todays_factor as number : null,
          timeToSeconds(pr.target),
        ],
      });
    }
    if (prStatements.length > 0) {
      await db.batch(prStatements, 'write');
    }
  }

  // ---- Leaderboard-only runners ----
  console.log('Importing leaderboard runners...');
  const lbSheet = wb.Sheets['Leaderboard'];
  const lbData = XLSX.utils.sheet_to_json<string[]>(lbSheet, { header: 1 }) as unknown[][];

  for (let r = 2; r < 30; r++) {
    const row = lbData[r] as unknown[] | undefined;
    if (!row) continue;
    let name = row[1];
    if (typeof name !== 'string' || !name.trim()) continue;
    name = name.trim();
    const remapped = nickRemap[name] || name;
    const existing = await db.execute({ sql: 'SELECT id FROM runners WHERE nickname = ?', args: [remapped] });
    if (existing.rows.length === 0) {
      const displayName = fullNameMap[remapped] || fullNameMap[name] || remapped;
      await db.execute({
        sql: 'INSERT INTO runners (nickname, full_name, birthday, age) VALUES (?, ?, ?, ?)',
        args: [remapped, displayName, null, null],
      });
      console.log(`  Added leaderboard-only runner: ${remapped} (${displayName})`);
    }
  }

  console.log('Skipping 2025 race results (starting fresh for 2026 season)');

  // ---- Summary ----
  const counts = await db.batch([
    { sql: 'SELECT COUNT(*) as c FROM runners', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM runner_prs', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM race_results', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM age_grading_factors', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM age_grading_standards', args: [] },
  ], 'read');

  console.log('\n=== Seed Complete ===');
  console.log(`Runners: ${counts[0].rows[0].c}`);
  console.log(`PR records: ${counts[1].rows[0].c}`);
  console.log(`Race results: ${counts[2].rows[0].c}`);
  console.log(`Age grading factors: ${counts[3].rows[0].c}`);
  console.log(`Age grading standards: ${counts[4].rows[0].c}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
