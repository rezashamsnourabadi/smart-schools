import {z} from 'zod';
import type {FastifyInstance} from 'fastify';
import {transaction,type Tx} from './db';
import {scope,memberProfile} from './resources';
import {entity,getRecord,saveRecord,audit,type Entity} from './repository';
import {requireValue} from './errors';
import {civilDate} from './calendar';
import {getSchoolClock,getSchoolDate} from '../src/utils/persianUtils';
import {upsertAttendance} from '../src/utils/attendance';
import type {AttendanceSession} from '../src/types';
import {enqueue} from './commands';
import {resourceSchemas} from './schema';
import {validateGradeItem} from '../src/utils/gradeUtils';
import type {GradeItem} from '../src/types';

const context=z.object({classId:z.uuid(),subject:z.string().trim().min(1).max(200)});
const listQuery=context.extend({kind:z.enum(['grades','homework','exams','sessions','events','submissions']),offset:z.coerce.number().int().min(0).max(1000000).default(0)});
const statuses=z.enum(['present','absent','late','excused']);
export const correctionSchema=z.object({version:z.number().int().positive(),reason:z.string().trim().min(3).max(500),platform:z.enum(['bale','sms']).default('bale'),notifyParents:z.boolean().default(true),records:z.array(z.object({studentId:z.uuid(),status:statuses,note:z.string().max(2000).optional()}).strict()).min(1).max(200)}).strict();
export function validateHistoricalRoster(oldIds:string[],newIds:string[]){return oldIds.length===newIds.length&&new Set(newIds).size===oldIds.length&&newIds.every(id=>oldIds.includes(id));}
const eventDate=(value:string|Date)=>getSchoolDate(value instanceof Date?value:new Date(`${value.slice(0,10)}T12:00:00Z`));
const studentView=(item:Entity)=>({id:item.id,name:String(item.name),studentNumber:String(item.studentNumber||''),classGroupId:String(item.classGroupId||'')});
function clean(item:Entity){const {previousVersions,_actor,...result}=item;return result;}
async function teacherScope(request:Parameters<typeof scope>[0],write=false){const value=await scope(request,write);requireValue(value.member.role==='teacher'&&value.school&&value.year,'این بخش مخصوص دبیر است.',403);return value;}
async function assignment(tx:Tx,value:Awaited<ReturnType<typeof teacherScope>>,classId:string,subject:string){
  const profile=await memberProfile(tx,value.member,value.school,value.year);
  requireValue(profile&&(profile.assignedClassIds as string[]).includes(classId)&&(profile.teachingSubjects as string[]).includes(subject),'کلاس یا درس به شما اختصاص ندارد.',403);
  const match=await tx.query("SELECT id FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND teacher_id=$3 AND class_id=$4 AND subject=$5 LIMIT 1",[value.school,value.year,profile.id,classId,subject]);
  requireValue(match.rowCount,'این ترکیب کلاس و درس در برنامه شما نیست.',403);return profile;
}
export async function teacherRoutes(app:FastifyInstance){
  app.get('/api/v1/teacher/classes',async request=>{
    const value=await teacherScope(request),{school,year}=value;
    return transaction(async tx=>{
      const profile=await memberProfile(tx,value.member,school,year);requireValue(profile,'پروفایل دبیر پیدا نشد.',403);
      const slots=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND teacher_id=$3 AND class_id=ANY($4::uuid[]) AND subject=ANY($5::text[]) ORDER BY data->>'dayOfWeek',(data->>'period')::int LIMIT 2001",[school,year,profile.id,profile.assignedClassIds,profile.teachingSubjects])).rows;
      requireValue(slots.length<=2000,'برنامه دبیر از حد مجاز بزرگ‌تر است.');
      const groups=(await tx.query("SELECT id,data->>'name' AS name FROM records WHERE school_id=$1 AND year_id=$2 AND kind='classes' AND id=ANY($3::uuid[])",[school,year,profile.assignedClassIds])).rows;
      const pairs=new Map<string,{classId:string;className:string;subject:string}>();
      for(const slot of slots)pairs.set(`${slot.class_id}:${slot.subject}`,{classId:slot.class_id,className:groups.find(group=>group.id===slot.class_id)?.name||slot.data.className,subject:slot.subject});
      return {items:[...pairs.values()],schedule:slots.map(row=>clean(entity(row)))};
    },school);
  });
  app.get('/api/v1/teacher/classroom',async request=>{
    const input=context.extend({period:z.coerce.number().int().min(0).max(4).default(0)}).parse(request.query),value=await teacherScope(request),{school,year}=value;
    return transaction(async tx=>{
      const teacher=await assignment(tx,value,input.classId,input.subject);
      const roster=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND COALESCE(data->>'status','active')='active' ORDER BY data->>'name',id LIMIT 201",[school,year,input.classId])).rows;
      requireValue(roster.length<=200,'کلاس بیش از دویست دانش‌آموز دارد.');
      const previous=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND class_id=$3 AND subject=$4 AND teacher_id=$5 AND (civil_day<$6::date OR civil_day=$6::date AND (data->>'period')::int<$7) ORDER BY civil_day DESC,(data->>'period')::int DESC LIMIT 1",[school,year,input.classId,input.subject,teacher.id,civilDate(getSchoolDate()),input.period])).rows[0];
      const stats=(await tx.query("SELECT count(*)::int AS homework,COALESCE(sum((data->>'submissionsCount')::int),0)::int AS submissions FROM records WHERE school_id=$1 AND year_id=$2 AND kind='homework' AND class_id=$3 AND subject=$4 AND teacher_id=$5",[school,year,input.classId,input.subject,teacher.id])).rows[0];
      const pending=(await tx.query("SELECT count(*)::int AS count FROM records s JOIN records h ON h.school_id=s.school_id AND h.year_id=s.year_id AND h.id::text=s.data->>'homeworkId' AND h.kind='homework' WHERE s.school_id=$1 AND s.year_id=$2 AND s.kind='homeworkSubmissions' AND h.class_id=$3 AND h.subject=$4 AND h.teacher_id=$5 AND s.data->>'status'='submitted'",[school,year,input.classId,input.subject,teacher.id])).rows[0].count;
      return {students:roster.map(row=>studentView(entity(row))),previous:previous?clean(entity(previous)):null,stats:{...stats,pendingReview:pending}};
    },school);
  });
  app.get('/api/v1/teacher/records',async request=>{
    const input=listQuery.parse(request.query),value=await teacherScope(request),{school,year}=value;
    return transaction(async tx=>{
      const teacher=await assignment(tx,value,input.classId,input.subject);
      if(input.kind==='events'){
        const rows=(await tx.query('SELECT *,count(*) OVER()::int AS total FROM classroom_events WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND teacher_id=$5 ORDER BY event_date DESC,created_at DESC,id LIMIT 25 OFFSET $6',[school,year,input.classId,input.subject,teacher.id,input.offset])).rows;
        return {items:rows.map(row=>({id:row.id,studentId:row.student_id,kind:row.kind,title:row.title,note:row.note,points:row.points,date:eventDate(row.event_date),active:row.active,version:row.version})),total:rows[0]?.total||0};
      }
      if(input.kind==='submissions'){
        const rows=(await tx.query("SELECT s.*,count(*) OVER()::int AS total FROM records s JOIN records h ON h.school_id=s.school_id AND h.year_id=s.year_id AND h.id::text=s.data->>'homeworkId' AND h.kind='homework' WHERE s.school_id=$1 AND s.year_id=$2 AND s.kind='homeworkSubmissions' AND h.class_id=$3 AND h.subject=$4 AND h.teacher_id=$5 ORDER BY s.created_at DESC,s.id LIMIT 25 OFFSET $6",[school,year,input.classId,input.subject,teacher.id,input.offset])).rows;
        return {items:rows.map(row=>clean(entity(row))),total:rows[0]?.total||0};
      }
      const kind=input.kind==='sessions'?'attendanceSessions':input.kind;
      const args=[school,year,input.classId,input.subject,teacher.id,input.offset,value.user.id,kind];
      const rows=(await tx.query("SELECT *,count(*) OVER()::int AS total FROM records WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND kind=$8 AND (teacher_id=$5 OR (teacher_id IS NULL AND data->>'_actor'=$7)) ORDER BY CASE WHEN kind='attendanceSessions' THEN civil_day ELSE created_at::date END DESC,created_at DESC,id LIMIT 25 OFFSET $6",args)).rows;
      let names:Record<string,string>={};
      if(kind==='attendanceSessions'){const students=(await tx.query("SELECT id,data->>'name' AS name FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3",[school,year,input.classId])).rows;names=Object.fromEntries(students.map(student=>[student.id,student.name]));}
      return {items:rows.map(row=>({...clean(entity(row)),...(kind==='attendanceSessions'?{studentNames:{...names,...row.data.studentNames}}:{})})),total:rows[0]?.total||0};
    },school);
  });
  app.get('/api/v1/teacher/student/:id',async request=>{
    const input=context.extend({section:z.enum(['all','overview','attendance','grades','homework','events']).default('all')}).parse(request.query),id=z.uuid().parse((request.params as {id:string}).id),value=await teacherScope(request),{school,year}=value;
    return transaction(async tx=>{
      const teacher=await assignment(tx,value,input.classId,input.subject),student=await getRecord(tx,id,school,year,'students');
      requireValue(student.classGroupId===input.classId,'دانش‌آموز عضو این کلاس نیست.',404);
      const args=[school,year,input.classId,input.subject,teacher.id,id,value.user.id];
      if(input.section==='overview'){
        const totals=(await tx.query("SELECT count(*) FILTER(WHERE r.kind='attendanceSessions' AND r.data->'records' @> jsonb_build_array(jsonb_build_object('studentId',$6::text)))::int AS sessions,count(*) FILTER(WHERE r.kind='attendanceSessions' AND r.data->'records' @> jsonb_build_array(jsonb_build_object('studentId',$6::text,'status','absent')))::int AS absent,count(*) FILTER(WHERE r.kind='grades' AND r.data->'scores' @> jsonb_build_array(jsonb_build_object('studentId',$6::text)))::int AS grades,count(*) FILTER(WHERE r.kind='homework')::int AS homework,count(*) FILTER(WHERE r.kind='homework' AND s.id IS NOT NULL)::int AS submitted,count(*) FILTER(WHERE r.kind='homework' AND s.data->>'status'='graded')::int AS graded FROM records r LEFT JOIN records s ON r.kind='homework' AND s.school_id=r.school_id AND s.year_id=r.year_id AND s.kind='homeworkSubmissions' AND s.student_id=$6::uuid AND s.data->>'homeworkId'=r.id::text WHERE r.school_id=$1 AND r.year_id=$2 AND r.class_id=$3 AND r.subject=$4 AND r.kind IN ('attendanceSessions','grades','homework') AND (r.teacher_id=$5 OR (r.teacher_id IS NULL AND r.data->>'_actor'=$7))",args)).rows[0];
        const participation=(await tx.query("SELECT count(*) FILTER(WHERE kind='positive')::int AS positive,count(*) FILTER(WHERE kind='negative')::int AS negative FROM classroom_events WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND teacher_id=$5 AND student_id=$6 AND active",args.slice(0,6))).rows[0];
        return {student:studentView(student),summary:{...totals,...participation},grades:[],sessions:[],homework:[],events:[],limit:25};
      }
      const grades=input.section==='all'||input.section==='grades'?(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND kind='grades' AND (teacher_id=$5 OR (teacher_id IS NULL AND data->>'_actor'=$7)) AND data->'scores' @> jsonb_build_array(jsonb_build_object('studentId',$6::text)) ORDER BY created_at DESC LIMIT 25",args)).rows.map(row=>{const item=entity(row);return {...clean(item),scores:(item.scores as {studentId:string}[]).filter(score=>score.studentId===id)};}) : [];
      const sessions=input.section==='all'||input.section==='attendance'?(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND teacher_id=$5 AND kind='attendanceSessions' AND data->'records' @> jsonb_build_array(jsonb_build_object('studentId',$6::text)) ORDER BY civil_day DESC,(data->>'period')::int DESC LIMIT 25",args.slice(0,6))).rows.map(row=>{const item=entity(row);return {...clean(item),records:(item.records as {studentId:string}[]).filter(record=>record.studentId===id)};}) : [];
      const homework=input.section==='all'||input.section==='homework'?(await tx.query("SELECT h.*,s.data AS submission FROM records h LEFT JOIN records s ON s.school_id=h.school_id AND s.year_id=h.year_id AND s.kind='homeworkSubmissions' AND s.student_id=$6::uuid AND s.data->>'homeworkId'=h.id::text WHERE h.school_id=$1 AND h.year_id=$2 AND h.class_id=$3 AND h.subject=$4 AND h.teacher_id=$5 AND h.kind='homework' ORDER BY h.created_at DESC LIMIT 25",args.slice(0,6))).rows.map(row=>({id:row.id,title:row.data.title,dueDate:row.data.dueDate,submission:row.submission?{textContent:row.submission.textContent,status:row.submission.status,teacherScore:row.submission.teacherScore,teacherFeedback:row.submission.teacherFeedback,submissionDate:row.submission.submissionDate,attachments:row.submission.attachments}:null})) : [];
      const events=input.section==='all'||input.section==='events'?(await tx.query('SELECT id,kind,title,note,points,active,event_date AS date FROM classroom_events WHERE school_id=$1 AND year_id=$2 AND class_id=$3 AND subject=$4 AND teacher_id=$5 AND student_id=$6 ORDER BY event_date DESC,created_at DESC LIMIT 25',args.slice(0,6))).rows : [];
      return {student:studentView(student),grades,sessions,homework,events:events.map(row=>({...row,date:eventDate(row.date)})),limit:25};
    },school);
  });
  app.patch('/api/v1/teacher/sessions/:id',async request=>{
    const id=z.uuid().parse((request.params as {id:string}).id),input=correctionSchema.parse(request.body),value=await teacherScope(request,true),{school,year}=value;
    return transaction(async tx=>{
      const old=await getRecord(tx,id,school,year,'attendanceSessions',true),profile=await memberProfile(tx,value.member,school,year);
      requireValue(profile&&old.teacherId===profile.id,'این جلسه متعلق به شما نیست.',403);
      requireValue(old.version===input.version,'جلسه تغییر کرده؛ دوباره دریافت کنید.',409);
      requireValue(civilDate(String(old.date))<=civilDate(getSchoolDate()),'جلسه آینده قابل اصلاح نیست.');
      const previous=old as unknown as AttendanceSession;
      requireValue(validateHistoricalRoster(previous.records.map(row=>row.studentId),input.records.map(row=>row.studentId)),'فهرست اعضای جلسه تاریخی قابل تغییر نیست.');
      const change=upsertAttendance([previous],{...previous,records:input.records,updatedAt:getSchoolClock().time});
      if(!change.changed)return {ok:true,changed:false};
      change.session.sentNotificationsCount=(previous.sentNotificationsCount||0)+(input.notifyParents?change.changes.length:0);
      const saved=await saveRecord(tx,school,year,'attendanceSessions',{...change.session,notifyParents:input.notifyParents,correctionReason:input.reason,correctedAt:new Date().toISOString(),correctedBy:value.user.id},old);
      for(const incident of input.notifyParents?change.changes:[]){const student=await getRecord(tx,incident.studentId,school,year,'students');await enqueue(tx,school,year,student,{message:`اصلاح حضور ${student.name} در تاریخ ${old.date}، زنگ ${old.period}: ${incident.status}.`,platform:'bale',type:'attendance_correction',attendanceSessionId:saved.id,attendanceRevision:change.session.revision});}
      if(String(old.date)===getSchoolDate()){
        const daily=(await tx.query("WITH daily AS (SELECT entry->>'studentId' AS student,max(CASE entry->>'status' WHEN 'absent' THEN 3 WHEN 'late' THEN 2 WHEN 'excused' THEN 1 ELSE 0 END) severity FROM records CROSS JOIN LATERAL jsonb_array_elements(data->'records') entry WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND civil_day=$3::date GROUP BY entry->>'studentId') SELECT count(*)::int AS recorded,count(*) FILTER(WHERE severity IN (0,2))::int AS present FROM daily",[school,year,civilDate(getSchoolDate())])).rows[0];
        await tx.query('UPDATE schools SET data=data||$1::jsonb WHERE id=$2',[JSON.stringify({todayAttendanceDate:getSchoolDate(),todayAttendanceSubmitted:daily.recorded>0,attendanceRateToday:daily.recorded?Math.round(daily.present/daily.recorded*1000)/10:0,attendanceRecordedCount:daily.recorded}),school]);
      }
      await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[value.user.id,school,'teacher:attendance-correction',id,{reason:input.reason,fromVersion:old.version,toVersion:saved.version,date:old.date}]);
      return {ok:true,changed:true};
    },school);
  });
  app.patch('/api/v1/teacher/grades/:id',async request=>{
    const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({version:z.number().int().positive(),reason:z.string().trim().min(3).max(500),grade:resourceSchemas.grades}).strict().parse(request.body),value=await teacherScope(request,true),{school,year}=value;
    return transaction(async tx=>{
      const old=await getRecord(tx,id,school,year,'grades',true),teacher=await assignment(tx,value,String(old.classGroupId),String(old.subject));
      requireValue(old.teacherId===teacher.id||(!old.teacherId&&old._actor===value.user.id),'این ارزشیابی متعلق به شما نیست.',403);
      requireValue(old.version===input.version,'ارزشیابی تغییر کرده؛ دوباره دریافت کنید.',409);
      requireValue(input.grade.classGroupId===old.classGroupId&&input.grade.subject===old.subject&&input.grade.date===old.date,'کلاس، درس و تاریخ ارزشیابی قابل تغییر نیست.');
      const prior=old.scores as {studentId:string}[];
      requireValue(validateHistoricalRoster(prior.map(row=>row.studentId),input.grade.scores.map(row=>row.studentId)),'اعضای ارزشیابی قابل تغییر نیست.');
      const error=validateGradeItem({...input.grade,id,schoolId:school} as GradeItem);requireValue(!error,error||'نمره نامعتبر است.');
      const {previousVersions,...snapshot}=old;
      await saveRecord(tx,school,year,'grades',{...old,...input.grade,teacherId:teacher.id,previousVersions:[...(previousVersions as unknown[]||[]),{...snapshot,correctionReason:input.reason,correctedAt:new Date().toISOString()}]},old);
      await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[value.user.id,school,'teacher:grade-correction',id,{reason:input.reason,fromVersion:old.version}]);return {ok:true};
    },school);
  });
  app.post('/api/v1/teacher/events',async request=>{
    const input=context.extend({studentId:z.uuid().optional(),kind:z.enum(['positive','negative','journal']),title:z.string().trim().min(1).max(200),note:z.string().trim().max(2000).default('')}).strict().parse(request.body),value=await teacherScope(request,true),{school,year}=value;
    return transaction(async tx=>{
      const teacher=await assignment(tx,value,input.classId,input.subject);
      if(input.kind!=='journal'){requireValue(input.studentId,'دانش‌آموز لازم است.');const student=await getRecord(tx,input.studentId!,school,year,'students');requireValue(student.classGroupId===input.classId,'دانش‌آموز عضو این کلاس نیست.',403);}else requireValue(!input.studentId,'یادداشت جلسه متعلق به کل کلاس است.');
      const row=(await tx.query('INSERT INTO classroom_events(school_id,year_id,class_id,teacher_id,subject,student_id,kind,title,note,points,event_date,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id',[school,year,input.classId,teacher.id,input.subject,input.studentId||null,input.kind,input.title,input.note,input.kind==='positive'?1:input.kind==='negative'?-1:0,civilDate(getSchoolDate()),value.user.id])).rows[0];
      await audit(tx,value.user.id,school,'teacher:event',row.id);return {id:row.id};
    },school);
  });
  app.patch('/api/v1/teacher/events/:id',async request=>{
    const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({version:z.number().int().positive(),reason:z.string().trim().min(3).max(500)}).strict().parse(request.body),value=await teacherScope(request,true),{school,year}=value;
    return transaction(async tx=>{
      const profile=await memberProfile(tx,value.member,school,year);
      const old=(await tx.query('SELECT * FROM classroom_events WHERE id=$1 AND school_id=$2 AND year_id=$3 FOR UPDATE',[id,school,year])).rows[0];
      requireValue(old&&old.teacher_id===profile?.id,'رخداد پیدا نشد.',404);requireValue(old.version===input.version,'رخداد تغییر کرده است.',409);
      await tx.query('UPDATE classroom_events SET active=false,version=version+1 WHERE id=$1',[id]);await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[value.user.id,school,'teacher:event-cancel',id,{reason:input.reason}]);return {ok:true};
    },school);
  });
}
