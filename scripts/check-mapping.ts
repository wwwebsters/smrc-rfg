import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  // Get all attendance runners with their match status
  const attendance = await db.execute(`
    SELECT ar.id, ar.nickname, ar.full_name, ar.rfg_runner_id, r.nickname as rfg_nickname, r.full_name as rfg_full_name
    FROM attendance_runners ar
    LEFT JOIN runners r ON ar.rfg_runner_id = r.id
    ORDER BY ar.nickname
  `);

  console.log('=== ATTENDANCE RUNNERS ===');
  console.log('Status | Attendance Nickname | Attendance Name | RFG Nickname');
  console.log('---------------------------------------------------------------');
  for (const row of attendance.rows) {
    const status = row.rfg_runner_id ? '✓' : '✗';
    console.log(`${status} | ${row.nickname} | ${row.full_name || '-'} | ${row.rfg_nickname || '-'}`);
  }

  // Get all RFG runners
  const rfg = await db.execute('SELECT id, nickname, full_name FROM runners ORDER BY nickname');
  console.log('');
  console.log('=== RFG RUNNERS ===');
  console.log('ID | Nickname | Full Name');
  console.log('-------------------------');
  for (const row of rfg.rows) {
    console.log(`${row.id} | ${row.nickname} | ${row.full_name}`);
  }
}

main();
