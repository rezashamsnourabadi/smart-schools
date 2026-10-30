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
    const publicAuth=route.url.startsWith('/api/v1/auth/')&&!route.url.startsWith('/api/v1/auth/bale')&&!['/api/v1/auth/me','/api/v1/auth/password','/api/v1/auth/logout'].includes(route.url);
    const params:Record<string,unknown>={};for(const match of route.url.matchAll(/:([A-Za-z]+)/g))params[match[1]]={type:'string'};
    route.schema={tags:[route.url.split('/')[3]||'system'],security:publicAuth||/\/(health|ready)$/.test(route.url)?[]:[{session:[]}],summary:route.url.replace('/api/v1/',''),...route.schema,...Object.keys(params).length?{params:{type:'object',required:Object.keys(params),properties:params}}:{}};
    if(methods.some(method=>['POST','PATCH'].includes(method))&&route.url!=='/api/v1/files'&&route.url!=='/api/v1/support/tickets/:id/files')route.schema.body={type:'object',additionalProperties:true};
    if(route.url==='/api/v1/resources/:kind'&&methods.includes('GET'))route.schema.querystring={type:'object',properties:{limit:{type:'integer',minimum:1,maximum:100,default:25},offset:{type:'integer',minimum:0,default:0},search:{type:'string',maxLength:100},classId:{type:'string'},date:{type:'string',maxLength:30,description:'Solar Hijri day; attendanceSessions only'},archive:{type:'string',enum:['active','archived'],default:'active',description:'Platform regional announcements only'},includeFinance:{type:'string',enum:['true','false']}}};
    if(methods.includes('GET')&&['/api/v1/teacher/records','/api/v1/students/:id/records/:kind'].includes(route.url)){
      route.schema.querystring={type:'object',additionalProperties:true,properties:{offset:{type:'integer',minimum:0,maximum:1000000,default:0},gradeView:{type:'string',enum:[...gradeViews],default:'all',description:'Grades only. Filters recorded categories before pagination; independent of the school current term.'},...(route.url.includes('/teacher/')?{classId:{type:'string',format:'uuid'},subject:{type:'string',minLength:1,maxLength:200},kind:{type:'string',enum:['grades','homework','exams','sessions','events','submissions']}}:{limit:{type:'integer',minimum:1,maximum:100,default:25}})}};
    }
    if(route.url==='/api/v1/resources/:kind'&&methods.includes('POST'))route.schema.description='The kind path parameter selects one resource schema. Actor, scope, identifiers and timestamps are assigned or checked by the server. See resource-* component schemas. School/year scope comes from the authorized membership headers.';
    if(route.url==='/api/v1/platform/schools/:id/access'&&methods.includes('PATCH'))route.schema.body={type:'object',required:['version','mode','reason'],additionalProperties:false,properties:{version:{type:'integer',minimum:0},mode:{type:'string',enum:['active','read_only','suspended']},reason:{type:'string',maxLength:1000},expiresAt:{anyOf:[{type:'string',format:'date-time'},{type:'null'}]}}};
    if(route.url==='/api/v1/support/tickets'&&methods.includes('GET'))route.schema.querystring={type:'object',properties:{offset:{type:'integer',minimum:0,maximum:1000000,default:0},schoolId:{type:'string',format:'uuid'},search:{type:'string',maxLength:100},status:{type:'string',enum:['new','in_progress','waiting_user','resolved','closed']}}};
    if(route.url==='/api/v1/integrations/bale/webhook')route.schema.security=[];
    if(route.url.startsWith('/api/v1/support/'))route.schema.description='Private support tickets: members see only their own tickets in the selected school; platform administrators handle all schools. Available during school restrictions. Lists/replies return at most 25 items. Writes require CSRF and an Idempotency-Key.';
    if(route.url==='/api/v1/messages'&&methods.includes('POST'))route.schema.body={type:'object',additionalProperties:false,required:['title','body','recipientIds'],properties:{title:{type:'string',minLength:1,maxLength:200},body:{type:'string',minLength:1,maxLength:2000},recipientIds:{type:'array',minItems:1,maxItems:50,items:{type:'string',format:'uuid'}},classId:{type:'string',format:'uuid'},subject:{type:'string',maxLength:200},bale:{type:'boolean',default:false},sms:{type:'boolean',default:false}}};
    if(route.url.startsWith('/api/v1/community'))route.schema.description='School feedback and surveys. School isolation, role/vice-principal permission checks, paginated lists (25), version conflicts and idempotent writes. Anonymous feedback author fields are omitted; only platform identity lookup with a recorded reason may reveal them. Survey responses are named and final per membership; published questions and audience snapshots are immutable. See docs/API.md for payloads.';
    if(route.url.startsWith('/api/v1/inbox'))route.schema.description='Personal inbox scoped to the authenticated user AND authorized membership. Lists return at most 25 messages. Summary polling returns only unread count and newest message id. Reading is available under school restrictions; read receipts require CSRF and Idempotency-Key.';
    if(route.url==='/api/v1/messages/recipients')route.schema.querystring={type:'object',properties:{classId:{type:'string',format:'uuid'},subject:{type:'string',maxLength:200},schoolId:{type:'string',format:'uuid'},role:{type:'string',enum:['principal','vice_principal','teacher','student','parent','platform_admin']},search:{type:'string',maxLength:100},offset:{type:'integer',minimum:0,maximum:1000000,default:0}}};
    if(route.url==='/api/v1/inbox'&&methods.includes('GET'))route.schema.querystring={type:'object',properties:{offset:{type:'integer',minimum:0,maximum:1000000,default:0},unread:{type:'string',enum:['true','false'],default:'false'}}};
    if(route.url.includes('/inspection')){
      route.schema.description='Read-only school oversight for the authenticated platform_admin, preserving its real role. Target school/year is validated and applied as an explicit RLS scope. Student lists omit dossier fields; dossier/section views and receipt-download starts are audited. Only receipt files referenced by that student in that school/year are downloadable. No write counterpart exists.';
      if(!route.url.endsWith('/files/:fileId'))route.schema.querystring={type:'object',properties:{offset:{type:'integer',minimum:0,maximum:1000000,default:0},search:{type:'string',maxLength:100},classId:{type:'string',format:'uuid'},gradeView:{type:'string',enum:[...gradeViews],default:'all'}}};
    }
    if(route.url==='/api/v1/analytics/events'){
      route.schema.description='Best-effort authenticated telemetry, at most 20 events. Actor, role, school, UTC occurrence and Tehran day are assigned by the server. Event IDs plus server windows deduplicate retries/remounts. No business mutation or persistent client queue. Invalid audience, inactive banner and non-student Dana Plus signals are ignored. School restrictions do not disable this narrow telemetry endpoint.';
      route.schema.body={type:'object',required:['events'],additionalProperties:true,properties:{events:{type:'array',minItems:1,maxItems:20,items:{type:'object',required:['id','kind'],additionalProperties:true,properties:{id:{type:'string',format:'uuid'},kind:{type:'string',enum:['activity','banner_impression','banner_click','dana_plus_open']},bannerId:{type:'string',format:'uuid'}}}}}};
    }
    if(route.url==='/api/v1/platform/analytics')route.schema.querystring={type:'object',properties:{days:{type:'integer',minimum:1,maximum:90,default:7},schoolId:{type:'string',format:'uuid'},bannerOffset:{type:'integer',minimum:0,maximum:1000000,default:0},schoolOffset:{type:'integer',minimum:0,maximum:1000000,default:0}}};
    if(!publicAuth&&!/\/(health|ready)$/.test(route.url))route.schema.headers={type:'object',properties:{'x-membership-id':{type:'string',format:'uuid'},'x-academic-year-id':{type:'string',format:'uuid'},'x-csrf-token':{type:'string'},'idempotency-key':{type:'string',minLength:16,maxLength:100}}};
  });
}
