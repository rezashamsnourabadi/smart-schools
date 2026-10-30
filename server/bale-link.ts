import {randomBytes,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import type {FastifyInstance} from 'fastify';
import {digest,requireAuth} from './auth';
import {query,transaction} from './db';
import {config} from './config';
import {requireValue} from './errors';
export const baleConfigured=()=>!!(config.BALE_BOT_TOKEN&&config.BALE_BOT_USERNAME&&config.BALE_WEBHOOK_SECRET);
export async function baleRoutes(app:FastifyInstance){
 app.get('/api/v1/auth/bale',async request=>{const user=requireAuth(request),row=(await query('SELECT verified_at FROM bale_links WHERE user_id=$1',[user.id])).rows[0];return {configured:baleConfigured(),linked:!!row,verifiedAt:row?.verified_at||null,botUsername:config.BALE_BOT_USERNAME||null};});
 app.post('/api/v1/auth/bale/pair',{config:{rateLimit:{max:3,timeWindow:'10 minutes'}}},async request=>{
  const user=requireAuth(request);requireValue(baleConfigured(),'ربات بله و وب‌هوک امن هنوز تنظیم نشده‌اند.',503);const code=randomBytes(16).toString('hex');
  await query("INSERT INTO bale_pairings(user_id,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,created_at=now()",[user.id,digest(`bale:${code}`)]);return {command:`/start ${code}`,expiresAt:new Date(Date.now()+600000).toISOString(),botUsername:config.BALE_BOT_USERNAME};
 });
 app.post('/api/v1/auth/bale/unlink',async request=>{const user=requireAuth(request);await transaction(async tx=>{await tx.query('DELETE FROM bale_links WHERE user_id=$1',[user.id]);await tx.query('DELETE FROM bale_pairings WHERE user_id=$1',[user.id]);await tx.query("INSERT INTO audit_log(user_id,action) VALUES($1,'bale-unlinked')",[user.id]);});return {ok:true};});
 app.post('/api/v1/integrations/bale/webhook',{config:{rateLimit:{max:300,timeWindow:'1 minute'}}},async request=>{
  requireValue(baleConfigured(),'سرویس بله فعال نیست.',503);const supplied=z.string().regex(/^[A-Za-z0-9_-]{32,128}$/).parse((request.query as {secret?:string}).secret),expected=config.BALE_WEBHOOK_SECRET!;
  requireValue(supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)),'دسترسی مجاز نیست.',403);
  const identity=z.union([z.string().regex(/^-?\d+$/),z.number().int().nonnegative()]);
  const input=z.object({message:z.object({text:z.string().max(500).optional(),from:z.object({id:identity}),chat:z.object({id:identity,type:z.string()})}).optional()}).parse(request.body),message=input.message;
  if(!message||message.chat.type!=='private'||String(message.from.id)!==String(message.chat.id))return {ok:true};
  const code=message.text?.match(/^\/start(?:@[A-Za-z0-9_]+)?\s+([a-f0-9]{32})$/)?.[1];if(!code)return {ok:true};
  await transaction(async tx=>{
   const pair=(await tx.query('SELECT * FROM bale_pairings WHERE code_hash=$1 AND expires_at>now() FOR UPDATE',[digest(`bale:${code}`)])).rows[0];if(!pair)return;
   if(!(await tx.query('SELECT 1 FROM users WHERE id=$1 AND active',[pair.user_id])).rowCount)return;
   await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`bale-chat:${message.chat.id}`]);
   const other=(await tx.query('SELECT user_id FROM bale_links WHERE chat_id=$1',[String(message.chat.id)])).rows[0];if(other&&other.user_id!==pair.user_id)return;
   await tx.query('INSERT INTO bale_links(user_id,chat_id) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET chat_id=excluded.chat_id,verified_at=now()',[pair.user_id,String(message.chat.id)]);
   await tx.query('DELETE FROM bale_pairings WHERE user_id=$1',[pair.user_id]);await tx.query("INSERT INTO audit_log(user_id,action) VALUES($1,'bale-linked')",[pair.user_id]);
  });return {ok:true};
 });
}
