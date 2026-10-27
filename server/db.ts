import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './config';
import { AsyncLocalStorage } from 'node:async_hooks';

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
export const db = drizzle(pool);
export type Tx = pg.PoolClient;
const active = new AsyncLocalStorage<Tx>();
/** Reuse the current transaction for authorization/metadata queries as well as writes. */
export function query<R extends pg.QueryResultRow=pg.QueryResultRow>(text:string,values?:unknown[]) {return (active.getStore()||pool).query<R>(text,values);}
export async function transaction<T>(work: (tx: Tx) => Promise<T>, schoolId = '', platform = false): Promise<T> {
  const inherited=active.getStore();
  if(inherited) return work(inherited);
  const tx = await pool.connect();
  try {
    await tx.query('BEGIN');
    await tx.query("SELECT set_config('app.school_id',$1,true),set_config('app.platform',$2,true)", [schoolId, String(platform)]);
    const result = await active.run(tx,()=>work(tx));
    await tx.query('COMMIT');
    return result;
  } catch (error) { await tx.query('ROLLBACK'); throw error; }
  finally { tx.release(); }
}
