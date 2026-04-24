#!/usr/bin/env npx tsx
/**
 * Create email-to-runner mapping table for RSVP parsing
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const emailMappings: Record<string, string> = {
  // email -> attendance nickname
  'ltaka@live.com': 'Luke',
  'mklaene@yahoo.com': 'Bolt',
  'kenjiheilman@gmail.com': 'Goat',
  'jordanbjj87@gmail.com': 'Hulk',
  'steve_hart@overheaddoor.com': 'Shart',
  'briegg1115@gmail.com': 'Eggs',
  'loganholmes33@gmail.com': 'Logan',
  'osu.richmond@gmail.com': 'CRich',
  'rob.tagher@gmail.com': 'Doc',
  'scott@dwyerins.com': 'Scott',
  'dkeyser1969@gmail.com': '3Ball',
  'grace.zakrajsek@yahoo.com': 'Grace',
  'dierig2008@gmail.com': 'DD',
  'jmillerpaul@outlook.com': 'JMil',
  'aaron_hardy8@mymail.eku.edu': 'Aaron',
  'timcantrell88@icloud.com': 'Timmy',
  'mikesee85396@gmail.com': 'Captain',
  'dtmcmanama@gmail.com': 'DMac',
  'mitchelminor517@gmail.com': 'Mitch',
  'emily.eggleston2003@yahoo.com': 'Eggs 2.0',
  'wwwebsters@gmail.com': 'MDub',
};

async function main() {
  // Create email mapping table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_email_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      attendance_nickname TEXT NOT NULL,
      runner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (runner_id) REFERENCES attendance_runners(id)
    )
  `);

  console.log('Created attendance_email_mappings table');

  // Insert mappings
  for (const [email, nickname] of Object.entries(emailMappings)) {
    // Find the runner ID
    const runner = await db.execute({
      sql: 'SELECT id FROM attendance_runners WHERE nickname = ?',
      args: [nickname]
    });

    const runnerId = runner.rows.length > 0 ? runner.rows[0].id : null;

    await db.execute({
      sql: `INSERT OR REPLACE INTO attendance_email_mappings (email, attendance_nickname, runner_id)
            VALUES (?, ?, ?)`,
      args: [email.toLowerCase(), nickname, runnerId]
    });

    console.log(`✓ Mapped: ${email} -> ${nickname}${runnerId ? ` (ID: ${runnerId})` : ''}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Mapped ${Object.keys(emailMappings).length} email addresses`);
}

main().catch(console.error);
