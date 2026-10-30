import { randomUUID } from 'node:crypto';
import { sql,and,eq } from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {records} from './model';
import type { Tx } from './db';
import { db } from './db';
import { requireValue } from './errors';
import type { Membership } from './auth';
import {civilDate} from './calendar';

export interface Entity { id: string; schoolId?: string; academicYearId?: string; version: number; [key: string]: unknown }
export interface RecordRow { id: string; school_id: string; year_id: string; kind: string; class_id: string | null; student_id: string | null; teacher_id: string | null; data: Record<string, unknown>; version: number }
export const entity = (row: RecordRow): Entity => ({...row.data,id:row.id,schoolId:row.school_id,academicYearId:row.year_id,version:row.version});
export async function readiness() {
  const result=await db.execute(sql`SELECT rolsuper,rolbypassrls,to_regclass('public.records') AS records,to_regclass('public.school_access_policies') AS school_access,to_regclass('public.support_tickets') AS support,to_regclass('public.inbox_recipients') AS inbox,to_regclass('public.analytics_events') AS analytics,to_regclass('public.support_attachments') AS support_files,to_regclass('public.bale_links') AS bale_links,to_regclass('public.announcement_jobs') AS broadcasts,to_regclass('public.school_feedback') AS feedback,to_regclass('public.school_surveys') AS surveys,to_regclass('public.survey_recipients') AS survey_recipients,to_regclass('public.survey_responses') AS survey_responses,to_regclass('public.evaluation_assignment') AS evaluations,to_regclass('public.school_feedback_status') AS feedback_status FROM pg_roles WHERE rolname=current_user`);
  const role=result.rows[0];requireValue(role&&!role.rolsuper&&!role.rolbypassrls&&role.records&&role.school_access&&role.support&&role.inbox&&role.analytics&&role.support_files&&role.bale_links&&role.broadcasts&&role.feedback&&role.surveys&&role.survey_recipients&&role.survey_responses&&role.evaluations&&role.feedback_status,'پایگاه داده باید مهاجرت‌شده و حساب اجرایی فاقد مجوز دورزدن RLS باشد.',503);
}
export async function getRecord(tx: Tx, id: string, school: string, year: string, kind?: string, lock=false): Promise<Entity> {
  const query=drizzle(tx).select().from(records).where(and(eq(records.id,id),eq(records.school_id,school),eq(records.year_id,year),kind?eq(records.kind,kind):undefined)).$dynamic();
  const result=await (lock?query.for('update'):query);
  requireValue(result.length, 'رکورد پیدا نشد.', 404);
  return entity(result[0]);
}
export async function saveRecord(tx: Tx, school: string, year: string, kind: string, data: Record<string, unknown>, existing?: Entity): Promise<Entity> {
  const id = existing?.id || randomUUID();
  const payload = {...data}; delete payload.id; delete payload.schoolId; delete payload.academicYearId; delete payload.version;
  const day=kind==='attendanceSessions'?civilDate(String(payload.date)):null;
  const identity=kind==='students'?payload.identityId||null:null;
  const args = [school,year,kind,payload.classGroupId || null,payload.studentId || null,payload.teacherId || null,payload.subject || null,payload,id,day,identity];
  const result = existing ? await tx.query(`UPDATE records SET class_id=$4,student_id=$5,teacher_id=$6,subject=$7,data=$8,civil_day=$10,identity_id=$11,version=version+1 WHERE school_id=$1 AND year_id=$2 AND kind=$3 AND id=$9 AND version=$12 RETURNING *`, [...args,existing.version])
    : await tx.query('INSERT INTO records(school_id,year_id,kind,class_id,student_id,teacher_id,subject,data,id,civil_day,identity_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',args);
  requireValue(result.rowCount,'اطلاعات توسط کاربر دیگری تغییر کرده است؛ دوباره بارگذاری کنید.',409);
  return entity(result.rows[0]);
}
export async function classAccess(tx: Tx, member: Membership, school: string, year: string, classId: string, subject?: string) {
  const group=await getRecord(tx,classId,school,year,'classes');
  if(member.role!=='teacher') return group;
  requireValue(member.profile_id,'انتساب دبیر پیدا نشد.',403);
  const profile=await getRecord(tx,member.profile_id,school,year,'teachers');
  requireValue((profile.assignedClassIds as string[]).includes(classId) && (!subject || (profile.teachingSubjects as string[]).includes(subject)), 'این کلاس یا درس به شما اختصاص ندارد.',403);
  if(subject){const match=await tx.query("SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND class_id=$3 AND teacher_id=$4 AND subject=$5 LIMIT 1",[school,year,classId,profile.id,subject]);requireValue(match.rowCount,'این ترکیب کلاس و درس در برنامه دبیر نیست.',403);}
  return group;
}
export async function audit(tx:Tx,userId:string,schoolId:string|null,action:string,id?:string) {
  await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id) VALUES($1,$2,$3,$4)',[userId,schoolId,action,id||null]);
}
