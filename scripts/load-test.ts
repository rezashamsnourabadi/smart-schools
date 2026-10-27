import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {cpus,totalmem,platform} from 'node:os';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import pg from 'pg';

if(process.env.LOAD_TEST!=='1')throw new Error('Set LOAD_TEST=1. This creates an isolated, temporary benchmark fixture.');
process.env.NODE_ENV='test';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';process.env.REDIS_URL=process.env.TEST_REDIS_URL||'redis://127.0.0.1:56379';
const {pool,transaction}=await import('../server/db');const {digest}=await import('../server/auth');const {createApp}=await import('../server/app');
const duration=Number(process.env.LOAD_SECONDS||1800),active=Number(process.env.LOAD_USERS||1000),accounts=50000;
if(!Number.isInteger(duration)||duration<5||active<5||active>1000)throw new Error('Invalid benchmark dimensions.');
const identityIds:string[]=[];const codeBase=8_000_000_000+Math.floor(Math.random()*100_000_000);
const run=randomUUID();const prefix=`load-${run}-`;const schoolIds:string[]=[],userIds:string[]=[];
const source=createHash('sha256');for(const name of (await readdir('server')).filter(name=>name.endsWith('.ts')).sort()){source.update(name);source.update(await readFile(`server/${name}`));}source.update(await readFile('package-lock.json'));const serverSourceHash=source.digest('hex');
interface Actor {user:string;membership:string;school:string;year:string;student:string;cookie:string;csrf:string}
const actors:Actor[]=[];const app=await createApp();const diagnostics:unknown[]=[];const errors:{name:string;code?:string;message:string}[]=[];app.addHook('onError',async(_request,_reply,error)=>{if(errors.length<10)errors.push({name:error.name,code:(error as {code?:string}).code,message:error.message.slice(0,250)});});
const samples:{read:number[];write:number[]}={read:[],write:[]};let failures=0,requests=0,completed=0;const statuses:Record<string,number>={};let inFlight=0,maxFlight=0;
const started=new Date();
try {
  console.log('Preparing 50,000 accounts, 25,000 annual student records and 1,000 revocable sessions in isolated benchmark schools.');
  await transaction(async tx=>{
    await tx.query(`INSERT INTO users(username,name,phone,phone_verified) SELECT $1||g::text,'Benchmark','09123456789',true FROM generate_series(1,$2) g`,[prefix,accounts]);
  });
  const all=(await pool.query('SELECT id,username FROM users WHERE username LIKE $1 ORDER BY username',[prefix+'%'])).rows;userIds.push(...all.map(r=>r.id));
  for(let schoolIndex=0;schoolIndex<100;schoolIndex++){
    const school=randomUUID(),year=randomUUID(),cls=randomUUID();schoolIds.push(school);
    await transaction(async tx=>{
      await tx.query('INSERT INTO schools(id,data) VALUES($1,$2)',[school,{name:`Benchmark ${run} ${schoolIndex}`,code:String(schoolIndex),studentCount:250,teacherCount:0,classesCount:2}]);
      await tx.query('INSERT INTO academic_years(id,school_id,data) VALUES($1,$2,$3)',[year,school,{title:'1405-1406',isCurrent:true,status:'active',terms:[],currentTermId:'term1'}]);
      // Two class groups keep each roster below the enforced 200-person ceiling.
      const secondClass=randomUUID();
      await tx.query("INSERT INTO records(id,school_id,year_id,kind,data) VALUES($1,$2,$3,'classes',$4),($5,$2,$3,'classes',$6)",[cls,school,year,{name:'Load A',grade:'پایه دهم',studentCount:125},secondClass,{name:'Load B',grade:'پایه دهم',studentCount:125}]);
      const identities=(await tx.query("INSERT INTO enrollment_identities(national_code) SELECT lpad(($1::bigint+g)::text,10,'0') FROM generate_series(1,250) g RETURNING id,national_code",[codeBase+schoolIndex*250])).rows;identityIds.push(...identities.map(row=>row.id));
      const students=(await tx.query(`INSERT INTO records(school_id,year_id,kind,class_id,identity_id,data) SELECT $1,$2,'students',CASE WHEN g<=125 THEN $3::uuid ELSE $4::uuid END,identity,jsonb_build_object('identityId',identity,'name','Benchmark student '||g,'nationalCode',code,'parentName','Guardian','parentPhone','09123456789','parentBaleAccount','','status','active','classGroupId',CASE WHEN g<=125 THEN $3::text ELSE $4::text END,'attendanceStats',jsonb_build_object('totalDays',0,'presentDays',0,'absentDays',0,'lateDays',0,'excusedDays',0),'reportCards','[]'::jsonb,'disciplinaryRecords','[]'::jsonb,'pastYearHistory','[]'::jsonb) FROM unnest($5::uuid[],$6::text[]) WITH ORDINALITY AS source(identity,code,g) RETURNING id,data`,[school,year,cls,secondClass,identities.map(row=>row.id),identities.map(row=>row.national_code)])).rows;
      const batch=all.slice(schoolIndex*500,schoolIndex*500+500);
      const memberships=(await tx.query("INSERT INTO memberships(user_id,school_id,role,student_id) SELECT u,$2,'parent',s FROM unnest($1::uuid[],$3::uuid[]) AS links(u,s) RETURNING id,user_id",[batch.map(row=>row.id),school,batch.map((_,index)=>students[index%250].data.identityId)])).rows;
      for(let index=0;index<10&&actors.length<active;index++){
        const user=batch[index].id,student=students[index%250];const membership=memberships.find(row=>row.user_id===user)!.id;
        const secret=randomBytes(32).toString('base64url'),csrf=randomUUID();await tx.query("INSERT INTO sessions(id,user_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '2 hours')",[digest(secret),user,csrf]);actors.push({user,membership,school,year,student:student.id,cookie:`school-session=${secret}`,csrf});
      }
    },school);
  }
  const address=process.env.LOAD_ORIGIN||await app.listen({host:'127.0.0.1',port:0});
  console.log(`Starting ${active} active users, one request per five seconds, ${duration} seconds. Workload: authenticated parent views and contact updates (80/20).`);
  const start=performance.now(),end=start+duration*1000;
  const probe=setTimeout(async()=>{const observer=new pg.Client({connectionString:process.env.TEST_DIAGNOSTIC_DATABASE_URL||'postgres://school_owner:local-owner-password@127.0.0.1:55432/schools'});try{await observer.connect();diagnostics.push({pool:{total:pool.totalCount,idle:pool.idleCount,waiting:pool.waitingCount},connections:(await observer.query("SELECT state,wait_event_type,wait_event,left(query,180) AS query,count(*)::int AS count FROM pg_stat_activity WHERE datname='schools' AND pid<>pg_backend_pid() GROUP BY state,wait_event_type,wait_event,left(query,180) ORDER BY count(*) DESC LIMIT 12")).rows});}finally{await observer.end();}},7000);
  await Promise.all(actors.map(async(actor,index)=>{
    await delay(index*5000/active);
    let sequence=0;
    while(performance.now()<end){
      const scheduled=start+index*5000/active+sequence*5000;
      if(performance.now()<scheduled)await delay(scheduled-performance.now());
      if(performance.now()>=end)break;
      const write=index%5===0;const paths=['/workspace','/dashboard',`/students/${actor.student}`,'/resources/homework?limit=25'];
      const path=write?'/commands/contact':paths[sequence%paths.length];const before=performance.now();inFlight++;maxFlight=Math.max(maxFlight,inFlight);requests++;
      try{const response=await fetch(`${address}/api/v1${path}`,{method:write?'POST':'GET',headers:{cookie:actor.cookie,'x-csrf-token':actor.csrf,'x-membership-id':actor.membership,'x-academic-year-id':actor.year,...write?{'Content-Type':'application/json','Idempotency-Key':randomUUID()}:{}},body:write?JSON.stringify({studentId:actor.student,changes:{address:`load-${sequence}`}}):undefined,signal:AbortSignal.timeout(10000)});await response.arrayBuffer();statuses[response.status]=(statuses[response.status]||0)+1;if(!response.ok)failures++;}catch{failures++;statuses.network=(statuses.network||0)+1;}finally{inFlight--;completed++;samples[write?'write':'read'].push(performance.now()-before);}
      sequence++;
    }
  }));
  const percentile=(values:number[],p:number)=>{values.sort((a,b)=>a-b);return Math.round(values[Math.min(values.length-1,Math.floor(values.length*p))]||0);};
  clearTimeout(probe);
  const result={run,serverSourceHash,serverRuntime:process.env.LOAD_SERVER_RUNTIME||'embedded-windows-process',apiBundleHash:process.env.LOAD_API_BUNDLE_HASH||null,startedAt:started.toISOString(),loadStartedAt:new Date(Date.now()-(performance.now()-start)).toISOString(),finishedAt:new Date().toISOString(),accounts,annualStudents:25000,schools:100,activeUsers:active,durationSeconds:duration,requests,completed,failures,errorRate:failures/Math.max(1,requests),rps:requests/duration,readP95Ms:percentile(samples.read,.95),writeP95Ms:percentile(samples.write,.95),maxInFlight:maxFlight,statuses,errors,diagnostics,loadGeneratorHardware:{platform:platform(),cpus:cpus().length,cpu:cpus()[0]?.model,memoryGiB:Math.round(totalmem()/1024**3)},limitations:'Authenticated parent views/contact updates (80/20), empty academic history and no attachments in fixture. Does not measure SMS, bank, login burst, uploads, internet latency, worst-case teacher/finance workloads or production availability.'};
  await mkdir('.local/benchmarks',{recursive:true});await writeFile(`.local/benchmarks/${run}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  if(result.errorRate>=.01||result.readP95Ms>=500||result.writeP95Ms>=800||result.rps<195)process.exitCode=1;
}finally{
  await app.close();
  if(process.env.LOAD_ORIGIN&&failures){console.log(`Cleanup deferred: stop the isolated API and run cleanup-load.ts ${run} with LOAD_SERVER_STOPPED=1.`);await pool.end();}
  else {
  console.log('Removing only this benchmark fixture.');
  for(const school of schoolIds)await transaction(async tx=>{await tx.query('DELETE FROM audit_log WHERE school_id=$1',[school]);await tx.query('DELETE FROM records WHERE school_id=$1',[school]);await tx.query('DELETE FROM academic_years WHERE school_id=$1',[school]);await tx.query('DELETE FROM memberships WHERE school_id=$1',[school]);await tx.query('DELETE FROM schools WHERE id=$1',[school]);},school);
  if(userIds.length){await pool.query('DELETE FROM idempotency WHERE user_id=ANY($1::uuid[])',[userIds]);await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])',[userIds]);await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[userIds]);}
  if(identityIds.length)await pool.query('DELETE FROM enrollment_identities WHERE id=ANY($1::uuid[])',[identityIds]);
  await pool.end();
  }
}
