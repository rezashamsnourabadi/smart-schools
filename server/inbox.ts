import {baleConfigured} from './bale-link';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {membership,requireAuth,type Membership} from './auth';
import {transaction,type Tx} from './db';
import {allowed,scope,memberProfile} from './resources';
import {classAccess} from './repository';
import {requireValue} from './errors';
import {audit} from './repository';
import {config} from './config';
import type {MessageRecipient} from '../shared/inbox';

export async function inboxContext(tx:Tx,userId:string,memberId:string){await tx.query("SELECT set_config('app.user_id',$1,true),set_config('app.membership_id',$2,true)",[userId,memberId]);}
function sender(member:Membership){requireValue(member.role==='platform_admin'||member.role==='teacher'||allowed(member,'canManageAnnouncements'),'اجازه ارسال پیام مستقیم ندارید.',403);}
async function teacherRecipients(tx:Tx,request:FastifyRequest,member:Membership,input:{classId?:string;subject?:string},write=false){
 if(member.role!=='teacher')return null;
 const teaching=z.object({classId:z.uuid(),subject:z.string().trim().min(1).max(200)}).parse(input),context=await scope(request,write);
 const profile=await memberProfile(tx,member,context.school,context.year);requireValue(profile,'پروفایل دبیر پیدا نشد.',403);
 await classAccess(tx,{...member,profile_id:profile.id},context.school,context.year,teaching.classId,teaching.subject);
 return (await tx.query("SELECT DISTINCT m.id FROM memberships m JOIN users u ON u.id=m.user_id JOIN records s ON s.school_id=m.school_id AND (s.id=m.student_id OR s.identity_id=m.student_id) WHERE m.school_id=$1 AND m.active AND u.active AND m.role IN ('student','parent') AND s.kind='students' AND s.year_id=$2 AND s.class_id=$3 AND COALESCE(s.data->>'status','active')='active'",[context.school,context.year,teaching.classId])).rows.map(row=>row.id as string);
}
interface Target extends MessageRecipient {phone:string;phoneVerified:boolean;baleChatId:string|null}
const targetSelect=`SELECT m.id AS "membershipId",m.user_id AS "userId",u.name,u.username,m.role,m.school_id AS "schoolId",s.data->>'name' AS "schoolName",m.student_id AS "studentId",child.name AS "studentName",u.phone,u.phone_verified AS "phoneVerified",bl.chat_id AS "baleChatId" FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN schools s ON s.id=m.school_id LEFT JOIN bale_links bl ON bl.user_id=u.id LEFT JOIN LATERAL (SELECT r.data->>'name' AS name FROM records r JOIN academic_years y ON y.id=r.year_id AND y.school_id=r.school_id WHERE r.school_id=m.school_id AND r.kind='students' AND (r.id=m.student_id OR r.identity_id=m.student_id) AND y.data->>'isCurrent'='true' LIMIT 1) child ON true`;
export async function addInboxMessage(tx:Tx,actor:{userId:string;memberId:string;schoolId:string|null},targets:Target[],input:{title:string;body:string;sms?:boolean;bale?:boolean;kind?:'direct'|'support'|'feedback';referenceId?:string}){
 await inboxContext(tx,actor.userId,actor.memberId);const id=randomUUID(),smsUsers=new Set<string>(),baleUsers=new Set<string>();
 await tx.query('INSERT INTO inbox_messages(id,sender_id,sender_membership_id,school_id,title,body,kind,reference_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,actor.userId,actor.memberId,actor.schoolId,input.title,input.body,input.kind||'direct',input.referenceId||null]);
 for(const target of targets){
  const sms=input.sms?(config.SMS_WEBHOOK_URL&&target.phoneVerified&&/^\+?\d{10,15}$/.test(target.phone)?'queued':'unavailable'):'not_requested';
  const bale=input.bale?(baleConfigured()&&target.baleChatId?'queued':'unavailable'):'not_requested';
  await tx.query('INSERT INTO inbox_recipients(message_id,membership_id,user_id,school_id,sms_status,bale_status) VALUES($1,$2,$3,$4,$5,$6)',[id,target.membershipId,target.userId,target.schoolId,sms,bale]);
  if(bale==='queued'&&!baleUsers.has(target.userId)){baleUsers.add(target.userId);await tx.query('INSERT INTO outbox(school_id,payload) VALUES($1,$2)',[target.schoolId,{channel:'bale',chatId:target.baleChatId,linkedUserId:target.userId,message:`${input.title}\n${input.body}`,inboxMessageId:id,inboxMembershipIds:targets.filter(t=>t.userId===target.userId).map(t=>t.membershipId),platformMessage:actor.schoolId===null}]);}
  if(sms==='queued'&&!smsUsers.has(target.userId)){smsUsers.add(target.userId);await tx.query('INSERT INTO outbox(school_id,payload) VALUES($1,$2)',[target.schoolId,{channel:'sms',phone:target.phone,message:`${input.title}\n${input.body}`,inboxMessageId:id,inboxMembershipIds:targets.filter(t=>t.userId===target.userId).map(t=>t.membershipId),platformMessage:actor.schoolId===null}]);}
 }
 await audit(tx,actor.userId,actor.schoolId,'message-created',id);return {id,recipients:targets.length,smsQueued:smsUsers.size,baleQueued:baleUsers.size};
}
export async function notifyFeedbackReply(tx:Tx,actor:{userId:string;memberId:string},feedback:{id:string;school_id:string;membership_id:string;title:string}){
 const target=(await tx.query<Target>(`${targetSelect} WHERE m.id=$1 AND m.school_id=$2 AND m.active AND u.active`,[feedback.membership_id,feedback.school_id])).rows[0];
 // The message intentionally contains no anonymous author identity or reply text.
 if(target)await addInboxMessage(tx,{...actor,schoolId:feedback.school_id},[target],{title:'پاسخ به پیام شما',body:`برای پیام «${feedback.title}» پاسخی ثبت شد. از دکمه پیگیری، پاسخ را ببینید.`,kind:'feedback',referenceId:feedback.id});
}
export async function notifyTicketReply(tx:Tx,actor:{userId:string;memberId:string},ticket:{id:string;membership_id:string;title:string},body:string){
 const target=(await tx.query<Target>(`${targetSelect} WHERE m.id=$1 AND m.active AND u.active`,[ticket.membership_id])).rows[0];
 if(target)await addInboxMessage(tx,{...actor,schoolId:null},[target],{title:`پاسخ پشتیبانی: ${ticket.title}`.slice(0,200),body:body.slice(0,2000),kind:'support',referenceId:ticket.id});
}
export async function notifyTicketAssignment(tx:Tx,actor:{userId:string;memberId:string},id:string,title:string,userId:string){
 const target=(await tx.query<Target>(`${targetSelect} WHERE m.user_id=$1 AND m.role='platform_admin' AND m.active AND u.active ORDER BY m.id LIMIT 1`,[userId])).rows[0];
 if(target)await addInboxMessage(tx,{...actor,schoolId:null},[target],{title:`ارجاع تیکت: ${title}`.slice(0,200),body:'رسیدگی به این تیکت به شما واگذار شد. از پیگیری تیکت وارد گفت‌وگو شوید.',kind:'support',referenceId:id});
}
export async function inboxRoutes(app:FastifyInstance){
 app.get('/api/v1/messages/options',async request=>{const m=await membership(request);sender(m);return {sms:!!config.SMS_WEBHOOK_URL,bale:baleConfigured(),maxRecipients:50};});
 app.get('/api/v1/messages/recipients',async request=>{
  const m=await membership(request);sender(m);
  const input=z.object({classId:z.uuid().optional(),subject:z.string().max(200).optional(),schoolId:z.uuid().optional(),role:z.enum(['principal','vice_principal','teacher','student','parent','platform_admin']).optional(),search:z.string().trim().max(100).default(''),offset:z.coerce.number().int().min(0).max(1000000).default(0)}).parse(request.query);
  requireValue(m.role==='platform_admin'||!input.schoolId||input.schoolId===m.school_id,'مدرسه مقصد مجاز نیست.',403);
  return transaction(async tx=>{const eligible=await teacherRecipients(tx,request,m,input);if(m.role==='platform_admin'&&input.schoolId)await tx.query("SELECT set_config('app.school_id',$1,true)",[input.schoolId]);const result=await tx.query<Target&{total:number}>(`${targetSelect} WHERE m.active AND u.active AND ($1::uuid IS NULL OR m.school_id=$1) AND ($2::text='' OR m.role=$2) AND (u.name ILIKE $3 OR u.username ILIKE $3) AND ($5::uuid[] IS NULL OR m.id=ANY($5::uuid[])) ORDER BY u.name,m.id LIMIT 25 OFFSET $4`,[m.role==='platform_admin'?input.schoolId||null:m.school_id,input.role||'',`%${input.search}%`,input.offset]);
   // Only display fields are returned; verified recovery phone numbers stay server-side.
   const count=(await tx.query("SELECT count(*)::int AS total FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.active AND u.active AND ($1::uuid IS NULL OR m.school_id=$1) AND ($2::text='' OR m.role=$2) AND (u.name ILIKE $3 OR u.username ILIKE $3) AND ($4::uuid[] IS NULL OR m.id=ANY($4::uuid[]))",[m.role==='platform_admin'?input.schoolId||null:m.school_id,input.role||'',`%${input.search}%`,eligible])).rows[0].total;
   return {items:result.rows.map(({phone,phoneVerified,baleChatId,...row})=>row),total:count};
  },m.school_id||'',m.role==='platform_admin');
 });
 app.post('/api/v1/messages',{config:{rateLimit:{max:20,timeWindow:'10 minutes'}}},async request=>{
  const m=await membership(request),user=requireAuth(request);sender(m);
  const input=z.object({classId:z.uuid().optional(),subject:z.string().max(200).optional(),title:z.string().trim().min(1).max(200),body:z.string().trim().min(1).max(2000),recipientIds:z.array(z.uuid()).min(1).max(50),sms:z.boolean().default(false),bale:z.boolean().default(false)}).strict().parse(request.body);
  requireValue(!input.bale||baleConfigured(),'سرویس بله تنظیم نشده است.',503);
  requireValue(!input.sms||!!config.SMS_WEBHOOK_URL,'سرویس پیامک تنظیم نشده است.',503);
  return transaction(async tx=>{const eligible=await teacherRecipients(tx,request,m,input,true),ids=[...new Set(input.recipientIds)];if(eligible)requireValue(ids.every(id=>eligible.includes(id)),'گیرنده در محدوده کلاس و درس شما نیست.',403);
   const targets=(await tx.query<Target>(`${targetSelect} WHERE m.id=ANY($1::uuid[]) AND m.active AND u.active AND ($2::uuid IS NULL OR m.school_id=$2) FOR SHARE OF m,u`,[ids,m.role==='platform_admin'?null:m.school_id])).rows;
   requireValue(targets.length===ids.length,'یک یا چند گیرنده فعال یا در محدوده مجاز شما نیستند.',403);
   return addInboxMessage(tx,{userId:user.id,memberId:m.id,schoolId:m.school_id},targets,input);
  },m.school_id||'',m.role==='platform_admin');
 });
 app.get('/api/v1/inbox/summary',async request=>{
  const m=await membership(request),u=requireAuth(request);return transaction(async tx=>{await inboxContext(tx,u.id,m.id);
   const unread=(await tx.query('SELECT count(*)::int AS n FROM inbox_recipients WHERE membership_id=$1 AND user_id=$2 AND read_at IS NULL',[m.id,u.id])).rows[0].n;
   const latest=(await tx.query('SELECT r.message_id FROM inbox_recipients r JOIN inbox_messages msg ON msg.id=r.message_id WHERE r.membership_id=$1 AND r.user_id=$2 ORDER BY msg.created_at DESC,msg.id DESC LIMIT 1',[m.id,u.id])).rows[0];return {unread,latestId:latest?.message_id||null};
  },m.school_id||'',m.role==='platform_admin');
 });
 app.get('/api/v1/inbox',async request=>{
  const m=await membership(request),u=requireAuth(request),input=z.object({offset:z.coerce.number().int().min(0).max(1000000).default(0),unread:z.enum(['true','false']).default('false')}).parse(request.query);
  return transaction(async tx=>{await inboxContext(tx,u.id,m.id);
   const filter='r.membership_id=$1 AND r.user_id=$2 AND (NOT $3::boolean OR r.read_at IS NULL)';
   const rows=(await tx.query(`SELECT msg.id,msg.title,msg.body,msg.kind,msg.reference_id AS "referenceId",msg.created_at AS "createdAt",u.name AS "senderName",s.data->>'name' AS "schoolName",r.read_at AS "readAt",r.sms_status AS "smsStatus",r.bale_status AS "baleStatus" FROM inbox_recipients r JOIN inbox_messages msg ON msg.id=r.message_id JOIN users u ON u.id=msg.sender_id LEFT JOIN schools s ON s.id=r.school_id WHERE ${filter} ORDER BY msg.created_at DESC,msg.id DESC LIMIT 25 OFFSET $4`,[m.id,u.id,input.unread==='true',input.offset])).rows;
   const total=(await tx.query(`SELECT count(*)::int AS n FROM inbox_recipients r WHERE ${filter}`,[m.id,u.id,input.unread==='true'])).rows[0].n;return {items:rows,total};
  },m.school_id||'',m.role==='platform_admin');
 });
 app.post('/api/v1/inbox/:id/read',async request=>{
  const m=await membership(request),u=requireAuth(request),id=z.uuid().parse((request.params as {id:string}).id);
  return transaction(async tx=>{await inboxContext(tx,u.id,m.id);const result=await tx.query('UPDATE inbox_recipients SET read_at=COALESCE(read_at,now()) WHERE message_id=$1 AND membership_id=$2 AND user_id=$3 RETURNING read_at',[id,m.id,u.id]);requireValue(result.rowCount,'پیام پیدا نشد.',404);return {readAt:result.rows[0].read_at};},m.school_id||'',m.role==='platform_admin');
 });
}
