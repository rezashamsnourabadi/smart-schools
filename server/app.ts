import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import compress from '@fastify/compress';
import { Redis } from 'ioredis';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { config } from './config';
import { pool, transaction } from './db';
import { authRoutes, membership, requireAuth } from './auth';
import { resourceRoutes } from './resources';
import { commandRoutes } from './commands';
import { adminRoutes } from './admin';
import { fileRoutes } from './files';
import { ApiError, requireValue } from './errors';
import { FinancialError } from '../src/utils/financialLedger';
import { AttendanceError } from '../src/utils/attendance';
import { readiness } from './repository';
import {installContracts} from './openapi';
import {installMetrics} from './metrics';
import {installAssetLinks} from './asset-links';

export async function createApp() {
  const app=Fastify({logger:config.NODE_ENV!=='test'?{redact:['req.headers.cookie','req.headers.authorization','req.headers.x-csrf-token','res.headers.set-cookie'],serializers:{req:request=>({method:request.method,url:request.url?.split('?')[0]})}}:false,bodyLimit:256*1024,requestTimeout:30000,trustProxy:config.TRUSTED_PROXY_CIDRS.split(',').map(value=>value.trim()).filter(Boolean)});
  const redis=new Redis(config.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:3000});
  redis.on('error',()=>{});
  await app.register(cookie);await app.register(helmet,{contentSecurityPolicy:{directives:{defaultSrc:["'self'"],imgSrc:["'self'",'data:','https://images.unsplash.com'],fontSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],scriptSrc:["'self'"]}}});
  installAssetLinks(app);
  await app.register(compress);
  await app.register(rateLimit,{max:600,timeWindow:'1 minute',redis,skipOnError:false,hook:'preHandler',keyGenerator:request=>request.identity?`user:${request.identity.id}`:`ip:${request.ip}`});
  installContracts(app);
  await app.register(swagger,{openapi:{info:{title:'School Management API',version:'1.0.0'},components:{securitySchemes:{session:{type:'apiKey',in:'cookie',name:config.NODE_ENV==='production'?'__Host-school-session':'school-session'}}}}});
  installMetrics(app,redis);
  app.addHook('preHandler',async request=>{
    if(!['/api/v1/auth/login','/api/v1/auth/challenge','/api/v1/auth/verify'].includes(request.routeOptions.url||''))return;
    const count=await redis.eval("local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],60) end;return n",1,`auth-ip:${request.ip}`) as number;
    requireValue(count<=300,'تعداد درخواست ورود زیاد است؛ یک دقیقه بعد تلاش کنید.',429);
  });
  app.setErrorHandler((error,request,reply)=>{
    if(error instanceof z.ZodError)return reply.status(422).send({error:{code:'VALIDATION',message:'اطلاعات ورودی معتبر نیست.',fields:error.issues.map(i=>({path:i.path.join('.'),message:i.message})),requestId:request.id}});
    let status=error instanceof ApiError?error.statusCode:((error as {statusCode?:number}).statusCode||500);
    let code=error instanceof ApiError?error.code:'INTERNAL';let message=error instanceof ApiError?error.message:'خطای داخلی سرور.';
    if((error as {validation?:unknown}).validation){status=422;code='VALIDATION';message='اطلاعات ورودی معتبر نیست.';}
    else if(status===400){code='BAD_REQUEST';message='قالب درخواست معتبر نیست.';}
    if(error instanceof FinancialError||error instanceof AttendanceError){status=422;code='VALIDATION';message=error.message;}
    const pgCode=(error as {code?:string}).code;
    if(['23505','23503','40001','40P01'].includes(pgCode||'')){status=409;code='CONFLICT';message='اطلاعات تکراری، وابسته یا هم‌زمان تغییرکرده است؛ دوباره بررسی کنید.';}
    if(status===429){code='RATE_LIMIT';message='تعداد درخواست زیاد است؛ کمی بعد تلاش کنید.';}
    if(status>=500)request.log.error({errorType:error instanceof Error?error.name:'Error',code:pgCode,requestId:request.id},'Request failed');
    return reply.status(status).send({error:{code,message,requestId:request.id}});
  });
  // All resource/command changes and their idempotency response commit together.
  app.addHook('onRoute',options=>{
    const methods=Array.isArray(options.method)?options.method:[options.method];
    const mutation=methods.some(m=>['POST','PATCH','DELETE'].includes(m));
    const protectedRead=methods.includes('GET')&&/^\/api\/v1\/(resources|workspace|students|dashboard|attendance)/.test(options.url);
    if(!protectedRead&&(!mutation||!/^\/api\/v1\/(resources|commands|accounts)/.test(options.url)))return;
    const original=options.handler;
    options.handler=async function(request,reply){
      const actor=requireAuth(request);const m=await membership(request);
      if(!mutation)return transaction(async()=>original.call(this,request,reply),m.school_id||'');
      const key=z.string().min(16).max(100).parse(request.headers['idempotency-key']);
      const hash=createHash('sha256').update(JSON.stringify({method:request.method,url:request.url,body:request.body,membership:m.id,year:request.headers['x-academic-year-id']})).digest('hex');
      return transaction(async tx=>{
        await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${actor.id}:${key}`]);
        const previous=await tx.query('SELECT * FROM idempotency WHERE user_id=$1 AND key=$2',[actor.id,key]);
        if(previous.rowCount){requireValue(previous.rows[0].request_hash===hash,'شناسه عملیات برای درخواست متفاوت استفاده شده است.',409);return previous.rows[0].response;}
        const result=await original.call(this,request,reply);
        requireValue(!reply.sent,'پاسخ عملیات باید پیش از ارسال ثبت شود.');
        if(m.school_id&&(/\/resources\/(students|classes|teachers|academicYears)/.test(request.url)||/\/commands\/(student-status|rollover|attendance)/.test(request.url))){
          const year=(await tx.query("SELECT id FROM academic_years WHERE school_id=$1 AND data->>'isCurrent'='true'",[m.school_id])).rows[0]?.id;
          if(year){const counts=(await tx.query("SELECT count(*) FILTER(WHERE kind='students' AND COALESCE(data->>'status','active')='active')::int AS \"studentCount\",count(*) FILTER(WHERE kind='teachers')::int AS \"teacherCount\",count(*) FILTER(WHERE kind='classes')::int AS \"classesCount\" FROM records WHERE school_id=$1 AND year_id=$2 AND kind IN ('students','classes','teachers')",[m.school_id,year])).rows[0];await tx.query('UPDATE schools SET data=data||$1::jsonb WHERE id=$2',[JSON.stringify(counts),m.school_id]);}
        }
        await tx.query('INSERT INTO idempotency(user_id,key,request_hash,response) VALUES($1,$2,$3,$4)',[actor.id,key,hash,result]);return result;
      },m.school_id||'');
    };
  });
  // Register directly, sharing authentication hooks with all protected routes.
  await authRoutes(app);await resourceRoutes(app);await commandRoutes(app);await adminRoutes(app);await fileRoutes(app);
  app.get('/api/v1/health',async()=>({ok:true}));
  app.get('/api/v1/ready',async()=>{await readiness();await redis.ping();return {ok:true};});
  app.get('/api/v1/openapi.json',async request=>{requireAuth(request);return app.swagger();});
  app.addHook('onSend',async(request,reply,payload)=>{if(request.url.startsWith('/api/'))reply.header('Cache-Control','no-store');return payload;});
  app.addHook('onClose',async()=>{await redis.quit();});
  return app;
}
