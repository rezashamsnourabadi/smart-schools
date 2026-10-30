import {randomUUID,createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {z} from 'zod';
import sharp from 'sharp';
import {GetObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {membership,requireAuth} from './auth';
import {transaction,type Tx} from './db';
import {ticket,ticketContext} from './operations';
import {storage,detectMime} from './files';
import {config} from './config';
import {requireValue} from './errors';
async function scope<T>(request:FastifyRequest,work:(tx:Tx,id:string,userId:string)=>Promise<T>){const m=await membership(request),u=requireAuth(request),id=z.uuid().parse((request.params as {id:string}).id);return transaction(async tx=>{await ticketContext(tx,u.id);await ticket(tx,id);return work(tx,id,u.id);},m.school_id||'',m.role==='platform_admin');}
export async function supportFileRoutes(app:FastifyInstance){
 app.post('/api/v1/support/tickets/:id/files',{config:{rateLimit:{max:20,timeWindow:'10 minutes'}}},async request=>{
  await scope(request,async()=>{});const key=z.string().min(16).max(100).parse(request.headers['idempotency-key']);
  const file=await request.file();requireValue(file,'فایل را انتخاب کنید.');let data=await file.toBuffer();requireValue(!file.file.truncated&&data.length>=8&&data.length<=2097152,'سقف فایل دو مگابایت است.');
  const fingerprint=createHash('sha256').update(file.filename).update(file.mimetype).update(data).digest('hex');let mime=detectMime(data);requireValue(mime&&mime===file.mimetype,'فقط PDF، تصویر معتبر و DOCX بدون ماکرو مجاز است.');
  if(mime.startsWith('image/')){try{data=await sharp(data,{limitInputPixels:8000000,animated:false}).rotate().resize({width:1280,height:1280,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();mime='image/webp';}catch{requireValue(false,'تصویر معتبر نیست یا ابعاد آن بیش از حد مجاز است.');}}
  const objectKey=`support/${randomUUID()}`;let uploaded=false;
  try{return await scope(request,async(tx,id,userId)=>{
   const current=await ticket(tx,id,true);requireValue(current.status!=='closed','تیکت بسته است؛ ابتدا آن را بازگشایی کنید.');
   const old=(await tx.query('SELECT id,name,digest FROM support_attachments WHERE ticket_id=$1 AND author_id=$2 AND upload_key=$3',[id,userId,key])).rows[0];
   if(old){requireValue(old.digest===fingerprint,'شناسه آپلود برای فایل دیگری استفاده شده است.',409);return {id:old.id,name:old.name};}
   requireValue((await tx.query('SELECT count(*)::int AS n FROM support_attachments WHERE ticket_id=$1',[id])).rows[0].n<10,'هر تیکت حداکثر ده فایل دارد.');
   await storage.send(new PutObjectCommand({Bucket:config.S3_BUCKET,Key:objectKey,Body:data,ContentType:mime!}),{abortSignal:AbortSignal.timeout(10000)});uploaded=true;const fileId=randomUUID();
   await tx.query('INSERT INTO support_attachments(id,school_id,ticket_id,author_id,name,mime,size,storage_key,upload_key,digest) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[fileId,current.school_id,id,userId,file.filename.slice(0,200),mime,data.length,objectKey,key,fingerprint]);
   await tx.query("INSERT INTO audit_log(user_id,school_id,action,entity_id) VALUES($1,$2,'support-file-uploaded',$3)",[userId,current.school_id,fileId]);return {id:fileId,name:file.filename};
  });}catch(error){if(uploaded)await storage.send(new DeleteObjectCommand({Bucket:config.S3_BUCKET,Key:objectKey})).catch(()=>{});throw error;}
 });
 app.get('/api/v1/support/tickets/:id/files/:fileId',async(request,reply)=>{
  const fileId=z.uuid().parse((request.params as {fileId:string}).fileId),file=await scope(request,async(tx,id,userId)=>{const row=(await tx.query('SELECT * FROM support_attachments WHERE id=$1 AND ticket_id=$2',[fileId,id])).rows[0];requireValue(row,'فایل پیدا نشد.',404);await tx.query("INSERT INTO audit_log(user_id,school_id,action,entity_id) VALUES($1,$2,'support-file-download-requested',$3)",[userId,row.school_id,fileId]);return row;});
  const object=await storage.send(new GetObjectCommand({Bucket:config.S3_BUCKET,Key:file.storage_key}));return reply.header('Content-Type',file.mime).header('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`).header('X-Content-Type-Options','nosniff').send(object.Body as Readable);
 });
}
