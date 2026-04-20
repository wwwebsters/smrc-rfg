/**
 * Restore Script
 *
 * Restores the database from a snapshot JSON file.
 * Run with: npm run restore -- backups/snapshot-2026-04-19.json
 *
 * WARNING: This will replace ALL data in the database with the snapshot data.
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function restore() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error('Usage: npm run restore -- <backup-file>');
    console.error('Example: npm run restore -- backups/snapshot-2026-04-19.json');
    process.exit(1);
  }

  console.log(`\n=== Restoring from: ${backupFile} ===\n`);

  const data = JSON.parse(readFileSync(backupFile, 'utf-8'));
  console.log(`Snapshot created: ${data.created}`);
  console.log(`Git tag: ${data.tag}`);

  // Confirm
  console.log('\nWARNING: This will replace ALL data in the database.');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const tables = [
    'race_results',       // delete first (has FK to runners)
    'pending_submissions',
    'runner_prs',         // delete before runners
    'runners',
    'age_grading_factors',
    'age_grading_standards',
  ];

  // Clear tables in FK-safe order
  console.log('Clearing existing data...');
  for (const table of tables) {
    await db.execute({ sql: `DELETE FROM ${table}`, args: [] });
    console.log(`   Cleared: ${table}`);
  }

  // Restore in reverse order (parents first)
  const restoreOrder = [
    'runners',
    'runner_prs',
    'age_grading_factors',
    'age_grading_standards',
    'race_results',
    'pending_submissions',
  ];

  console.log('\nRestoring data...');
  for (const table of restoreOrder) {
    const rows = data.tables[table];
    if (!rows || rows.length === 0) {
      console.log(`   ${table}: 0 rows (empty)`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    let inserted = 0;
    // Batch in groups of 20 to avoid query limits
    for (let i = 0; i < rows.length; i += 20) {
      const batch = rows.slice(i, i + 20);
      const statements = batch.map((row: Record<string, unknown>) => ({
        sql,
        args: columns.map(col => row[col] ?? null),
      }));
      await db.batch(statements, 'write');
      inserted += batch.length;
    }

    console.log(`   ${table}: ${inserted} rows restored`);
  }

  console.log(`\n=== Restore Complete ===`);
  console.log(`To also restore the code: git checkout ${data.tag}\n`);
}

restore().catch(console.error);
