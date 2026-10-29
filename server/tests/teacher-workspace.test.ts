import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {randomUUID} from 'node:crypto';
process.env.NODE_ENV='test';
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';
process.env.REDIS_URL=process.env.TEST_REDIS_URL||'redis://127.0.0.1:56379';
process.env.SMS_WEBHOOK_URL='';process.env.BALE_BOT_TOKEN='';
const {createApp}=await import('../app');const {pool,transaction}=await import('../db');const {saveRecord}=await import('../repository');const {digest}=await import('../auth');const {getSchoolDate,getSchoolClock}=await import('../../src/utils/persianUtils');
const app=await createApp(),school=randomUUID(),year=randomUUID(),users:string[]=[];
let initialized=false;
after(async()=>{
 if(initialized)await transaction(async tx=>{
  await tx.query('DELETE FROM classroom_events WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM outbox WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM audit_log WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM idempotency WHERE user_id=ANY($1::uuid[])',[users]);
  await tx.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])',[users]);
  await tx.query('DELETE FROM memberships WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM records WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM academic_years WHERE school_id=$1',[school]);
  await tx.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);
  await tx.query('DELETE FROM schools WHERE id=$1',[school]);
 },school);
 await app.close();await pool.end();
});
test('teacher workspace: scope, historical roster and reversible classroom events',async t=>{
 const fixtures=await transaction(async tx=>{
  await tx.query('INSERT INTO schools(id,data) VALUES($1,$2)',[school,{name:'Teacher workspace checks',todayAttendanceDate:getSchoolDate(),attendanceRateToday:77}]);initialized=true;
  await tx.query('INSERT INTO academic_years(id,school_id,data) VALUES($1,$2,$3)',[year,school,{title:'1405-1406',isCurrent:true,status:'active',terms:[]}]);
  const group=await saveRecord(tx,school,year,'classes',{name:'Test class',grade:'دهم',room:'1'}),other=await saveRecord(tx,school,year,'classes',{name:'Other class',grade:'دهم',room:'2'});
  const a=await saveRecord(tx,school,year,'teachers',{name:'Teacher A',identityId:randomUUID(),assignedClassIds:[group.id,other.id],teachingSubjects:['ریاضی','فیزیک']}),b=await saveRecord(tx,school,year,'teachers',{name:'Teacher B',identityId:randomUUID(),assignedClassIds:[group.id],teachingSubjects:['فیزیک']});
  const actors=[];
  for(const profile of [a,b]){
   const user=(await tx.query('INSERT INTO users(username,name,phone) VALUES($1,$1,$2) RETURNING id',[`teacher-check-${randomUUID()}`,''])).rows[0];users.push(user.id);
   const member=(await tx.query("INSERT INTO memberships(user_id,school_id,role,profile_id) VALUES($1,$2,'teacher',$3) RETURNING id",[user.id,school,profile.identityId])).rows[0];
   const secret=randomUUID(),csrf=randomUUID();await tx.query("INSERT INTO sessions(id,user_id,csrf,expires_at,privileged,auth_method) VALUES($1,$2,$3,now()+interval '1 hour',false,'password')",[digest(secret),user.id,csrf]);actors.push({userId:user.id,cookie:`school-session=${secret}`,member:member.id,csrf});
  }
  await saveRecord(tx,school,year,'schedule',{classGroupId:group.id,className:'Test class',teacherId:a.id,teacherName:a.name,subject:'ریاضی',dayOfWeek:'شنبه',period:1,startTime:'00:00',endTime:'23:59'});
  await saveRecord(tx,school,year,'schedule',{classGroupId:other.id,className:'Other class',teacherId:a.id,teacherName:a.name,subject:'فیزیک',dayOfWeek:'شنبه',period:2,startTime:'00:00',endTime:'23:59'});
  await saveRecord(tx,school,year,'schedule',{classGroupId:group.id,className:'Test class',teacherId:b.id,teacherName:b.name,subject:'فیزیک',dayOfWeek:'شنبه',period:2,startTime:'00:00',endTime:'23:59'});
  const student=await saveRecord(tx,school,year,'students',{name:'Student',studentNumber:'1',nationalCode:'1234567890',classGroupId:group.id,status:'active',parentName:'SECRET_FAMILY',parentPhone:'',address:'SECRET_ADDRESS',financialSummary:{secret:true}});
  const added=await saveRecord(tx,school,year,'students',{name:'Later enrolment',studentNumber:'2',nationalCode:'1234567891',classGroupId:group.id,status:'active'});
  const yesterday=getSchoolDate(new Date(Date.now()-86400000));
  const session=await saveRecord(tx,school,year,'attendanceSessions',{schoolId:school,academicYearId:year,classGroupId:group.id,className:'Test class',teacherId:a.id,teacherName:a.name,subject:'ریاضی',date:yesterday,period:1,submittedAt:'08:00',records:[{studentId:student.id,status:'absent'}],sentNotificationsCount:0});
  const grade=await saveRecord(tx,school,year,'grades',{classGroupId:group.id,teacherId:a.id,subject:'ریاضی',title:'Math check',category:'quiz',categoryTitle:'Quiz',date:yesterday,maxScore:20,scores:[{studentId:student.id,score:17}],_actor:actors[0].userId});
  await saveRecord(tx,school,year,'grades',{classGroupId:group.id,teacherId:b.id,subject:'فیزیک',title:'SECRET_PHYSICS',category:'quiz',categoryTitle:'Quiz',date:yesterday,maxScore:20,scores:[{studentId:student.id,score:9}],_actor:actors[1].userId});
  return {group,student,added,session,grade,actors};
 },school);
 const {group,student,added,session,grade,actors}=fixtures;
 const call=(actor:number,path:string,method:'GET'|'POST'|'PATCH'='GET',body?:object,key=randomUUID())=>app.inject({url:`/api/v1${path}`,method,headers:{cookie:actors[actor].cookie,'x-membership-id':actors[actor].member,'x-academic-year-id':year,'x-csrf-token':actors[actor].csrf,'idempotency-key':key},...body?{payload:body}:{}});
 const params=new URLSearchParams({classId:group.id,subject:'ریاضی'}).toString();
 await t.test('class/subject assignments do not form a Cartesian permission grant',async()=>{const result=await call(0,`/teacher/classroom?classId=${group.id}&subject=${encodeURIComponent('فیزیک')}`);assert.equal(result.statusCode,403,result.body);});
 await t.test('classroom and performance expose no family, finance or other lesson grades',async()=>{
  const classes=await call(0,'/teacher/classes');assert.equal(classes.statusCode,200,classes.body);assert.equal(classes.json().items.length,2);
  for(const kind of ['grades','sessions','homework','exams','submissions']){const records=await call(0,`/teacher/records?${params}&kind=${kind}`);assert.equal(records.statusCode,200,records.body);assert.ok(!records.body.includes('SECRET'));}
  const classroom=await call(0,`/teacher/classroom?${params}`);assert.equal(classroom.statusCode,200,classroom.body);assert.equal(classroom.json().students.length,2);assert.equal(classroom.json().previous.id,session.id);assert.ok(!classroom.body.includes('SECRET'));
  const performance=await call(0,`/teacher/student/${student.id}?${params}`);assert.equal(performance.statusCode,200,performance.body);assert.equal(performance.json().grades.length,1);assert.ok(!performance.body.includes('SECRET'));
  const overview=await call(0,`/teacher/student/${student.id}?${params}&section=overview`);assert.equal(overview.statusCode,200,overview.body);assert.equal(overview.json().summary.absent,1);assert.equal(overview.json().grades.length,0);assert.equal(overview.json().sessions.length,0);assert.ok(!overview.body.includes('SECRET'));
  const gradeSection=await call(0,`/teacher/student/${student.id}?${params}&section=grades`);assert.equal(gradeSection.statusCode,200,gradeSection.body);assert.equal(gradeSection.json().grades.length,1);assert.equal(gradeSection.json().sessions.length,0);
  const dated=await call(0,`/resources/attendanceSessions?classId=${group.id}&date=${encodeURIComponent(String(session.date))}`);assert.equal(dated.statusCode,200,dated.body);assert.equal(dated.json().items.length,1);assert.equal(dated.json().items[0].id,session.id);
  const todayOnly=await call(0,`/resources/attendanceSessions?classId=${group.id}&date=${getSchoolDate()}`);assert.equal(todayOnly.statusCode,200,todayOnly.body);assert.equal(todayOnly.json().items.length,0);
  const old=await call(0,`/students/${student.id}`);assert.equal(old.statusCode,403);
  const oldRecords=await call(0,`/students/${student.id}/records/grades`);assert.equal(oldRecords.statusCode,403);
 });
 await t.test('historical correction rejects another teacher, stale version and changed roster',async()=>{
  const body={version:session.version,reason:'Fix incorrect absence',platform:'sms',records:[{studentId:student.id,status:'present'}]};
  assert.equal((await call(1,`/teacher/sessions/${session.id}`,'PATCH',body)).statusCode,403);
  assert.equal((await call(0,`/teacher/sessions/${session.id}`,'PATCH',{...body,version:99})).statusCode,409);
  assert.equal((await call(0,`/teacher/sessions/${session.id}`,'PATCH',{...body,records:[...body.records,{studentId:added.id,status:'present'}]})).statusCode,422);
 });
 await t.test('correction preserves old roster and date, records history and is idempotent',async()=>{
  const key=randomUUID(),body={version:session.version,reason:'Fix incorrect absence',platform:'sms',records:[{studentId:student.id,status:'present'}]};
  const first=await call(0,`/teacher/sessions/${session.id}`,'PATCH',body,key);assert.equal(first.statusCode,200,first.body);assert.equal((await call(0,`/teacher/sessions/${session.id}`,'PATCH',body,key)).statusCode,200);
  await transaction(async tx=>{const saved=(await tx.query('SELECT * FROM records WHERE id=$1',[session.id])).rows[0];assert.equal(saved.version,2);assert.equal(saved.data.date,session.date);assert.equal(saved.data.records.length,1);assert.equal(saved.data.previousVersions.length,1);assert.equal((await tx.query('SELECT count(*)::int AS n FROM outbox WHERE school_id=$1',[school])).rows[0].n,1);assert.equal((await tx.query('SELECT data FROM schools WHERE id=$1',[school])).rows[0].data.attendanceRateToday,77);},school);
 });
 await t.test('notification opt-out stores attendance and corrections without adding outbox messages',async()=>{
  const correction={version:2,reason:'Correct attendance privately',notifyParents:false,records:[{studentId:student.id,status:'absent'}]};
  const key=randomUUID();const response=await call(0,`/teacher/sessions/${session.id}`,'PATCH',correction,key);assert.equal(response.statusCode,200,response.body);assert.equal((await call(0,`/teacher/sessions/${session.id}`,'PATCH',correction,key)).statusCode,200);
  const slot=await transaction(tx=>saveRecord(tx,school,year,'schedule',{classGroupId:group.id,className:'Test class',teacherId:session.teacherId,teacherName:'Teacher A',subject:'ریاضی',dayOfWeek:getSchoolClock().dayOfWeek,period:3,startTime:'00:00',endTime:'23:59'}),school);
  const saved=await call(0,'/commands/attendance','POST',{scheduleSlotId:slot.id,notifyParents:false,records:[{studentId:student.id,status:'absent'},{studentId:added.id,status:'present'}]});assert.equal(saved.statusCode,200,saved.body);assert.equal(saved.json().notificationsSent,0);
  await transaction(async tx=>{const historical=(await tx.query('SELECT data FROM records WHERE id=$1',[session.id])).rows[0].data;assert.equal(historical.notifyParents,false);assert.equal(historical.sentNotificationsCount,1);assert.equal((await tx.query('SELECT count(*)::int AS n FROM outbox WHERE school_id=$1',[school])).rows[0].n,1);},school);
 });
 await t.test('own grade can be corrected with a reason, while the other teacher is denied',async()=>{
  const payload={classGroupId:group.id,subject:'ریاضی',title:'Math check',category:'quiz',categoryTitle:'Quiz',date:grade.date,maxScore:20,scores:[{studentId:student.id,score:18}]};
  assert.equal((await call(1,`/teacher/grades/${grade.id}`,'PATCH',{version:1,reason:'Score correction',grade:payload})).statusCode,403);
  const corrected=await call(0,`/teacher/grades/${grade.id}`,'PATCH',{version:1,reason:'Score correction',grade:payload});assert.equal(corrected.statusCode,200,corrected.body);
 });
 await t.test('teacher refresh updates the related class views without refetching the class list',async()=>{
  const {QueryClient}=await import('@tanstack/react-query');const {refreshTeacherData}=await import('../../src/api/teacherCache');const client=new QueryClient();
  const key=(path:string)=>['teacher',actors[0].member,year,path];
  const routes=['/teacher/classes',`/teacher/records?${params}&kind=grades`,`/teacher/records?${params}&kind=homework`,`/teacher/student/${student.id}?${params}&section=overview`,`/teacher/classroom?${params}`];
  for(const route of routes)client.setQueryData(key(route),{});
  await refreshTeacherData(client,actors[0].member,year,{kind:'grades',classId:group.id,subject:'ریاضی'});
  assert.equal(client.getQueryState(key(routes[0]))?.isInvalidated,false);assert.equal(client.getQueryState(key(routes[1]))?.isInvalidated,true);assert.equal(client.getQueryState(key(routes[2]))?.isInvalidated,false);assert.equal(client.getQueryState(key(routes[3]))?.isInvalidated,true);assert.equal(client.getQueryState(key(routes[4]))?.isInvalidated,false);client.clear();
 });
 await t.test('classroom participation is private, scoped and reversibly cancelled',async()=>{
  const created=await call(0,'/teacher/events','POST',{classId:group.id,subject:'ریاضی',studentId:student.id,kind:'positive',title:'Participation',note:'Worked on the exercise'});assert.equal(created.statusCode,200,created.body);const id=created.json().id;
  assert.equal((await call(1,`/teacher/events/${id}`,'PATCH',{version:1,reason:'Cancel'})).statusCode,404);
  assert.equal((await call(0,`/teacher/events/${id}`,'PATCH',{version:1,reason:'Entered twice'})).statusCode,200);
  const events=await call(0,`/teacher/records?${params}&kind=events`);assert.equal(events.statusCode,200,events.body);assert.equal(events.json().items[0].active,false);
 });
});
