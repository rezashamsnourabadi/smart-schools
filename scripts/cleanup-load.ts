import {readFile} from 'node:fs/promises';
import {z} from 'zod';
process.env.NODE_ENV='test';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';
const run=z.uuid().parse(process.argv[2]);
await readFile(`.local/benchmarks/${run}.json`); // Only a recorded run may be cleaned.
if(process.env.LOAD_SERVER_STOPPED!=='1')throw new Error('Stop the isolated benchmark API first, then set LOAD_SERVER_STOPPED=1.');
const {pool,transaction}=await import('../server/db');
try{
  const schools=(await pool.query("SELECT id FROM schools WHERE data->>'name' LIKE $1",[`Benchmark ${run} %`])).rows;
  const users=(await pool.query('SELECT id FROM users WHERE username LIKE $1',[`load-${run}-%`])).rows.map(row=>row.id);
  await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])',[users]);
  const identities:string[]=[];
  for(const school of schools)await transaction(async tx=>{
    identities.push(...(await tx.query('SELECT identity_id FROM records WHERE school_id=$1 AND identity_id IS NOT NULL',[school.id])).rows.map(row=>row.identity_id));
    await tx.query('DELETE FROM audit_log WHERE school_id=$1',[school.id]);await tx.query('DELETE FROM records WHERE school_id=$1',[school.id]);await tx.query('DELETE FROM academic_years WHERE school_id=$1',[school.id]);await tx.query('DELETE FROM memberships WHERE school_id=$1',[school.id]);await tx.query('DELETE FROM schools WHERE id=$1',[school.id]);
  },school.id);
  await pool.query('DELETE FROM idempotency WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM memberships WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);
  await pool.query('DELETE FROM enrollment_identities e WHERE id=ANY($1::uuid[]) AND NOT EXISTS(SELECT 1 FROM records WHERE identity_id=e.id)',[identities]);
  console.log(JSON.stringify({run,removedSchools:schools.length,removedUsers:users.length}));
}finally{await pool.end();}
