import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set');
    }

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

// Helper to run a query and return all rows
export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: args as (string | number | null)[] });
  return result.rows as unknown as T[];
}

// Helper to run a query and return the first row
export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: unknown[] = []
): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, args);
  return rows[0];
}

// Helper to run an INSERT/UPDATE/DELETE and return result info
export async function dbRun(
  sql: string,
  args: unknown[] = []
): Promise<{ rowsAffected: number; lastInsertRowid: number | bigint }> {
  const db = getDb();
  const result = await db.execute({ sql, args: args as (string | number | null)[] });
  return {
    rowsAffected: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid ?? 0,
  };
}

// Helper to run multiple statements in a transaction
export async function dbTransaction(
  statements: { sql: string; args: (string | number | null)[] }[]
): Promise<void> {
  const db = getDb();
  await db.batch(statements, 'write');
}
