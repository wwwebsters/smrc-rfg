import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  // Mappings to apply: attendance_nickname -> rfg_nickname
  const mappings: Record<string, string> = {
    '0Dark': '0Dark30',
    '3Ball': '3 Ball',
    'CRich': 'C-Rich',
    'Crich': 'C-Rich',  // Duplicate entry, same person
    'Flyin\'': 'Flyin Brian',
    'JMil': 'J-Mill',
    'MDub': 'M-Dub',
    'Logan': 'Wolverine',
    'Chip': 'Hamma',
    'Emily D.': 'Emily',
    'Joe D.': 'Joe Durt',
    'Timmy': '.75',     // Tim Cantrell
    'Goat': 'MG',       // Kenji Heilman
  };

  // Get RFG runner IDs
  const rfgRunners = await db.execute('SELECT id, nickname FROM runners');
  const rfgMap = new Map<string, number>();
  for (const row of rfgRunners.rows) {
    rfgMap.set(row.nickname as string, row.id as number);
  }

  // Apply mappings
  for (const [attNick, rfgNick] of Object.entries(mappings)) {
    const rfgId = rfgMap.get(rfgNick);
    if (!rfgId) {
      console.log(`WARNING: RFG runner '${rfgNick}' not found, skipping ${attNick}`);
      continue;
    }

    // Get the RFG full name
    const rfgRunner = await db.execute('SELECT full_name FROM runners WHERE id = ?', [rfgId]);
    const fullName = rfgRunner.rows[0]?.full_name || null;

    const result = await db.execute(
      `UPDATE attendance_runners SET rfg_runner_id = ?, full_name = ? WHERE nickname = ?`,
      [rfgId, fullName, attNick]
    );

    if (result.rowsAffected > 0) {
      console.log(`✓ Mapped: ${attNick} -> ${rfgNick} (ID: ${rfgId}, ${fullName})`);
    } else {
      console.log(`✗ No attendance runner found with nickname '${attNick}'`);
    }
  }

  // Summary
  const matched = await db.execute('SELECT COUNT(*) as c FROM attendance_runners WHERE rfg_runner_id IS NOT NULL');
  const total = await db.execute('SELECT COUNT(*) as c FROM attendance_runners');
  console.log(`\n=== Summary ===`);
  console.log(`Matched: ${matched.rows[0].c}/${total.rows[0].c} attendance runners`);
}

main();
