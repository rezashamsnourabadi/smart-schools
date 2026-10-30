import {Readable} from 'node:stream';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {z} from 'zod';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {membership,requireAuth} from './auth';
import {transaction,type Tx} from './db';
import {entity,getRecord} from './repository';
import {requireValue} from './errors';
import {readSchoolAccess} from './school-access';
import {storage} from './files';
import {config} from './config';
import {gradeViews,gradeCategories} from '../shared/academic';
import {createEmptyFinancialSummary} from '../src/utils/financialLedger';
import type {StudentFinancialSummary} from '../src/types';

const params=z.object({schoolId:z.uuid(),yearId:z.uuid().optional(),studentId:z.uuid().optional(),fileId:z.uuid().optional(),kind:z.string().optional()});
const paging=z.object({offset:z.coerce.number().int().min(0).max(1000000).default(0),search:z.string().trim().max(100).default(''),classId:z.uuid().optional()});
// The role remains platform_admin. Only this explicit read service sets a target RLS scope.
async function inspect<T>(request:FastifyRequest,work:(tx:Tx,ids:z.infer<typeof params>)=>Promise<T>){
 const member=await membership(request);requireValue(member.role==='platform_admin','نمای نظارتی فقط برای مدیر پلتفرم مجاز است.',403);
 const ids=params.parse(request.params);
 return transaction(async tx=>{
  requireValue((await tx.query('SELECT 1 FROM schools WHERE id=$1',[ids.schoolId])).rowCount,'مدرسه پیدا نشد.',404);
  await tx.query("SELECT set_config('app.school_id',$1,true)",[ids.schoolId]);
  if(ids.yearId)requireValue((await tx.query('SELECT 1 FROM academic_years WHERE school_id=$1 AND id=$2',[ids.schoolId,ids.yearId])).rowCount,'سال تحصیلی متعلق به این مدرسه نیست.',404);
  return work(tx,ids);
 },ids.schoolId,true);
}
async function inspectionAudit(tx:Tx,request:FastifyRequest,schoolId:string,yearId:string,studentId:string,action:string,fileId?:string){
 await tx.query('INSERT INTO audit_log(user_id,school_id,action,entity_id,details) VALUES($1,$2,$3,$4,$5)',[requireAuth(request).id,schoolId,action,studentId,{yearId,...fileId?{fileId}:{}}]);
}
function receiptIds(financial:unknown){
 const ids:string[]=[];const transactions=(financial as StudentFinancialSummary|undefined)?.transactions;
 if(Array.isArray(transactions))for(const payment of transactions){const url=payment?.methodDetails?.receiptImageUrl;if(typeof url==='string'){const match=url.match(/^\/api\/v1\/files\/([a-f0-9-]{36})(?:\?.*)?$/);if(match&&z.uuid().safeParse(match[1]).success)ids.push(match[1]);}}
 return [...new Set(ids)];
}
export async function inspectionRoutes(app:FastifyInstance){
 const base='/api/v1/platform/schools/:schoolId/inspection',yearBase=`${base}/years/:yearId`;
 app.get(base,async request=>{const page=paging.pick({offset:true}).parse(request.query);return inspect(request,async(tx,{schoolId})=>{
  const school=(await tx.query('SELECT * FROM schools WHERE id=$1',[schoolId])).rows[0];
  const years=(await tx.query('SELECT * FROM academic_years WHERE school_id=$1 ORDER BY data->>\'title\' DESC,id LIMIT 25 OFFSET $2',[schoolId,page.offset])).rows;
  const total=(await tx.query('SELECT count(*)::int AS n FROM academic_years WHERE school_id=$1',[schoolId])).rows[0].n;
  const current=(await tx.query("SELECT id,data->>'title' AS title FROM academic_years WHERE school_id=$1 AND data->>'isCurrent'='true' ORDER BY id LIMIT 1",[schoolId])).rows[0];
  const principals=(await tx.query("SELECT u.name,u.username,u.active FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.school_id=$1 AND m.role='principal' AND m.active ORDER BY u.name,m.id LIMIT 25",[schoolId])).rows;
  return {principals,school:{...school.data,id:schoolId,version:school.version},access:await readSchoolAccess(schoolId),years:years.map(row=>({...row.data,id:row.id,schoolId,version:row.version})),totalYears:total,currentYearId:current?.id||null,currentYearTitle:current?.title||null};
 });});
 app.get(`${yearBase}/summary`,async request=>inspect(request,async(tx,{schoolId,yearId})=>(await tx.query("SELECT count(*) FILTER(WHERE kind='students')::int AS students,count(*) FILTER(WHERE kind='students' AND COALESCE(data->>'status','active')='active')::int AS \"activeStudents\",count(*) FILTER(WHERE kind='classes')::int AS classes,count(*) FILTER(WHERE kind='teachers')::int AS teachers,count(*) FILTER(WHERE kind='vicePrincipals')::int AS \"vicePrincipals\" FROM records WHERE school_id=$1 AND year_id=$2 AND kind IN ('students','classes','teachers','vicePrincipals')",[schoolId,yearId])).rows[0]));
 app.get(`${yearBase}/list/:kind`,async request=>{
  const kind=z.enum(['students','classes','staff']).parse((request.params as {kind:string}).kind),page=paging.parse(request.query);
  return inspect(request,async(tx,{schoolId,yearId})=>{
   if(page.classId)await getRecord(tx,page.classId,schoolId,yearId!,'classes');
   const kinds=kind==='staff'?['teachers','vicePrincipals']:[kind],values=[schoolId,yearId,kinds,`%${page.search}%`,page.classId||null];
   const filter="r.school_id=$1 AND r.year_id=$2 AND r.kind=ANY($3::text[]) AND (r.data->>'name' ILIKE $4 OR r.data->>'studentNumber' ILIKE $4 OR r.data->>'nationalCode' ILIKE $4) AND ($5::uuid IS NULL OR r.class_id=$5)";
   const count=(await tx.query(`SELECT count(*)::int AS total FROM records r WHERE ${filter}`,values)).rows[0].total;
   const rows=(await tx.query(`SELECT r.id,r.kind,r.class_id,c.data->>'name' AS class_name,r.data ${kind==='classes'?",(SELECT count(*)::int FROM records s WHERE s.school_id=r.school_id AND s.year_id=r.year_id AND s.kind='students' AND s.class_id=r.id AND COALESCE(s.data->>'status','active')='active') AS roster_count":''} FROM records r LEFT JOIN records c ON c.id=r.class_id AND c.school_id=r.school_id AND c.year_id=r.year_id AND c.kind='classes' WHERE ${filter} ORDER BY r.data->>'name',r.id LIMIT 25 OFFSET $6`,[...values,page.offset])).rows;
   return {total:count,items:rows.map(row=>kind==='students'?{id:row.id,name:row.data.name,studentNumber:row.data.studentNumber,grade:row.data.grade,classGroupId:row.class_id,className:row.class_name,status:row.data.status||'active'}:kind==='classes'?{id:row.id,name:row.data.name,grade:row.data.grade,major:row.data.major,room:row.data.room,studentCount:row.roster_count}:{id:row.id,kind:row.kind,name:row.data.name,phone:row.data.phone,roleTitle:row.data.roleTitle,teachingSubjects:row.data.teachingSubjects||[],assignedClassIds:row.data.assignedClassIds||[]})};
  });
 });
 app.get(`${yearBase}/students/:studentId`,async request=>inspect(request,async(tx,{schoolId,yearId,studentId})=>{
  const student=await getRecord(tx,studentId!,schoolId,yearId!,'students');delete student._actor;
  if(student.financialSummary===undefined)student.financialSummary=createEmptyFinancialSummary();
  const classRow=student.classGroupId?(await tx.query("SELECT * FROM records WHERE id=$1 AND school_id=$2 AND year_id=$3 AND kind='classes'",[student.classGroupId,schoolId,yearId])).rows[0]:null;
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'});
  const stats=(await tx.query(`WITH days AS (SELECT civil_day,max(CASE entry->>'status' WHEN 'absent' THEN 3 WHEN 'late' THEN 2 WHEN 'excused' THEN 1 ELSE 0 END) severity FROM records CROSS JOIN LATERAL jsonb_array_elements(data->'records') entry WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND data->'records' @> $3::jsonb AND entry->>'studentId'=$4 AND civil_day<=$5::date GROUP BY civil_day) SELECT count(*)::int AS "totalDays",count(*) FILTER(WHERE severity=0)::int AS "presentDays",count(*) FILTER(WHERE severity=1)::int AS "excusedDays",count(*) FILTER(WHERE severity=2)::int AS "lateDays",count(*) FILTER(WHERE severity=3)::int AS "absentDays" FROM days`,[schoolId,yearId,JSON.stringify([{studentId}]),studentId,today])).rows[0];
  const receipts=(await tx.query("SELECT id,name FROM files WHERE school_id=$1 AND year_id=$2 AND purpose='receipt' AND student_id=$3 AND id=ANY($4::uuid[]) ORDER BY id",[schoolId,yearId,studentId,receiptIds(student.financialSummary)])).rows;
  await inspectionAudit(tx,request,schoolId,yearId!,studentId!,'platform-dossier-viewed');
  return {student:{...student,attendanceStats:stats,attendanceStatsSource:'sessions'},classGroup:classRow?entity(classRow):null,receipts};
 }));
 app.get(`${yearBase}/students/:studentId/records/:kind`,async request=>{
  const kind=z.enum(['grades','attendanceSessions']).parse((request.params as {kind:string}).kind),page=paging.pick({offset:true}).extend({gradeView:z.enum(gradeViews).default('all')}).parse(request.query);
  return inspect(request,async(tx,{schoolId,yearId,studentId})=>{
   await getRecord(tx,studentId!,schoolId,yearId!,'students');const field=kind==='grades'?'scores':'records';
   const values=[schoolId,yearId,kind,JSON.stringify([{studentId}]),kind==='grades'?gradeCategories(page.gradeView):null];
   const filter="school_id=$1 AND year_id=$2 AND kind=$3 AND data->'"+field+"' @> $4::jsonb AND ($5::text[] IS NULL OR data->>'category'=ANY($5::text[]))";
   const total=(await tx.query(`SELECT count(*)::int AS n FROM records WHERE ${filter}`,values)).rows[0].n;
   const rows=(await tx.query(`SELECT id,school_id,year_id,kind,version,jsonb_set(data,'{${field}}',(SELECT COALESCE(jsonb_agg(entry),'[]'::jsonb) FROM jsonb_array_elements(data->'${field}') entry WHERE entry->>'studentId'=$7)) AS data FROM records WHERE ${filter} ORDER BY created_at DESC,id LIMIT 25 OFFSET $6`,[...values,page.offset,studentId])).rows;
   await inspectionAudit(tx,request,schoolId,yearId!,studentId!,`platform-dossier-${kind}-viewed`);
   return {items:rows.map(row=>{const item=entity(row);delete item.previousVersions;delete item._actor;return item;}),total};
  });
 });
 // This streamed route owns its transaction; the generic GET wrapper must not wrap reply.send.
 app.get(`${yearBase}/students/:studentId/files/:fileId`,async(request,reply)=>{
  const file=await inspect(request,async(tx,{schoolId,yearId,studentId,fileId})=>{
   const student=await getRecord(tx,studentId!,schoolId,yearId!,'students');requireValue(receiptIds(student.financialSummary).includes(fileId!),'فایل به پرونده انتخاب‌شده تعلق ندارد.',404);
   const row=(await tx.query("SELECT * FROM files WHERE id=$1 AND school_id=$2 AND year_id=$3 AND student_id=$4 AND purpose='receipt'",[fileId,schoolId,yearId,studentId])).rows[0];requireValue(row,'فایل پیدا نشد.',404);return row;
  });
  const result=await storage.send(new GetObjectCommand({Bucket:config.S3_BUCKET,Key:file.storage_key}));
  await inspect(request,async(tx,{schoolId,yearId,studentId,fileId})=>inspectionAudit(tx,request,schoolId,yearId!,studentId!,'platform-file-download-started',fileId));
  return reply.header('Content-Type',file.mime).header('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`).header('X-Content-Type-Options','nosniff').send(result.Body as Readable);
 });
}
