import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { config } from './config';

const client = new pg.Client({ connectionString: config.MIGRATION_DATABASE_URL || config.DATABASE_URL });
await client.connect();
try {
  await client.query('SELECT pg_advisory_lock(8172401)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  for (const name of (await readdir(new URL('./migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).sort()) {
    if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(await readFile(new URL(`./migrations/${name}`, import.meta.url), 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
  }
} finally { await client.end(); }
