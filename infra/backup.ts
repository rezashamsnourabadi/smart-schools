import 'dotenv/config';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,readFile,writeFile,readdir,stat,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {S3Client,ListObjectsV2Command,GetObjectCommand,PutObjectCommand,CreateBucketCommand} from '@aws-sdk/client-s3';

const secret=process.env.BACKUP_KEY;
if(!secret||secret.length<32)throw new Error('BACKUP_KEY must be a private random secret with at least 32 characters.');
const key=createHash('sha256').update(secret).digest();
const root=resolve(process.env.BACKUP_DIR||'backups');
const compose=process.env.BACKUP_COMPOSE_FILE||'compose.yaml';
const owner=process.env.BACKUP_DATABASE_OWNER||'school_owner';
const database=process.env.BACKUP_DATABASE_NAME||'schools';
const bucket=process.env.S3_BUCKET||'school-private';
const storage=new S3Client({region:process.env.S3_REGION||'us-east-1',endpoint:process.env.BACKUP_S3_ENDPOINT||process.env.S3_ENDPOINT||'http://127.0.0.1:59000',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY||'local-storage',secretAccessKey:process.env.S3_SECRET_KEY||'local-storage-password'}});
interface CipherInfo {iv:string;tag:string;bytes:number}
interface Manifest {version:1;createdAt:string;database:CipherInfo;objects:{key:string;filename:string;type:string;metadata:Record<string,string>;cipher:CipherInfo}[]}
function docker(args:string[]){return spawn('docker',['compose','-f',compose,'exec','-T','postgres',...args],{stdio:['pipe','pipe','pipe'],windowsHide:true});}
async function done(child:ReturnType<typeof docker>):Promise<void>{let error='';child.stderr.on('data',chunk=>{error+=chunk.toString().slice(0,2000);});return new Promise((ok,fail)=>{child.once('error',fail);child.once('exit',code=>code===0?ok():fail(new Error(`Database tool failed (${code}): ${error}`)));});}
async function encrypt(source:Readable,path:string):Promise<CipherInfo>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);let bytes=0;source.on('data',chunk=>{bytes+=chunk.length;});await pipeline(source,cipher,createWriteStream(path,{mode:0o600}));return {iv:iv.toString('base64url'),tag:cipher.getAuthTag().toString('base64url'),bytes};}
function decrypt(path:string,info:CipherInfo){const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(info.iv,'base64url'));decipher.setAuthTag(Buffer.from(info.tag,'base64url'));return {source:createReadStream(path),decipher};}
function targetFolder(name:string){if(!/^schools-[0-9TZ-]+-[a-f0-9]{8}$/.test(name))throw new Error('Unexpected backup directory name');const path=resolve(root,name);if(!path.startsWith(root+sep))throw new Error('Backup path escapes its root');return path;}
if(process.argv[2]==='create'){
  await mkdir(root,{recursive:true});const name=`schools-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`;const folder=targetFolder(name);await mkdir(folder);
  const child=docker(['pg_dump','--username',owner,'--dbname',database,'--format=custom','--no-owner']);const completion=done(child);child.stdin.end();
  const db=await encrypt(child.stdout,join(folder,'database.enc'));await completion;
  const manifest:Manifest={version:1,createdAt:new Date().toISOString(),database:db,objects:[]};
  let token:string|undefined;
  do{const listed=await storage.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));for(const object of listed.Contents||[]){if(!object.Key)continue;const response=await storage.send(new GetObjectCommand({Bucket:bucket,Key:object.Key}));const filename=`object-${manifest.objects.length}.enc`;const cipher=await encrypt(response.Body as Readable,join(folder,filename));manifest.objects.push({key:object.Key,filename,type:response.ContentType||'application/octet-stream',metadata:response.Metadata||{},cipher});}token=listed.NextContinuationToken;}while(token);
  const header=await encrypt(Readable.from([Buffer.from(JSON.stringify(manifest))]),join(folder,'manifest.enc'));await writeFile(join(folder,'manifest.header.json'),JSON.stringify(header),{mode:0o600});
  // Only completed, well-named backups under the verified root are eligible for retention.
  for(const old of await readdir(root)){if(old===name||!/^schools-[0-9TZ-]+-[a-f0-9]{8}$/.test(old))continue;const path=targetFolder(old);try{await stat(join(path,'manifest.header.json'));if(Date.now()-(await stat(path)).mtimeMs>30*86400000)await rm(path,{recursive:true});}catch{/* Incomplete backups are retained for operator review. */}}
  console.log(JSON.stringify({backup:name,objects:manifest.objects.length,databaseBytes:db.bytes,encrypted:true}));
}else if(process.argv[2]==='verify'){
  const name=process.argv[3];const folder=targetFolder(name);const header=JSON.parse(await readFile(join(folder,'manifest.header.json'),'utf8')) as CipherInfo;
  const {source,decipher}=decrypt(join(folder,'manifest.enc'),header);const chunks:Buffer[]=[];decipher.on('data',chunk=>chunks.push(chunk));await pipeline(source,decipher);const manifest=JSON.parse(Buffer.concat(chunks).toString()) as Manifest;
  if(manifest.version!==1)throw new Error('Unsupported backup format');
  const dbName=`restore_verify_${randomUUID().replace(/-/g,'')}`;const create=docker(['createdb','--username',owner,dbName]);const created=done(create);create.stdin.end();await created;
  const restore=docker(['pg_restore','--username',owner,'--dbname',dbName,'--no-owner','--exit-on-error']);const restored=done(restore);const encrypted=decrypt(join(folder,'database.enc'),manifest.database);await Promise.all([pipeline(encrypted.source,encrypted.decipher,restore.stdin),restored]);
  const restoredBucket=`restore-verify-${randomUUID()}`;await storage.send(new CreateBucketCommand({Bucket:restoredBucket}));
  for(const object of manifest.objects){if(!/^object-\d+\.enc$/.test(object.filename))throw new Error('Invalid object filename');const plain=decrypt(join(folder,object.filename),object.cipher);const uploading=storage.send(new PutObjectCommand({Bucket:restoredBucket,Key:object.key,Body:plain.decipher,ContentLength:object.cipher.bytes,ContentType:object.type,Metadata:object.metadata}));await Promise.all([pipeline(plain.source,plain.decipher),uploading]);}
  const verify=docker(['psql','--username',owner,'--dbname',dbName,'-At','-c',"SELECT json_build_object('users',(SELECT count(*) FROM users),'schools',(SELECT count(*) FROM schools),'records',(SELECT count(*) FROM records),'rls',(SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE relname='records'))"]);let counts='';verify.stdout.on('data',chunk=>{counts+=chunk.toString();});const verified=done(verify);verify.stdin.end();await verified;
  console.log(JSON.stringify({ok:true,restoredDatabase:dbName,restoredBucket,objects:manifest.objects.length,counts:JSON.parse(counts),note:'Restored into new isolated targets. The live database and bucket were not modified.'}));
}else throw new Error('Use create or verify <backup-directory-name>.');
