import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';

process.env.NODE_ENV='test';
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';
process.env.REDIS_URL=process.env.TEST_REDIS_URL||'redis://127.0.0.1:56379';
process.env.SMS_WEBHOOK_URL='';process.env.BALE_BOT_TOKEN='';
const {createApp}=await import('../app');
const {pool,transaction}=await import('../db');
const {hashPassword}=await import('../auth');
const app=await createApp();
const users:string[]=[],banners:string[]=[],challenges:string[]=[];
let school:string|undefined;
after(async()=>{
  await pool.query('DELETE FROM audit_log WHERE user_id=ANY($1::uuid[])',[users]);
  await pool.query('DELETE FROM idempotency WHERE user_id=ANY($1::uuid[])',[users]);
  await pool.query('DELETE FROM regional_content WHERE id=ANY($1::uuid[])',[banners]);
  await pool.query('DELETE FROM sessions WHERE user_id=ANY($1::uuid[])',[users]);
  await pool.query('DELETE FROM challenges WHERE user_id=ANY($1::uuid[]) OR id=ANY($2::uuid[])',[users,challenges]);
  await pool.query('DELETE FROM memberships WHERE user_id=ANY($1::uuid[])',[users]);
  await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users]);
  if(school)await transaction(async tx=>{await tx.query('DELETE FROM schools WHERE id=$1',[school]);},school);
  for(const challenge of challenges)await rm(`.local/otp/${challenge}.json`,{force:true});
  await app.close();await pool.end();
});

test('login choices and banner destinations',async t=>{
  school=(await pool.query('INSERT INTO schools(data) VALUES($1) RETURNING id',[{name:'Access checks '+randomUUID()}])).rows[0].id;
  const password='test-only-password-1234',hash=await hashPassword(password);
  const actors:Record<string,{id:string;username:string;membership:string;cookie:string;csrf:string}>={};
  for(const role of ['platform_admin','principal','student']){
    const username=`access-${role}-${randomUUID().slice(0,8)}`;
    const user=(await pool.query('INSERT INTO users(username,name,phone,password_hash,phone_verified) VALUES($1,$1,$2,$3,true) RETURNING id',[username,'09123456789',hash])).rows[0];users.push(user.id);
    const membership=(await pool.query('INSERT INTO memberships(user_id,school_id,role) VALUES($1,$2,$3) RETURNING id',[user.id,role==='platform_admin'?null:school,role])).rows[0];
    actors[role]={id:user.id,username,membership:membership.id,cookie:'',csrf:''};
  }
  const authPost=(path:string,body:object)=>app.inject({url:`/api/v1/auth/${path}`,method:'POST',payload:body});
  const request=(role:string,path:string,method:'POST'|'PATCH'='POST',body:object={})=>app.inject({url:`/api/v1${path}`,method,headers:{cookie:actors[role].cookie,'x-csrf-token':actors[role].csrf,'x-membership-id':actors[role].membership,'idempotency-key':randomUUID()},payload:body});

  await t.test('all roles including managers use password without a second code',async()=>{
    for(const [role,actor]of Object.entries(actors)){
      const login=await authPost('login',{username:actor.username,password});assert.equal(login.statusCode,200,login.body);assert.equal(login.json().authenticated,true);assert.equal(login.json().challengeId,undefined);
      actor.cookie=`school-session=${login.cookies[0].value}`;actor.csrf=login.json().csrf;
      const me=await app.inject({url:'/api/v1/auth/me',headers:{cookie:actor.cookie}});assert.equal(me.statusCode,200,me.body);assert.equal(me.json().user.authMethod,'password');assert.equal(me.json().user.privileged,role!=='student');
    }
  });
  await t.test('SMS signs in without a password, codes are single-use and sessions expire by role',async()=>{
    for(const role of ['student','platform_admin']){
      const actor=actors[role];const sent=await authPost('challenge',{username:actor.username,purpose:'login'});assert.equal(sent.statusCode,200,sent.body);
      const id=sent.json().challengeId;challenges.push(id);const {code}=JSON.parse(await readFile(`.local/otp/${id}.json`,'utf8'));
      const login=await authPost('verify',{challengeId:id,code});assert.equal(login.statusCode,200,login.body);assert.equal(login.json().authenticated,true);
      const cookie=`school-session=${login.cookies[0].value}`;
      const me=await app.inject({url:'/api/v1/auth/me',headers:{cookie}});assert.equal(me.json().user.authMethod,'sms');
      assert.equal((await authPost('verify',{challengeId:id,code})).statusCode,401);
      const row=(await pool.query('SELECT privileged,extract(epoch FROM (expires_at-created_at))/3600 AS hours FROM sessions WHERE user_id=$1 AND auth_method=$2',[actor.id,'sms'])).rows[0];
      assert.equal(row.privileged,role==='platform_admin');assert.ok(Math.abs(Number(row.hours)-(role==='platform_admin'?12:168))<0.01);
    }
  });
  await t.test('expired SMS, unknown accounts and inactive accounts do not authenticate',async()=>{
    const unknown=await authPost('challenge',{username:`missing-${randomUUID()}`,purpose:'login'});assert.equal(unknown.statusCode,200);challenges.push(unknown.json().challengeId);
    assert.equal((await authPost('verify',{challengeId:unknown.json().challengeId,code:'000000'})).statusCode,401);
    await pool.query("UPDATE challenges SET created_at=now()-interval '16 minutes' WHERE user_id=$1",[actors.student.id]);
    const sent=await authPost('challenge',{username:actors.student.username,purpose:'login'});const id=sent.json().challengeId;challenges.push(id);const {code}=JSON.parse(await readFile(`.local/otp/${id}.json`,'utf8'));
    await pool.query("UPDATE challenges SET expires_at=now()-interval '1 second' WHERE id=$1",[id]);assert.equal((await authPost('verify',{challengeId:id,code})).statusCode,401);
    await pool.query('UPDATE users SET active=false WHERE id=$1',[actors.student.id]);
    assert.equal((await authPost('login',{username:actors.student.username,password})).statusCode,401);
    await pool.query('UPDATE users SET active=true WHERE id=$1',[actors.student.id]);
  });
  let banner:{id:string;version:number};
  const content={title:'بنر بررسی',description:'لینک مقصد',sponsorName:'حامی بررسی',targetAudience:['all'],linkText:'اطلاعات بیشتر',linkUrl:'https://example.com/school',category:'آموزشی',badge:'آموزشی',isActive:true};
  await t.test('only platform administrators can create and edit a banner destination',async()=>{
    const create=await request('platform_admin','/resources/banners','POST',content);assert.equal(create.statusCode,200,create.body);banner=create.json();banners.push(banner.id);
    assert.equal((await request('student','/resources/banners','POST',content)).statusCode,403);
    assert.equal((await request('student',`/resources/banners/${banner.id}`,'PATCH',{version:banner.version,changes:{linkUrl:'https://example.com/other'}})).statusCode,403);
    const edited=await request('platform_admin',`/resources/banners/${banner.id}`,'PATCH',{version:banner.version,changes:{linkUrl:'https://example.com/updated'}});assert.equal(edited.statusCode,200,edited.body);assert.equal(edited.json().linkUrl,'https://example.com/updated');
    assert.equal((await request('platform_admin',`/resources/banners/${banner.id}`,'PATCH',{version:banner.version,changes:{title:'تعارض'}})).statusCode,409);banner=edited.json();
  });
  await t.test('active and executable URLs are rejected and click counts are independent',async()=>{
    for(const linkUrl of ['javascript:alert(1)','data:text/html,test','https://user:password@example.com']){
      assert.equal((await request('platform_admin','/resources/banners','POST',{...content,linkUrl})).statusCode,422);
      assert.equal((await request('platform_admin',`/resources/banners/${banner.id}`,'PATCH',{version:banner.version,changes:{linkUrl}})).statusCode,422);
    }
    const click=await request('student','/commands/banner-click','POST',{id:banner.id});assert.equal(click.statusCode,200,click.body);
    const row=(await pool.query('SELECT data FROM regional_content WHERE id=$1',[banner.id])).rows[0];assert.equal(row.data.clicksCount,1);assert.equal(row.data.linkUrl,'https://example.com/updated');
    const logout=await request('student','/auth/logout');assert.equal(logout.statusCode,200,logout.body);
    assert.equal((await app.inject({url:'/api/v1/auth/me',headers:{cookie:actors.student.cookie}})).statusCode,401);
  });
});
