import { z } from 'zod';
import { pool, transaction } from './db';
import { hashPassword } from './auth';
import { storage } from './files';
import { CreateBucketCommand,PutBucketVersioningCommand } from '@aws-sdk/client-s3';
import { config } from './config';

const command=process.argv[2];
try {
  if(command==='bootstrap-admin') {
    const input=z.object({username:z.string().regex(/^[a-z0-9._-]{3,80}$/),name:z.string().min(1),phone:z.string().regex(/^09\d{9}$/),password:z.string().min(12)}).parse({username:process.env.BOOTSTRAP_USERNAME,name:process.env.BOOTSTRAP_NAME,phone:process.env.BOOTSTRAP_PHONE,password:process.env.BOOTSTRAP_PASSWORD});
    await transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(8172402)');
      const exists=await tx.query("SELECT 1 FROM memberships WHERE role='platform_admin'");if(exists.rowCount)throw new Error('Platform administrator already exists.');
      const user=await tx.query('INSERT INTO users(username,name,phone,password_hash,phone_verified) VALUES($1,$2,$3,$4,true) RETURNING id',[input.username,input.name,input.phone,await hashPassword(input.password)]);
      await tx.query("INSERT INTO memberships(user_id,role) VALUES($1,'platform_admin')",[user.rows[0].id]);
    });
    console.log('Administrator created. Login with the password or a verified SMS code.');
  } else if(command==='storage-init') {
    try{await storage.send(new CreateBucketCommand({Bucket:config.S3_BUCKET}));}catch(e){if(!['BucketAlreadyOwnedByYou','BucketAlreadyExists'].includes((e as Error).name))throw e;}
    await storage.send(new PutBucketVersioningCommand({Bucket:config.S3_BUCKET,VersioningConfiguration:{Status:'Enabled'}}));
    console.log('Private bucket ready.');
  } else if(command==='link-membership') {
    // Operator-only command for verified cross-school identity linking.
    const input=z.object({userId:z.uuid(),schoolId:z.uuid(),role:z.enum(['principal','teacher','vice_principal','student','parent']),profileId:z.uuid().optional(),studentId:z.uuid().optional()}).parse(JSON.parse(process.env.MEMBERSHIP_JSON||'{}'));
    await transaction(async tx=>{await tx.query('INSERT INTO memberships(user_id,school_id,role,profile_id,student_id) VALUES($1,$2,$3,$4,$5)',[input.userId,input.schoolId,input.role,input.profileId||null,input.studentId||null]);},input.schoolId);
    console.log('Verified membership linked.');
  } else throw new Error('Use bootstrap-admin, storage-init or link-membership.');
} finally {await pool.end();}
