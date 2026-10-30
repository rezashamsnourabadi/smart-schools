import {randomUUID} from 'node:crypto';
import {access,mkdir,unlink,writeFile} from 'node:fs/promises';
import {config} from './config';
import {pool,transaction} from './db';
import {hashPassword} from './auth';
import {saveRecord} from './repository';
import {getSchoolClock,getSchoolDate} from '../src/utils/persianUtils';
import {assignFee,createEmptyFinancialSummary,recordPayment} from '../src/utils/financialLedger';
import type {SchoolFeeItem} from '../src/types';

// This is an explicit, one-time, local development seed. It never runs at app startup.
const database=new URL(config.DATABASE_URL);
if(config.NODE_ENV!=='development'||!['localhost','127.0.0.1'].includes(database.hostname)||database.port!=='55432'||database.pathname!=='/schools')throw new Error('Full demo school seeding is restricted to the local development database on port 55432.');
const credentialsPath='.local/full-demo-school-credentials.md';
const password='DanaaDemo1405!';
const weekdays=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه'] as const;
const periods=[['07:30','08:15'],['08:25','09:10'],['09:30','10:15'],['10:25','11:10']];
const subjects=['ریاضی','فیزیک','شیمی','زیست‌شناسی','فارسی','عربی','دین و زندگی','زبان انگلیسی','تاریخ','تربیت بدنی'];
const subjectTeachers=['علی نادری','امیرحسین رستگار','رضا شریفی','حمید بهرامی','محمد فرهمند','مهدی یوسفی','محمدرضا حیدری','امیر کاظمی','علی اکبری','بهنام صالحی'];
const studentNames=['آراد محمدی','پارسا احمدی','آریا رضایی','امیرعلی کریمی','آرین حسینی','سامیار جعفری','کیان مرادی','بردیا موسوی','ماهان صادقی','نیما عباسی'];
const parentNames=['حمید محمدی','رضا احمدی','مجید رضایی','محمود کریمی','فرهاد حسینی','علی جعفری','پویا مرادی','سعید موسوی','حامد صادقی','بهنام عباسی'];
const classSpecs=[{grade:10,letter:'الف',room:'۱۰۱'},{grade:10,letter:'ب',room:'۱۰۲'},{grade:11,letter:'الف',room:'۲۰۱'},{grade:11,letter:'ب',room:'۲۰۲'},{grade:12,letter:'الف',room:'۳۰۱'},{grade:12,letter:'ب',room:'۳۰۲'}];
const demoPhone='09000000000';
const clock=getSchoolClock();
const [,currentYearMonth]=clock.date.split('/').map(Number);
const currentSolarYear=Number(clock.date.split('/')[0]);
const schoolYearStart=currentYearMonth>=7?currentSolarYear:currentSolarYear-1;
const academicYear=`${schoolYearStart}-${schoolYearStart+1}`;
const schoolId=randomUUID(),yearId=randomUUID();
const loginRows:{role:string;username:string;name:string;className?:string}[]=[];
const addLogin=(role:string,username:string,name:string,className?:string)=>loginRows.push({role,username,name,...className?{className}:{}});
const getUsername=(kind:string,suffix:string)=>`dana-demo-${kind}-${suffix}`;
const gradeDateFor=(year:number)=>`${year}/08/05`;
const createUser=async(tx:any,role:string,username:string,name:string,hash:string,school:string|null,profileId:string|null=null,studentId:string|null=null,permissions:Record<string,boolean>={})=>{
  const user=(await tx.query('INSERT INTO users(username,name,phone,password_hash,phone_verified) VALUES($1,$2,$3,$4,true) RETURNING id',[username,name,demoPhone,hash])).rows[0];
  const member=(await tx.query('INSERT INTO memberships(user_id,school_id,role,profile_id,student_id,permissions) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[user.id,school,role,profileId,studentId,permissions])).rows[0];
  return {id:user.id,membershipId:member.id};
};
const termOneStart=`${schoolYearStart}/07/01`,termOneEnd=`${schoolYearStart}/10/30`,termTwoStart=`${schoolYearStart}/11/01`,yearEnd=`${schoolYearStart+1}/06/31`;

try{
  await mkdir('.local',{recursive:true});
  try{await access(credentialsPath);throw new Error(`Demo credentials already exist at ${credentialsPath}. Refusing to create a duplicate school.`);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const hash=await hashPassword(password);
  try{
    await transaction(async tx=>{
      const duplicate=await tx.query("SELECT 1 FROM schools WHERE data->>'code'='DANA-DEMO-1405' OR data->>'name'='دبیرستان نمونه دانا' LIMIT 1");
      if(duplicate.rowCount)throw new Error('A demo school already exists in this database; no records were changed.');
      await tx.query('INSERT INTO schools(id,data) VALUES($1,$2)',[schoolId,{name:'دبیرستان نمونه دانا',code:'DANA-DEMO-1405',type:'دبیرستان دوره دوم',principalName:'محمدرضا نیک‌روش',address:'شهر نمونه، خیابان دانش، کوچه فرهنگ',phone:demoPhone,accentColor:'teal',studentCount:60,teacherCount:10,classesCount:6,todayAttendanceSubmitted:false,attendanceRateToday:0}]);
      await tx.query('INSERT INTO academic_years(id,school_id,data) VALUES($1,$2,$3)',[yearId,schoolId,{title:academicYear,startDate:termOneStart,endDate:yearEnd,status:'active',isCurrent:true,currentTermId:clock.date.split('/')[1]&&Number(clock.date.split('/')[1])>=11?'term2':'term1',terms:[{id:'term1',title:'نوبت اول',startDate:termOneStart,endDate:termOneEnd,isCurrent:Number(clock.date.split('/')[1])<11},{id:'term2',title:'نوبت دوم',startDate:termTwoStart,endDate:yearEnd,isCurrent:Number(clock.date.split('/')[1])>=11}]}]);

      const classes=[];
      for(const [index,spec] of classSpecs.entries()){
        const gradeTitle=`پایه ${{10:'دهم',11:'یازدهم',12:'دوازدهم'}[spec.grade]}`;
        const major=spec.grade===10?'ریاضی فیزیک':spec.grade===11?'علوم تجربی':'علوم انسانی';
        const group=await saveRecord(tx,schoolId,yearId,'classes',{name:`${gradeTitle} ${spec.letter}`,grade:gradeTitle,major,room:spec.room,studentCount:10});
        classes.push({...group,name:`${gradeTitle} ${spec.letter}`,grade:gradeTitle,room:spec.room,spec,major,index});
      }
      const feesByGrade=new Map<number,SchoolFeeItem>();
      for(const [grade,amount] of [[10,24000000],[11,28000000],[12,32000000]] as const){
        const targetScope=grade===10?'grade_10':grade===11?'grade_11':'grade_12';
        const fee=await saveRecord(tx,schoolId,yearId,'feeItems',{academicYearId:yearId,title:`شهریه و خدمات پایهٔ ${grade===10?'دهم':grade===11?'یازدهم':'دوازدهم'}`,category:'tuition',amount,isMandatory:true,targetScope,description:'تعرفهٔ نمونه برای نمایش بخش مالی؛ پرداخت واقعی انجام نشده است.',dueDate:`${schoolYearStart}/09/30`,defaultInstallmentsCount:1});
        feesByGrade.set(grade,fee as unknown as SchoolFeeItem);
      }
      const teachers=[];
      for(let index=0;index<subjects.length;index++){
        const profileId=randomUUID(),assignedClassIds=classes.map(group=>group.id);
        const teacher=await saveRecord(tx,schoolId,yearId,'teachers',{identityId:profileId,name:subjectTeachers[index],phone:demoPhone,avatarBg:['bg-blue-600','bg-teal-600','bg-violet-600','bg-amber-600'][index%4],teachingSubjects:[subjects[index]],assignedClassIds});
        teachers.push(teacher);
        const username=getUsername('teacher',String(index+1).padStart(2,'0'));
        await createUser(tx,'teacher',username,subjectTeachers[index],hash,schoolId,profileId);
        addLogin('دبیر',username,subjectTeachers[index]);
      }
      const vicePermissions={canManageAnnouncements:true,canManageSchedule:true,canManageStudentsAndClasses:true,canViewFullDossier:false,canLogDisciplinary:true,canManageFinances:false,canManageFeedback:true,canManageSurveys:true};
      for(const [index,name] of ['کامران امینی','مهدی رفیعی'].entries()){
        const profileId=randomUUID();
        await saveRecord(tx,schoolId,yearId,'vicePrincipals',{identityId:profileId,name,phone:demoPhone,avatarBg:index?'bg-violet-600':'bg-teal-600',roleTitle:index?'معاون اجرایی':'معاون آموزشی',permissions:vicePermissions});
        const username=getUsername('vice',String(index+1));await createUser(tx,'vice_principal',username,name,hash,schoolId,profileId,null,vicePermissions);addLogin('معاون',username,name);
      }
      const principalUsername=getUsername('principal','school');
      await createUser(tx,'principal',principalUsername,'محمدرضا نیک‌روش',hash,schoolId);addLogin('مدیر مدرسه',principalUsername,'محمدرضا نیک‌روش');
      const platformUsername=getUsername('platform','admin');
      await createUser(tx,'platform_admin',platformUsername,'مدیر سامانه نمونه',hash,null);addLogin('مدیر پلتفرم',platformUsername,'مدیر سامانه نمونه');

      const studentsByClass:{id:string;identityId:string;name:string;classId:string;className:string;index:number;classIndex:number}[][]=[];
      let serial=1;
      for(const group of classes){
        const list=[];
        for(let index=0;index<10;index++){
          const identityId=(await tx.query('INSERT INTO enrollment_identities(national_code) VALUES($1) RETURNING id',[`99${String(schoolYearStart).slice(-2)}${String(serial).padStart(6,'0')}`])).rows[0].id;
          const name=studentNames[(index+group.index)%studentNames.length];
          const studentNumber=`${schoolYearStart}${String(group.spec.grade).slice(-1)}${group.spec.letter==='الف'?'1':'2'}${String(index+1).padStart(2,'0')}`;
          const fee=feesByGrade.get(group.spec.grade);
          if(!fee)throw new Error(`A sample tuition fee was not configured for grade ${group.spec.grade}.`);
          const financeOperation={id:randomUUID(),date:clock.date,recordedBy:'محمدرضا نیک‌روش'};
          let financialSummary=assignFee(createEmptyFinancialSummary(),fee,financeOperation);
          if(serial%7===0){
            const paymentDate=gradeDateFor(schoolYearStart);
            financialSummary=recordPayment(financialSummary,{id:randomUUID(),studentId:'pending-student-id',studentName:name,schoolId,amount:5000000,date:paymentDate,trackingCode:`DEMO-${studentNumber}`,method:'cash',feeItemId:fee.id,feeTitle:fee.title,recordedBy:'محمدرضا نیک‌روش',status:'confirmed',isSimulated:true},{...financeOperation,date:paymentDate});
          }
          const student=await saveRecord(tx,schoolId,yearId,'students',{identityId,name,nationalCode:`99${String(schoolYearStart).slice(-2)}${String(serial).padStart(6,'0')}`,birthDate:`${schoolYearStart-group.spec.grade-5}/02/${String(5+index).padStart(2,'0')}`,fatherName:parentNames[index].split(' ')[0],motherName:'پدر دوم',parentName:parentNames[index],parentPhone:demoPhone,emergencyPhone:demoPhone,address:`شهر نمونه، خیابان ${['دانش','فرهنگ','بهار','معلم'][index%4]}، پلاک ${index+2}`,parentBaleAccount:'',grade:group.grade,fieldOfStudy:group.major,studentNumber,status:'active',classGroupId:group.id,attendanceStats:{totalDays:8,presentDays:7,absentDays:index===2?1:0,lateDays:index===4?1:0,excusedDays:0},attendanceStatsSource:'sessions',attendanceAcademicYearId:yearId,reportCards:[],disciplinaryRecords:[],pastYearHistory:[],financialSummary});
          if(serial%7===0){financialSummary={...financialSummary,transactions:financialSummary.transactions.map(payment=>({...payment,studentId:student.id}))};await saveRecord(tx,schoolId,yearId,'students',{...student,financialSummary},student);}
          list.push({...student,identityId,name,classId:group.id,className:group.name,index,classIndex:group.index});
          const classSlug=`${group.spec.grade}${group.spec.letter==='الف'?'a':'b'}`;
          const studentUsername=getUsername('student',`${classSlug}-${String(index+1).padStart(2,'0')}`);
          await createUser(tx,'student',studentUsername,`${name} (${group.name})`,hash,schoolId,null,identityId);addLogin('دانش‌آموز',studentUsername,name,group.name);
          const parentUsername=getUsername('parent',`${classSlug}-${String(index+1).padStart(2,'0')}`);
          await createUser(tx,'parent',parentUsername,`${parentNames[index]}، ولی ${name}`,hash,schoolId,null,identityId);addLogin('ولی',parentUsername,parentNames[index],group.name);
          serial++;
        }
        studentsByClass.push(list);
      }

      for(const group of classes){
        for(let slot=0;slot<20;slot++){
          const subjectIndex=(slot+group.index)%subjects.length,dayIndex=Math.floor(slot/4),period=slot%4+1;
          const [startTime,endTime]=periods[period-1];
          await saveRecord(tx,schoolId,yearId,'schedule',{classGroupId:group.id,className:group.name,teacherId:teachers[subjectIndex].id,teacherName:teachers[subjectIndex].name,subject:subjects[subjectIndex],dayOfWeek:weekdays[dayIndex],period,startTime,endTime});
        }
      }

      const recentSchoolDays:Date[]=[];
      for(let offset=1;recentSchoolDays.length<2&&offset<=10;offset++){
        const day=new Date(Date.now()-offset*86400000);
        if(weekdays.includes(getSchoolClock(day).dayOfWeek as typeof weekdays[number]))recentSchoolDays.push(day);
      }
      const sessionDates=recentSchoolDays.map(day=>getSchoolDate(day));
      for(const [classIndex,group] of classes.entries()){
        const roster=studentsByClass[classIndex];
        for(const [dateIndex,date] of sessionDates.entries()){
          const dayOfWeek=getSchoolClock(recentSchoolDays[dateIndex]).dayOfWeek;
          const schedule=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND class_id=$3 AND data->>'dayOfWeek'=$4 AND data->>'period'='1' LIMIT 1",[schoolId,yearId,group.id,dayOfWeek])).rows[0];
          const sessionTeacher=teachers.find(teacher=>teacher.id===schedule?.teacher_id);
          if(!schedule||!sessionTeacher)throw new Error(`A schedule slot was not found for ${group.name}.`);
          await saveRecord(tx,schoolId,yearId,'attendanceSessions',{schoolId,academicYearId:yearId,classGroupId:group.id,className:group.name,teacherId:sessionTeacher.id,teacherName:sessionTeacher.name,subject:subjects[(classIndex+dateIndex)%subjects.length],date,period:1,submittedAt:'08:20',records:roster.map((student,index)=>({studentId:student.id,status:index===(classIndex+dateIndex)%10?'absent':index===(classIndex+dateIndex+3)%10?'late':'present'})),studentNames:Object.fromEntries(roster.map(student=>[student.id,student.name])),sentNotificationsCount:0,notifyParents:false,scheduleSlotId:schedule?.id,revision:1});
        }
      }

      const gradeDate=`${schoolYearStart}/08/05`;
      for(const [classIndex,group] of classes.entries()){
        const roster=studentsByClass[classIndex];
        for(let subjectIndex=0;subjectIndex<subjects.length;subjectIndex++){
          const teacher=teachers[subjectIndex];
          const scores=roster.map((student,index)=>({studentId:student.id,score:12+((index*3+subjectIndex+classIndex)%9),note:index===0?'پیشرفت خوب در حل تمرین':''}));
          await saveRecord(tx,schoolId,yearId,'grades',{classGroupId:group.id,subject:subjects[subjectIndex],title:'ارزشیابی آغاز سال',category:'continuous',categoryTitle:'ارزشیابی مستمر',date:gradeDate,maxScore:20,scores,teacherId:teacher.id,teacherName:teacher.name});
        }
        const homeworkSubjects=[classIndex%subjects.length,(classIndex+4)%subjects.length];
        for(const [workIndex,subjectIndex] of homeworkSubjects.entries()){
          const teacher=teachers[subjectIndex];
          const homework=await saveRecord(tx,schoolId,yearId,'homework',{classGroupId:group.id,className:group.name,teacherId:teacher.id,teacherName:teacher.name,subject:subjects[subjectIndex],title:workIndex?'تمرین مرور فصل':'تمرین هفتگی',description:workIndex?'پرسش‌های مشخص‌شده از کتاب را با راه‌حل کامل در دفتر بنویسید.':'تمرین‌های پایان درس را حل کنید و مراحل پاسخ را مرتب بنویسید.',assignedDate:gradeDate,dueDate:`${schoolYearStart}/08/20`,submissionsCount:8,totalStudents:10,status:'active'});
          for(const [studentIndex,student] of roster.entries()){
            if(studentIndex>=8)continue;
            await saveRecord(tx,schoolId,yearId,'homeworkSubmissions',{homeworkId:homework.id,studentId:student.id,studentName:student.name,submissionDate:`${schoolYearStart}/08/${String(8+studentIndex%5).padStart(2,'0')}`,textContent:studentIndex%3===0?'پاسخ تمرین را در دفتر نوشته‌ام.':'پاسخ پرسش‌ها به ترتیب در دفتر نوشته شده است.',status:studentIndex<6?'graded':'submitted',...(studentIndex<6?{teacherScore:16+(studentIndex%5),teacherFeedback:studentIndex%2?'پاسخ‌ها کامل است.':'روش حل را واضح نوشته‌ای؛ ادامه بده.'}:{})});
          }
        }
        const examSubjects=[(classIndex+1)%subjects.length,(classIndex+6)%subjects.length];
        for(const [examIndex,subjectIndex] of examSubjects.entries()){
          const examDate=`${schoolYearStart}/08/${String(15+examIndex).padStart(2,'0')}`;
          await saveRecord(tx,schoolId,yearId,'exams',{classGroupId:group.id,className:group.name,subject:subjects[subjectIndex],teacherName:teachers[subjectIndex].name,title:examIndex?'آزمونک فصل اول':'آزمون کوتاه کلاسی',examDate,startTime:examIndex?'09:30':'08:25',durationMinutes:30,totalScore:20,status:'scheduled',questions:[]});
        }
      }

      const announcements=[
        {title:'جلسه آشنایی با برنامه سال تحصیلی',content:'اولیای گرامی، جلسه آشنایی با برنامه آموزشی و پرورشی روز دوشنبه ساعت ۱۶ در سالن مدرسه برگزار می‌شود.',target:'parents' as const,priority:'normal' as const},
        {title:'آغاز هفته کتاب و مطالعه',content:'دانش‌آموزان می‌توانند کتاب‌های پیشنهادی خود را تا پایان هفته به کتابخانه مدرسه معرفی کنند.',target:'all' as const,priority:'important' as const},
        {title:'یادآوری برنامه آزمون‌های کلاسی',content:'برنامه آزمون‌های کوتاه هر کلاس در بخش آزمون‌ها قابل مشاهده است. برنامه به‌روزرسانی می‌شود.',target:'students' as const,priority:'normal' as const},
      ];
      for(const item of announcements)await saveRecord(tx,schoolId,yearId,'announcements',{...item,type:'announcement',senderRole:'principal',senderName:'محمدرضا نیک‌روش',eventDate:gradeDate,isPinned:item.priority==='important',isArchived:false,attachments:[]});
      for(let index=0;index<20;index++)await saveRecord(tx,schoolId,yearId,'questionBank',{title:`پرسش نمونه ${subjects[index%subjects.length]} ${Math.floor(index/10)+1}`,content:`یک پرسش تمرینی متناسب با مباحث آغاز سال درس ${subjects[index%subjects.length]} برای گفت‌وگوی کلاسی.`,subject:subjects[index%subjects.length],grade:`پایه ${['دهم','یازدهم','دوازدهم'][Math.floor(index/7)%3]}`,difficulty:['آسان','متوسط','دشوار'][index%3],type:index%2?'تشریحی':'تستی',options:index%2?undefined:['گزینه الف','گزینه ب','گزینه پ','گزینه ت'],correctAnswer:index%2?undefined:'گزینه الف',authorName:subjectTeachers[index%subjects.length],authorSchool:'دبیرستان نمونه دانا',isSharedRegional:false,tags:['نمونه','آغاز سال']});

    },schoolId);
  }catch(error){await unlink(credentialsPath).catch(()=>{});throw error;}

  const lines=['# حساب‌های مدرسهٔ آزمایشی دانا','',`سال تحصیلی: ${academicYear}`,'مدرسه: دبیرستان نمونه دانا','',`رمز مشترک همهٔ حساب‌ها: \`${password}\``,'','این حساب‌ها فقط برای دیتابیس توسعهٔ محلی ساخته شده‌اند. ورود با رمز انجام می‌شود؛ پیامک و ارسال اعلان بیرونی فعال نیست. فایل را منتشر یا در Git ثبت نکنید.','','| نقش | شناسه ورود | نام نمایشی | کلاس | رمز |','|---|---|---|---|---|'];
  for(const item of loginRows)lines.push(`| ${item.role} | \`${item.username}\` | ${item.name} | ${item.className||'—'} | \`${password}\` |`);
  await writeFile(credentialsPath,lines.join('\n')+'\n',{mode:0o600});
  console.log(JSON.stringify({school:'دبیرستان نمونه دانا',academicYear,classes:6,students:60,teachers:10,vicePrincipals:2,accounts:loginRows.length,credentials:credentialsPath},null,2));
}finally{await pool.end();}
