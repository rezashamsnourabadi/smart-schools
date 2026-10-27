import {timingSafeEqual} from 'node:crypto';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {z} from 'zod';
import {digest,requireAuth} from './auth';
import {requireValue} from './errors';

const reference=/^\/api\/v1\/files\/[a-f0-9-]{36}$/;
export function installAssetLinks(app:FastifyInstance){
  const normalize=(value:unknown):unknown=>{
    if(typeof value==='string'&&reference.test(value.split('?')[0]))return value.split('?')[0];
    if(Array.isArray(value))return value.map(normalize);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,normalize(child)]));
    return value;
  };
  app.addHook('preValidation',async request=>{if(request.body&&request.url!=='/api/v1/files')request.body=normalize(request.body);});
  app.addHook('preSerialization',async(request,_reply,payload)=>{
    if(request.method!=='GET'||!request.identity||!request.headers['x-membership-id']||!request.headers['x-academic-year-id'])return payload;
    const token=Buffer.from(JSON.stringify({user:request.identity.id,membership:request.headers['x-membership-id'],year:request.headers['x-academic-year-id'],expires:Date.now()+30*60*1000})).toString('base64url');
    const visit=(value:unknown):unknown=>{
      if(typeof value==='string'&&reference.test(value))return `${value}?asset=${token}&signature=${digest(`asset:${value}:${token}`)}`;
      if(Array.isArray(value))return value.map(visit);
      if(value&&typeof value==='object'&&!(value instanceof Date))return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,visit(child)]));
      return value;
    };
    return visit(payload);
  });
}
export function assetScope(request:FastifyRequest,id:string){
  const query=request.query as Record<string,unknown>;
  if(!query.asset)return;
  const token=z.string().max(1000).parse(query.asset),signature=z.string().regex(/^[a-f0-9]{64}$/).parse(query.signature);
  const expected=digest(`asset:/api/v1/files/${id}:${token}`);
  requireValue(timingSafeEqual(Buffer.from(expected),Buffer.from(signature)),'پیوند فایل معتبر نیست.',403);
  let decoded:unknown;try{decoded=JSON.parse(Buffer.from(token,'base64url').toString());}catch{requireValue(false,'پیوند فایل معتبر نیست.',403);}
  const input=z.object({user:z.uuid(),membership:z.uuid(),year:z.uuid(),expires:z.number().int()}).strict().parse(decoded);
  requireValue(input.user===requireAuth(request).id&&input.expires>Date.now(),'پیوند منقضی شده است؛ اطلاعات را دوباره بارگذاری کنید.',403);
  request.headers['x-membership-id']=input.membership;request.headers['x-academic-year-id']=input.year;
}
