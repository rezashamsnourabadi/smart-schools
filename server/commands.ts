import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { transaction, type Tx } from './db';
import { allowed, scope, linkedRecord, memberProfile, assertRead } from './resources';
import { deny, requireValue } from './errors';
import { audit, entity, getRecord, saveRecord, classAccess, type Entity } from './repository';
import { permissions } from './schema';
import { getSchoolClock, getSchoolDate, toEnglishDigits } from '../src/utils/persianUtils';
import { schoolTimeMinutes, upsertAttendance } from '../src/utils/attendance';
import { assignFee, calculateFinancialSummary, changePaymentStatus, createEmptyFinancialSummary, grantDiscount, matchesFeeTarget, recordPayment } from '../src/utils/financialLedger';
import { rolloverStudents } from '../src/utils/academicYear';
import type { AttendanceSession, PaymentTransaction, StudentFinancialSummary, SchoolFeeItem, Student, ClassGroup, YearRolloverOptions } from '../src/types';

const id=z.uuid();const text=z.string().trim().max(2000);const amount=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const payment=z.object({studentId:id,studentName:text,schoolId:id,amount,trackingCode:text.min(1).max(100),method:z.enum(['pos','card_to_card','bank_receipt','cheque','cash']),methodDetails:z.object({bankName:text.optional(),chequeNumber:text.optional(),chequeDueDate:text.optional(),receiptImageUrl:z.string().regex(/^\/api\/v1\/files\/[a-f0-9-]+$/).optional(),payerName:text.optional(),accountTail:text.optional()}).strict().optional(),note:text.optional(),feeItemId:id.optional(),feeTitle:text.optional(),recordedBy:text,status:z.enum(['confirmed','pending_verification','rejected']),isSimulated:z.boolean().optional()}).strict();
export async function enqueue(tx:Tx,school:string,year:string,student:Entity,input:{message:string;platform?:'bale'|'sms';type?:string;attendanceSessionId?:string;attendanceRevision?:number}) {
  const channel=input.platform==='bale'&&student.parentBaleAccount?'bale':'sms';
  const notification={studentId:student.id,studentName:student.name,recipientName:student.parentName,recipientPhone:student.parentPhone,platform:channel==='bale'?'بله':'پیامک',status:'queued',message:input.message,timestamp:new Date().toISOString(),schoolName:'',type:input.type||'general',attendanceSessionId:input.attendanceSessionId,attendanceRevision:input.attendanceRevision};
  const row=await saveRecord(tx,school,year,'notifications',notification);
  await tx.query('INSERT INTO outbox(school_id,payload) VALUES($1,$2)',[school,{channel,phone:student.parentPhone,chatId:student.parentBaleAccount,message:input.message,notificationId:row.id,yearId:year}]);
}
export async function commandRoutes(app:FastifyInstance) {
  app.post('/api/v1/commands/:action',async request=>{
    const action=(request.params as {action:string}).action;
    const {member,school,year,user}=await scope(request,!['banner-click','banner-status'].includes(action));
    const body=z.record(z.string(),z.unknown()).parse(request.body);
    const need=(p:Parameters<typeof allowed>[1])=>{if(!allowed(member,p))deny();};
    return transaction(async tx=>{
      let result:Record<string,unknown>={ok:true};
      const updateStudent=async(studentId:string,change:(student:Entity)=>Promise<Record<string,unknown>>|Record<string,unknown>)=>{
        const old=await getRecord(tx,studentId,school,year,'students',true);
        const changes=await change(old);return saveRecord(tx,school,year,'students',{...old,...changes},old);
      };
      if(action==='attendance') {
        const input=z.object({scheduleSlotId:id,records:z.array(z.object({studentId:id,status:z.enum(['present','absent','late','excused']),note:text.optional()}).strict()).min(1).max(200),platform:z.enum(['bale','sms'])}).strict().parse(body);
        requireValue(['principal','vice_principal','teacher'].includes(member.role),'دسترسی مجاز نیست.',403);
        const slot=await getRecord(tx,input.scheduleSlotId,school,year,'schedule');
        await classAccess(tx,{...member,profile_id:(await memberProfile(tx,member,school,year))?.id||null},school,year,String(slot.classGroupId),String(slot.subject));
        if(member.role==='teacher')requireValue(slot.teacherId===(await memberProfile(tx,member,school,year))?.id,'این برنامه متعلق به دبیر دیگری است.',403);
        const clock=getSchoolClock();requireValue(slot.dayOfWeek===clock.dayOfWeek && (schoolTimeMinutes(String(slot.startTime))??Infinity)<=clock.minuteOfDay,'ثبت فقط برای زنگ آغازشده امروز مجاز است.');
        const roster=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND COALESCE(data->>'status','active')='active'",[school,year,slot.classGroupId]);
        requireValue(input.records.length===roster.rowCount && new Set(input.records.map(r=>r.studentId)).size===roster.rowCount && input.records.every(r=>roster.rows.some(s=>s.id===r.studentId)),'فهرست باید شامل همه دانش‌آموزان فعال کلاس باشد.');
        await tx.query('SELECT id FROM records WHERE id=$1 FOR UPDATE',[slot.classGroupId]);
        const prior=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND class_id=$3 AND data->>'date'=$4 AND data->>'period'=$5 FOR UPDATE",[school,year,slot.classGroupId,clock.date,String(slot.period)]);
        const previous=prior.rows.map(entity);
        const draft={id:randomUUID(),schoolId:school,academicYearId:year,classGroupId:slot.classGroupId,className:slot.className,subject:slot.subject,teacherId:slot.teacherId,teacherName:slot.teacherName,date:clock.date,period:slot.period,submittedAt:clock.time,records:input.records,sentNotificationsCount:0,scheduleSlotId:slot.id,recordedBy:user.id} as AttendanceSession;
        const change=upsertAttendance(previous as unknown as AttendanceSession[],draft);
        if(change.changed) {
          const saved=await saveRecord(tx,school,year,'attendanceSessions',change.session as unknown as Record<string,unknown>,previous[0]);
          for(const incident of change.changes) {
            const student=entity(roster.rows.find(r=>r.id===incident.studentId));
            await enqueue(tx,school,year,student,{message:`وضعیت حضور ${student.name} در زنگ ${slot.period} به ${incident.status} ثبت شد.`,platform:input.platform,type:incident.previousStatus?'attendance_correction':incident.status==='absent'?'attendance_absent':'attendance_late',attendanceSessionId:saved.id,attendanceRevision:change.session.revision});
          }
          const daily=(await tx.query("WITH daily AS (SELECT entry->>'studentId' AS student,max(CASE entry->>'status' WHEN 'absent' THEN 3 WHEN 'late' THEN 2 WHEN 'excused' THEN 1 ELSE 0 END) severity FROM records CROSS JOIN LATERAL jsonb_array_elements(data->'records') entry WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND civil_day=$3::date GROUP BY entry->>'studentId') SELECT count(*)::int AS recorded,count(*) FILTER(WHERE severity IN (0,2))::int AS present FROM daily",[school,year,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tehran'})])).rows[0];
          await tx.query('UPDATE schools SET data=data||$1::jsonb WHERE id=$2',[JSON.stringify({todayAttendanceDate:clock.date,todayAttendanceSubmitted:daily.recorded>0,attendanceRateToday:daily.recorded?Math.round(daily.present/daily.recorded*1000)/10:0,attendanceRecordedCount:daily.recorded}),school]);
        }
        result={ok:true,changed:change.changed,notificationsSent:change.changes.length};
      } else if(action==='payment'||action==='payment-status'||action==='discount') {
        let studentId:string;
        if(action==='payment')studentId=payment.parse(body).studentId;
        else studentId=id.parse(body.studentId);
        if(member.role==='parent') {
          requireValue(action==='payment','دسترسی مجاز نیست.',403);
          requireValue((await linkedRecord(tx,member,school,year))?.id===studentId,'پرونده به این حساب متصل نیست.',403);
        } else need('canManageFinances');
        await updateStudent(studentId,async student=>{
          const source=(student.financialSummary as StudentFinancialSummary)||createEmptyFinancialSummary();
          const operation={id:randomUUID(),date:getSchoolDate(),recordedBy:user.name};
          let summary:StudentFinancialSummary;
          if(action==='payment') {
            const input=payment.parse(body);requireValue(input.schoolId===school,'مدرسه معتبر نیست.');
            if(input.methodDetails?.receiptImageUrl) {
              const file=await tx.query('SELECT 1 FROM files WHERE id=$1 AND school_id=$2 AND owner_id=$3',[input.methodDetails.receiptImageUrl.split('/').pop(),school,user.id]);requireValue(file.rowCount,'پیوست معتبر نیست.');
            }
            const doc:PaymentTransaction={...input,id:operation.id,studentName:String(student.name),date:operation.date,recordedBy:user.name,status:member.role==='parent'?'pending_verification':input.status,isSimulated:false};
            summary=recordPayment(source,doc,operation);
          } else if(action==='payment-status') {
            const input=z.object({studentId:id,transactionId:id,status:z.enum(['confirmed','rejected'])}).strict().parse(body);
            summary=changePaymentStatus(source,input.transactionId,input.status,operation);
          } else {
            const input=z.object({studentId:id,feeItemId:id,amount,reason:text.min(1)}).strict().parse(body);
            summary=grantDiscount(source,input.feeItemId,input.amount,input.reason,operation);
          }
          await enqueue(tx,school,year,student,{message:`عملیات مالی پرونده ${student.name} ثبت شد؛ مانده ${summary.remainingDebt} تومان.`,type:'payment'});
          return {financialSummary:summary};
        });
      } else if(action==='assign-fee') {
        need('canManageFinances');const input=z.object({feeItemId:id,targetScope:z.enum(['all','grade_10','grade_11','grade_12','selective']),classGroupId:id.optional()}).strict().parse(body);
        requireValue(input.targetScope!=='selective'||input.classGroupId,'برای تخصیص انتخابی کلاس را انتخاب کنید.');
        const fee=await getRecord(tx,input.feeItemId,school,year,'feeItems');
        const students=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' ORDER BY id FOR UPDATE",[school,year]);
        for(const row of students.rows) { const student=entity(row); if(!matchesFeeTarget(student as unknown as Student,fee as unknown as SchoolFeeItem,input.targetScope,input.classGroupId))continue;
          const summary=assignFee((student.financialSummary as StudentFinancialSummary)||createEmptyFinancialSummary(),fee as unknown as SchoolFeeItem,{id:randomUUID(),date:getSchoolDate(),recordedBy:user.name});await saveRecord(tx,school,year,'students',{...student,financialSummary:summary},student);
        }
      } else if(action==='report-card') {
        requireValue(member.role==='principal','انتشار کارنامه در اختیار مدیر مدرسه است.',403);
        const score=z.number().min(0).max(20);
        const input=z.object({studentId:id,version:z.number().int().positive(),card:z.object({term:z.enum(['term1','term2']),termTitle:text.min(1),year:text,gpa:score,rankInClass:z.number().int().positive().max(200),disciplineScore:score,subjects:z.array(z.object({name:text.min(1),unit:z.number().positive().max(20),continuousScore:score,finalScore:score,totalScore:score,status:z.enum(['قبول','تجدید']),teacherName:text}).strict()).min(1).max(50),isPublished:z.boolean()}).strict()}).strict().parse(body);
        const academic=(await tx.query('SELECT data FROM academic_years WHERE school_id=$1 AND id=$2',[school,year])).rows[0];
        requireValue(toEnglishDigits(input.card.year)===toEnglishDigits(academic.data.title),'سال کارنامه باید سال انتخاب‌شده باشد.');
        await updateStudent(input.studentId,student=>{requireValue(student.version===input.version,'پرونده تغییر کرده است؛ پنجره را ببندید و پس از بررسی نسخه تازه دوباره اقدام کنید.',409);return {reportCards:[...(student.reportCards as {term:string}[]||[]).filter(card=>card.term!==input.card.term),input.card]};});
      } else if(action==='contact') {
        const input=z.object({studentId:id,changes:z.object({address:text.optional(),emergencyPhone:text.optional(),parentPhone:text.optional(),parentBaleAccount:text.optional()}).strict()}).strict().parse(body);
        if(member.role==='parent')requireValue((await linkedRecord(tx,member,school,year))?.id===input.studentId,'دسترسی مجاز نیست.',403);else need('canManageStudentsAndClasses');
        await updateStudent(input.studentId,()=>input.changes);
      } else if(action==='discipline') {
        need('canLogDisciplinary');const input=z.object({studentId:id,record:z.object({type:z.enum(['تشویقی','تذکر','تاخیر']),title:text.min(1),note:text,date:text,recordedBy:text}).strict()}).strict().parse(body);
        await updateStudent(input.studentId,async student=>{
          await enqueue(tx,school,year,student,{message:`${input.record.title}: ${input.record.note}`});
          return {disciplinaryRecords:[{...input.record,id:randomUUID(),date:getSchoolDate(),recordedBy:user.name},...(student.disciplinaryRecords as unknown[]||[])]};
        });
      } else if(action==='remove-student') {
        need('canManageStudentsAndClasses');const input=z.object({studentId:id}).strict().parse(body);
        const student=await getRecord(tx,input.studentId,school,year,'students',true);
        const finance=student.financialSummary as StudentFinancialSummary|undefined;
        requireValue(!finance?.assignedFees.length&&!finance?.transactions.length&&!(student.reportCards as unknown[]||[]).length&&!(student.disciplinaryRecords as unknown[]||[]).length&&!(student.pastYearHistory as unknown[]||[]).length,'دانش‌آموز دارای سابقه قابل حذف نیست؛ انتقال یا فارغ‌التحصیلی را ثبت کنید.');
        const refs=await tx.query("SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 AND (student_id=$3 OR (kind='attendanceSessions' AND data->'records' @> $4::jsonb) OR (kind='grades' AND data->'scores' @> $4::jsonb)) LIMIT 1",[school,year,input.studentId,JSON.stringify([{studentId:input.studentId}])]);
        requireValue(!refs.rowCount,'پرونده دارای سابقه آموزشی است و قابل حذف نیست.');
        await tx.query('DELETE FROM records WHERE school_id=$1 AND year_id=$2 AND id=$3',[school,year,input.studentId]);
      } else if(action==='student-status') {
        need('canManageStudentsAndClasses');const input=z.object({studentId:id,status:z.enum(['active','graduated','transferred']),classGroupId:id.optional(),details:z.record(z.string(),z.string().max(2000)).optional()}).strict().parse(body);
        if(input.classGroupId){await getRecord(tx,input.classGroupId,school,year,'classes',true);const count=(await tx.query("SELECT count(*)::int n FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3 AND id<>$4 AND COALESCE(data->>'status','active')='active'",[school,year,input.classGroupId,input.studentId])).rows[0].n;requireValue(count<200,'سقف این کلاس دویست دانش‌آموز است.');}
        await updateStudent(input.studentId,()=>({status:input.status,...input.classGroupId?{classGroupId:input.classGroupId,pendingClassGrade:undefined}:{},...input.status==='graduated'?{graduationDetails:input.details}:input.status==='transferred'?{transferDetails:input.details}:{}}));
      } else if(action==='homework-grade') {
        requireValue(member.role==='teacher','دسترسی مجاز نیست.',403);
        const input=z.object({submissionId:id,score:z.number().min(0).max(20),feedback:text}).strict().parse(body);
        const old=await getRecord(tx,input.submissionId,school,year,'homeworkSubmissions',true);
        const hw=await getRecord(tx,String(old.homeworkId),school,year,'homework');
        requireValue(hw.teacherId===(await memberProfile(tx,member,school,year))?.id,'این تکلیف متعلق به شما نیست.',403);
        await saveRecord(tx,school,year,'homeworkSubmissions',{...old,status:'graded',teacherScore:input.score,teacherFeedback:input.feedback},old);
      } else if(action==='permissions') {
        requireValue(member.role==='principal','دسترسی مجاز نیست.',403);
        const input=z.object({vpId:id,permissions:permissions.partial()}).strict().parse(body);
        const vp=await getRecord(tx,input.vpId,school,year,'vicePrincipals',true);
        const next={...(vp.permissions as object),...input.permissions};
        await saveRecord(tx,school,year,'vicePrincipals',{...vp,permissions:next},vp);
        await tx.query("UPDATE memberships SET permissions=$1 WHERE school_id=$2 AND role='vice_principal' AND (profile_id=$3 OR profile_id=$4)",[next,school,vp.id,vp.identityId||vp.id]);
      } else if(action==='notify'||action==='payment-reminder') {
        const input=z.object({studentId:id,message:text.min(1),platform:z.enum(['bale','sms']).optional()}).strict().parse(body);
        if(action==='payment-reminder')need('canManageFinances');else requireValue(['principal','vice_principal'].includes(member.role),'دسترسی مجاز نیست.',403);
        const student=await getRecord(tx,input.studentId,school,year,'students');await enqueue(tx,school,year,student,{message:input.message,platform:input.platform,type:action==='payment-reminder'?'reminder':'general'});
      } else if(action==='pin-announcement') {
        need('canManageAnnouncements');const input=z.object({id}).strict().parse(body);const old=await getRecord(tx,input.id,school,year,'announcements',true);await saveRecord(tx,school,year,'announcements',{...old,isPinned:!old.isPinned},old);
      } else if(action==='term') {
        requireValue(member.role==='principal','دسترسی مجاز نیست.',403);const input=z.object({termId:z.enum(['term1','term2','summer'])}).strict().parse(body);
        const row=(await tx.query('SELECT * FROM academic_years WHERE id=$1 AND school_id=$2 FOR UPDATE',[year,school])).rows[0];
        requireValue(row.data.terms.some((t:{id:string})=>t.id===input.termId),'نوبت پیدا نشد.');
        await tx.query('UPDATE academic_years SET data=$1,version=version+1 WHERE id=$2',[{...row.data,currentTermId:input.termId,terms:row.data.terms.map((t:{id:string})=>({...t,isCurrent:t.id===input.termId}))},year]);
      } else if(action==='rollover') {
        requireValue(member.role==='principal','دسترسی مجاز نیست.',403);
        const options=z.object({newYearTitle:z.string().max(20),promoteStudents:z.boolean(),graduateTwelfthGraders:z.boolean(),archiveCurrentGrades:z.boolean(),resetAttendanceLogs:z.boolean()}).strict().parse(body) as YearRolloverOptions;
        requireValue(options.resetAttendanceLogs,'سال جدید همیشه حضور و غیاب مستقل دارد؛ گزینه بازنشانی را فعال کنید.');
        const current=(await tx.query('SELECT * FROM academic_years WHERE school_id=$1 AND id=$2 FOR UPDATE',[school,year])).rows[0];
        const title=toEnglishDigits(options.newYearTitle);const parts=title.split('-').map(Number);const oldParts=toEnglishDigits(current.data.title).split('-').map(Number);
        requireValue(/^\d{4}-\d{4}$/.test(title)&&parts[0]===oldParts[0]+1&&parts[1]===parts[0]+1,'سال مقصد باید سال پیوسته بعدی باشد.');
        await tx.query("UPDATE academic_years SET data=data||'{\"isCurrent\":false,\"status\":\"archived\"}'::jsonb,version=version+1 WHERE id=$1",[year]);
        const planned=(await tx.query("SELECT * FROM academic_years WHERE school_id=$1 AND data->>'title'=$2 FOR UPDATE",[school,title])).rows[0];
        if(planned)requireValue(planned.data.status==='planned','سال مقصد از قبل موجود است و برنامه‌ریزی‌شده نیست.');
        const nextYear=planned?.id||randomUUID();
        if(planned){const records=await tx.query('SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 LIMIT 1',[school,nextYear]);requireValue(!records.rowCount,'سال مقصد دارای داده است؛ انتقال خودکار مجاز نیست.');await tx.query('UPDATE academic_years SET data=data||$1,version=version+1 WHERE id=$2',[{isCurrent:true,status:'active'},nextYear]);}
        else await tx.query('INSERT INTO academic_years(id,school_id,data) VALUES($1,$2,$3)',[nextYear,school,{...current.data,title,isCurrent:true,status:'active',startDate:`${parts[0]}/07/01`,endDate:`${parts[1]}/06/31`,terms:(current.data.terms as {id:string;title:string}[]).map(term=>({id:term.id,title:term.title,isCurrent:term.id==='term1',startDate:term.id==='term1'?`${parts[0]}/07/01`:term.id==='term2'?`${parts[0]}/11/01`:`${parts[1]}/04/01`,endDate:term.id==='term1'?`${parts[0]}/10/30`:term.id==='term2'?`${parts[1]}/03/31`:`${parts[1]}/06/31`}))}]);
        const definitions=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind IN ('classes','teachers','vicePrincipals','schedule') ORDER BY CASE kind WHEN 'classes' THEN 1 WHEN 'teachers' THEN 2 WHEN 'vicePrincipals' THEN 3 ELSE 4 END,id",[school,year]);
        const map=new Map<string,string>();
        for(const row of definitions.rows){const data={...row.data};if(data.assignedClassIds)data.assignedClassIds=data.assignedClassIds.map((v:string)=>map.get(v)).filter(Boolean);if(data.classGroupId)data.classGroupId=map.get(data.classGroupId);if(data.teacherId)data.teacherId=map.get(data.teacherId);const created=await saveRecord(tx,school,nextYear,row.kind,data);map.set(row.id,created.id);}
        const originals=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' ORDER BY id FOR UPDATE",[school,year]);
        const newClasses=await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='classes'",[school,nextYear]);
        const prepared=originals.rows.map(r=>({...entity(r),classGroupId:map.get(r.class_id)||''}));
        const change=rolloverStudents(prepared as unknown as Student[],newClasses.rows.map(entity) as unknown as ClassGroup[],{schoolId:school,schoolName:'',currentYearTitle:current.data.title,newYearId:nextYear,newYearTitle:title,options});
        for(const student of change.students) {
          const old=originals.rows.find(r=>r.id===student.id);if(old.data.status&&old.data.status!=='active')continue;
          // New enrollment has no inherited debt, grades, homework or incident state.
          await saveRecord(tx,school,nextYear,'students',{...student,reportCards:[],disciplinaryRecords:[],financialSummary:createEmptyFinancialSummary(),legacyAttendanceStats:undefined,identityId:old.data.identityId||old.id});
        }
        result={ok:true,...change,students:undefined,newYearId:nextYear};
      } else if(action==='banner-status'||action==='banner-click') {
        const input=z.object({id}).strict().parse(body);if(action==='banner-status')requireValue(member.role==='platform_admin','دسترسی مجاز نیست.',403);
        const row=(await tx.query("SELECT * FROM regional_content WHERE id=$1 AND kind='banners' FOR UPDATE",[input.id])).rows[0];requireValue(row,'بنر پیدا نشد.',404);
        const data=action==='banner-status'?{...row.data,isActive:!row.data.isActive}:{...row.data,clicksCount:(row.data.clicksCount||0)+1};await tx.query('UPDATE regional_content SET data=$1,version=version+1 WHERE id=$2',[data,input.id]);
      } else if(action==='convert-staff') {
        requireValue(member.role==='principal','دسترسی مجاز نیست.',403);
        const input=z.object({id,to:z.enum(['teacher','vice_principal']),roleTitle:text.optional(),permissions:permissions.partial().optional(),teachingSubjects:z.array(text).optional(),assignedClassIds:z.array(id).optional()}).strict().parse(body);
        const old=await getRecord(tx,input.id,school,year,input.to==='teacher'?'vicePrincipals':'teachers',true);
        if(input.assignedClassIds)for(const cls of input.assignedClassIds)await getRecord(tx,cls,school,year,'classes');
        const next={...old,roleTitle:input.roleTitle||old.roleTitle,permissions:input.permissions||{},teachingSubjects:input.teachingSubjects||[],assignedClassIds:input.assignedClassIds||[]};
        const refs=await tx.query('SELECT 1 FROM records WHERE teacher_id=$1 LIMIT 1',[old.id]);requireValue(!refs.rowCount,'ابتدا برنامه‌ها و تکالیف وابسته را تعیین تکلیف کنید.');
        await tx.query('UPDATE records SET kind=$1,data=$2,version=version+1 WHERE id=$3',[input.to==='teacher'?'teachers':'vicePrincipals',next,old.id]);
        await tx.query('UPDATE memberships SET role=$1,permissions=$2 WHERE school_id=$3 AND profile_id=$4',[input.to,input.permissions||{},school,old.identityId||old.id]);
      } else requireValue(false,'عملیات شناخته نشد.',404);
      await audit(tx,user.id,school||null,action);return result;
    },school);
  });
}
