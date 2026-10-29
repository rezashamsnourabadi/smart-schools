import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {resourceSchemas} from './schema';
import {gradeViews} from '../shared/academic';

export function installContracts(app:FastifyInstance){
  for(const [name,schema]of Object.entries(resourceSchemas)){
    const json=z.toJSONSchema(schema,{target:'draft-7'});delete json.$schema;
    app.addSchema({$id:`resource-${name}`,...json});
  }
  app.addHook('onRoute',route=>{
    if(!route.url.startsWith('/api/v1'))return;
    const methods=Array.isArray(route.method)?route.method:[route.method];
    const publicAuth=route.url.startsWith('/api/v1/auth/')&&!['/api/v1/auth/me','/api/v1/auth/password','/api/v1/auth/logout'].includes(route.url);
    const params:Record<string,unknown>={};for(const match of route.url.matchAll(/:([A-Za-z]+)/g))params[match[1]]={type:'string'};
    route.schema={tags:[route.url.split('/')[3]||'system'],security:publicAuth||/\/(health|ready)$/.test(route.url)?[]:[{session:[]}],summary:route.url.replace('/api/v1/',''),...route.schema,...Object.keys(params).length?{params:{type:'object',required:Object.keys(params),properties:params}}:{}};
    if(methods.some(method=>['POST','PATCH'].includes(method))&&route.url!=='/api/v1/files')route.schema.body={type:'object',additionalProperties:true};
    if(route.url==='/api/v1/resources/:kind'&&methods.includes('GET'))route.schema.querystring={type:'object',properties:{limit:{type:'integer',minimum:1,maximum:100,default:25},offset:{type:'integer',minimum:0,default:0},search:{type:'string',maxLength:100},classId:{type:'string'},date:{type:'string',maxLength:30,description:'Solar Hijri day; attendanceSessions only'},includeFinance:{type:'string',enum:['true','false']}}};
    if(methods.includes('GET')&&['/api/v1/teacher/records','/api/v1/students/:id/records/:kind'].includes(route.url)){
      route.schema.querystring={type:'object',additionalProperties:true,properties:{offset:{type:'integer',minimum:0,maximum:1000000,default:0},gradeView:{type:'string',enum:[...gradeViews],default:'all',description:'Grades only. Filters recorded categories before pagination; independent of the school current term.'},...(route.url.includes('/teacher/')?{classId:{type:'string',format:'uuid'},subject:{type:'string',minLength:1,maxLength:200},kind:{type:'string',enum:['grades','homework','exams','sessions','events','submissions']}}:{limit:{type:'integer',minimum:1,maximum:100,default:25}})}};
    }
    if(route.url==='/api/v1/resources/:kind'&&methods.includes('POST'))route.schema.description='The kind path parameter selects one resource schema. Actor, scope, identifiers and timestamps are assigned or checked by the server. See resource-* component schemas. School/year scope comes from the authorized membership headers.';
    if(!publicAuth&&!/\/(health|ready)$/.test(route.url))route.schema.headers={type:'object',properties:{'x-membership-id':{type:'string',format:'uuid'},'x-academic-year-id':{type:'string',format:'uuid'},'x-csrf-token':{type:'string'},'idempotency-key':{type:'string',minLength:16,maxLength:100}}};
  });
}
