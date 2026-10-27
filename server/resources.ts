import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { membership, requireAuth, type Membership } from './auth';
import { pool, query, transaction, type Tx } from './db';
import { deny, requireValue } from './errors';
import { audit, classAccess, entity, getRecord, saveRecord, type Entity } from './repository';
import { resourceSchemas, resourceName, paging, type Resource } from './schema';
import { toEnglishDigits, getSchoolDate } from '../src/utils/persianUtils';
import { validateGradeItem } from '../src/utils/gradeUtils';
import { schoolTimeMinutes } from '../src/utils/attendance';
import type { Student, AttendanceSession, VicePrincipalPermissions, GradeItem } from '../src/types';
import {validateCivilDates} from './calendar';

export function allowed(member:Membership, permission:keyof VicePrincipalPermissions) {
  return member.role==='principal' || (member.role==='vice_principal' && member.permissions[permission]===true);
}
export function manage(member:Membership,kind:Resource) {
  if(['schools','banners'].includes(kind)) return member.role==='platform_admin';
  if(['teachers','vicePrincipals','academicYears'].includes(kind)) return member.role==='principal';
  if(['students','classes'].includes(kind)) return allowed(member,'canManageStudentsAndClasses');
  if(kind==='schedule') return allowed(member,'canManageSchedule');
  if(kind==='feeItems') return allowed(member,'canManageFinances');
  if(kind==='announcements') return allowed(member,'canManageAnnouncements') || member.role==='platform_admin';
  if(['grades','homework','exams','questionBank'].includes(kind)) return member.role==='teacher' || (kind==='questionBank' && member.role==='platform_admin');
  if(kind==='homeworkSubmissions') return member.role==='student';
  return false;
}
export async function scope(request:FastifyRequest,write=false) {
  const member=await membership(request);
  const school=member.school_id || '';
  const yearHeader=request.headers['x-academic-year-id'];
  let year=typeof yearHeader==='string' && yearHeader ? z.uuid().parse(yearHeader):'';
  if(school&&(!year||write)) await transaction(async tx=>{
    const result=await tx.query(`SELECT * FROM academic_years WHERE school_id=$1 ${year?'AND id=$2':"AND data->>'isCurrent'='true'"}`,year?[school,year]:[school]);
    if(!result.rowCount){requireValue(!write && !year,'سال تحصیلی فعال پیدا نشد.');return;}
    year=result.rows[0].id;
    if(write) requireValue(result.rows[0].data.isCurrent && result.rows[0].data.status==='active','سال انتخاب‌شده فقط خواندنی است.');
  },school);
  return {member,school,year,user:requireAuth(request)};
}
export async function memberProfile(tx:Tx,m:Membership,school:string,year:string) {
  if(!m.profile_id) return null;
  const result=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind IN ('teachers','vicePrincipals') AND (id=$3 OR data->>'identityId'=$4)",[school,year,m.profile_id,m.profile_id]);
  return result.rowCount ? entity(result.rows[0]):null;
}
export async function linkedRecord(tx:Tx,m:Membership,school:string,year:string):Promise<Entity|null> {
  if(!m.student_id) return null;
  const r=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND (id=$3 OR identity_id=$3 OR data->>'identityId'=$4)",[school,year,m.student_id,m.student_id]);
  return r.rowCount ? entity(r.rows[0]):null;
}
export async function visibleFilter(tx:Tx,m:Membership,school:string,year:string,kind:string,args:unknown[]):Promise<string> {
  const add=(v:unknown)=>{args.push(v);return `$${args.length}`;};
  if(m.role==='platform_admin') return 'false';
  if(m.role==='principal') return 'true';
  if(m.role==='vice_principal'){
    if(kind==='vicePrincipals'){const profile=await memberProfile(tx,m,school,year);args.push(profile?.id||null);return `id=$${args.length}`;}
    return 'true';
  }
  if(['feeItems','teachers','vicePrincipals'].includes(kind)) return 'false';
  const profile=await memberProfile(tx,m,school,year);
  if(m.role==='teacher') {
    const classes=(profile?.assignedClassIds as string[])||[];
    if(['questionBank','announcements'].includes(kind)) return kind==='announcements'?"data->>'target' IN ('all','teachers')":'true';
    if(kind==='notifications') return 'false';
    const col=kind==='classes'?'id':'class_id';
    let filter=`${col}=ANY(${add(classes)}::uuid[])`;
    if(['grades','homework','exams','schedule'].includes(kind)) filter+=` AND subject=ANY(${add(profile?.teachingSubjects||[])}::text[])`;
    if(['homework','schedule'].includes(kind)) filter+=` AND teacher_id=${add(profile?.id||null)}`;
    if(kind==='homeworkSubmissions') filter+=` AND data->>'homeworkId' IN (SELECT id::text FROM records WHERE school_id=${add(school)} AND year_id=${add(year)} AND kind='homework' AND teacher_id=${add(profile?.id||null)})`;
    return filter;
  }
  const child=await linkedRecord(tx,m,school,year);
  if(!child)return 'false';
  if(kind==='students')return `id=${add(child.id)}`;
  if(kind==='notifications')return m.role==='parent'?`student_id=${add(child.id)}`:'false';
  if(kind==='announcements')return `data->>'target' IN ('all',${add(m.role==='parent'?'parents':'students')})`;
  if(kind==='questionBank')return m.role==='student'?'true':'false';
  if(kind==='homeworkSubmissions')return `student_id=${add(child.id)}`;
  if(['classes','schedule','homework','exams','grades','attendanceSessions'].includes(kind))return `${kind==='classes'?'id':'class_id'}=${add(child.classGroupId||null)}`;
  return 'false';
}
export async function assertRead(tx:Tx,m:Membership,school:string,year:string,id:string,kind:string) {
  const args:unknown[]=[id,school,year,kind];
  const filter=await visibleFilter(tx,m,school,year,kind,args);
  const result=await tx.query(`SELECT * FROM records WHERE id=$1 AND school_id=$2 AND year_id=$3 AND kind=$4 AND (${filter})`,args);
  requireValue(result.rowCount,'رکورد پیدا نشد.',404);
  return entity(result.rows[0]);
}
function sanitize(row:Entity,m:Membership,linkedId?:string):Entity {
  const out={...row};
  if(m.role==='teacher')delete out.financialSummary;
  if((m.role==='parent'||m.role==='student')&&Array.isArray(out.scores)) out.scores=out.scores.filter((v:{studentId:string})=>v.studentId===linkedId);
  if((m.role==='parent'||m.role==='student')&&Array.isArray(out.records)) out.records=out.records.filter((v:{studentId:string})=>v.studentId===linkedId);
  if((m.role==='parent'||m.role==='student')&&Array.isArray(out.reportCards))out.reportCards=out.reportCards.filter((v:{isPublished:boolean})=>v.isPublished);
  delete out.previousVersions;
  return out;
}
export async function validateReferences(tx:Tx,m:Membership,school:string,year:string,kind:Resource,data:Record<string,unknown>) {
  if(data.classGroupId){const group=await classAccess(tx,{...m,profile_id:(await memberProfile(tx,m,school,year))?.id||null},school,year,String(data.classGroupId),typeof data.subject==='string'?data.subject:undefined);if(['schedule','homework','exams'].includes(kind))data.className=group.name;}
  if(kind==='schedule') {
    const start=schoolTimeMinutes(String(data.startTime)),end=schoolTimeMinutes(String(data.endTime));requireValue(start!==undefined&&end!==undefined&&end>start,'ساعت آغاز و پایان زنگ معتبر نیست.');data.startTime=toEnglishDigits(String(data.startTime));data.endTime=toEnglishDigits(String(data.endTime));
    const teacher=await getRecord(tx,String(data.teacherId),school,year,'teachers');
    requireValue((teacher.assignedClassIds as string[]).includes(String(data.classGroupId)) && (teacher.teachingSubjects as string[]).includes(String(data.subject)),'دبیر باید برای همین کلاس و درس منصوب باشد.');
    data.teacherName=teacher.name;
  }
  if(kind==='teachers') for(const cls of (data.assignedClassIds as string[])||[])await getRecord(tx,cls,school,year,'classes');
  if(['homework','exams'].includes(kind)) {
    if(kind==='exams')requireValue(schoolTimeMinutes(String(data.startTime))!==undefined,'ساعت آغاز آزمون معتبر نیست.');
    const profile=await memberProfile(tx,m,school,year);requireValue(profile,'پروفایل دبیر پیدا نشد.');
    data.teacherId=profile.id;data.teacherName=profile.name;
  }
  if(kind==='grades') {
    requireValue(!validateGradeItem({...data,schoolId:school} as unknown as Omit<GradeItem,'id'>), 'نمره یا فهرست ارزشیابی معتبر نیست.');
    const roster=await tx.query("SELECT id FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND COALESCE(data->>'status','active')='active'",[school,year,data.classGroupId]);
    const scores=data.scores as {studentId:string}[];
    requireValue(scores.length===roster.rowCount && scores.every(row=>roster.rows.some(s=>s.id===row.studentId)),'نمرات باید دقیقاً متعلق به دانش‌آموزان فعال همین کلاس باشند.');
  }
  if(kind==='homeworkSubmissions') {
    const student=await linkedRecord(tx,m,school,year);requireValue(student && student.id===data.studentId,'پاسخ فقط برای حساب خود قابل ثبت است.',403);
    const hw=await assertRead(tx,m,school,year,String(data.homeworkId),'homework');
    data.studentId=student.id;data.studentName=student.name;data.classGroupId=hw.classGroupId;
    data.submissionDate=`${getSchoolDate()} - ${new Date().toISOString()}`;data.status='submitted';
  }
  // Files must belong to this account, or already be an authorized class file.
  for(const file of (data.attachments as {url?:string}[])||[]) {
    if(!file.url)continue;
    const id=file.url.split('/').pop();
    const found=await tx.query('SELECT 1 FROM files WHERE id=$1 AND school_id=$2 AND year_id=$3 AND owner_id=$4',[id,school,year,(data._actor as string)]);
    requireValue(found.rowCount,'پیوست متعلق به این حساب نیست.',403);
  }
  delete data._actor;
}
export async function resourceRoutes(app:FastifyInstance) {
  app.get('/api/v1/attendance/daily-absences',async request=>{
    const {member,school,year}=await scope(request);requireValue(['principal','vice_principal'].includes(member.role),'دسترسی مجاز نیست.',403);const page=paging.parse(request.query);
    if(!year)return {items:[],total:0};
    return transaction(async tx=>{
      const rows=await tx.query(`WITH incidents AS (SELECT DISTINCT ON (entry->>'studentId') entry->>'studentId' AS student_id,r.data AS session,r.id AS session_id,r.version AS session_version,entry->>'note' AS note FROM records r CROSS JOIN LATERAL jsonb_array_elements(r.data->'records') entry WHERE r.school_id=$1 AND r.year_id=$2 AND r.kind='attendanceSessions' AND r.civil_day=$3::date AND entry->>'status'='absent' ORDER BY entry->>'studentId',(r.data->>'period')::int DESC) SELECT s.*,incidents.session,incidents.session_id,incidents.session_version,incidents.note,count(*) OVER() AS total FROM incidents JOIN records s ON s.id=incidents.student_id::uuid AND s.school_id=$1 AND s.year_id=$2 AND s.kind='students' WHERE COALESCE(s.data->>'status','active')='active' AND s.data->>'name' ILIKE $6 ORDER BY s.data->>'name',s.id LIMIT $4 OFFSET $5`,[school,year,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'}),page.limit,page.offset,`%${page.search}%`]);
      return {items:rows.rows.map(row=>{const student=entity(row);delete student.financialSummary;return {student,session:{...row.session,id:row.session_id,version:row.session_version,records:row.session.records.filter((r:{studentId:string})=>r.studentId===row.id),previousVersions:undefined},note:row.note};}),total:Number(rows.rows[0]?.total||0)};
    },school);
  });
  app.get('/api/v1/classes/:id/roster',async request=>{
    const {member,school,year}=await scope(request);const classId=z.uuid().parse((request.params as {id:string}).id);
    requireValue(['principal','vice_principal','teacher'].includes(member.role),'دسترسی مجاز نیست.',403);
    return transaction(async tx=>{
      await classAccess(tx,{...member,profile_id:(await memberProfile(tx,member,school,year))?.id||null},school,year,classId);
      const result=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND COALESCE(data->>'status','active')='active' ORDER BY data->>'name' LIMIT 201",[school,year,classId]);
      requireValue(result.rows.length<=200,'این کلاس بیش از سقف مجاز دانش‌آموز دارد؛ کلاس‌بندی را بررسی کنید.');
      return {items:result.rows.map(row=>{const data=entity(row);delete data.financialSummary;data.reportCards=[];data.disciplinaryRecords=[];data.pastYearHistory=[];return data;})};
    },school);
  });
  app.get('/api/v1/attendance/session',async request=>{
    const {member,school,year}=await scope(request);const input=z.object({scheduleSlotId:z.uuid()}).strict().parse(request.query);
    requireValue(['principal','vice_principal','teacher'].includes(member.role),'دسترسی مجاز نیست.',403);
    return transaction(async tx=>{
      const slot=await getRecord(tx,input.scheduleSlotId,school,year,'schedule');const profile=await memberProfile(tx,member,school,year);
      await classAccess(tx,{...member,profile_id:profile?.id||null},school,year,String(slot.classGroupId),String(slot.subject));
      if(member.role==='teacher')requireValue(slot.teacherId===profile?.id,'این برنامه متعلق به شما نیست.',403);
      const row=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND class_id=$3 AND civil_day=$4::date AND data->>'period'=$5",[school,year,slot.classGroupId,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'}),String(slot.period)])).rows[0];
      if(!row)return null;const item=entity(row);delete item.previousVersions;return item;
    },school);
  });
  app.get('/api/v1/students/:id/records/:kind',async request=>{
    const {member,school,year}=await scope(request);const params=z.object({id:z.uuid(),kind:z.enum(['grades','attendanceSessions'])}).parse(request.params);const page=paging.parse(request.query);
    requireValue(school&&year&&member.role!=='platform_admin','رکورد پیدا نشد.',404);
    if(member.role==='vice_principal'&&!allowed(member,'canViewFullDossier'))deny();
    return transaction(async tx=>{
      await assertRead(tx,member,school,year,params.id,'students');
      const field=params.kind==='grades'?'scores':'records';
      const rows=await tx.query(`SELECT id,school_id,year_id,kind,version,jsonb_set(data,'{${field}}',(SELECT COALESCE(jsonb_agg(entry),'[]'::jsonb) FROM jsonb_array_elements(data->'${field}') entry WHERE entry->>'studentId'=$4)) AS data,count(*) OVER() total FROM records WHERE school_id=$1 AND year_id=$2 AND kind=$3 AND data->'${field}' @> $5::jsonb ORDER BY created_at DESC,id LIMIT $6 OFFSET $7`,[school,year,params.kind,params.id,JSON.stringify([{studentId:params.id}]),page.limit,page.offset]);
      return {items:rows.rows.map(row=>{const item=entity(row);delete item.previousVersions;return item;}),total:Number(rows.rows[0]?.total||0)};
    },school);
  });
  app.get('/api/v1/workspace',async request=>{
    const {member,school,year,user}=await scope(request);
    if(member.role==='platform_admin')return {user:{...user,role:member.role,avatarBg:'bg-rose-600'},years:[],profile:null,currentStudentId:null};
    return transaction(async tx=>{
      const years=await tx.query('SELECT id,school_id,data,version FROM academic_years WHERE school_id=$1 ORDER BY data->>\'title\' DESC',[school]);
      const profile=await memberProfile(tx,member,school,year);
      const student=await linkedRecord(tx,member,school,year);
      return {user:{...user,role:member.role,schoolId:school,avatarBg:'bg-teal-600',assignedClassIds:profile?.assignedClassIds||[],teachingSubjects:profile?.teachingSubjects||[],studentId:member.role==='student'?student?.id:undefined,childStudentId:member.role==='parent'?student?.id:undefined},years:years.rows.map(r=>({...r.data,id:r.id,schoolId:r.school_id,version:r.version})),profile,currentStudentId:student?.id||null};
    },school);
  });
  app.get('/api/v1/resources/:kind',async request=>{
    const kind=resourceName.parse((request.params as {kind:string}).kind) as Resource;
    const page=paging.parse(request.query);const {member,school,year}=await scope(request);
    if(kind==='schools') {
      const args:unknown[]=[page.limit,page.offset,member.role==='platform_admin'?`%${page.search}%`:school];
      const filter=member.role==='platform_admin'?"data->>'name' ILIKE $3":"id=$3::uuid";
      const result=await query(`SELECT *,count(*) OVER() AS total FROM schools WHERE ${filter} ORDER BY id LIMIT $1 OFFSET $2`,args);
      return {items:result.rows.map(r=>({...r.data,...r.data.todayAttendanceDate!==getSchoolDate()?{todayAttendanceSubmitted:false,attendanceRateToday:0,attendanceRecordedCount:0}:{},id:r.id,version:r.version})),total:Number(result.rows[0]?.total||0),...page};
    }
    if(kind==='academicYears') return {items:(await transaction(async tx=>(await tx.query('SELECT * FROM academic_years WHERE school_id=$1',[school])).rows.map(r=>({...r.data,id:r.id,schoolId:school,version:r.version})),school)),total:0,...page};
    if(kind==='banners'||member.role==='platform_admin') {
      requireValue(['banners','announcements','questionBank'].includes(kind),'این بخش در دسترس مدیر منطقه نیست.',403);
      const rows=await query("SELECT *,count(*) OVER() total FROM regional_content WHERE kind=$1 AND COALESCE(data->>'title','') ILIKE $4 ORDER BY id LIMIT $2 OFFSET $3",[kind,page.limit,page.offset,`%${page.search}%`]);
      return {items:rows.rows.map(r=>({...r.data,id:r.id,schoolId:'all',version:r.version})),total:Number(rows.rows[0]?.total||0),...page};
    }
    if(!year)return {items:[],total:0,...page};
    if(kind==='questionBank'&&member.role==='parent')deny();
    return transaction(async tx=>{
      const args:unknown[]=[school,year,kind,page.limit,page.offset,`%${page.search}%`];
      const filter=await visibleFilter(tx,member,school,year,kind,args);
      if(['questionBank','announcements'].includes(kind)){
        const audience=member.role==='teacher'?'teachers':member.role==='parent'?'parents':'students';args.push(audience,['principal','vice_principal'].includes(member.role));
        const audienceParam=`$${args.length-1}`,managerParam=`$${args.length}`;
        const rows=await tx.query(`WITH items AS (SELECT id,school_id::text AS school_id,year_id,kind,data,version FROM records WHERE school_id=$1 AND year_id=$2 AND kind=$3 AND (${filter}) AND NOT EXISTS(SELECT 1 FROM regional_content rc WHERE rc.id=records.id AND rc.kind=$3) UNION ALL SELECT id,COALESCE(data->>'schoolId','all'),NULL::uuid,kind,data,version FROM regional_content WHERE kind=$3 AND ($3='questionBank' OR ${managerParam}::boolean OR data->>'target' IN ('all',${audienceParam}))) SELECT *,count(*) OVER() total FROM items WHERE COALESCE(data->>'title','') ILIKE $6 ORDER BY COALESCE(data->>'createdAt',data->>'date','') DESC,id DESC LIMIT $4 OFFSET $5`,args);
        return {items:rows.rows.map(entity),total:Number(rows.rows[0]?.total||0),...page};
      }
      if(page.classId)args.push(page.classId);
      const rows=await tx.query(`SELECT *,count(*) OVER() total FROM records WHERE school_id=$1 AND year_id=$2 AND kind=$3 AND (${filter}) AND (COALESCE(data->>'name',data->>'title','') ILIKE $6) ${page.classId?`AND class_id=$${args.length}`:''} ORDER BY created_at DESC,id LIMIT $4 OFFSET $5`,args);
      const child=await linkedRecord(tx,member,school,year);
      const items=rows.rows.map(r=>{
        const row=sanitize(entity(r),member,child?.id);
        if(kind==='students') { if(page.includeFinance!=='true'||!allowed(member,'canManageFinances'))delete row.financialSummary;row.reportCards=[];row.disciplinaryRecords=[];row.pastYearHistory=[]; }
        return row;
      });
      return {items,total:Number(rows.rows[0]?.total||0),...page};
    },school);
  });
  app.get('/api/v1/students/:id',async request=>{
    const {member,school,year}=await scope(request);const id=z.uuid().parse((request.params as {id:string}).id);
    requireValue(school&&year&&member.role!=='platform_admin','رکورد پیدا نشد.',404);
    if(member.role==='vice_principal'&&!allowed(member,'canViewFullDossier'))deny();
    return transaction(async tx=>{
      let row=await assertRead(tx,member,school,year,id,'students');
      const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'});
      const stats=(await tx.query(`WITH days AS (SELECT civil_day,max(CASE entry->>'status' WHEN 'absent' THEN 3 WHEN 'late' THEN 2 WHEN 'excused' THEN 1 ELSE 0 END) severity FROM records CROSS JOIN LATERAL jsonb_array_elements(data->'records') entry WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND data->'records' @> $3::jsonb AND entry->>'studentId'=$4 AND civil_day<=$5::date GROUP BY civil_day) SELECT count(*)::int AS "totalDays",count(*) FILTER(WHERE severity=0)::int AS "presentDays",count(*) FILTER(WHERE severity=1)::int AS "excusedDays",count(*) FILTER(WHERE severity=2)::int AS "lateDays",count(*) FILTER(WHERE severity=3)::int AS "absentDays",max(severity) FILTER(WHERE civil_day=$5::date) AS today FROM days`,[school,year,JSON.stringify([{studentId:id}]),id,today])).rows[0];
      const {today:status,...attendanceStats}=stats;row={...row,attendanceStats,attendanceStatsSource:'sessions',todayStatus:status===null?undefined:['present','excused','late','absent'][status]};
      return sanitize(row,member,id);
    },school);
  });
  app.get('/api/v1/dashboard',async request=>{
    const {member,school,year}=await scope(request);
    if(member.role==='platform_admin'){
      const result=(await query("SELECT count(*)::int AS schools,COALESCE(sum((data->>'studentCount')::int),0)::int AS students,COALESCE(sum((data->>'teacherCount')::int),0)::int AS teachers, count(*) FILTER(WHERE data->>'todayAttendanceDate'=$1)::int AS submittedSchools FROM schools",[getSchoolDate()])).rows[0];return result;
    }
    return transaction(async tx=>{
      const args:unknown[]=[school,year];const filter=await visibleFilter(tx,member,school,year,'students',args);
      const rows=await tx.query(`SELECT count(*) FILTER(WHERE COALESCE(data->>'status','active')='active')::int AS students,count(*) FILTER(WHERE data->>'status'='graduated')::int AS graduated FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND (${filter})`,args);
      const result:Record<string,number>={...rows.rows[0]};
      if(['principal','vice_principal'].includes(member.role)){
        const counts=(await tx.query("SELECT count(*) FILTER(WHERE kind='classes')::int AS classes,count(*) FILTER(WHERE kind='teachers')::int AS teachers FROM records WHERE school_id=$1 AND year_id=$2 AND kind IN ('classes','teachers')",[school,year])).rows[0];Object.assign(result,counts);
        const daily=(await tx.query("WITH statuses AS (SELECT (entry->>'studentId')::uuid AS student,max(CASE entry->>'status' WHEN 'absent' THEN 3 WHEN 'late' THEN 2 WHEN 'excused' THEN 1 ELSE 0 END) AS severity FROM records CROSS JOIN LATERAL jsonb_array_elements(data->'records') entry WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND civil_day=$3::date GROUP BY entry->>'studentId') SELECT count(*)::int AS recorded,count(*) FILTER(WHERE severity=3)::int AS absent,count(*) FILTER(WHERE severity IN (0,2))::int AS present FROM statuses",[school,year,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'})])).rows[0];Object.assign(result,daily);
        result.attendanceRate=result.recorded?Math.round(result.present/result.recorded*1000)/10:0;
        if(allowed(member,'canManageFinances')){
          const financial=(await tx.query(`SELECT COALESCE(sum((data->'financialSummary'->>'totalBilled')::numeric),0) AS "totalBilled",COALESCE(sum((data->'financialSummary'->>'totalPaid')::numeric),0) AS "totalPaid",COALESCE(sum((data->'financialSummary'->>'totalDiscount')::numeric),0) AS "totalDiscount",COALESCE(sum((data->'financialSummary'->>'remainingDebt')::numeric),0) AS "totalRemainingDebt",count(*) FILTER(WHERE COALESCE((data->'financialSummary'->>'remainingDebt')::numeric,0)>0)::int AS "debtorCount",count(*) FILTER(WHERE COALESCE((data->'financialSummary'->>'remainingDebt')::numeric,0)=0)::int AS "settledCount",count(*) FILTER(WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(data->'financialSummary'->'installments','[]'::jsonb)) i WHERE i->>'dueDate'<$3 AND (i->>'amount')::numeric>(i->>'paidAmount')::numeric))::int AS "overdueCount" FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND COALESCE(data->>'status','active') IN ('active','pending_class_assignment')`,[school,year,getSchoolDate()])).rows[0];
          for(const [key,value]of Object.entries(financial)){const number=Number(value);requireValue(Number.isSafeInteger(number),'جمع مالی از محدوده امن نمایش خارج شده است.');result[key]=number;}
          result.collectionRate=Math.min(100,Math.round(result.totalPaid/Math.max(1,result.totalBilled-result.totalDiscount)*100));
        }
      }
      return result;
    },school);
  });
  app.post('/api/v1/resources/:kind',async request=>{
    const kind=resourceName.parse((request.params as {kind:string}).kind) as Resource;
    const {member,school,year,user}=await scope(request,!['schools','banners','academicYears'].includes(kind));
    if(!manage(member,kind))deny();
    requireValue(kind in resourceSchemas,'این رکورد از مسیر اختصاصی ثبت می‌شود.');
    const body=request.body as Record<string,unknown>;
    if(member.role!=='platform_admin'&&body.schoolId!==undefined)requireValue(body.schoolId===school,'مدرسه درخواست با دسترسی حساب مطابقت ندارد.',403);
    const {schoolId:_school,...raw}=body;
    if(kind!=='feeItems')delete raw.academicYearId;
    if(kind==='students')raw.nationalCode=toEnglishDigits(String(raw.nationalCode));
    if(kind==='academicYears')raw.title=toEnglishDigits(String(raw.title)).trim();
    for(const field of ['phone','parentPhone','studentPhone','emergencyPhone'])if(typeof raw[field]==='string')raw[field]=toEnglishDigits(raw[field]).replace(/[\s-]/g,'');
    const schema=resourceSchemas[kind as keyof typeof resourceSchemas];
    const data=schema.parse(raw) as Record<string,unknown>;
    validateCivilDates(data);
    if(kind==='schools')Object.assign(data,{studentCount:0,teacherCount:0,classesCount:0,todayAttendanceSubmitted:false,attendanceRateToday:0});
    if(kind==='announcements')Object.assign(data,{senderName:user.name,senderRole:member.role});
    if(kind==='questionBank')Object.assign(data,{authorName:user.name});
    return transaction(async tx=>{
      let result:Entity;
      if(kind==='schools') {
        const row=await tx.query('INSERT INTO schools(data) VALUES($1) RETURNING *',[data]);result={...data,id:row.rows[0].id,version:1};
      } else if(kind==='banners'||member.role==='platform_admin') {
        const row=await tx.query('INSERT INTO regional_content(kind,data) VALUES($1,$2) RETURNING *',[kind,{...data,date:getSchoolDate(),clicksCount:0}]);result={...data,id:row.rows[0].id,version:1};
      } else if(kind==='academicYears') {
        const current=await tx.query('SELECT id FROM academic_years WHERE school_id=$1',[school]);
        data.isCurrent=!current.rowCount;data.status=current.rowCount?'planned':'active';
        const row=await tx.query('INSERT INTO academic_years(school_id,data) VALUES($1,$2) RETURNING *',[school,data]);result={...data,id:row.rows[0].id,version:1};
      } else {
        requireValue(year,'ابتدا سال تحصیلی را ایجاد کنید.');
        data._actor=user.id;
        await validateReferences(tx,member,school,year,kind,data);
        if(kind==='questionBank')data.authorSchool=(await tx.query("SELECT data->>'name' AS name FROM schools WHERE id=$1",[school])).rows[0]?.name||'';
        if(kind==='students'){
          await tx.query('SELECT id FROM records WHERE id=$1 FOR UPDATE',[data.classGroupId]);
          const roster=await tx.query("SELECT count(*)::int AS n FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND COALESCE(data->>'status','active')='active'",[school,year,data.classGroupId]);
          requireValue(roster.rows[0].n<200,'سقف این کلاس دویست دانش‌آموز است.');
          const identity=await tx.query('INSERT INTO enrollment_identities(national_code) VALUES($1) ON CONFLICT(national_code) DO UPDATE SET national_code=EXCLUDED.national_code RETURNING id',[data.nationalCode]);
          Object.assign(data,{identityId:identity.rows[0].id,attendanceStats:{totalDays:0,presentDays:0,absentDays:0,lateDays:0,excusedDays:0},reportCards:[],disciplinaryRecords:[],pastYearHistory:[]});
        }
        if(['teachers','vicePrincipals'].includes(kind))data.identityId=randomUUID();
        if(kind==='homework')data.submissionsCount=0;
        if(['announcements','feeItems','questionBank'].includes(kind))Object.assign(data,{date:getSchoolDate(),createdAt:getSchoolDate(),usageCount:0});
        if(kind==='feeItems')requireValue(raw.academicYearId===year,'تعرفه به سال انتخاب‌شده تعلق ندارد.');
        result=await saveRecord(tx,school,year,kind,data);
        if(kind==='questionBank'&&data.isSharedRegional)await tx.query('INSERT INTO regional_content(id,kind,data) VALUES($1,$2,$3)',[result.id,kind,{...data,schoolId:school}]);
      }
      await audit(tx,user.id,school||null,`create:${kind}`,result.id);return result;
    },school);
  });
  app.patch('/api/v1/resources/:kind/:id',async request=>{
    const kind=resourceName.parse((request.params as {kind:string}).kind) as Resource;
    const id=z.uuid().parse((request.params as {id:string}).id);
    const {member,school,year,user}=await scope(request,kind!=='academicYears');
    if(!manage(member,kind))deny();
    const input=z.object({version:z.number().int().positive(),changes:z.record(z.string(),z.unknown())}).strict().parse(request.body);
    requireValue(kind in resourceSchemas && !['schools','banners'].includes(kind),'از مسیر عملیات اختصاصی استفاده کنید.');
    return transaction(async tx=>{
      if(kind==='academicYears') {
        const row=await tx.query('SELECT * FROM academic_years WHERE id=$1 AND school_id=$2 FOR UPDATE',[id,school]);requireValue(row.rowCount,'سال پیدا نشد.',404);
        requireValue(row.rows[0].version===input.version,'نسخه سال تغییر کرده است.',409);
        if(typeof input.changes.title==='string')input.changes.title=toEnglishDigits(input.changes.title).trim();
        const changes=resourceSchemas.academicYears.partial().omit({isCurrent:true,status:true}).parse(input.changes);validateCivilDates(changes);
        const updated=await tx.query('UPDATE academic_years SET data=data||$1,version=version+1 WHERE id=$2 RETURNING *',[changes,id]);
        return {...updated.rows[0].data,id,version:updated.rows[0].version};
      }
      const old=await getRecord(tx,id,school,year,kind,true);requireValue(old.version===input.version,'اطلاعات تغییر کرده؛ دوباره بارگذاری کنید.',409);
      if(member.role==='teacher'){
        await classAccess(tx,{...member,profile_id:(await memberProfile(tx,member,school,year))?.id||null},school,year,String(old.classGroupId),String(old.subject));
        if(kind==='homework')requireValue(old.teacherId===(await memberProfile(tx,member,school,year))?.id,'این تکلیف متعلق به شما نیست.',403);
      }
      if(kind==='feeItems') { const used=await tx.query("SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND data->'financialSummary'->'assignedFees' @> $3::jsonb",[school,year,JSON.stringify([{feeItemId:id}])]);requireValue(!used.rowCount,'تعرفه تخصیص‌یافته قابل ویرایش نیست.'); }
      const changes=resourceSchemas[kind as keyof typeof resourceSchemas].partial().parse(input.changes) as Record<string,unknown>;
      validateCivilDates(changes);
      if(kind==='students'&&changes.nationalCode!==undefined)requireValue(changes.nationalCode===old.nationalCode,'تغییر کد ملی نیازمند تطبیق هویت توسط مسئول سامانه است.');
      const data={...old,...changes,_actor:user.id};
      await validateReferences(tx,member,school,year,kind,data);
      const result=await saveRecord(tx,school,year,kind,data,old);
      if(kind==='vicePrincipals'&&changes.permissions)await tx.query("UPDATE memberships SET permissions=$1 WHERE school_id=$2 AND role='vice_principal' AND (profile_id=$3 OR profile_id=$4)",[changes.permissions,school,old.id,old.identityId||old.id]);
      await audit(tx,user.id,school,`update:${kind}`,id);return result;
    },school);
  });
  app.delete('/api/v1/resources/:kind/:id',async request=>{
    const kind=resourceName.parse((request.params as {kind:string}).kind) as Resource;const id=z.uuid().parse((request.params as {id:string}).id);
    const {member,school,year,user}=await scope(request,true);if(!manage(member,kind))deny();
    requireValue(['classes','schedule','homework','exams','announcements','teachers','vicePrincipals','feeItems'].includes(kind),'سابقه قابل حذف نیست؛ وضعیت را تغییر دهید.');
    return transaction(async tx=>{
      const old=await getRecord(tx,id,school,year,kind,true);
      if(member.role==='teacher'){
        await classAccess(tx,{...member,profile_id:(await memberProfile(tx,member,school,year))?.id||null},school,year,String(old.classGroupId),String(old.subject));
        if(kind==='homework')requireValue(old.teacherId===(await memberProfile(tx,member,school,year))?.id,'این تکلیف متعلق به شما نیست.',403);
      }
      const version=z.coerce.number().int().positive().parse(request.headers['if-match']);requireValue(version===old.version,'اطلاعات تغییر کرده است.',409);
      if(kind==='feeItems') { const used=await tx.query("SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND data->'financialSummary'->'assignedFees' @> $3::jsonb",[school,year,JSON.stringify([{feeItemId:id}])]);requireValue(!used.rowCount,'تعرفه تخصیص‌یافته قابل حذف نیست.'); }
      await tx.query('DELETE FROM records WHERE id=$1 AND school_id=$2 AND year_id=$3',[id,school,year]);await audit(tx,user.id,school,`delete:${kind}`,id);return {ok:true};
    },school);
  });
}
