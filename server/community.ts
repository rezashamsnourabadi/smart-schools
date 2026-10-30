import {publishTeacherEvaluation,evaluationAnswered} from './teacher-evaluations';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {FastifyInstance} from 'fastify';
import {scope,allowed} from './resources';
import {transaction} from './db';
import {requireValue} from './errors';
import {audit} from './repository';
import {inboxContext,notifyFeedbackReply} from './inbox';
import type {SurveyQuestion} from '../shared/community';

const question=z.object({id:z.uuid(),title:z.string().trim().min(1).max(300),type:z.enum(['text','choice','rating']),options:z.array(z.string().trim().min(1).max(200)).max(10),required:z.boolean()}).strict().superRefine((q,c)=>{if(q.type==='choice'&&(q.options.length<2||new Set(q.options).size!==q.options.length))c.addIssue({code:'custom',message:'گزینه‌ها باید حداقل دو مورد متفاوت باشند.'});});
const draft=z.object({kind:z.enum(['standard','evaluation']).default('standard'),title:z.string().trim().min(1).max(200),description:z.string().trim().max(2000),questions:z.array(question).min(1).max(30),audience:z.array(z.enum(['student','parent','teacher'])).min(1).max(3),classIds:z.array(z.uuid()).max(100)}).strict().superRefine((v,c)=>{if(v.kind==='evaluation'&&(v.audience.length!==1||v.audience[0]!=='student'))c.addIssue({code:'custom',message:'ارزشیابی دبیران فقط برای دانش‌آموزان است.'});if(new Set(v.questions.map(q=>q.id)).size!==v.questions.length)c.addIssue({code:'custom',message:'شناسه سؤال تکراری است.'});if(v.classIds.length&&v.audience.includes('teacher'))c.addIssue({code:'custom',message:'برای دبیران، مخاطب کل مدرسه را انتخاب کنید.'});});
const paging=z.object({offset:z.coerce.number().int().min(0).max(1000000).default(0),schoolId:z.uuid().optional()});
export async function communityRoutes(app:FastifyInstance){
 app.get('/api/v1/community/feedback/:id',async request=>{
  const {member:m,school,user}=await scope(request),id=z.uuid().parse((request.params as {id:string}).id),input=z.object({schoolId:z.uuid().optional()}).parse(request.query),manager=m.role==='platform_admin'||allowed(m,'canManageFeedback');
  requireValue(manager||['student','parent'].includes(m.role),'دسترسی مجاز نیست.',403);
  requireValue(m.role!=='platform_admin'||input.schoolId,'مدرسه مقصد را مشخص کنید.');
  return transaction(async tx=>{const row=(await tx.query(`SELECT f.id,f.school_id,f.title,f.body,f.anonymous,f.status,f.reply,f.version,f.created_at,CASE WHEN f.anonymous THEN NULL ELSE u.name END AS "authorName" FROM school_feedback f JOIN users u ON u.id=f.owner_id WHERE f.id=$1 AND ($2::uuid IS NULL OR f.owner_id=$2) AND f.school_id=$3`,[id,manager?null:user.id,m.role==='platform_admin'?input.schoolId:school])).rows[0];requireValue(row,'پیام مجاز پیدا نشد.',404);return row;},school,m.role==='platform_admin');
 });
 app.get('/api/v1/community/surveys/:id/targets',async request=>{
  const {member:m,school,user}=await scope(request),id=z.uuid().parse((request.params as {id:string}).id),input=paging.extend({search:z.string().trim().max(100).default('')}).parse(request.query),manager=m.role==='platform_admin'||allowed(m,'canManageSurveys');
  return transaction(async tx=>{
   const root=(await tx.query("SELECT id FROM school_surveys s WHERE id=$1 AND kind='evaluation' AND ($2::boolean OR status IN ('published','closed') AND EXISTS(SELECT 1 FROM survey_recipients r WHERE r.survey_id=s.id AND r.membership_id=$3))",[id,manager,m.id])).rows[0];requireValue(root,'دوره ارزشیابی مجاز پیدا نشد.',404);
   const args=[id,manager,m.id,`%${input.search}%`],filter="s.parent_id=$1 AND ($2::boolean OR EXISTS(SELECT 1 FROM survey_recipients r WHERE r.survey_id=s.id AND r.membership_id=$3)) AND (s.teacher_name ILIKE $4 OR s.class_name ILIKE $4)",answered="EXISTS(SELECT 1 FROM survey_responses a WHERE a.survey_id=s.id AND a.membership_id=$3)";
   const items=(await tx.query(`SELECT s.id,s.school_id,s.kind,s.parent_id,s.teacher_id,s.class_id,s.teacher_name,s.class_name,s.title,s.description,s.questions,s.audience,s.class_ids,s.status,s.version,s.created_at,${answered} AS answered FROM school_surveys s WHERE ${filter} ORDER BY answered,s.class_name,s.teacher_name,s.id LIMIT 25 OFFSET $5`,[...args,input.offset])).rows;
   const counts=(await tx.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE ${answered})::int AS "answeredTotal" FROM school_surveys s WHERE ${filter}`,args)).rows[0];
   if(manager)await audit(tx,user.id,school||null,'evaluation-targets-viewed',id);
   return {items,...counts};
  },school,m.role==='platform_admin');
 });
 app.get('/api/v1/community/classes',async request=>{
  const {member:m,school,year}=await scope(request);requireValue(allowed(m,'canManageSurveys'),'دسترسی مجاز نیست.',403);
  const input=paging.extend({search:z.string().trim().max(100).default('')}).parse(request.query);
  return transaction(async tx=>{const args=[school,year,`%${input.search}%`];const filter="school_id=$1 AND year_id=$2 AND kind='classes' AND data->>'name' ILIKE $3";
   return {items:(await tx.query(`SELECT id,data->>'name' AS name FROM records WHERE ${filter} ORDER BY data->>'name',id LIMIT 25 OFFSET $4`,[...args,input.offset])).rows,total:(await tx.query(`SELECT count(*)::int AS n FROM records WHERE ${filter}`,args)).rows[0].n};
  },school);
 });
 app.get('/api/v1/community/surveys/:id',async request=>{
  const {member:m,school,year}=await scope(request),id=z.uuid().parse((request.params as {id:string}).id);
  return transaction(async tx=>{const row=(await tx.query(`SELECT s.id,s.school_id,s.kind,s.parent_id,s.teacher_id,s.class_id,s.teacher_name,s.class_name,s.title,s.description,s.questions,s.audience,s.class_ids,s.status,s.version,s.created_at,${evaluationAnswered} AS answered FROM school_surveys s JOIN survey_recipients r ON r.survey_id=s.id WHERE s.id=$1 AND r.membership_id=$3 AND s.year_id=$2 AND s.status IN ('published','closed')`,[id,year||null,m.id])).rows[0];requireValue(row,'نظرسنجی مجاز پیدا نشد.',404);return row;},school);
 });
 app.get('/api/v1/community/feedback',async request=>{
  const {member:m,school,user}=await scope(request),input=paging.extend({search:z.string().trim().max(100).default(''),status:z.enum(['all','new','reviewed']).default('all')}).parse(request.query),manager=m.role==='platform_admin'||allowed(m,'canManageFeedback');
  requireValue(manager||['student','parent'].includes(m.role),'دسترسی مجاز نیست.',403);
  requireValue(m.role!=='platform_admin'||input.schoolId,'مدرسه مقصد را از بخش مدارس انتخاب کنید.');
  return transaction(async tx=>{
   const args=[m.role==='platform_admin'?input.schoolId||null:school,manager?null:user.id,input.status,`%${input.search}%`,input.offset];
   // Anonymous owners and membership IDs must never leave the server in this projection.
   const filter="f.school_id=$1 AND ($2::uuid IS NULL OR f.owner_id=$2) AND ($3='all' OR f.status=$3) AND (f.title ILIKE $4 OR f.body ILIKE $4)";
   const items=(await tx.query(`SELECT f.id,f.school_id,f.title,f.body,f.anonymous,f.status,f.reply,f.version,f.created_at,CASE WHEN f.anonymous THEN NULL ELSE u.name END AS "authorName" FROM school_feedback f JOIN users u ON u.id=f.owner_id WHERE ${filter} ORDER BY f.created_at DESC,f.id LIMIT 25 OFFSET $5`,args)).rows;
   const total=(await tx.query(`SELECT count(*)::int AS n FROM school_feedback f WHERE ${filter}`,args.slice(0,4))).rows[0].n;return {items,total};
  },school,m.role==='platform_admin');
 });
 app.post('/api/v1/community/feedback',{config:{rateLimit:{max:10,timeWindow:'1 hour'}}},async request=>{
  const {member:m,school,user}=await scope(request);requireValue(['student','parent'].includes(m.role)&&school,'فقط دانش‌آموز و ولی می‌توانند پیشنهاد ثبت کنند.',403);
  const input=z.object({title:z.string().trim().min(1).max(200),body:z.string().trim().min(3).max(4000),anonymous:z.boolean()}).strict().parse(request.body);
  return transaction(async tx=>{const id=randomUUID();await tx.query('INSERT INTO school_feedback(id,school_id,owner_id,membership_id,title,body,anonymous) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,school,user.id,m.id,input.title,input.body,input.anonymous]);return {id};},school);
 });
 app.patch('/api/v1/community/feedback/:id',async request=>{
  const {member:m,school,user}=await scope(request);requireValue(m.role==='platform_admin'||allowed(m,'canManageFeedback'),'اجازه رسیدگی به پیشنهادها ندارید.',403);
  const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({version:z.number().int().positive(),reply:z.string().trim().min(3).max(4000).optional(),status:z.enum(['new','reviewed']).optional()}).strict().refine(v=>v.reply!==undefined||v.status!==undefined,'تغییری مشخص نشده است.').parse(request.body);
  return transaction(async tx=>{const old=(await tx.query('SELECT * FROM school_feedback WHERE id=$1 FOR UPDATE',[id])).rows[0];requireValue(old,'پیام پیدا نشد.',404);requireValue(old.version===input.version,'پیام هم‌زمان تغییر کرده است؛ اطلاعات تازه را دریافت و متن خود را دوباره بررسی کنید.',409);
   const reply=input.reply??old.reply,status=input.status??(input.reply!==undefined?'reviewed':old.status);
   if(reply===old.reply&&status===old.status)return {ok:true};
   await tx.query('UPDATE school_feedback SET reply=$1,status=$2,version=version+1 WHERE id=$3',[reply,status,id]);
   if(input.reply!==undefined&&reply!==old.reply)await notifyFeedbackReply(tx,{userId:user.id,memberId:m.id},old);
   await audit(tx,user.id,old.school_id,'feedback-reviewed',id);return {ok:true};
  },school,m.role==='platform_admin');
 });
 app.post('/api/v1/community/feedback/:id/identity',async request=>{
  const {member:m,user}=await scope(request);requireValue(m.role==='platform_admin','هویت ناشناس فقط برای مدیر پلتفرم قابل بررسی است.',403);
  const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({reason:z.string().trim().min(10).max(1000)}).strict().parse(request.body);
  return transaction(async tx=>{const row=(await tx.query('SELECT u.name,u.username,f.school_id FROM school_feedback f JOIN users u ON u.id=f.owner_id WHERE f.id=$1',[id])).rows[0];requireValue(row,'پیام پیدا نشد.',404);await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[user.id,row.school_id,'feedback-identity-access',id,{reason:input.reason}]);return {name:row.name,username:row.username};},'',true);
 });
 app.get('/api/v1/community/surveys',async request=>{
  const {member:m,school,year}=await scope(request),input=paging.extend({pending:z.enum(['true','false']).default('false'),yearId:z.uuid().optional()}).parse(request.query),manager=m.role==='platform_admin'||allowed(m,'canManageSurveys');
  requireValue(m.role!=='platform_admin'||input.schoolId,'مدرسه مقصد را از بخش مدارس انتخاب کنید.');
  return transaction(async tx=>{const args=[m.role==='platform_admin'?input.schoolId:school,manager,m.id,m.role==='platform_admin'?input.yearId||null:year||null,input.offset];
   const filter="s.parent_id IS NULL AND ($1::uuid IS NULL OR s.school_id=$1) AND ($4::uuid IS NULL OR s.year_id=$4) AND ($2::boolean OR s.status IN ('published','closed') AND EXISTS(SELECT 1 FROM survey_recipients r WHERE r.survey_id=s.id AND r.membership_id=$3))"+(input.pending==='true'?` AND s.status='published' AND NOT (${evaluationAnswered})`:"");
   const items=(await tx.query(`SELECT s.id,s.school_id,s.kind,s.parent_id,s.teacher_id,s.class_id,s.teacher_name,s.class_name,s.title,s.description,s.questions,s.audience,s.class_ids,s.status,s.version,s.created_at,${evaluationAnswered} AS answered FROM school_surveys s WHERE ${filter} ORDER BY s.created_at DESC,s.id LIMIT 25 OFFSET $5`,args)).rows;
   const total=(await tx.query(`SELECT count(*)::int AS n FROM school_surveys s WHERE ${filter}`,args.slice(0,4))).rows[0].n;return {items,total};
  },school,m.role==='platform_admin');
 });
 app.post('/api/v1/community/surveys',async request=>{
  const {member:m,school,year,user}=await scope(request,true);requireValue(allowed(m,'canManageSurveys'),'اجازه ساخت نظرسنجی ندارید.',403);const input=draft.parse(request.body);
  return transaction(async tx=>{for(const id of input.classIds)requireValue((await tx.query("SELECT 1 FROM records WHERE id=$1 AND school_id=$2 AND year_id=$3 AND kind='classes'",[id,school,year])).rowCount,'کلاس مجاز نیست.',403);
   const id=randomUUID();await tx.query('INSERT INTO school_surveys(id,school_id,year_id,title,description,questions,audience,class_ids,created_by,kind) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,school,year,input.title,input.description,JSON.stringify(input.questions),[...new Set(input.audience)],input.classIds,user.id,input.kind]);return {id};
  },school);
 });
 app.patch('/api/v1/community/surveys/:id',async request=>{
  const {member:m,school,year,user}=await scope(request,true);requireValue(allowed(m,'canManageSurveys'),'اجازه ویرایش نظرسنجی ندارید.',403);
  const id=z.uuid().parse((request.params as {id:string}).id),input=z.object({version:z.number().int().positive(),status:z.enum(['draft','published','closed']),draft:draft.optional()}).strict().parse(request.body);
  return transaction(async tx=>{const s=(await tx.query('SELECT * FROM school_surveys WHERE id=$1 AND school_id=$2 AND year_id=$3 FOR UPDATE',[id,school,year])).rows[0];requireValue(s,'نظرسنجی پیدا نشد.',404);requireValue(!s.parent_id,'دریافت پاسخ ارزشیابی را از دوره اصلی مدیریت کنید.');requireValue(s.version===input.version,'نظرسنجی تغییر کرده است.',409);
   requireValue(s.status==='draft'&&['draft','published'].includes(input.status)||s.status==='published'&&input.status==='closed','این تغییر وضعیت مجاز نیست.');
   // Questions are immutable after publication; edit the saved draft when publishing.
   if(input.draft){requireValue(s.status==='draft','پرسش‌های منتشرشده تغییر نمی‌کنند.');for(const cls of input.draft.classIds)requireValue((await tx.query("SELECT 1 FROM records WHERE id=$1 AND school_id=$2 AND year_id=$3 AND kind='classes'",[cls,school,s.year_id])).rowCount,'کلاس مجاز نیست.',403);Object.assign(s,{kind:input.draft.kind,title:input.draft.title,description:input.draft.description,questions:input.draft.questions,audience:input.draft.audience,class_ids:input.draft.classIds});}
   if(input.status==='published'){
    if(s.kind==='evaluation')await publishTeacherEvaluation(tx,s,user.id);else {
    await tx.query(`INSERT INTO survey_recipients(school_id,survey_id,membership_id) SELECT DISTINCT $1::uuid,$2::uuid,m.id FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.school_id=$1 AND m.active AND u.active AND m.role=ANY($3::text[]) AND (m.role='teacher' OR EXISTS(SELECT 1 FROM records c WHERE c.school_id=$1 AND c.year_id=$5 AND c.kind='students' AND (c.id=m.student_id OR c.identity_id=m.student_id) AND (cardinality($4::uuid[])=0 OR c.class_id=ANY($4::uuid[])) AND COALESCE(c.data->>'status','active')='active'))`,[school,id,s.audience,s.class_ids,s.year_id]);
    }
    requireValue((await tx.query('SELECT 1 FROM survey_recipients WHERE survey_id=$1 LIMIT 1',[id])).rowCount,'هیچ مخاطب فعال و مجازی برای این نظرسنجی وجود ندارد؛ کلاس و حساب‌ها را بررسی کنید.');
    await inboxContext(tx,user.id,m.id);const messageId=randomUUID();await tx.query("INSERT INTO inbox_messages(id,sender_id,sender_membership_id,school_id,title,body,kind,reference_id) VALUES($1,$2,$3,$4,$5,$6,'survey',$7)",[messageId,user.id,m.id,school,`نظرسنجی: ${s.title}`.slice(0,200),'نظر شما برای مدرسه ارزشمند است. از بخش نظرسنجی‌ها، پرسش‌ها را ببینید و پاسخ دهید.',id]);
    await tx.query('INSERT INTO inbox_recipients(message_id,membership_id,user_id,school_id) SELECT $1,m.id,m.user_id,m.school_id FROM survey_recipients r JOIN memberships m ON m.id=r.membership_id WHERE r.survey_id=$2',[messageId,id]);
   }
   if(input.status==='closed'&&s.kind==='evaluation')await tx.query("UPDATE school_surveys SET status='closed',version=version+1 WHERE parent_id=$1",[id]);
   await tx.query('UPDATE school_surveys SET title=$1,description=$2,questions=$3,audience=$4,class_ids=$5,status=$6,version=version+1,kind=$8 WHERE id=$7',[s.title,s.description,JSON.stringify(s.questions),s.audience,s.class_ids,input.status,id,s.kind]);await audit(tx,user.id,school,'survey-'+input.status,id);return {ok:true};
  },school);
 });
 app.post('/api/v1/community/surveys/:id/responses',async request=>{
  const {member:m,school,year,user}=await scope(request,true),id=z.uuid().parse((request.params as {id:string}).id),input=z.object({answers:z.record(z.string(),z.union([z.string().trim().max(2000),z.number()]))}).strict().parse(request.body);
  return transaction(async tx=>{const s=(await tx.query("SELECT s.* FROM school_surveys s JOIN survey_recipients r ON r.survey_id=s.id WHERE s.id=$1 AND r.membership_id=$2 AND s.school_id=$3 AND s.year_id=$4 FOR SHARE OF s",[id,m.id,school,year])).rows[0];requireValue(s&&s.kind!=='evaluation'&&s.status==='published','نظرسنجی باز و مجاز پیدا نشد.',403);
   const qs=s.questions as SurveyQuestion[];requireValue(Object.keys(input.answers).every(k=>qs.some(q=>q.id===k)),'پرسش نامعتبر است.');
   for(const q of qs){const value=input.answers[q.id],empty=value===undefined||value==='';requireValue(!q.required||!empty,'به همه پرسش‌های ضروری پاسخ دهید.');if(empty)continue;requireValue(q.type==='text'?typeof value==='string':q.type==='choice'?typeof value==='string'&&q.options.includes(value):typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=5,'پاسخ معتبر نیست.');}
   const row=await tx.query('INSERT INTO survey_responses(school_id,survey_id,membership_id,user_id,answers) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING survey_id',[school,id,m.id,user.id,input.answers]);requireValue(row.rowCount,'پاسخ شما قبلاً ثبت شده است.',409);return {ok:true};
  },school);
 });
 app.get('/api/v1/community/surveys/:id/results',async request=>{
  const {member:m,school}=await scope(request),id=z.uuid().parse((request.params as {id:string}).id),{offset,teacherId,classId}=paging.extend({teacherId:z.uuid().optional(),classId:z.uuid().optional()}).parse(request.query);requireValue(m.role==='platform_admin'||allowed(m,'canManageSurveys'),'اجازه مشاهده نتایج ندارید.',403);
  return transaction(async tx=>{const s=(await tx.query('SELECT questions FROM school_surveys WHERE id=$1',[id])).rows[0];requireValue(s,'نظرسنجی پیدا نشد.',404);
   const args=[id,teacherId||null,classId||null],filter="(s.id=$1 OR s.parent_id=$1) AND s.kind<>'evaluation' AND ($2::uuid IS NULL OR s.teacher_id=$2) AND ($3::uuid IS NULL OR s.class_id=$3)";
   const total=(await tx.query(`SELECT count(*)::int AS n FROM survey_recipients r JOIN school_surveys s ON s.id=r.survey_id WHERE ${filter}`,args)).rows[0].n,responseTotal=(await tx.query(`SELECT count(*)::int AS n FROM survey_responses r JOIN school_surveys s ON s.id=r.survey_id WHERE ${filter}`,args)).rows[0].n;
   const grouped=(await tx.query(`SELECT a.key,CASE WHEN q->>'type'='text' THEN '[text]' ELSE a.value END AS value,count(*)::int AS n FROM survey_responses r JOIN school_surveys s ON s.id=r.survey_id CROSS JOIN LATERAL jsonb_each_text(r.answers) a CROSS JOIN LATERAL jsonb_array_elements(s.questions) q WHERE ${filter} AND q->>'id'=a.key AND a.value<>'' GROUP BY a.key,CASE WHEN q->>'type'='text' THEN '[text]' ELSE a.value END`,args)).rows;
   const questions=(s.questions as SurveyQuestion[]).map(q=>{const rows=grouped.filter(a=>a.key===q.id&&a.value!==''),count=rows.reduce((n,a)=>n+a.n,0);return {id:q.id,title:q.title,type:q.type,count,average:q.type==='rating'&&count?rows.reduce((n,a)=>n+Number(a.value)*a.n,0)/count:null,options:(q.type==='choice'?q.options:q.type==='rating'?['1','2','3','4','5']:[]).map(label=>{const n=rows.find(a=>a.value===label)?.n||0;return {label,count:n,percent:count?Math.round(n*100/count):0};})};});
   const items=(await tx.query(`SELECT u.name,m.role,s.teacher_name AS "teacherName",s.class_name AS "className",child.name AS "childName",r.answers,r.created_at FROM survey_responses r JOIN users u ON u.id=r.user_id JOIN memberships m ON m.id=r.membership_id JOIN school_surveys s ON s.id=r.survey_id LEFT JOIN LATERAL (SELECT c.data->>'name' AS name FROM records c WHERE c.school_id=r.school_id AND c.year_id=s.year_id AND c.kind='students' AND (c.id=m.student_id OR c.identity_id=m.student_id) LIMIT 1) child ON true WHERE ${filter} ORDER BY r.created_at DESC,r.survey_id,r.membership_id LIMIT 25 OFFSET $4`,[...args,offset])).rows;return {total,responseTotal,questions,items};
  },school,m.role==='platform_admin');
 });
}
