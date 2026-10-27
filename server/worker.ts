import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config';
import { pool, transaction } from './db';
import {unseal} from './secrets';

const redis=new Redis(config.REDIS_URL,{maxRetriesPerRequest:null});
const queue=new Queue('school-outbox',{connection:redis});
let running=false;
async function pump() {
  if(running)return;running=true;
  try {
    const jobs=await transaction(async tx=>(await tx.query("SELECT id FROM outbox WHERE status IN ('pending','queued') AND available_at<=now() ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED")).rows);
    for(const row of jobs) {
      await queue.add('deliver',{outboxId:row.id},{jobId:row.id,attempts:5,backoff:{type:'exponential',delay:5000},removeOnComplete:{age:86400},removeOnFail:{age:7*86400}});
      await pool.query("UPDATE outbox SET status='queued',available_at=now()+interval '5 minutes' WHERE id=$1 AND status='pending'",[row.id]);
    }
  } catch(error){console.error('Outbox dispatch failed',error instanceof Error?error.name:'Error');}
  finally{running=false;}
}
const worker=new Worker('school-outbox',async job=>{
  const row=(await pool.query('SELECT * FROM outbox WHERE id=$1',[job.data.outboxId])).rows[0];
  if(!row||['sent','unavailable'].includes(row.status))return;
  const payload=row.payload;
  if(payload.sealedMessage)payload.message=unseal(payload.sealedMessage);
  if(payload.challengeId){const challenge=await pool.query('SELECT 1 FROM challenges WHERE id=$1 AND NOT consumed AND expires_at>now()',[payload.challengeId]);if(!challenge.rowCount){await pool.query("UPDATE outbox SET status='expired',payload='{}' WHERE id=$1",[row.id]);return;}}
  let delivered=false;
  if(payload.channel==='sms'&&config.SMS_WEBHOOK_URL){
    const response=await fetch(config.SMS_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.SMS_WEBHOOK_TOKEN||''}`,'Idempotency-Key':row.id},body:JSON.stringify({to:payload.phone,message:payload.message,reference:row.id}),signal:AbortSignal.timeout(10000)});
    const acceptance=await response.json() as {accepted?:boolean;messageId?:string};
    if(!response.ok||acceptance.accepted!==true||typeof acceptance.messageId!=='string')throw new Error('SMS provider failed');delivered=true;
  } else if(payload.channel==='bale'&&config.BALE_BOT_TOKEN){
    const response=await fetch(`https://tapi.bale.ai/bot${config.BALE_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:payload.chatId,text:payload.message}),signal:AbortSignal.timeout(10000)});
    if(!response.ok||!(await response.json() as {ok:boolean}).ok)throw new Error('Bale provider failed');delivered=true;
  }
  await transaction(async tx=>{
    await tx.query('UPDATE outbox SET status=$1,attempts=attempts+1,payload=CASE WHEN $2 THEN $3::jsonb ELSE payload END WHERE id=$4',[delivered?'sent':'unavailable',!!payload.challengeId,JSON.stringify({challengeId:payload.challengeId}),row.id]);
    if(payload.notificationId)await tx.query("UPDATE records SET data=jsonb_set(data,'{status}',$1::jsonb),version=version+1 WHERE id=$2 AND school_id=$3 AND year_id=$4",[JSON.stringify(delivered?'sent':'unavailable'),payload.notificationId,row.school_id,payload.yearId]);
  },row.school_id||'');
},{connection:redis,concurrency:10});
worker.on('failed',async(job)=>{
  if(job&&job.attemptsMade>=5)await pool.query("UPDATE outbox SET status='failed',attempts=$1 WHERE id=$2",[job.attemptsMade,job.data.outboxId]);
});
const timer=setInterval(pump,5000);await pump();
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{clearInterval(timer);await worker.close();await queue.close();await redis.quit();await pool.end();process.exit(0);});
