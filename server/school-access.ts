import type {FastifyInstance,FastifyRequest} from 'fastify';
import {membership} from './auth';
import {query,transaction,type Tx} from './db';
import {ApiError} from './errors';
import {assetScope} from './asset-links';
import type {SchoolAccess} from '../shared/operations';

export async function readSchoolAccess(schoolId:string):Promise<SchoolAccess>{
 const result=(await query("SELECT s.data->>'name' AS name,p.mode,p.reason,p.expires_at,p.version,p.updated_at FROM schools s LEFT JOIN school_access_policies p ON p.school_id=s.id WHERE s.id=$1",[schoolId])).rows[0];
 if(!result)throw new ApiError(404,'NOT_FOUND','مدرسه پیدا نشد.');
 const mode=result.mode||'active';
 return {schoolId,schoolName:result.name,mode:result.expires_at&&new Date(result.expires_at).getTime()<=Date.now()?'active':mode,configuredMode:mode,reason:result.reason||'',expiresAt:result.expires_at?new Date(result.expires_at).toISOString():null,version:result.version||0,updatedAt:result.updated_at?new Date(result.updated_at).toISOString():null};
}
export function schoolPolicyException(request:FastifyRequest){
 const route=request.routeOptions.url||'';
 return route==='/api/v1/analytics/events'||(route.startsWith('/api/v1/inbox')&&(['GET','HEAD'].includes(request.method)||route==='/api/v1/inbox/:id/read'))||['/api/v1/health','/api/v1/ready'].includes(route)||route.startsWith('/api/v1/auth/')||route==='/api/v1/school-access'||route.startsWith('/api/v1/support/')||route==='/api/v1/commands/banner-click';
}
export async function assertSchoolAccess(request:FastifyRequest,tx?:Tx){
 if(!request.identity||schoolPolicyException(request))return;
 const member=await membership(request);if(member.role==='platform_admin'||!member.school_id)return;
 const check=async()=>{
  if(tx)await tx.query('SELECT pg_advisory_xact_lock_shared(hashtextextended($1,0))',[`school-access:${member.school_id}`]);
  const access=await readSchoolAccess(member.school_id!);
  if(access.mode==='suspended')throw new ApiError(403,'SCHOOL_SUSPENDED','دسترسی مدرسه موقتاً تعلیق شده است؛ از بخش پشتیبانی پیگیری کنید.');
  if(access.mode==='read_only'&&!['GET','HEAD','OPTIONS'].includes(request.method))throw new ApiError(403,'SCHOOL_READ_ONLY','مدرسه در حالت فقط مشاهده است؛ ثبت و تغییر اطلاعات مجاز نیست.');
 };
 if(tx)await check();else await transaction(check,member.school_id);
}
export function installSchoolAccessGuard(app:FastifyInstance){
 app.addHook('preHandler',async request=>{
  if(!request.identity||!request.routeOptions.url?.startsWith('/api/v1/')||schoolPolicyException(request))return;
  if(request.routeOptions.url==='/api/v1/files/:id')assetScope(request,String((request.params as {id:string}).id));
  await assertSchoolAccess(request);
 });
}
