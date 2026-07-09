import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  // List existing tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log('Existing tables:');
  tables.rows.forEach((row) => console.log(' -', row.name));

  // Create page_views table
  console.log('\nCreating page_views table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_id TEXT,
      user_agent TEXT,
      referrer TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create indexes
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp)`);

  console.log('Done!');

  // Verify
  const verify = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='page_views';");
  if (verify.rows.length > 0) {
    console.log('page_views table confirmed created!');
  }
}

main().catch(console.error);
