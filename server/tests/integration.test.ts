import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

process.env.NODE_ENV='test';
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';
process.env.REDIS_URL=process.env.TEST_REDIS_URL||'redis://127.0.0.1:56379';
process.env.S3_ENDPOINT=process.env.TEST_S3_ENDPOINT||'http://127.0.0.1:59000';
if(!process.env.DATABASE_URL.includes('55432')&&!process.env.TEST_DATABASE_URL)throw new Error('Explicit isolated test database required');
const {createApp}=await import('../app');
const {pool,transaction}=await import('../db');
const {hashPassword,digest}=await import('../auth');
const {config}=await import('../config');
const {getSchoolClock}=await import('../../src/utils/persianUtils');
const app=await createApp();
const run=randomUUID().slice(0,8);
interface Actor {id:string;membership:string;cookie:string;csrf:string;year?:string;school?:string;username?:string}
const users:string[]=[],schools:string[]=[];
async function actor(role:string,school?:string,profileId?:string,studentId?:string,perms:object={}):Promise<Actor&{username:string}> {
  const username=`test-${role}-${randomUUID().slice(0,8)}`;
  const row=await pool.query('INSERT INTO users(username,name,phone,password_hash,phone_verified) VALUES($1,$2,$3,$4,true) RETURNING id',[username,username,'09123456789',await hashPassword('test-password-1234')]);
  const id=row.rows[0].id;users.push(id);
  const member=await pool.query('INSERT INTO memberships(user_id,role,school_id,profile_id,student_id,permissions) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[id,role,school||null,profileId||null,studentId||null,perms]);
  const secret=randomUUID(),csrf=randomUUID();await pool.query("INSERT INTO sessions(id,user_id,csrf,expires_at,privileged) VALUES($1,$2,$3,now()+interval '1 day',true)",[digest(secret),id,csrf]);
  return {id,membership:member.rows[0].id,cookie:`school-session=${secret}`,csrf,school,username};
}
async function call(a:Actor,path:string,method='GET',body?:unknown,key=randomUUID(),expected=200) {
  const response=await app.inject({url:`/api/v1${path}`,method:method as 'GET'|'POST'|'PATCH'|'DELETE',headers:{cookie:a.cookie,'x-csrf-token':a.csrf,'x-membership-id':a.membership,...a.year?{'x-academic-year-id':a.year}:{},'idempotency-key':key},payload:body as never});
  assert.equal(response.statusCode,expected,`${method} ${path}: ${response.body}`);return response.json();
}
after(async()=>{
  // Fixtures belong only to this test run; never truncate shared application tables.
  for(const school of schools)await transaction(async tx=>{
    await tx.query('DELETE FROM outbox WHERE school_id=$1',[school]);await tx.query('DELETE FROM files WHERE school_id=$1',[school]);await tx.query('DELETE FROM audit_log WHERE school_id=$1',[school]);await tx.query('DELETE FROM records WHERE school_id=$1',[school]);await tx.query('DELETE FROM academic_years WHERE school_id=$1',[school]);await tx.query('DELETE FROM memberships WHERE school_id=$1',[school]);await tx.query('DELETE FROM schools WHERE id=$1',[school]);
  },school);
  await pool.query('DELETE FROM idempotency WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM audit_log WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM challenges WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM memberships WHERE user_id=ANY($1::uuid[])',[users]);await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);await app.close();await pool.end();
});
test('PostgreSQL-backed workflows and security',async t=>{
  const platform=await actor('platform_admin');
  const makeSchool=async()=>{const result=await call(platform,'/resources/schools','POST',{name:`test-school-${run}-${schools.length}`,code:run,type:'دبیرستان دوره دوم',principalName:'مدیر',address:'',phone:'09123456789',accentColor:'teal'});schools.push(result.id);return result.id as string;};
  const school=await makeSchool(),other=await makeSchool();
  const principal=await actor('principal',school),foreign=await actor('principal',other);
  const yearData={title:'1405-1406',startDate:'1405/07/01',endDate:'1406/06/31',status:'active',currentTermId:'term1',terms:[{id:'term1',title:'نوبت اول',startDate:'1405/07/01',endDate:'1405/10/30',isCurrent:true}]};
  principal.year=(await call(principal,'/resources/academicYears','POST',yearData)).id;
  foreign.year=(await call(foreign,'/resources/academicYears','POST',yearData)).id;
  const cls=await call(principal,'/resources/classes','POST',{name:'الف',grade:'پایه دهم',major:'ریاضی',room:'۱'});
  const cls2=await call(principal,'/resources/classes','POST',{name:'ب',grade:'پایه دهم',major:'ریاضی',room:'۲'});
  const cls3=await call(principal,'/resources/classes','POST',{name:'ج',grade:'پایه دهم',major:'ریاضی',room:'۳'});
  const teacherData={name:'دبیر',phone:'09123456789',avatarBg:'bg-teal-600',teachingSubjects:['ریاضی'],assignedClassIds:[cls.id,cls2.id,cls3.id]};
  const teacherProfile=await call(principal,'/resources/teachers','POST',teacherData);
  const teacherProfile2=await call(principal,'/resources/teachers','POST',{...teacherData,name:'دبیر دوم'});
  const teacher={...await actor('teacher',school,teacherProfile.identityId),year:principal.year};
  const student=await call(principal,'/resources/students','POST',{name:'دانش‌آموز',nationalCode:'0012345678',birthDate:'1390/01/01',fatherName:'پدر',parentName:'ولی',parentPhone:'09123456789',address:'',parentBaleAccount:'',grade:'پایه دهم',fieldOfStudy:'ریاضی',studentNumber:'123',classGroupId:cls.id});
  const parent={...await actor('parent',school,undefined,student.identityId),year:principal.year};
  const learner={...await actor('student',school,undefined,student.identityId),year:principal.year};
  const vp={...await actor('vice_principal',school,undefined,undefined,{}),year:principal.year};

  await t.test('runtime role does not bypass RLS; foreign IDs and forged membership rejected',async()=>{
    const role=await pool.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');assert.equal(role.rows[0].rolsuper,false);assert.equal(role.rows[0].rolbypassrls,false);
    await transaction(async tx=>assert.equal((await tx.query('SELECT 1 FROM records WHERE school_id=$1',[school])).rowCount,0),other);
    await call(foreign,`/students/${student.id}`,'GET',undefined,undefined,404);
    await call({...parent,membership:principal.membership},'/workspace','GET',undefined,undefined,403);
    await call(platform,`/students/${student.id}`,'GET',undefined,undefined,404);
    await call(vp,`/students/${student.id}`,'GET',undefined,undefined,403);
    await call(vp,'/resources/classes','POST',{name:'x',grade:'x',room:''},undefined,403);
  });
  await t.test('CSRF, authenticated session and pagination bounds',async()=>{
    assert.equal((await app.inject('/api/v1/workspace')).statusCode,401);
    assert.equal((await app.inject({url:'/api/v1/resources/classes',method:'POST',headers:{cookie:principal.cookie,'x-membership-id':principal.membership},payload:{}})).statusCode,403);
    await call(principal,'/resources/students?limit=101','GET',undefined,undefined,422);
    const list=await call(parent,'/resources/students');assert.equal(list.items.length,1);assert.equal(list.items[0].financialSummary,undefined);
  });
  await t.test('more simultaneous writes than pool connections do not acquire nested connections',async()=>{
    const results=await Promise.all(Array.from({length:40},(_,index)=>call(parent,'/commands/contact','POST',{studentId:student.id,changes:{address:`parallel-${index}`}})));
    assert.equal(results.length,40);assert.ok(results.every(result=>result.ok));
  });
  await t.test('idempotency commits response with business operation; optimistic edits',async()=>{
    const key=randomUUID(),body={name:'یکتا',grade:'پایه دهم',room:''};
    const first=await call(principal,'/resources/classes','POST',body,key),second=await call(principal,'/resources/classes','POST',body,key);assert.equal(first.id,second.id);
    await call(principal,'/resources/classes','POST',{...body,name:'دیگر'},key,409);
    await call(principal,`/resources/classes/${first.id}`,'PATCH',{version:1,changes:{room:'۲'}});
    await call(principal,`/resources/classes/${first.id}`,'PATCH',{version:1,changes:{room:'۳'}},undefined,409);
  });
  const clock=getSchoolClock();
  const slotData={classGroupId:cls.id,className:'الف',teacherId:teacherProfile.id,teacherName:'دبیر',subject:'ریاضی',dayOfWeek:clock.dayOfWeek==='پنجشنبه'||clock.dayOfWeek==='جمعه'?'شنبه':clock.dayOfWeek,period:1,startTime:'00:00',endTime:'23:59'};
  const slot=await call(principal,'/resources/schedule','POST',slotData);
  await call(principal,'/resources/schedule','POST',{...slotData,classGroupId:cls2.id,teacherId:teacherProfile2.id});
  await t.test('third class conflicts with second teacher, not just first slot',async()=>{
    await call(principal,'/resources/schedule','POST',{...slotData,classGroupId:cls3.id,teacherId:teacherProfile2.id},undefined,409);
  });
  if(slotData.dayOfWeek===clock.dayOfWeek)await t.test('attendance correction and retry produce one incident per change',async()=>{
    const body={scheduleSlotId:slot.id,records:[{studentId:student.id,status:'absent'}],platform:'sms'};
    const first=await call(teacher,'/commands/attendance','POST',body);assert.equal(first.notificationsSent,1);
    const again=await call(teacher,'/commands/attendance','POST',body);assert.equal(again.changed,false);
    const fixed=await call(teacher,'/commands/attendance','POST',{...body,records:[{studentId:student.id,status:'present'}]});assert.equal(fixed.notificationsSent,1);
    const logs=await call(parent,'/resources/notifications');assert.equal(logs.items.length,2);
  });
  await t.test('grade scope and hidden classmates',async()=>{
    const grade={classGroupId:cls.id,subject:'ریاضی',title:'کوییز',category:'quiz',categoryTitle:'کوییز',date:clock.date,maxScore:20,scores:[{studentId:student.id,score:18}]};
    await call(teacher,'/resources/grades','POST',grade);
    await call(teacher,'/resources/grades','POST',{...grade,subject:'فیزیک'},undefined,403);
    const rows=await call(learner,'/resources/grades');assert.equal(rows.items[0].scores.length,1);
  });
  await t.test('homework submission and teacher ownership',async()=>{
    const hw=await call(teacher,'/resources/homework','POST',{classGroupId:cls.id,className:'الف',subject:'ریاضی',teacherId:teacherProfile.id,teacherName:'دبیر',title:'تمرین',description:'حل کنید',assignedDate:clock.date,dueDate:'1405/12/01',totalStudents:1,status:'active'});
    const response=await call(learner,'/resources/homeworkSubmissions','POST',{homeworkId:hw.id,studentId:student.id,studentName:'دانش‌آموز',textContent:'پاسخ'});
    await call(teacher,'/commands/homework-grade','POST',{submissionId:response.id,score:19,feedback:'خوب'});
    await call(parent,'/resources/homeworkSubmissions','POST',{homeworkId:hw.id,studentId:student.id,studentName:'دانش‌آموز',textContent:'جعلی'},undefined,403);
  });
  await t.test('pending receipts, concurrent confirmation, duplicate tracking, discounts',async()=>{
    const fee=await call(principal,'/resources/feeItems','POST',{academicYearId:principal.year,title:'شهریه',category:'tuition',amount:1000,isMandatory:true,targetScope:'all'});
    await call(principal,'/commands/assign-fee','POST',{feeItemId:fee.id,targetScope:'all'});
    const pay={studentId:student.id,studentName:'دانش‌آموز',schoolId:school,amount:700,trackingCode:'A-'+run,method:'bank_receipt',recordedBy:'والد',status:'confirmed'};
    await call(parent,'/commands/payment','POST',pay);await call(parent,'/commands/payment','POST',{...pay,trackingCode:'B-'+run});
    let dossier=await call(parent,`/students/${student.id}`);assert.equal(dossier.financialSummary.totalPaid,0);
    const txs=dossier.financialSummary.transactions;
    const results=await Promise.all(txs.map((p:{id:string})=>app.inject({url:'/api/v1/commands/payment-status',method:'POST',headers:{cookie:principal.cookie,'x-csrf-token':principal.csrf,'x-membership-id':principal.membership,'x-academic-year-id':principal.year!,'idempotency-key':randomUUID()},payload:{studentId:student.id,transactionId:p.id,status:'confirmed'}})));
    assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,422]);
    dossier=await call(parent,`/students/${student.id}`);assert.equal(dossier.financialSummary.totalPaid,700);assert.equal(dossier.financialSummary.remainingDebt,300);
    await call(parent,'/commands/payment','POST',pay,undefined,422);
    await call(principal,'/commands/discount','POST',{studentId:student.id,feeItemId:fee.id,amount:301,reason:'بیش از مانده'},undefined,422);
    await call(principal,'/commands/discount','POST',{studentId:student.id,feeItemId:fee.id,amount:100,reason:'تخفیف'});
    await call(parent,'/commands/discount','POST',{studentId:student.id,feeItemId:fee.id,amount:100,reason:'جعلی'},undefined,403);
  });
  await t.test('account activation, expiry, recovery and verified recovery-phone change',async()=>{
    const username=`account-${randomUUID().slice(0,8)}`;
    const account=await call(principal,'/accounts','POST',{username,name:'ولی جدید',phone:'09123456789',role:'parent',schoolId:school,studentId:student.id});users.push(account.id);
    const publicPost=async(path:string,body:object,expected=200)=>{const response=await app.inject({url:`/api/v1/auth/${path}`,method:'POST',payload:body});assert.equal(response.statusCode,expected,response.body);return response;};
    await publicPost('login',{username,password:'initial-password-123'},401);
    let challenge=(await publicPost('challenge',{username,purpose:'activate'})).json();let code=JSON.parse(await readFile(`.local/otp/${challenge.challengeId}.json`,'utf8')).code;
    await publicPost('verify',{challengeId:challenge.challengeId,code:'000000',password:'initial-password-123'},401);
    await publicPost('verify',{challengeId:challenge.challengeId,code,password:'initial-password-123'});
    let login=await publicPost('login',{username,password:'initial-password-123'});
    const member=(await pool.query('SELECT id FROM memberships WHERE user_id=$1',[account.id])).rows[0].id;
    let current:Actor={id:account.id,membership:member,cookie:`school-session=${login.cookies[0].value}`,csrf:login.json().csrf,year:principal.year};
    await call(current,'/auth/me');
    await pool.query("UPDATE challenges SET created_at=now()-interval '16 minutes' WHERE user_id=$1",[account.id]);
    challenge=(await publicPost('challenge',{username,purpose:'recover'})).json();code=JSON.parse(await readFile(`.local/otp/${challenge.challengeId}.json`,'utf8')).code;
    await pool.query("UPDATE challenges SET expires_at=now()-interval '1 second' WHERE id=$1",[challenge.challengeId]);
    await publicPost('verify',{challengeId:challenge.challengeId,code,password:'recovered-password-123'},401);
    await pool.query("UPDATE challenges SET created_at=now()-interval '16 minutes' WHERE user_id=$1",[account.id]);
    challenge=(await publicPost('challenge',{username,purpose:'recover'})).json();code=JSON.parse(await readFile(`.local/otp/${challenge.challengeId}.json`,'utf8')).code;
    await publicPost('verify',{challengeId:challenge.challengeId,code,password:'recovered-password-123'});
    await call(current,'/auth/me','GET',undefined,undefined,401);
    login=await publicPost('login',{username,password:'recovered-password-123'});current={...current,cookie:`school-session=${login.cookies[0].value}`,csrf:login.json().csrf};
    await pool.query("UPDATE challenges SET created_at=now()-interval '16 minutes' WHERE user_id=$1",[account.id]);
    challenge=await call(current,'/auth/phone','POST',{currentPassword:'recovered-password-123',phone:'09123456780'});code=JSON.parse(await readFile(`.local/otp/${challenge.challengeId}.json`,'utf8')).code;
    await call(current,'/auth/verify','POST',{challengeId:challenge.challengeId,code});
    await call(current,'/auth/me','GET',undefined,undefined,401);
    assert.equal((await pool.query('SELECT phone FROM users WHERE id=$1',[account.id])).rows[0].phone,'09123456780');
    assert.equal((await call(principal,`/students/${student.id}`)).parentPhone,'09123456789');
    const absent=(await publicPost('challenge',{username:`absent-${randomUUID()}`,purpose:'recover'})).json();assert.ok(absent.challengeId);await publicPost('verify',{challengeId:absent.challengeId,code:'000000',password:'recovered-password-123'},401);
  });
  await t.test('private file links work with browser cookies and cannot be reused by another user',async()=>{
    const sharp=(await import('sharp')).default;
    const png=await sharp({create:{width:4,height:4,channels:3,background:'#008080'}}).png().toBuffer();
    const boundary=`test-${randomUUID()}`;const payload=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="poster.png"\r\nContent-Type: image/png\r\n\r\n`),png,Buffer.from(`\r\n--${boundary}--\r\n`)]);
    const upload=await app.inject({url:'/api/v1/files?purpose=post',method:'POST',headers:{cookie:principal.cookie,'x-csrf-token':principal.csrf,'x-membership-id':principal.membership,'x-academic-year-id':principal.year!,'content-type':`multipart/form-data; boundary=${boundary}`},payload});assert.equal(upload.statusCode,200,upload.body);const file=upload.json();
    await call(principal,'/resources/announcements','POST',{title:'خبر پیوست',content:'آزمون پیوست خصوصی',senderName:'مدیر',senderRole:'principal',target:'all',priority:'normal',coverImage:file.url,attachments:[{name:'poster.png',type:'image',url:file.url}]});
    const list=await call(parent,'/resources/announcements');const post=list.items.find((p:{title:string})=>p.title==='خبر پیوست');assert.match(post.coverImage,/asset=/);
    const allowed=await app.inject({url:post.coverImage,headers:{cookie:parent.cookie}});assert.equal(allowed.statusCode,200,allowed.body);assert.equal(allowed.headers['content-type'],'image/webp');
    const blocked=await app.inject({url:post.coverImage,headers:{cookie:foreign.cookie}});assert.equal(blocked.statusCode,403);
    const anon=await app.inject({url:post.coverImage});assert.equal(anon.statusCode,401);
    const bad=await app.inject({url:post.coverImage.replace('signature=','signature=0'),headers:{cookie:parent.cookie}});assert.equal(bad.statusCode,422);
  });
  await t.test('official card publication is independent of gradebook and respects visibility',async()=>{
    const card={term:'term2',termTitle:'نوبت دوم',year:'1405-1406',gpa:18,rankInClass:1,disciplineScore:20,subjects:[{name:'ریاضی',unit:2,continuousScore:18,finalScore:18,totalScore:18,status:'قبول',teacherName:'دبیر'}],isPublished:false};
    await call(principal,'/commands/report-card','POST',{studentId:student.id,version:(await call(principal,`/students/${student.id}`)).version,card});assert.equal((await call(parent,`/students/${student.id}`)).reportCards.length,0);
    await call(principal,'/commands/report-card','POST',{studentId:student.id,version:(await call(principal,`/students/${student.id}`)).version,card:{...card,isPublished:true}});assert.equal((await call(parent,`/students/${student.id}`)).reportCards[0].gpa,18);
  });
  await t.test('independent password and SMS login, single-use codes and revocation',async()=>{
    const login=await app.inject({url:'/api/v1/auth/login',method:'POST',payload:{username:principal.username,password:'test-password-1234'}});assert.equal(login.statusCode,200,login.body);
    assert.equal(login.json().authenticated,true);assert.equal(login.json().challengeId,undefined);assert.equal(login.cookies.length,1);
    const sent=await app.inject({url:'/api/v1/auth/challenge',method:'POST',payload:{username:principal.username,purpose:'login'}});assert.equal(sent.statusCode,200,sent.body);
    const challengeId=sent.json().challengeId;assert.ok(challengeId);assert.equal(sent.cookies.length,0);
    const {code}=JSON.parse(await readFile(`.local/otp/${challengeId}.json`,'utf8'));
    const verify=await app.inject({url:'/api/v1/auth/verify',method:'POST',payload:{challengeId,code}});assert.equal(verify.statusCode,200,verify.body);
    const repeated=await app.inject({url:'/api/v1/auth/verify',method:'POST',payload:{challengeId,code}});assert.equal(repeated.statusCode,401);
    const expired=await app.inject({url:'/api/v1/auth/login',method:'POST',payload:{username:principal.username,password:'wrong'}});assert.equal(expired.statusCode,401);
    const recovered=await call(learner,'/auth/password','POST',{currentPassword:'test-password-1234',password:'new-test-password-1234'});assert.equal(recovered.ok,true);
    await call(learner,'/auth/me','GET',undefined,undefined,401);
  });
  await t.test('year rollover preserves old finance and separates new year',async()=>{
    const next=await call(principal,'/commands/rollover','POST',{newYearTitle:'1406-1407',promoteStudents:true,graduateTwelfthGraders:true,archiveCurrentGrades:true,resetAttendanceLogs:true});
    const old=await call(parent,`/students/${student.id}`);assert.equal(old.financialSummary.remainingDebt,200);
    const nextParent={...parent,year:next.newYearId};const metadata=await call(nextParent,'/workspace');assert.ok(metadata.currentStudentId);assert.notEqual(metadata.currentStudentId,student.id);
    const current=await call(nextParent,`/students/${metadata.currentStudentId}`);assert.equal(current.financialSummary.remainingDebt,0);
    await call(principal,'/resources/classes','POST',{name:'قدیمی',grade:'دهم',room:''},undefined,422);
  });
});
