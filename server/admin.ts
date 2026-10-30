import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { membership, requireAuth, hashPassword, passwordSchema } from './auth';
import { pool, query, transaction } from './db';
import { deny, requireValue } from './errors';
import { audit, getRecord } from './repository';
import { permissions } from './schema';
import { scope } from './resources';

const userInput=z.object({username:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,80}$/),name:z.string().min(1).max(200),phone:z.string().regex(/^09\d{9}$/),role:z.enum(['principal','vice_principal','teacher','student','parent']),schoolId:z.uuid(),profileId:z.uuid().optional(),studentId:z.uuid().optional()}).strict();
export async function adminRoutes(app:FastifyInstance) {
  app.post('/api/v1/accounts',async request=>{
    const caller=await membership(request);const user=requireAuth(request);const input=userInput.parse(request.body);
    if(caller.role==='platform_admin')requireValue(input.role==='principal','مدیر منطقه فقط حساب مدیر مدرسه ایجاد می‌کند.',403);
    else if(caller.role!=='principal'||caller.school_id!==input.schoolId||input.role==='principal')deny();
    return transaction(async tx=>{
      const school=await tx.query('SELECT 1 FROM schools WHERE id=$1',[input.schoolId]);requireValue(school.rowCount,'مدرسه پیدا نشد.',404);
      const year=(await tx.query("SELECT id FROM academic_years WHERE school_id=$1 AND data->>'isCurrent'='true'",[input.schoolId])).rows[0]?.id;
      let studentId:string|null=null;let profileId:string|null=null;let perms={};
      let label='';
      if(['student','parent'].includes(input.role)) {
        requireValue(input.studentId&&year,'پرونده و سال فعال لازم است.');
        const student=await getRecord(tx,input.studentId,input.schoolId,year,'students');studentId=String(student.identityId||student.id);label=String(student.name);
        requireValue(input.phone===String(student.parentPhone)||input.phone===String(student.studentPhone),'شماره باید با شماره دانش‌آموز یا ولی ثبت‌شده مطابقت داشته باشد.');
      }
      if(['teacher','vice_principal'].includes(input.role)) {
        requireValue(input.profileId&&year,'پروفایل پرسنل و سال فعال لازم است.');
        const profile=await getRecord(tx,input.profileId,input.schoolId,year,input.role==='teacher'?'teachers':'vicePrincipals');profileId=String(profile.identityId||profile.id);perms=profile.permissions||{};
      }
      // An existing username is never silently attached to a new identity.
      const created=await tx.query('INSERT INTO users(username,name,phone) VALUES($1,$2,$3) RETURNING id',[input.username,input.name,input.phone]);
      const id=created.rows[0].id;
      await tx.query('INSERT INTO memberships(user_id,school_id,role,profile_id,student_id,permissions,label) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,input.schoolId,input.role,profileId,studentId,perms,label]);
      await audit(tx,user.id,input.schoolId,'account-created',id);return {id,username:input.username,activationRequired:true};
    },input.schoolId);
  });
  app.post('/api/v1/accounts/:id/memberships',async request=>{
    const caller=await membership(request);const user=requireAuth(request);const userId=z.uuid().parse((request.params as {id:string}).id);
    const input=userInput.omit({username:true,name:true,phone:true}).parse(request.body);
    if(caller.role==='platform_admin')requireValue(input.role==='principal','دسترسی مجاز نیست.',403);
    else if(caller.role!=='principal'||caller.school_id!==input.schoolId||input.role==='principal')deny();
    return transaction(async tx=>{
      // Principals may extend only users already in their school. Cross-school linkage
      // is performed by the platform operator after explicit identity verification.
      const existing=await tx.query('SELECT 1 FROM memberships WHERE user_id=$1 AND school_id=$2',[userId,input.schoolId]);
      if(caller.role!=='platform_admin')requireValue(existing.rowCount,'حساب باید قبلاً به همین مدرسه متصل باشد.',403);
      const year=(await tx.query("SELECT id FROM academic_years WHERE school_id=$1 AND data->>'isCurrent'='true'",[input.schoolId])).rows[0]?.id;
      let studentId:string|null=null;let profileId:string|null=null;let perms={};let label='';
      if(['student','parent'].includes(input.role)){
        requireValue(input.studentId&&year,'پرونده لازم است.');const student=await getRecord(tx,input.studentId,input.schoolId,year,'students');studentId=String(student.identityId||student.id);label=String(student.name);
        const target=(await tx.query('SELECT phone FROM users WHERE id=$1',[userId])).rows[0];requireValue(target&&(target.phone===student.parentPhone||target.phone===student.studentPhone),'شماره بازیابی حساب با پرونده مرتبط مطابقت ندارد.');
        if(input.role==='student'){const other=await tx.query("SELECT 1 FROM memberships WHERE user_id=$1 AND role='student' AND student_id<>$2",[userId,studentId]);requireValue(!other.rowCount,'حساب دانش‌آموز نمی‌تواند به هویت دانش‌آموز دیگری متصل شود.');}
      }
      if(['teacher','vice_principal'].includes(input.role)){requireValue(input.profileId&&year,'پروفایل لازم است.');const profile=await getRecord(tx,input.profileId,input.schoolId,year,input.role==='teacher'?'teachers':'vicePrincipals');profileId=String(profile.identityId||profile.id);perms=profile.permissions||{};}
      const result=await tx.query('INSERT INTO memberships(user_id,school_id,role,student_id,profile_id,permissions,label) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[userId,input.schoolId,input.role,studentId,profileId,perms,label]);
      await audit(tx,user.id,input.schoolId,'membership-created',result.rows[0].id);return {id:result.rows[0].id};
    },input.schoolId);
  });
  app.get('/api/v1/accounts',async request=>{
    const m=await membership(request);if(!['platform_admin','principal'].includes(m.role))deny();
    const page=z.object({limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().nonnegative().default(0)}).parse(request.query);
    const result=await query(`SELECT DISTINCT u.id,u.username,u.name,u.active,u.phone_verified FROM users u JOIN memberships m ON m.user_id=u.id WHERE ${m.role==='platform_admin'?"m.role='principal'":'m.school_id=$3'} ORDER BY u.username LIMIT $1 OFFSET $2`,m.role==='platform_admin'?[page.limit,page.offset]:[page.limit,page.offset,m.school_id]);return {items:result.rows};
  });
  for(const action of ['disable','enable'] as const)app.post(`/api/v1/accounts/:id/${action}`,async request=>{
    const caller=await membership(request);const actor=requireAuth(request);const target=z.uuid().parse((request.params as {id:string}).id);
    requireValue(actor.id!==target,'وضعیت حساب خود را از این مسیر تغییر ندهید.');
    const roles=(await query('SELECT * FROM memberships WHERE user_id=$1 AND active',[target])).rows;
    requireValue(roles.length,'حساب پیدا نشد.',404);
    if(caller.role==='principal')requireValue(roles.every(m=>m.school_id===caller.school_id&&m.role!=='principal'),'این حساب دسترسی خارج از اختیار شما دارد.',403);
    else requireValue(caller.role==='platform_admin'&&roles.every(m=>m.role==='principal'),'دسترسی مجاز نیست.',403);
    await transaction(async tx=>{await tx.query('UPDATE users SET active=$2 WHERE id=$1',[target,action==='enable']);await tx.query('DELETE FROM sessions WHERE user_id=$1',[target]);await audit(tx,actor.id,caller.school_id,action==='enable'?'account-enabled':'account-disabled',target);},caller.school_id||'');return {ok:true};
  });
}
