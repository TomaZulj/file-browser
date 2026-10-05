import { readFile } from 'node:fs/promises';
import pg from 'pg';

export function createPool(databaseUrl: string): pg.Pool {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  pool.on('error', (error) => console.error('Idle database client error', error));
  return pool;
}

export async function applySchema(pool: pg.Pool): Promise<void> {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}
