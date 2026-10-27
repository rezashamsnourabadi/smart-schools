import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import staticFiles from '@fastify/static';
import { createApp } from './app';
import { config } from './config';
import { pool } from './db';
import {readiness} from './repository';

const app=await createApp();
await readiness();
if(config.NODE_ENV==='production') {
  if(!existsSync('dist/index.html'))throw new Error('Run npm run build first.');
  await app.register(staticFiles,{root:resolve('dist'),maxAge:'1y',immutable:true,setHeaders(response,path){
    if(path.endsWith('.html'))response.header('Cache-Control','no-cache');
  }});
  app.setNotFoundHandler((req,reply)=>req.url.startsWith('/api/')?reply.code(404).send({error:{code:'NOT_FOUND',message:'مسیر پیدا نشد.',requestId:req.id}}):reply.header('Cache-Control','no-cache').sendFile('index.html'));
}
await app.listen({host:'0.0.0.0',port:config.NODE_ENV==='production'?3000:config.API_PORT});
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{await app.close();await pool.end();process.exit(0);});
