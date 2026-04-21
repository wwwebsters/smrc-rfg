/**
 * Seed attendance data from the 2026_Attendance.xlsx spreadsheet into Turso.
 *
 * Creates attendance tables and imports historical data from 2023-2026.
 *
 * Run with: npx tsx scripts/seed-attendance.ts
 */
import { createClient } from '@libsql/client';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

config(); // Load .env

const ATTENDANCE_PATH = path.join(
  process.cwd(),
  '..',
  'claudeclaw',
  'workspace',
  'uploads',
  '1776733033404_2026_Attendance.xlsx'
);

if (!fs.existsSync(ATTENDANCE_PATH)) {
  console.error(`ERROR: ${ATTENDANCE_PATH} not found.`);
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('ERROR: TURSO_DATABASE_URL not set in .env');
  process.exit(1);
}

const db = createClient({ url, authToken });

// Timmy Year: second Saturday of December through first Saturday of following December
function getTimmsYear(dateStr: string): number {
  // dateStr is like "12/13" - we need to figure out the year
  // For now, we'll pass the actual year context when calling this
  return 0; // placeholder, handled per-sheet
}

function parseWeekDate(dateStr: string, sheetYear: number): string | null {
  // dateStr like "12/13", "1/3", etc.
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  // Timmy Year starts in December of previous year
  // So for sheet "2026", December dates are in 2025
  const year = month === 12 ? sheetYear - 1 : sheetYear;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function main() {
  console.log('Creating attendance tables...');

  // Create attendance tables (don't drop RFG tables!)
  await db.batch([
    { sql: 'DROP TABLE IF EXISTS attendance_records', args: [] },
    { sql: 'DROP TABLE IF EXISTS attendance_weeks', args: [] },
    { sql: 'DROP TABLE IF EXISTS attendance_runners', args: [] },
    { sql: 'DROP TABLE IF EXISTS attendance_rsvp_queue', args: [] },
  ], 'write');

  await db.batch([
    {
      sql: `CREATE TABLE attendance_runners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL UNIQUE,
        full_name TEXT,
        email TEXT,
        rfg_runner_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (rfg_runner_id) REFERENCES runners(id)
      )`, args: []
    },
    {
      sql: `CREATE TABLE attendance_weeks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_date TEXT NOT NULL UNIQUE,
        timmy_year INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        approved_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`, args: []
    },
    {
      sql: `CREATE TABLE attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runner_id INTEGER NOT NULL,
        week_id INTEGER NOT NULL,
        present INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'import',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (runner_id) REFERENCES attendance_runners(id),
        FOREIGN KEY (week_id) REFERENCES attendance_weeks(id),
        UNIQUE(runner_id, week_id)
      )`, args: []
    },
    {
      sql: `CREATE TABLE attendance_rsvp_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_id INTEGER NOT NULL,
        runner_nickname TEXT NOT NULL,
        rsvp_status TEXT NOT NULL,
        email_from TEXT,
        email_snippet TEXT,
        parsed_at TEXT NOT NULL DEFAULT (datetime('now')),
        processed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (week_id) REFERENCES attendance_weeks(id)
      )`, args: []
    },
  ], 'write');

  console.log('Tables created.');

  // Load the attendance workbook
  const wb = XLSX.readFile(ATTENDANCE_PATH);

  // Process sheets 2023, 2024, 2025, 2026 (skip SMBC sheets)
  const sheetsToProcess = ['2023', '2024', '2025', '2026'];

  // Collect all unique nicknames across all sheets
  const allNicknames = new Set<string>();

  for (const sheetName of sheetsToProcess) {
    if (!wb.SheetNames.includes(sheetName)) {
      console.log(`Sheet ${sheetName} not found, skipping.`);
      continue;
    }

    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) as unknown[][];

    // Row 0 has column headers like "SMRC 2026 Timmy Year..."
    // Row 1 has: [empty, "Total", "12/13", "12/20", ...] - actual date headers
    // Rows 2+ are runners with nickname in col 0, total in col 1, dates in cols 2+
    for (let r = 2; r < data.length; r++) {
      const row = data[r] as unknown[];
      if (!row || !row[0]) continue;
      const nickname = String(row[0]).trim();
      if (!nickname || nickname === 'NaN') continue;
      // Skip summary rows (rows that start with a number as total)
      if (/^\d+$/.test(nickname)) continue;
      allNicknames.add(nickname);
    }
  }

  console.log(`Found ${allNicknames.size} unique nicknames across all sheets.`);

  // Try to match attendance nicknames to RFG runners
  const rfgRunners = await db.execute({
    sql: 'SELECT id, nickname, full_name FROM runners',
    args: [],
  });

  const rfgNickMap = new Map<string, { id: number; full_name: string }>();
  for (const row of rfgRunners.rows) {
    const nick = String(row.nickname).toLowerCase();
    rfgNickMap.set(nick, { id: row.id as number, full_name: row.full_name as string });
  }

  // Insert attendance runners
  const nicknameToId = new Map<string, number>();

  for (const nickname of allNicknames) {
    const rfgMatch = rfgNickMap.get(nickname.toLowerCase());
    const result = await db.execute({
      sql: `INSERT INTO attendance_runners (nickname, full_name, rfg_runner_id) VALUES (?, ?, ?)`,
      args: [nickname, rfgMatch?.full_name || null, rfgMatch?.id || null],
    });
    nicknameToId.set(nickname, Number(result.lastInsertRowid));

    if (rfgMatch) {
      console.log(`  Matched: ${nickname} -> RFG runner ${rfgMatch.full_name}`);
    }
  }

  console.log(`Inserted ${nicknameToId.size} attendance runners.`);

  // Now process each year's data
  for (const sheetName of sheetsToProcess) {
    if (!wb.SheetNames.includes(sheetName)) continue;

    const timmyYear = parseInt(sheetName, 10);
    console.log(`\nProcessing Timmy Year ${timmyYear}...`);

    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }) as unknown[][];

    // Row 0 has column headers like "SMRC 2026 Timmy Year..."
    // Row 1 has: [empty, "Total", "12/13", "12/20", ...] - actual date headers
    const headerRow = data[1] as unknown[];

    // Find all date columns (starting at col 2)
    const weekDates: { col: number; date: string; weekNum: number }[] = [];
    let weekNum = 1;

    for (let c = 2; c < headerRow.length; c++) {
      const dateStr = headerRow[c];
      if (!dateStr || typeof dateStr !== 'string') continue;
      // Skip non-date strings
      if (!dateStr.includes('/')) continue;
      const parsed = parseWeekDate(dateStr, timmyYear);
      if (parsed) {
        weekDates.push({ col: c, date: parsed, weekNum: weekNum++ });
      }
    }

    console.log(`  Found ${weekDates.length} weeks in ${sheetName}`);

    // Insert weeks
    const weekIdMap = new Map<string, number>();

    for (const week of weekDates) {
      const result = await db.execute({
        sql: `INSERT OR IGNORE INTO attendance_weeks (week_date, timmy_year, week_number, status) VALUES (?, ?, ?, 'approved')`,
        args: [week.date, timmyYear, week.weekNum],
      });

      // Get the ID (might be existing if we had a conflict)
      const existing = await db.execute({
        sql: 'SELECT id FROM attendance_weeks WHERE week_date = ?',
        args: [week.date],
      });
      weekIdMap.set(week.date, existing.rows[0].id as number);
    }

    // Insert attendance records
    // Data rows start at row 2 (row 0 is title, row 1 is date headers)
    let recordCount = 0;

    for (let r = 2; r < data.length; r++) {
      const row = data[r] as unknown[];
      if (!row || !row[0]) continue;
      const nickname = String(row[0]).trim();
      if (!nickname || nickname === 'NaN') continue;
      if (/^\d+$/.test(nickname)) continue; // Skip summary rows

      const runnerId = nicknameToId.get(nickname);
      if (!runnerId) continue;

      for (const week of weekDates) {
        const cellVal = row[week.col];
        const present = cellVal === 1 || cellVal === '1' ? 1 : 0;

        const weekId = weekIdMap.get(week.date);
        if (!weekId) continue;

        await db.execute({
          sql: `INSERT OR REPLACE INTO attendance_records (runner_id, week_id, present, source) VALUES (?, ?, ?, 'import')`,
          args: [runnerId, weekId, present],
        });

        if (present) recordCount++;
      }
    }

    console.log(`  Inserted ${recordCount} attendance records for ${sheetName}`);
  }

  // Summary
  const counts = await db.batch([
    { sql: 'SELECT COUNT(*) as c FROM attendance_runners', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM attendance_weeks', args: [] },
    { sql: 'SELECT COUNT(*) as c FROM attendance_records WHERE present = 1', args: [] },
  ], 'read');

  console.log('\n=== Attendance Seed Complete ===');
  console.log(`Attendance Runners: ${counts[0].rows[0].c}`);
  console.log(`Weeks: ${counts[1].rows[0].c}`);
  console.log(`Attendance Records (present): ${counts[2].rows[0].c}`);

  // Show RFG match rate
  const matched = await db.execute({
    sql: 'SELECT COUNT(*) as c FROM attendance_runners WHERE rfg_runner_id IS NOT NULL',
    args: [],
  });
  console.log(`RFG Matched: ${matched.rows[0].c}/${counts[0].rows[0].c}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
