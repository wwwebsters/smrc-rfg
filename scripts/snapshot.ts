/**
 * Weekly Snapshot Script
 *
 * Creates a git tag and exports the full database to a local JSON backup.
 * Run with: npm run snapshot
 *
 * To restore from a snapshot:
 *   npm run restore -- backups/snapshot-2026-04-19.json
 */

import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { config } from 'dotenv';

config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function snapshot() {
  const today = new Date().toISOString().split('T')[0];
  const tagName = `snapshot-${today}`;
  const backupDir = 'backups';
  const backupFile = `${backupDir}/snapshot-${today}.json`;

  console.log(`\n=== Creating Snapshot: ${today} ===\n`);

  // 1. Git tag
  console.log('1. Creating git tag...');
  try {
    // Check if tag already exists
    try {
      execSync(`git tag -l ${tagName}`, { encoding: 'utf-8' }).trim();
      const existing = execSync(`git tag -l ${tagName}`, { encoding: 'utf-8' }).trim();
      if (existing) {
        console.log(`   Tag ${tagName} already exists, skipping`);
      } else {
        execSync(`git tag ${tagName}`);
        execSync(`git push origin ${tagName}`);
        console.log(`   Tagged: ${tagName} (pushed to remote)`);
      }
    } catch {
      execSync(`git tag ${tagName}`);
      execSync(`git push origin ${tagName}`);
      console.log(`   Tagged: ${tagName} (pushed to remote)`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`   Git tag warning: ${msg}`);
  }

  // 2. Export database
  console.log('2. Exporting database...');

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    'runners',
    'runner_prs',
    'race_results',
    'pending_submissions',
    'age_grading_factors',
    'age_grading_standards',
  ];

  const backup: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const result = await db.execute({ sql: `SELECT * FROM ${table}`, args: [] });
      backup[table] = result.rows.map(row => ({ ...row }));
      totalRows += backup[table].length;
      console.log(`   ${table}: ${backup[table].length} rows`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`   ${table}: skipped (${msg})`);
      backup[table] = [];
    }
  }

  const snapshotData = {
    created: new Date().toISOString(),
    tag: tagName,
    tables: backup,
  };

  writeFileSync(backupFile, JSON.stringify(snapshotData, null, 2));
  console.log(`\n   Saved: ${backupFile} (${totalRows} total rows)`);

  console.log(`\n=== Snapshot Complete ===`);
  console.log(`   Git tag: ${tagName}`);
  console.log(`   Backup:  ${backupFile}`);
  console.log(`\n   To restore: npm run restore -- ${backupFile}\n`);
}

snapshot().catch(console.error);
