import {z} from 'zod';
import type {FastifyInstance} from 'fastify';
import {membership,requireAuth,type Membership} from './auth';
import {transaction,type Tx} from './db';
import {requireValue} from './errors';
import {safeExternalUrl} from '../src/utils/externalLinks';
import type {AnalyticsEvent} from '../shared/analytics';

const event=z.object({id:z.uuid(),kind:z.enum(['activity','banner_impression','banner_click','dana_plus_open']),bannerId:z.uuid().optional()}).strict().refine(row=>row.kind.startsWith('banner_')===!!row.bannerId);
export async function recordAnalytics(tx:Tx,member:Membership,userId:string,events:AnalyticsEvent[]){
 if(member.role==='platform_admin')return {accepted:0,ignored:events.length};
 await tx.query("SELECT set_config('app.user_id',$1,true),set_config('app.membership_id',$2,true)",[userId,member.id]);
 const clock=(await tx.query("SELECT to_char((now() AT TIME ZONE 'Asia/Tehran')::date,'YYYY-MM-DD') AS day,floor(extract(epoch FROM now()))::bigint AS epoch")).rows[0];let accepted=0;
 for(const item of [...events].sort((a,b)=>(a.bannerId||'').localeCompare(b.bannerId||''))){
  if(item.kind==='dana_plus_open'&&member.role!=='student')continue;
  let title:string|null=null;
  if(item.bannerId){const banner=(await tx.query("SELECT data FROM regional_content WHERE id=$1 AND kind='banners'",[item.bannerId])).rows[0]?.data;
   const audience=member.role==='student'?'students':member.role==='parent'?'parents':member.role==='teacher'?'teachers':'';
   if(!banner?.isActive||!Array.isArray(banner.targetAudience)||!banner.targetAudience.includes('all')&&!banner.targetAudience.includes(audience))continue;
   if(item.kind==='banner_click'&&!safeExternalUrl(banner.linkUrl))continue;title=banner.title;
  }
  const bucket=item.kind==='activity'?clock.day:Math.floor(Number(clock.epoch)/(item.kind==='banner_click'?2:1800));
  const key=`${member.id}:${item.kind}:${item.bannerId||''}:${bucket}`;
  // ON CONFLICT does not expose a conflicting event or require SELECT privileges on private events.
  const result=await tx.query('INSERT INTO analytics_events(user_id,event_id,membership_id,school_id,role,kind,banner_id,banner_title,dedup_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING',[userId,item.id,member.id,member.school_id,member.role,item.kind,item.bannerId||null,title,key]);
  if(!result.rowCount)continue;accepted++;
  if(item.kind==='banner_click')await tx.query("UPDATE regional_content SET data=jsonb_set(data,'{clicksCount}',to_jsonb(COALESCE((data->>'clicksCount')::bigint,0)+1)) WHERE id=$1",[item.bannerId]);
 }
 return {accepted,ignored:events.length-accepted};
}
const counts=`count(DISTINCT user_id)::int AS users,count(DISTINCT school_id)::int AS schools,count(*) FILTER(WHERE kind='banner_impression')::int AS impressions,count(DISTINCT user_id) FILTER(WHERE kind='banner_impression')::int AS viewers,count(*) FILTER(WHERE kind='banner_click')::int AS clicks,count(DISTINCT user_id) FILTER(WHERE kind='banner_click')::int AS clickers,count(*) FILTER(WHERE kind='dana_plus_open')::int AS "danaOpens",count(DISTINCT user_id) FILTER(WHERE kind='dana_plus_open')::int AS "danaUsers"`;
export async function analyticsRoutes(app:FastifyInstance){
 app.get('/api/v1/platform/analytics/retention',async request=>{const m=await membership(request);requireValue(m.role==='platform_admin','دسترسی مجاز نیست.',403);return transaction(async tx=>(await tx.query('SELECT days,enabled,version,last_run AS "lastRun",deleted::text AS deleted FROM analytics_retention WHERE id=true')).rows[0],'',true);});
 app.patch('/api/v1/platform/analytics/retention',async request=>{const m=await membership(request),user=requireAuth(request);requireValue(m.role==='platform_admin','دسترسی مجاز نیست.',403);const input=z.object({days:z.number().int().min(90).max(730),enabled:z.boolean(),version:z.number().int().positive()}).strict().parse(request.body);return transaction(async tx=>{const row=await tx.query('UPDATE analytics_retention SET days=$1,enabled=$2,version=version+1,updated_by=$3,next_run=now() WHERE id=true AND version=$4 RETURNING version',[input.days,input.enabled,user.id,input.version]);requireValue(row.rowCount,'سیاست هم‌زمان تغییر کرده است؛ دوباره دریافت کنید.',409);await tx.query("INSERT INTO audit_log(user_id,action,details) VALUES($1,'analytics-retention-updated',$2)",[user.id,{days:input.days,enabled:input.enabled}]);return {ok:true};},'',true);});
 app.post('/api/v1/analytics/events',{config:{rateLimit:{max:60,timeWindow:'1 minute'}}},async request=>{
  const member=await membership(request),user=requireAuth(request),input=z.object({events:z.array(event).min(1).max(20)}).strict().parse(request.body);
  return transaction(tx=>recordAnalytics(tx,member,user.id,input.events),member.school_id||'');
 });
 app.get('/api/v1/platform/analytics',async request=>{
  const member=await membership(request);requireValue(member.role==='platform_admin','دسترسی آمار فقط برای مدیر پلتفرم مجاز است.',403);
  const page=z.object({days:z.coerce.number().int().min(1).max(90).default(7),schoolId:z.uuid().optional(),bannerOffset:z.coerce.number().int().min(0).max(1000000).default(0),schoolOffset:z.coerce.number().int().min(0).max(1000000).default(0)}).parse(request.query);
  return transaction(async tx=>{
   if(page.schoolId)requireValue((await tx.query('SELECT 1 FROM schools WHERE id=$1',[page.schoolId])).rowCount,'مدرسه پیدا نشد.',404);
   const dates=(await tx.query("SELECT to_char((now() AT TIME ZONE 'Asia/Tehran')::date-($1::int-1),'YYYY-MM-DD') AS first,to_char((now() AT TIME ZONE 'Asia/Tehran')::date,'YYYY-MM-DD') AS last",[page.days])).rows[0];
   const values=[dates.first,dates.last,page.schoolId||null],filter='day BETWEEN $1::date AND $2::date AND ($3::uuid IS NULL OR school_id=$3)';
   const totals=(await tx.query(`SELECT ${counts} FROM analytics_events WHERE ${filter}`,values)).rows[0];
   const daily=(await tx.query(`SELECT to_char(day,'YYYY-MM-DD') AS day,${counts} FROM analytics_events WHERE ${filter} GROUP BY day ORDER BY day`,values)).rows;
   const roles=(await tx.query(`SELECT role,count(DISTINCT user_id)::int AS users FROM analytics_events WHERE ${filter} GROUP BY role ORDER BY users DESC,role`,values)).rows;
   const banners=(await tx.query(`WITH stats AS (SELECT banner_id,count(*) FILTER(WHERE kind='banner_impression')::int AS impressions,count(DISTINCT user_id) FILTER(WHERE kind='banner_impression')::int AS viewers,count(*) FILTER(WHERE kind='banner_click')::int AS clicks,count(DISTINCT user_id) FILTER(WHERE kind='banner_click')::int AS clickers FROM analytics_events WHERE ${filter} AND banner_id IS NOT NULL GROUP BY banner_id) SELECT b.id,b.data->>'title' AS title,COALESCE(s.impressions,0) AS impressions,COALESCE(s.viewers,0) AS viewers,COALESCE(s.clicks,0) AS clicks,COALESCE(s.clickers,0) AS clickers,COALESCE((b.data->>'clicksCount')::bigint,0)::text AS "legacyClicks" FROM regional_content b LEFT JOIN stats s ON s.banner_id=b.id WHERE b.kind='banners' ORDER BY COALESCE(s.impressions,0) DESC,b.id LIMIT 25 OFFSET $4`,[...values,page.bannerOffset])).rows;
   const bannerTotal=(await tx.query("SELECT count(*)::int AS n FROM regional_content WHERE kind='banners'")).rows[0].n;
   const schools=(await tx.query(`SELECT e.school_id AS id,s.data->>'name' AS name,count(DISTINCT e.user_id)::int AS users,count(DISTINCT e.user_id) FILTER(WHERE e.kind='dana_plus_open')::int AS "danaUsers" FROM analytics_events e JOIN schools s ON s.id=e.school_id WHERE ${filter} GROUP BY e.school_id,s.data ORDER BY users DESC,e.school_id LIMIT 25 OFFSET $4`,[...values,page.schoolOffset])).rows;
   const schoolTotal=(await tx.query(`SELECT count(DISTINCT school_id)::int AS n FROM analytics_events WHERE ${filter}`,values)).rows[0].n;
   const startedAt=(await tx.query('SELECT started_at FROM analytics_collection WHERE id=true')).rows[0].started_at;
   return {startedAt,from:dates.first,to:dates.last,totals,daily,roles,banners:banners.map(row=>({...row,legacyClicks:Number(row.legacyClicks)})),bannerTotal,schools,schoolTotal};
  },'',true);
 });
}
