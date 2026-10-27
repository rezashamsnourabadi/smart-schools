import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {config} from './config';
import {pool,transaction} from './db';
import {hashPassword} from './auth';
import {saveRecord} from './repository';
import {getSchoolClock} from '../src/utils/persianUtils';

if(config.NODE_ENV==='production')throw new Error('Demo seeding is prohibited in production.');
const run=randomUUID().slice(0,8),password=randomBytes(18).toString('base64url');
const schoolId=randomUUID(),yearId=randomUUID();
const permissions={canManageAnnouncements:true,canManageSchedule:true,canManageStudentsAndClasses:true,canViewFullDossier:true,canLogDisciplinary:true,canManageFinances:true};
const clock=getSchoolClock();
const fixtures:Record<string,unknown>={schoolId,yearId,password,users:{}};
try {
  await transaction(async tx=>{
    await tx.query('INSERT INTO schools(id,data) VALUES($1,$2)',[schoolId,{name:'مدرسه آزمایشی دانا',code:run,type:'دبیرستان دوره دوم',principalName:'مدیر آزمایشی',address:'',phone:'09123456789',accentColor:'teal',studentCount:2,teacherCount:1,classesCount:1,todayAttendanceSubmitted:false,attendanceRateToday:0}]);
    const parts=clock.date.split('/');const first=Number(parts[1])>=7?Number(parts[0]):Number(parts[0])-1;
    await tx.query('INSERT INTO academic_years(id,school_id,data) VALUES($1,$2,$3)',[yearId,schoolId,{title:`${first}-${first+1}`,startDate:`${first}/07/01`,endDate:`${first+1}/06/31`,status:'active',isCurrent:true,currentTermId:'term1',terms:[{id:'term1',title:'نوبت اول',startDate:`${first}/07/01`,endDate:`${first}/10/30`,isCurrent:true}]}]);
    const cls=await saveRecord(tx,schoolId,yearId,'classes',{name:'دهم ریاضی الف',grade:'پایه دهم',major:'ریاضی',room:'۱۰۱',studentCount:2});
    const teacher=await saveRecord(tx,schoolId,yearId,'teachers',{identityId:randomUUID(),name:'دبیر آزمایشی',phone:'09123456789',avatarBg:'bg-blue-600',teachingSubjects:['ریاضی'],assignedClassIds:[cls.id]});
    const vp=await saveRecord(tx,schoolId,yearId,'vicePrincipals',{identityId:randomUUID(),name:'معاون آزمایشی',phone:'09123456789',avatarBg:'bg-teal-600',roleTitle:'معاون آموزشی',permissions});
    const students=[];
    for(let i=0;i<2;i++){
      const code=String(Date.now()+i).slice(-10);const identity=(await tx.query('INSERT INTO enrollment_identities(national_code) VALUES($1) ON CONFLICT(national_code) DO UPDATE SET national_code=EXCLUDED.national_code RETURNING id',[code])).rows[0].id;
      students.push(await saveRecord(tx,schoolId,yearId,'students',{identityId:identity,name:i?'دانش‌آموز دوم آزمایشی':'دانش‌آموز اول آزمایشی',nationalCode:code,birthDate:'1390/01/01',fatherName:'پدر',parentName:'ولی آزمایشی',parentPhone:'09123456789',parentBaleAccount:'',address:'',grade:'پایه دهم',fieldOfStudy:'ریاضی',studentNumber:String(i+1),status:'active',classGroupId:cls.id,attendanceStats:{totalDays:0,presentDays:0,absentDays:0,lateDays:0,excusedDays:0},reportCards:[],disciplinaryRecords:[],pastYearHistory:[]}));
    }
    await saveRecord(tx,schoolId,yearId,'schedule',{classGroupId:cls.id,className:cls.name,teacherId:teacher.id,teacherName:teacher.name,subject:'ریاضی',dayOfWeek:['پنجشنبه','جمعه'].includes(clock.dayOfWeek)?'شنبه':clock.dayOfWeek,period:1,startTime:'00:00',endTime:'23:59'});
    await saveRecord(tx,schoolId,yearId,'homework',{classGroupId:cls.id,className:cls.name,teacherId:teacher.id,teacherName:teacher.name,subject:'ریاضی',title:'تمرین آزمایشی',description:'پاسخ تمرین را ارسال کنید.',assignedDate:clock.date,dueDate:`${first+1}/03/01`,submissionsCount:0,totalStudents:2,status:'active'});
    const hash=await hashPassword(password);
    for(const role of ['platform_admin','principal','vice_principal','teacher','student','parent']){
      const username=`demo-${role}-${run}`;const user=(await tx.query('INSERT INTO users(username,name,phone,password_hash,phone_verified) VALUES($1,$2,$3,$4,true) RETURNING id',[username,`${role} آزمایشی`,'09123456789',hash])).rows[0];
      const membership=(await tx.query('INSERT INTO memberships(user_id,school_id,role,profile_id,student_id,permissions) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[user.id,role==='platform_admin'?null:schoolId,role,role==='teacher'?teacher.identityId:role==='vice_principal'?vp.identityId:null,['student','parent'].includes(role)?students[0].identityId:null,role==='vice_principal'?permissions:{}])).rows[0];
      (fixtures.users as Record<string,unknown>)[role]={id:user.id,username,membershipId:membership.id};
      if(role==='parent')await tx.query("INSERT INTO memberships(user_id,school_id,role,student_id) VALUES($1,$2,'parent',$3)",[user.id,schoolId,students[1].identityId]);
    }
    Object.assign(fixtures,{classId:cls.id,studentId:students[0].id});
  },schoolId);
  await mkdir('.local',{recursive:true});await writeFile('.local/browser-fixture.json',JSON.stringify(fixtures,null,2),{mode:0o600});
  console.log('Explicit demo data created. Credentials are in .local/browser-fixture.json (not included in the application bundle).');
} finally {await pool.end();}
