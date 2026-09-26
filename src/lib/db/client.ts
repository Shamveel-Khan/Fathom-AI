import { Pool, neonConfig } from '@neondatabase/serverless';

// Cache the pool instance across serverless function invocations
let pool: Pool | null = null;

export function getDbPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
    });
  }

  return pool;
}

/**
 * Execute a SQL query with parameters using the Neon pool.
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

/**
 * Check if the database connection is available and initialized.
 */
export async function isDbConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const p = getDbPool();
    await p.query('SELECT 1');
    return true;
  } catch (err) {
    console.warn('Neon PostgreSQL connection test failed:', err);
    return false;
  }
}
