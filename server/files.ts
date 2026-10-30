import {assertSchoolAccess} from './school-access';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { z } from 'zod';
import multipart from '@fastify/multipart';
import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { FastifyInstance } from 'fastify';
import { config } from './config';
import { transaction } from './db';
import { scope, allowed, linkedRecord, memberProfile } from './resources';
import { classAccess } from './repository';
import { requireValue,ApiError } from './errors';
import sharp from 'sharp';
import {assetScope} from './asset-links';

export const storage=new S3Client({region:config.S3_REGION,endpoint:config.S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:config.S3_ACCESS_KEY,secretAccessKey:config.S3_SECRET_KEY}});
export function detectMime(buffer:Buffer):string|null {
  if(buffer.length<8)return null;
  if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return 'image/jpeg';
  if(buffer.subarray(0,5).toString()==='%PDF-')return 'application/pdf';
  if(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')return 'image/webp';
  if(buffer.readUInt32LE(0)===0x04034b50){
    let offset=buffer.length-22;while(offset>=Math.max(0,buffer.length-65557)&&buffer.readUInt32LE(offset)!==0x06054b50)offset--;
    if(offset<Math.max(0,buffer.length-65557))return null;
    const entries=buffer.readUInt16LE(offset+10);let cursor=buffer.readUInt32LE(offset+16),expanded=0;const names=new Set<string>();
    if(entries>1000)return null;
    for(let index=0;index<entries;index++){
      if(cursor+46>buffer.length||buffer.readUInt32LE(cursor)!==0x02014b50)return null;
      if(buffer.readUInt16LE(cursor+8)&1)return null;
      expanded+=buffer.readUInt32LE(cursor+24);if(expanded>20*1024*1024)return null;
      const length=buffer.readUInt16LE(cursor+28),extra=buffer.readUInt16LE(cursor+30),comment=buffer.readUInt16LE(cursor+32);
      if(cursor+46+length+extra+comment>buffer.length)return null;
      const name=buffer.subarray(cursor+46,cursor+46+length).toString();if(/(^\/|\.\.|\\|\0|\.bin$|vbaProject|embeddings\/)/i.test(name))return null;names.add(name);cursor+=46+length+extra+comment;
    }
    if(names.has('[Content_Types].xml')&&names.has('word/document.xml'))return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return null;
}
export async function fileRoutes(app:FastifyInstance) {
  await app.register(multipart,{limits:{fileSize:2*1024*1024,files:1,fields:0}});
  app.post('/api/v1/files',async request=>{
    const {member,school,year,user}=await scope(request,true);
    const query=z.object({purpose:z.enum(['homework','submission','receipt','post']),classId:z.uuid().optional(),studentId:z.uuid().optional()}).strict().parse(request.query);
    requireValue(school&&year,'مدرسه و سال فعال لازم است.');
    const file=await request.file();requireValue(file,'فایل الزامی است.');
    let data=await file.toBuffer();requireValue(!file.file.truncated&&data.length>=8&&data.length<=2*1024*1024,'اندازه فایل معتبر نیست.');
    let mime=detectMime(data);requireValue(mime&&mime===file.mimetype,'فقط PDF، تصویر معتبر و DOCX بدون ماکرو پذیرفته می‌شوند.');
    if(mime.startsWith('image/')){try{data=await sharp(data,{limitInputPixels:8_000_000,animated:false}).rotate().resize({width:1280,height:1280,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();mime='image/webp';}catch{requireValue(false,'تصویر معتبر نیست یا ابعاد آن بیش از حد مجاز است.');}}
    return transaction(async tx=>{
      await assertSchoolAccess(request,tx);
      let classId=query.classId||null,studentId=query.studentId||null;
      const child=await linkedRecord(tx,member,school,year);
      if(query.purpose==='submission'){requireValue(member.role==='student'&&child,'دسترسی مجاز نیست.',403);classId=String(child.classGroupId);studentId=child.id;}
      if(query.purpose==='homework'){requireValue(member.role==='teacher'&&classId,'کلاس و دبیر لازم است.',403);await classAccess(tx,{...member,profile_id:(await memberProfile(tx,member,school,year))?.id||null},school,year,classId);}
      if(query.purpose==='receipt'){requireValue((member.role==='parent'&&child?.id===studentId)||allowed(member,'canManageFinances'),'دسترسی مجاز نیست.',403);classId=null;}
      if(query.purpose==='post'){requireValue(allowed(member,'canManageAnnouncements'),'دسترسی مجاز نیست.',403);classId=null;studentId=null;}
      const id=randomUUID(),key=`${school}/${year}/${id}`;
      try { await storage.send(new PutObjectCommand({Bucket:config.S3_BUCKET,Key:key,Body:data,ContentType:mime!,Metadata:{purpose:query.purpose}})); }
      catch { throw new ApiError(503,'STORAGE_UNAVAILABLE','مخزن فایل در دسترس نیست؛ فرم را نگه دارید و دوباره تلاش کنید.'); }
      try {
        await tx.query('INSERT INTO files(id,school_id,year_id,owner_id,class_id,student_id,name,mime,size,storage_key,purpose) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[id,school,year,user.id,classId,studentId,file.filename.slice(0,200),mime,data.length,key,query.purpose]);
      } catch(e){await storage.send(new DeleteObjectCommand({Bucket:config.S3_BUCKET,Key:key}));throw e;}
      return {id,url:`/api/v1/files/${id}`,name:file.filename,type:mime!.startsWith('image/')?'image':mime==='application/pdf'?'pdf':'doc'};
    },school);
  });
  app.get('/api/v1/files/:id',async(request,reply)=>{
    const id=z.uuid().parse((request.params as {id:string}).id);assetScope(request,id);const {member,school,year,user}=await scope(request);
    const row=await transaction(async tx=>{
      const result=await tx.query('SELECT * FROM files WHERE id=$1 AND school_id=$2 AND year_id=$3',[id,school,year]);requireValue(result.rowCount,'فایل پیدا نشد.',404);const file=result.rows[0];
      let access=file.owner_id===user.id;
      if(file.purpose==='receipt')access ||=allowed(member,'canManageFinances');
      if(['homework','submission'].includes(file.purpose)) {
        if(['principal','vice_principal'].includes(member.role))access ||=allowed(member,'canViewFullDossier');
        if(member.role==='teacher'){const profile=await memberProfile(tx,member,school,year);const reference=JSON.stringify([{url:`/api/v1/files/${id}`}]);const own=await tx.query("SELECT 1 FROM records h LEFT JOIN records s ON s.school_id=h.school_id AND s.year_id=h.year_id AND s.kind='homeworkSubmissions' AND s.data->>'homeworkId'=h.id::text WHERE h.school_id=$1 AND h.year_id=$2 AND h.kind='homework' AND h.teacher_id=$3 AND (h.data->'attachments' @> $4::jsonb OR s.data->'attachments' @> $4::jsonb) LIMIT 1",[school,year,profile?.id||null,reference]);access ||=!!own.rowCount;}
        if(file.purpose==='homework'&&['parent','student'].includes(member.role))access ||=(await linkedRecord(tx,member,school,year))?.classGroupId===file.class_id;
        if(file.purpose==='submission'&&member.role==='parent')access ||=(await linkedRecord(tx,member,school,year))?.id===file.student_id;
      }
      if(file.purpose==='post'){
        const audience=member.role==='teacher'?'teachers':member.role==='parent'?'parents':'students';
        const posts=await tx.query("SELECT 1 FROM records WHERE school_id=$1 AND year_id=$2 AND kind='announcements' AND (data->'attachments' @> $3::jsonb OR data->>'coverImage'=$6 OR data->>'imageUrl'=$6) AND (data->>'target' IN ('all',$4) OR $5)",[school,year,JSON.stringify([{url:`/api/v1/files/${id}`}]),audience,['principal','vice_principal'].includes(member.role),`/api/v1/files/${id}`]);access ||=!!posts.rowCount;
      }
      requireValue(access,'دسترسی فایل مجاز نیست.',403);return file;
    },school);
    const result=await storage.send(new GetObjectCommand({Bucket:config.S3_BUCKET,Key:row.storage_key}));
    reply.header('Content-Type',row.mime).header('Content-Disposition',`${row.mime.startsWith('image/')&&row.purpose==='post'?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(row.name)}`).header('X-Content-Type-Options','nosniff');
    return reply.send(result.Body as Readable);
  });
}
