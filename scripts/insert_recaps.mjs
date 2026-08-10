import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Read recaps from JSON
const recaps = JSON.parse(readFileSync('/tmp/race_recaps.json', 'utf-8'));

console.log(`Inserting ${recaps.length} recaps...`);

let inserted = 0;
for (const recap of recaps) {
  try {
    await client.execute({
      sql: `INSERT INTO race_recaps (runner_id, race_name, race_date, recap_text, original_format, original_filename, email_subject, email_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        recap.runner_id,
        recap.race_name,
        recap.race_date || null,
        recap.recap_text,
        recap.original_format,
        recap.original_filename || null,
        recap.email_subject,
        recap.email_date
      ]
    });
    inserted++;
    console.log(`  + ${recap.race_name}`);
  } catch (e) {
    console.log(`  x ${recap.race_name}: ${e.message}`);
  }
}

console.log(`\nInserted ${inserted}/${recaps.length} recaps`);

// Verify
const count = await client.execute('SELECT COUNT(*) as cnt FROM race_recaps');
console.log(`Total recaps in database: ${count.rows[0].cnt}`);
