import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {config} from './config';
const key=createHash('sha256').update(config.SESSION_SECRET).digest();
export function seal(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),body].map(v=>v.toString('base64url')).join('.');}
export function unseal(value:string){const [iv,tag,body]=value.split('.').map(v=>Buffer.from(v,'base64url'));const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAuthTag(tag);return Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8');}
