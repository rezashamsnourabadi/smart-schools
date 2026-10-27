import {timingSafeEqual} from 'node:crypto';
import type {FastifyInstance} from 'fastify';
import type {Redis} from 'ioredis';
import {config} from './config';
import {pool} from './db';
import {ApiError} from './errors';

export function installMetrics(app:FastifyInstance,redis:Redis){
  const buckets=[.05,.1,.25,.5,1,2,5,10];
  const routes=new Map<string,{count:number;sum:number;values:number[]}>();
  app.addHook('onResponse',async(request,reply)=>{
    const key=`route=${JSON.stringify(request.routeOptions.url||'unmatched')},method=${JSON.stringify(request.method)},status=${JSON.stringify(String(reply.statusCode))}`;
    const row=routes.get(key)||{count:0,sum:0,values:buckets.map(()=>0)};const seconds=reply.elapsedTime/1000;row.count++;row.sum+=seconds;buckets.forEach((bound,index)=>{if(seconds<=bound)row.values[index]++;});routes.set(key,row);
  });
  app.get('/api/v1/metrics',async(request,reply)=>{
    const expected=config.METRICS_TOKEN,token=request.headers.authorization?.replace(/^Bearer /,'');
    if(!expected)throw new ApiError(404,'NOT_FOUND','مسیر پیدا نشد.');
    if(!token||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))throw new ApiError(403,'FORBIDDEN','دسترسی مجاز نیست.');
    const lines=['# TYPE school_http_duration_seconds histogram'];
    for(const [labels,row]of routes){for(let i=0;i<buckets.length;i++)lines.push(`school_http_duration_seconds_bucket{${labels},le="${buckets[i]}"} ${row.values[i]}`);lines.push(`school_http_duration_seconds_bucket{${labels},le="+Inf"} ${row.count}`,`school_http_duration_seconds_count{${labels}} ${row.count}`,`school_http_duration_seconds_sum{${labels}} ${row.sum}`);}
    lines.push(`school_database_connections ${pool.totalCount}`,`school_database_waiting ${pool.waitingCount}`,`school_database_idle ${pool.idleCount}`,`school_queue_waiting ${await redis.llen('bull:school-outbox:wait')}`,`school_queue_delayed ${await redis.zcard('bull:school-outbox:delayed')}`);
    const outbox=await pool.query('SELECT status,count(*)::int AS count FROM outbox GROUP BY status');for(const row of outbox.rows)lines.push(`school_outbox{status=${JSON.stringify(row.status)}} ${row.count}`);
    return reply.type('text/plain; version=0.0.4').send(lines.join('\n')+'\n');
  });
}
