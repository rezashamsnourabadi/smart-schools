import {readFile} from 'node:fs/promises';
import {randomInt} from 'node:crypto';
import {config} from './config';
import {pool,transaction} from './db';
import {entity,getRecord,saveRecord} from './repository';
import {getSchoolDate,getSchoolClock} from '../src/utils/persianUtils';

// Explicit, repeatable development fixture extension; never run at server boot.
const database=new URL(config.DATABASE_URL);
if(config.NODE_ENV!=='development'||!['localhost','127.0.0.1'].includes(database.hostname)||database.port!=='55432'||database.pathname!=='/schools')throw new Error('Teacher preview seeding requires the local development database on port 55432.');
interface Fixture {schoolId:string;yearId:string;classId:string;users:{teacher:{id:string;username:string;membershipId:string}}}
try {
  const fixture:Fixture=JSON.parse(await readFile('.local/browser-fixture.json','utf8'));
  if(!fixture.users.teacher.username.startsWith('demo-teacher-'))throw new Error('An explicit demo teacher fixture is required.');
  const result=await transaction(async tx=>{
    const school=(await tx.query('SELECT * FROM schools WHERE id=$1',[fixture.schoolId])).rows[0];
    if(school?.data.name!=='مدرسه آزمایشی دانا')throw new Error('Only the known demo school can be extended.');
    const year=(await tx.query('SELECT * FROM academic_years WHERE school_id=$1 AND id=$2',[fixture.schoolId,fixture.yearId])).rows[0];
    if(!year?.data.isCurrent||year.data.status!=='active')throw new Error('The demo school needs an active current year.');
    const membership=(await tx.query("SELECT m.* FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.id=$1 AND m.user_id=$2 AND m.school_id=$3 AND m.role='teacher' AND m.active AND u.username=$4",[fixture.users.teacher.membershipId,fixture.users.teacher.id,fixture.schoolId,fixture.users.teacher.username])).rows[0];
    if(!membership)throw new Error('Demo teacher membership not found.');
    const teacherRow=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='teachers' AND (id=$3 OR data->>'identityId'=$4)",[fixture.schoolId,fixture.yearId,membership.profile_id,membership.profile_id])).rows[0];
    if(!teacherRow)throw new Error('Demo teacher profile not found.');
    const teacher=entity(teacherRow),group=await getRecord(tx,fixture.classId,fixture.schoolId,fixture.yearId,'classes');
    if(!(teacher.assignedClassIds as string[]).includes(group.id))throw new Error('Demo class must already be assigned to the teacher.');
    let students=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3",[fixture.schoolId,fixture.yearId,group.id])).rows;
    const names=['آراد','آرین','بردیا','پارسا','دانیال','سامان','شایان','کیان','ماهان','نیما'];
    let added=0;
    for(let index=students.length;index<12;index++){
      let identity:string|undefined;
      let code='';
      while(!identity){code=String(randomInt(1_000_000_000,9_999_999_999));identity=(await tx.query('INSERT INTO enrollment_identities(national_code) VALUES($1) ON CONFLICT(national_code) DO NOTHING RETURNING id',[code])).rows[0]?.id;}
      await saveRecord(tx,fixture.schoolId,fixture.yearId,'students',{identityId:identity,name:`${names[(index-2+names.length)%names.length]} آزمایشی`,nationalCode:code,birthDate:'1390/01/01',fatherName:'ولی نمونه',parentName:'ولی آزمایشی',parentPhone:'09123456789',parentBaleAccount:'',address:'',grade:group.grade,fieldOfStudy:group.major||'ریاضی',studentNumber:String(index+1),status:'active',classGroupId:group.id,attendanceStats:{totalDays:0,presentDays:0,absentDays:0,lateDays:0,excusedDays:0},reportCards:[],disciplinaryRecords:[],pastYearHistory:[]});added++;
    }
    students=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students' AND class_id=$3",[fixture.schoolId,fixture.yearId,group.id])).rows;
    await saveRecord(tx,fixture.schoolId,fixture.yearId,'classes',{...group,studentCount:students.length},group);
    const subject=(teacher.teachingSubjects as string[])[0];
    if(!subject)throw new Error('Demo teacher must have an assigned subject.');
    for(const day of ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه']){
      const existing=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND class_id=$3 AND data->>'dayOfWeek'=$4 AND data->>'period'='1'",[fixture.schoolId,fixture.yearId,group.id,day])).rows[0];
      if(existing&&existing.teacher_id!==teacher.id)throw new Error('An existing schedule belongs to another teacher; no overwrite is permitted.');
      const collision=(await tx.query("SELECT id FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND teacher_id=$3 AND class_id<>$4 AND data->>'dayOfWeek'=$5 AND data->>'period'='1'",[fixture.schoolId,fixture.yearId,teacher.id,group.id,day])).rowCount;
      if(collision)throw new Error('The demo teacher has a conflicting session; no overwrite is permitted.');
      await saveRecord(tx,fixture.schoolId,fixture.yearId,'schedule',{classGroupId:group.id,className:group.name,teacherId:teacher.id,teacherName:teacher.name,subject,dayOfWeek:day,period:1,startTime:'00:00',endTime:'23:59'},existing?entity(existing):undefined);
    }
    let historyAdded=false;
    if(process.argv.includes('--with-history')){
      const date=getSchoolDate(new Date(Date.now()-86400000));
      const existing=await tx.query("SELECT id FROM records WHERE school_id=$1 AND year_id=$2 AND kind='attendanceSessions' AND class_id=$3 AND data->>'date'=$4 AND data->>'period'='1'",[fixture.schoolId,fixture.yearId,group.id,date]);
      if(!existing.rowCount){
        const slot=(await tx.query("SELECT * FROM records WHERE school_id=$1 AND year_id=$2 AND kind='schedule' AND teacher_id=$3 AND class_id=$4 AND subject=$5 LIMIT 1",[fixture.schoolId,fixture.yearId,teacher.id,group.id,subject])).rows[0];
        await saveRecord(tx,fixture.schoolId,fixture.yearId,'attendanceSessions',{schoolId:fixture.schoolId,academicYearId:fixture.yearId,classGroupId:group.id,className:group.name,teacherId:teacher.id,teacherName:teacher.name,subject,date,period:1,submittedAt:'08:00',records:students.map((student,index)=>({studentId:student.id,status:index===0?'absent':index===1?'late':'present'})),studentNames:Object.fromEntries(students.map(student=>[student.id,student.data.name])),sentNotificationsCount:0,scheduleSlotId:slot.id,revision:1});historyAdded=true;
      }
    }
    const total=(await tx.query("SELECT count(*)::int AS count FROM records WHERE school_id=$1 AND year_id=$2 AND kind='students'",[fixture.schoolId,fixture.yearId])).rows[0].count;
    await tx.query("UPDATE schools SET data=jsonb_set(data,'{studentCount}',to_jsonb($2::int)),version=version+1 WHERE id=$1",[fixture.schoolId,total]);
    return {school:school.data.name,teacher:fixture.users.teacher.username,className:group.name,students:students.length,addedStudents:added,historyAdded,today:getSchoolClock().dayOfWeek,period:1,available:'00:00–23:59 every day; demo only',attendanceHistory:'preserved'};
  },fixture.schoolId);
  console.log(JSON.stringify(result,null,2));
}finally{await pool.end();}
