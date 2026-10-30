import {randomUUID} from 'node:crypto';
import {transaction,type Tx} from './db';
import {inboxContext} from './inbox';
import {requireValue} from './errors';
import {readSchoolAccess} from './school-access';
export async function enqueueAnnouncement(tx:Tx,input:{userId:string;membershipId:string;schoolId:string|null;yearId:string|null;announcementId:string;target:string;title:string;body:string}){
 await inboxContext(tx,input.userId,input.membershipId);const id=randomUUID();
 await tx.query("INSERT INTO inbox_messages(id,sender_id,sender_membership_id,school_id,title,body,kind,reference_id) VALUES($1,$2,$3,$4,$5,$6,'announcement',$7)",[id,input.userId,input.membershipId,input.schoolId,input.title,input.body,input.announcementId]);
 await tx.query('INSERT INTO announcement_jobs(message_id,announcement_id,school_id,year_id,author_id,membership_id,audience) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,input.announcementId,input.schoolId,input.yearId,input.userId,input.membershipId,input.target]);
}
export async function deliverAnnouncementBatch(){
 return transaction(async tx=>{
  const job=(await tx.query("SELECT * FROM announcement_jobs WHERE status='pending' AND available_at<=now() ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED")).rows[0];if(!job)return 0;
  await inboxContext(tx,job.author_id,job.membership_id);
  const author=(await tx.query('SELECT m.*,u.active AS user_active FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.id=$1 AND m.user_id=$2',[job.membership_id,job.author_id])).rows[0];
  const permitted=author?.active&&author.user_active&&(author.role==='platform_admin'||author.school_id===job.school_id&&(author.role==='principal'||author.role==='vice_principal'&&author.permissions.canManageAnnouncements===true));
  let valid=!!permitted;if(!valid){await tx.query("UPDATE announcement_jobs SET status='cancelled' WHERE id=$1",[job.id]);return 0;}
  if(job.school_id){await tx.query('SELECT pg_advisory_xact_lock_shared(hashtextextended($1,0))',[`school-access:${job.school_id}`]);await tx.query("SELECT set_config('app.school_id',$1,true)",[job.school_id]);if((await readSchoolAccess(job.school_id)).mode!=='active'){await tx.query("UPDATE announcement_jobs SET available_at=now()+interval '5 minutes' WHERE id=$1",[job.id]);return 0;}
   const post=(await tx.query("SELECT 1 FROM records r JOIN academic_years y ON y.id=r.year_id AND y.school_id=r.school_id WHERE r.id=$1 AND r.school_id=$2 AND r.year_id=$3 AND r.kind='announcements' AND r.data->>'target'=$4 AND COALESCE(r.data->>'isArchived','false')<>'true' AND y.data->>'isCurrent'='true' AND y.data->>'status'='active'",[job.announcement_id,job.school_id,job.year_id,job.audience])).rowCount;valid&&=!!post;
  }else valid&&=!!(await tx.query("SELECT 1 FROM regional_content WHERE id=$1 AND kind='announcements' AND data->>'target'=$2 AND COALESCE(data->>'isArchived','false')<>'true'",[job.announcement_id,job.audience])).rowCount;
  if(!valid){await tx.query("UPDATE announcement_jobs SET status='cancelled' WHERE id=$1",[job.id]);return 0;}
  const targets=(await tx.query("SELECT m.id,m.user_id,m.school_id FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.active AND u.active AND m.role<>'platform_admin' AND m.created_at<=$1 AND ($2::uuid IS NULL OR m.role NOT IN ('parent','student') OR EXISTS(SELECT 1 FROM records s JOIN academic_years y ON y.id=s.year_id AND y.school_id=s.school_id WHERE s.school_id=m.school_id AND s.kind='students' AND (s.id=m.student_id OR s.identity_id=m.student_id OR s.data->>'identityId'=m.student_id::text) AND COALESCE(s.data->>'status','active')='active' AND y.data->>'isCurrent'='true')) AND ($2::uuid IS NULL OR m.school_id=$2) AND ($3='all' OR m.role=CASE $3 WHEN 'teachers' THEN 'teacher' WHEN 'parents' THEN 'parent' WHEN 'students' THEN 'student' END) AND ($4::uuid IS NULL OR m.id>$4) ORDER BY m.id LIMIT 200",[job.created_at,job.school_id,job.audience,job.cursor])).rows;
  if(targets.length)await tx.query('INSERT INTO inbox_recipients(message_id,membership_id,user_id,school_id) SELECT $1,t.id,t.user_id,t.school_id FROM jsonb_to_recordset($2::jsonb) AS t(id uuid,user_id uuid,school_id uuid) ON CONFLICT DO NOTHING',[job.message_id,JSON.stringify(targets)]);
  await tx.query('UPDATE announcement_jobs SET cursor=$2,status=$3,delivered=delivered+$4 WHERE id=$1',[job.id,targets.at(-1)?.id||job.cursor,targets.length<200?'completed':'pending',targets.length]);return targets.length;
 },'',true);
}
export async function purgeAnalyticsBatch(){
 return transaction(async tx=>{const policy=(await tx.query('SELECT * FROM analytics_retention WHERE id=true AND enabled AND next_run<=now() FOR UPDATE SKIP LOCKED')).rows[0];if(!policy)return 0;
  requireValue(policy.days>=90,'سیاست نگهداری نامعتبر است.');
  const removed=await tx.query("DELETE FROM analytics_events WHERE (user_id,event_id) IN (SELECT user_id,event_id FROM analytics_events WHERE day<(now() AT TIME ZONE 'Asia/Tehran')::date-$1::int ORDER BY day,user_id,event_id LIMIT 1000)",[policy.days]);const count=removed.rowCount||0;
  await tx.query("UPDATE analytics_retention SET last_run=now(),deleted=deleted+$1,next_run=now()+CASE WHEN $1=1000 THEN interval '5 seconds' ELSE interval '1 day' END WHERE id=true",[count]);return count;
 },'',true);
}
