import {notifyTicketReply,notifyTicketAssignment} from './inbox';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {membership,requireAuth} from './auth';
import {transaction,type Tx} from './db';
import {requireValue} from './errors';
import {audit} from './repository';
import {readSchoolAccess} from './school-access';
import {schoolModes,ticketCategories,ticketPriorities,ticketStates,type SupportTicket} from '../shared/operations';

const paging=z.object({offset:z.coerce.number().int().min(0).max(1000000).default(0),search:z.string().trim().max(100).default(''),status:z.enum(ticketStates).optional(),schoolId:z.uuid().optional()});
async function context(request:FastifyRequest){const member=await membership(request);return {member,user:requireAuth(request),platform:member.role==='platform_admin'};}
export async function ticketContext(tx:Tx,userId:string){await tx.query("SELECT set_config('app.user_id',$1,true)",[userId]);}
const ticketSelect="SELECT t.*,s.data->>'name' AS school_name,u.name AS owner_name,a.name AS assigned_name FROM support_tickets t JOIN schools s ON s.id=t.school_id JOIN users u ON u.id=t.owner_id LEFT JOIN users a ON a.id=t.assigned_to";
interface TicketRow {assigned_to:string|null;assigned_name:string|null;id:string;school_id:string;school_name:string;owner_name:string;owner_id:string;title:string;category:SupportTicket['category'];priority:SupportTicket['priority'];status:SupportTicket['status'];version:number;created_at:Date;updated_at:Date}
function ticketView(row:TicketRow):SupportTicket{return {assignedTo:row.assigned_to,assignedName:row.assigned_name,id:row.id,schoolId:row.school_id,schoolName:row.school_name,ownerName:row.owner_name,ownerId:row.owner_id,title:row.title,category:row.category,priority:row.priority,status:row.status,version:row.version,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};}
export async function ticket(tx:Tx,id:string,lock=false){const row=(await tx.query(`${ticketSelect} WHERE t.id=$1${lock?' FOR UPDATE OF t':''}`,[id])).rows[0];requireValue(row,'تیکت پیدا نشد.',404);return row;}
export async function operationRoutes(app:FastifyInstance){
 app.get('/api/v1/support/agents',async request=>{const {platform}=await context(request);requireValue(platform,'دسترسی مجاز نیست.',403);return transaction(async tx=>({items:(await tx.query("SELECT DISTINCT u.id,u.name FROM users u JOIN memberships m ON m.user_id=u.id WHERE u.active AND m.active AND m.role='platform_admin' ORDER BY u.name,u.id LIMIT 100")).rows}),'',true);});
 app.get('/api/v1/school-access',async request=>{
  const {member,platform}=await context(request);
  if(platform||!member.school_id)return {schoolId:null,schoolName:'',mode:'active',configuredMode:'active',reason:'',expiresAt:null,version:0,updatedAt:null};
  return transaction(()=>readSchoolAccess(member.school_id!),member.school_id);
 });
 app.get('/api/v1/platform/schools/:id/access',async request=>{
  const {platform}=await context(request);requireValue(platform,'دسترسی مجاز نیست.',403);const id=z.uuid().parse((request.params as {id:string}).id);
  return transaction(async tx=>({access:await readSchoolAccess(id),history:(await tx.query('SELECT h.mode,h.reason,h.expires_at AS "expiresAt",h.version,h.created_at AS "createdAt",u.name AS "changedBy" FROM school_access_history h JOIN users u ON u.id=h.changed_by WHERE h.school_id=$1 ORDER BY h.created_at DESC,h.id LIMIT 25',[id])).rows}),id,true);
 });
 app.patch('/api/v1/platform/schools/:id/access',async request=>{
  const {platform,user}=await context(request);requireValue(platform,'دسترسی مجاز نیست.',403);const id=z.uuid().parse((request.params as {id:string}).id);
  const input=z.object({version:z.number().int().nonnegative(),mode:z.enum(schoolModes),reason:z.string().trim().max(1000),expiresAt:z.iso.datetime().nullable().default(null)}).strict().parse(request.body);
  requireValue(input.mode==='active'||input.reason.length>=3,'علت قابل نمایش برای اعضای مدرسه را وارد کنید.');
  requireValue(!input.expiresAt||Date.parse(input.expiresAt)>Date.now(),'زمان پایان باید در آینده باشد.');
  return transaction(async tx=>{
   await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`school-access:${id}`]);
   const previous=await readSchoolAccess(id);requireValue(previous.version===input.version,'وضعیت مدرسه هم‌زمان تغییر کرده است؛ اطلاعات را تازه کنید.',409);
   await tx.query('INSERT INTO school_access_policies(school_id,mode,reason,expires_at,updated_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(school_id) DO UPDATE SET mode=excluded.mode,reason=excluded.reason,expires_at=excluded.expires_at,updated_by=excluded.updated_by,updated_at=now(),version=school_access_policies.version+1',[id,input.mode,input.reason,input.mode==='active'?null:input.expiresAt,user.id]);
   const access=await readSchoolAccess(id);
   await tx.query('INSERT INTO school_access_history(school_id,mode,reason,expires_at,version,changed_by) VALUES($1,$2,$3,$4,$5,$6)',[id,input.mode,input.reason,access.expiresAt,access.version,user.id]);
   await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$2,$4)',[user.id,id,'school-access-changed',{before:previous.mode,after:input.mode,reason:input.reason,expiresAt:access.expiresAt}]);return access;
  },id,true);
 });
 app.get('/api/v1/support/tickets',async request=>{
  const {member,user,platform}=await context(request),page=paging.parse(request.query);
  return transaction(async tx=>{await ticketContext(tx,user.id);
   const rows=(await tx.query(`${ticketSelect} WHERE ($1::text='' OR t.school_id::text=$1) AND ($2::text='' OR t.status=$2) AND t.title ILIKE $3 ORDER BY t.updated_at DESC,t.id LIMIT 25 OFFSET $4`,[platform?page.schoolId||'':member.school_id||'none',page.status||'',`%${page.search}%`,page.offset])).rows;
   const count=(await tx.query("SELECT count(*)::int AS total FROM support_tickets t WHERE ($1::text='' OR t.school_id::text=$1) AND ($2::text='' OR t.status=$2) AND t.title ILIKE $3",[platform?page.schoolId||'':member.school_id||'none',page.status||'',`%${page.search}%`])).rows[0].total;
   return {items:rows.map(ticketView),total:count};
  },member.school_id||'',platform);
 });
 app.post('/api/v1/support/tickets',{config:{rateLimit:{max:10,timeWindow:'10 minutes'}}},async request=>{
  const {member,user,platform}=await context(request);requireValue(!platform&&member.school_id,'تیکت را از عضویت مدرسه ثبت کنید.',403);
  const input=z.object({title:z.string().trim().min(3).max(200),message:z.string().trim().min(3).max(5000),category:z.enum(ticketCategories),priority:z.enum(ticketPriorities).default('normal')}).strict().parse(request.body);
  return transaction(async tx=>{await ticketContext(tx,user.id);const id=randomUUID();
   await tx.query('INSERT INTO support_tickets(id,school_id,owner_id,membership_id,title,category,priority) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,member.school_id,user.id,member.id,input.title,input.category,input.priority]);
   await tx.query('INSERT INTO support_replies(school_id,ticket_id,author_id,is_staff,message) VALUES($1,$2,$3,false,$4)',[member.school_id,id,user.id,input.message]);
   await audit(tx,user.id,member.school_id,'ticket-created',id);return ticketView(await ticket(tx,id));
  },member.school_id);
 });
 app.get('/api/v1/support/tickets/:id',async request=>{
  const {member,user,platform}=await context(request),id=z.uuid().parse((request.params as {id:string}).id),page=paging.pick({offset:true}).parse(request.query);
  return transaction(async tx=>{await ticketContext(tx,user.id);const row=await ticket(tx,id);
   const replies=(await tx.query('SELECT r.id,r.message,r.is_staff AS "isStaff",r.created_at AS "createdAt",u.name AS "authorName" FROM support_replies r JOIN users u ON u.id=r.author_id WHERE r.ticket_id=$1 ORDER BY r.created_at DESC,r.id LIMIT 25 OFFSET $2',[id,page.offset])).rows;
   const total=(await tx.query('SELECT count(*)::int AS total FROM support_replies WHERE ticket_id=$1',[id])).rows[0].total;
   const files=(await tx.query('SELECT f.id,f.name,f.mime,f.size,f.created_at AS \"createdAt\",u.name AS \"authorName\" FROM support_attachments f JOIN users u ON u.id=f.author_id WHERE f.ticket_id=$1 ORDER BY f.created_at,f.id LIMIT 10',[id])).rows;
   return {files,ticket:ticketView(row),replies:replies.map(reply=>({...reply,createdAt:new Date(reply.createdAt).toISOString()})),total};
  },member.school_id||'',platform);
 });
 app.post('/api/v1/support/tickets/:id/replies',{config:{rateLimit:{max:30,timeWindow:'1 minute'}}},async request=>{
  const {member,user,platform}=await context(request),id=z.uuid().parse((request.params as {id:string}).id),input=z.object({message:z.string().trim().min(1).max(5000)}).strict().parse(request.body);
  return transaction(async tx=>{await ticketContext(tx,user.id);const row=await ticket(tx,id,true);requireValue(row.status!=='closed','تیکت بسته شده است؛ برای بازگشایی با پشتیبانی پیگیری کنید.');
   await tx.query('INSERT INTO support_replies(school_id,ticket_id,author_id,is_staff,message) VALUES($1,$2,$3,$4,$5)',[row.school_id,id,user.id,platform,input.message]);
   await tx.query("UPDATE support_tickets SET status=$2,version=version+1,updated_at=now() WHERE id=$1",[id,platform?'waiting_user':'in_progress']);await audit(tx,user.id,row.school_id,'ticket-replied',id);if(platform)await notifyTicketReply(tx,{userId:user.id,memberId:member.id},row,input.message);return {ok:true};
  },member.school_id||'',platform);
 });
 app.patch('/api/v1/support/tickets/:id',async request=>{
  const {user,member,platform}=await context(request);requireValue(platform,'دسترسی مجاز نیست.',403);const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({status:z.enum(ticketStates).optional(),assignedTo:z.uuid().nullable().optional(),version:z.number().int().positive()}).strict().refine(value=>value.status!==undefined||value.assignedTo!==undefined).parse(request.body);
  return transaction(async tx=>{await ticketContext(tx,user.id);const row=await ticket(tx,id,true);requireValue(row.version===input.version,'تیکت هم‌زمان تغییر کرده است؛ دوباره دریافت کنید.',409);if(input.assignedTo)requireValue((await tx.query("SELECT 1 FROM users u JOIN memberships m ON m.user_id=u.id WHERE u.id=$1 AND u.active AND m.active AND m.role='platform_admin'",[input.assignedTo])).rowCount,'مسئول انتخاب‌شده مدیر پلتفرم فعال نیست.');await tx.query('UPDATE support_tickets SET status=$2,assigned_to=$3,version=version+1,updated_at=now() WHERE id=$1',[id,input.status||row.status,input.assignedTo===undefined?row.assigned_to:input.assignedTo]);await audit(tx,user.id,row.school_id,'ticket-status-changed',id);if(input.assignedTo&&input.assignedTo!==row.assigned_to)await notifyTicketAssignment(tx,{userId:user.id,memberId:member.id},id,row.title,input.assignedTo);return {ok:true};},'',true);
 });
}
