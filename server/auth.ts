import { randomBytes, randomInt, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import argon2 from 'argon2';
import { z } from 'zod';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config';
import { pool, query, transaction } from './db';
import { ApiError, deny, requireValue } from './errors';
import type { UserRole, VicePrincipalPermissions } from '../src/types';
import {seal} from './secrets';
import {isAllowedOrigin} from './origin';

export interface Identity { id: string; username: string; name: string; phone: string; csrf: string; privileged: boolean; authMethod: 'password' | 'sms' }
export interface Membership { id: string; school_id: string | null; role: UserRole; profile_id: string | null; student_id: string | null; permissions: Partial<VicePrincipalPermissions> }
declare module 'fastify' { interface FastifyRequest { identity: Identity | null; authorizedMembership: Membership | null } }
const cookieName = config.NODE_ENV === 'production' ? '__Host-school-session' : 'school-session';
export const digest = (value: string) => createHmac('sha256', config.SESSION_SECRET).update(value).digest('hex');
const username = z.string().trim().min(3).max(80).transform(v => v.toLowerCase());
export const passwordSchema = z.string().min(12).max(128);
const bodySchema = z.object({ username }).strict();
let passwordOperations=0;
const passwordWaiters:(()=>void)[]=[];
async function passwordTask<T>(work:()=>Promise<T>):Promise<T>{
  if(passwordOperations>=4){if(passwordWaiters.length>=32)throw new ApiError(503,'AUTH_BUSY','سامانه ورود مشغول است؛ کمی بعد دوباره تلاش کنید.');await new Promise<void>(resolve=>passwordWaiters.push(resolve));}
  else passwordOperations++;
  try{return await work();}finally{const next=passwordWaiters.shift();if(next)next();else passwordOperations--;}
}
export async function hashPassword(password: string) {const parsed=passwordSchema.parse(password);return passwordTask(()=>argon2.hash(parsed, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }));}
let dummyHash:Promise<string>|undefined;
async function verifyPassword(hash:string|null|undefined,password:string){const target=hash||await(dummyHash||=hashPassword('invalid-account-password'));const valid=await passwordTask(()=>argon2.verify(target,password));return !!hash&&valid;}
function setCookie(reply: FastifyReply, value: string) {
  reply.setCookie(cookieName, value, { path: '/', httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400 });
}
async function session(userId: string, method: 'password' | 'sms', reply: FastifyReply) {
  const secret = randomBytes(32).toString('base64url');
  const csrf = randomBytes(32).toString('base64url');
  await query(`WITH account_scope AS (SELECT EXISTS(SELECT 1 FROM memberships WHERE user_id=$2 AND active AND role IN ('principal','platform_admin')) AS privileged)
    INSERT INTO sessions(id,user_id,csrf,expires_at,privileged,auth_method)
    SELECT $1,$2,$3,now()+CASE WHEN privileged THEN interval '12 hours' ELSE interval '7 days' END,privileged,$4 FROM account_scope`, [digest(secret), userId, csrf, method]);
  setCookie(reply, secret);
  return { authenticated: true, csrf };
}
export async function challenge(userId: string | null, purpose: string, phone?: string) {
  if (config.NODE_ENV === 'production' && !config.SMS_WEBHOOK_URL) throw new ApiError(503, 'SMS_UNAVAILABLE', 'سرویس پیامک هنوز تنظیم نشده است.');
  const code = String(randomInt(100000, 1000000));
  const result = await transaction(async tx => {
    if (userId) {
      await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      const recent = await tx.query("SELECT count(*)::int AS n FROM challenges WHERE user_id=$1 AND created_at>now()-interval '15 minutes'", [userId]);
      requireValue(recent.rows[0].n < 3, 'تعداد درخواست زیاد است؛ چند دقیقه بعد تلاش کنید.', 429);
      const last = await tx.query("SELECT 1 FROM challenges WHERE user_id=$1 AND created_at>now()-interval '60 seconds'", [userId]);
      requireValue(!last.rowCount, 'برای ارسال دوباره یک دقیقه صبر کنید.', 429);
    }
    const inserted = await tx.query("INSERT INTO challenges(user_id,purpose,code_hash,expires_at,metadata) VALUES($1,$2,$3,now()+interval '5 minutes',$4) RETURNING id", [userId, purpose, digest(code),purpose==='phone'?{phone}:{}]);
    if (userId && config.SMS_WEBHOOK_URL) await tx.query('INSERT INTO outbox(payload) VALUES($1)', [{ channel: 'sms', phone, sealedMessage:seal(`کد سامانه مدارس: ${code}`), challengeId: inserted.rows[0].id }]);
    return inserted.rows[0].id as string;
  });
  if (userId && config.NODE_ENV !== 'production') {
    await mkdir('.local/otp', { recursive: true });
    await writeFile(`.local/otp/${result}.json`, JSON.stringify({ code, expiresInSeconds: 300 }), { mode: 0o600 });
  }
  return { challengeId: result, expiresInSeconds: 300 };
}
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  request.identity = null;
  const secret = request.cookies[cookieName];
  if (!secret) return;
  const memberId=request.headers['x-membership-id']?z.uuid().parse(request.headers['x-membership-id']):null;
  const result = await query<Identity&{last_seen:Date;membership:Membership|null}>(`SELECT u.id,u.username,u.name,u.phone,s.csrf,s.privileged,s.auth_method AS "authMethod",s.last_seen,CASE WHEN m.id IS NULL THEN NULL ELSE jsonb_build_object('id',m.id,'school_id',m.school_id,'role',m.role,'profile_id',m.profile_id,'student_id',m.student_id,'permissions',m.permissions) END AS membership FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN memberships m ON m.id=$2 AND m.user_id=u.id AND m.active
    WHERE s.id=$1 AND u.active AND s.expires_at>now() AND s.last_seen>now()-CASE WHEN s.privileged THEN interval '30 minutes' ELSE interval '8 hours' END`, [digest(secret),memberId]);
  if (!result.rowCount) { reply.clearCookie(cookieName, { path: '/' }); return; }
  const {last_seen,membership,...identity}=result.rows[0];request.identity=identity;request.authorizedMembership=membership;
  if(Date.now()-new Date(last_seen).getTime()>5*60*1000)await query("UPDATE sessions SET last_seen=now() WHERE id=$1 AND last_seen<now()-interval '5 minutes'", [digest(secret)]);
}
export function requireAuth(request: FastifyRequest): Identity {
  if (!request.identity) throw new ApiError(401, 'UNAUTHENTICATED', 'لطفاً وارد حساب خود شوید.');
  return request.identity;
}
export async function membership(request: FastifyRequest): Promise<Membership> {
  const user = requireAuth(request);
  const id = z.uuid().parse(request.headers['x-membership-id']);
  const cached=request.authorizedMembership?.id===id?request.authorizedMembership:null;
  const member=cached||(await query<Membership>('SELECT * FROM memberships WHERE id=$1 AND user_id=$2 AND active', [id, user.id])).rows[0];
  if(!member)return deny();
  return member;
}
export async function authRoutes(app: FastifyInstance) {
  app.decorateRequest('identity', null);
  app.decorateRequest('authorizedMembership', null);
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', async request => {
    if (['GET','HEAD','OPTIONS'].includes(request.method)) return;
    const origin = request.headers.origin;
    if (origin && !isAllowedOrigin(origin, config.APP_ORIGIN, config.NODE_ENV)) deny();
    if (request.identity) {
      const token = request.headers['x-csrf-token'];
      if (typeof token !== 'string' || token.length !== request.identity.csrf.length || !timingSafeEqual(Buffer.from(token), Buffer.from(request.identity.csrf))) throw new ApiError(403, 'CSRF', 'اعتبار درخواست تأیید نشد.');
    }
  });
  app.get('/api/v1/auth/me', async request => {
    const user = requireAuth(request);
    const memberships = await query(`SELECT m.*,s.data->>'name' AS school_name FROM memberships m LEFT JOIN schools s ON s.id=m.school_id WHERE m.user_id=$1 AND m.active ORDER BY m.role,m.school_id,m.student_id`, [user.id]);
    for(const row of memberships.rows){
      if(!row.student_id||!row.school_id)continue;
      const label=await transaction(async tx=>(await tx.query("SELECT r.data->>'name' AS name FROM records r JOIN academic_years y ON y.id=r.year_id AND y.school_id=r.school_id WHERE r.school_id=$1 AND r.kind='students' AND (r.id=$2 OR r.data->>'identityId'=$3) AND y.data->>'isCurrent'='true' LIMIT 1",[row.school_id,row.student_id,row.student_id])).rows[0]?.name,row.school_id);
      if(label)row.label=label;
    }
    return { user, memberships: memberships.rows };
  });
  app.post('/api/v1/auth/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes', keyGenerator: (req:FastifyRequest)=>`login:${digest(String((req.body as {username?:unknown})?.username||'').trim().toLowerCase())}` } } }, async (request, reply) => {
    const input = z.object({ username, password: z.string().max(128) }).strict().parse(request.body);
    const result = await query('SELECT * FROM users WHERE username=$1 AND active', [input.username]);
    const user = result.rows[0];
    // Always do a password hash operation, including unknown usernames.
    const valid = await verifyPassword(user?.password_hash,input.password);
    if (!valid || !user.phone_verified) throw new ApiError(401, 'INVALID_CREDENTIALS', 'شناسه یا رمز صحیح نیست یا حساب فعال نشده است.');
    return session(user.id, 'password', reply);
  });
  app.post('/api/v1/auth/challenge', { config: { rateLimit: { max: 5, timeWindow: '15 minutes',keyGenerator:(req:FastifyRequest)=>`challenge:${digest(String((req.body as {username?:unknown})?.username||'').trim().toLowerCase())}` } } }, async request => {
    const input = z.object({ username, purpose: z.enum(['login','activate','recover']) }).strict().parse(request.body);
    const result = await query("SELECT id,phone FROM users WHERE username=$1 AND active AND ($2<>'login' OR phone_verified)", [input.username,input.purpose]);
    try{return await challenge(result.rows[0]?.id || null, input.purpose, result.rows[0]?.phone);}
    catch(error){if(error instanceof ApiError&&error.statusCode===429)return challenge(null,input.purpose);throw error;}
  });
  app.post('/api/v1/auth/verify', { config: { rateLimit: { max: 15, timeWindow: '15 minutes',keyGenerator:(req:FastifyRequest)=>`verify:${String((req.body as {challengeId?:unknown})?.challengeId||req.ip)}` } } }, async (request, reply) => {
    const input = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/), password: passwordSchema.optional() }).strict().parse(request.body);
    const result = await transaction(async tx => {
      const found = await tx.query('SELECT * FROM challenges WHERE id=$1 FOR UPDATE', [input.challengeId]);
      const row = found.rows[0];
      if (!row || !['login','activate','recover','phone'].includes(row.purpose) || row.consumed || row.attempts >= 5 || new Date(row.expires_at).getTime() <= Date.now()) return null;
      await tx.query('UPDATE challenges SET attempts=attempts+1 WHERE id=$1', [row.id]);
      if (!row.user_id || !timingSafeEqual(Buffer.from(digest(input.code)), Buffer.from(row.code_hash))) return null;
      const active = await tx.query("SELECT id FROM users WHERE id=$1 AND active AND ($2<>'login' OR phone_verified) FOR UPDATE", [row.user_id,row.purpose]);
      if (!active.rowCount) return null;
      if(row.purpose==='phone'){
        requireValue(requireAuth(request).id===row.user_id,'این کد متعلق به حساب شما نیست.',403);
        await tx.query('UPDATE users SET phone=$1,phone_verified=true WHERE id=$2',[row.metadata.phone,row.user_id]);
        await tx.query('DELETE FROM sessions WHERE user_id=$1',[row.user_id]);
      } else if (row.purpose === 'activate' || row.purpose === 'recover') {
        requireValue(input.password, 'رمز جدید الزامی است.');
        await tx.query('UPDATE users SET password_hash=$1,phone_verified=true WHERE id=$2', [await hashPassword(input.password), row.user_id]);
        await tx.query('DELETE FROM sessions WHERE user_id=$1', [row.user_id]);
      }
      await tx.query('UPDATE challenges SET consumed=true WHERE user_id=$1', [row.user_id]);
      return row;
    });
    if (!result) throw new ApiError(401, 'INVALID_CODE', 'کد معتبر نیست یا منقضی شده است.');
    if (result.purpose !== 'login') {reply.clearCookie(cookieName,{path:'/'});return { authenticated: false, passwordChanged:result.purpose!=='phone',phoneChanged:result.purpose==='phone' };}
    return session(result.user_id, 'sms', reply);
  });
  app.post('/api/v1/auth/logout', async (request, reply) => {
    requireAuth(request);
    await query('DELETE FROM sessions WHERE id=$1', [digest(request.cookies[cookieName] || '')]);
    reply.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  });
  app.post('/api/v1/auth/password', async (request, reply) => {
    const user = requireAuth(request);
    const input = z.object({ currentPassword: z.string(), password: passwordSchema }).strict().parse(request.body);
    const row = (await query('SELECT password_hash FROM users WHERE id=$1', [user.id])).rows[0];
    requireValue(await verifyPassword(row.password_hash, input.currentPassword), 'رمز فعلی صحیح نیست.');
    await transaction(async tx => {
      await tx.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await hashPassword(input.password), user.id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    });
    reply.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  });
  app.post('/api/v1/auth/phone',async request=>{
    const user=requireAuth(request);
    const input=z.object({currentPassword:z.string().max(128),phone:z.string().regex(/^09\d{9}$/)}).strict().parse(request.body);
    const row=(await query('SELECT password_hash FROM users WHERE id=$1',[user.id])).rows[0];
    requireValue(await verifyPassword(row.password_hash,input.currentPassword),'رمز فعلی صحیح نیست.');
    return challenge(user.id,'phone',input.phone);
  });
}
