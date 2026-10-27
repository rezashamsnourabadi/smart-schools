import React,{createContext,useContext,useState,useEffect,useCallback,useMemo} from 'react';
import {useQueries,useQuery,useQueryClient} from '@tanstack/react-query';
import type {AppContextType} from './contracts';
import type {Student,UserProfile,AcademicYear,VicePrincipalPermissions,UserRole} from '../types';
import {getSchoolClock} from '../utils/persianUtils';
import {useAuth,Status} from '../auth/AuthProvider';
import {request,uploadDataUrl,type RequestScope} from '../api/client';
import type {AttendanceSession} from '../types';

export const actionNames=['sendNotification','submitAttendance','addQuestionBankItem','addBannerAd','updateBannerAd','toggleBannerStatus','clickBanner','addAnnouncement','updateAnnouncement','deleteAnnouncement','togglePinAnnouncement','addSchool','addStudent','updateStudent','removeStudent','transferStudentClass','markStudentGraduated','markStudentTransferred','markStudentActive','addClassGroup','deleteClassGroup','addScheduleSlot','updateScheduleSlot','deleteScheduleSlot','updateVicePrincipalPermissions','addDisciplinaryRecord','addGradeItem','addHomework','submitHomework','gradeHomeworkSubmission','addOnlineExam','updateParentContact','setActiveTermId','addAcademicYear','updateAcademicYear','rolloverAcademicYear','addFeeItem','updateFeeItem','deleteFeeItem','assignFeeItemToStudents','recordStudentPayment','updatePaymentTransactionStatus','sendPaymentReminder','applyStudentDiscount','addTeacher','updateTeacher','deleteTeacher','addVicePrincipal','updateVicePrincipal','deleteVicePrincipal','convertTeacherToVicePrincipal','convertVicePrincipalToTeacher','updateVicePrincipalProfilePermissions'] as const;
type ActionName=typeof actionNames[number];
type Result<T>={ok:false;error:string}|(T extends void|undefined?{ok:true}:T);
type AsyncActions={[K in ActionName]:AppContextType[K] extends (...args:infer A)=>infer R?(...args:A)=>Promise<Result<Exclude<R,undefined>>>:never};
interface Page {items:Record<string,unknown>[];total:number;limit:number;offset:number}
interface Workspace {user:UserProfile;years:AcademicYear[];profile:Record<string,unknown>|null;currentStudentId:string|null}
interface PageState {offset:number;search:string;classId?:string}
type RemoteApp=Omit<AppContextType,ActionName>&AsyncActions&{loadResource:(kind:string)=>void;page:(kind:string)=>PageState&{total:number;loading:boolean};setPage:(kind:string,change:Partial<PageState>)=>void;busy:boolean;dashboard:Record<string,number>;dailyAbsences:{student:Student;session:AttendanceSession;note?:string}[]};
const Context=createContext<RemoteApp|null>(null);
const denied:VicePrincipalPermissions={canManageAnnouncements:false,canManageSchedule:false,canManageStudentsAndClasses:false,canViewFullDossier:false,canLogDisciplinary:false,canManageFinances:false};
const baseResources=['schools','classes','students','schedule','announcements','banners','notifications'];
const roleResources:Partial<Record<UserRole,string[]>>={teacher:[],student:['homework','homeworkSubmissions','exams','questionBank'],parent:['homework','exams'],principal:[],vice_principal:[],platform_admin:['questionBank']};
const independentResourceRefresh:Partial<Record<string,readonly string[]>>={
  announcements:['announcements'],questionBank:['questionBank'],banners:['banners'],
  homework:['homework'],exams:['exams'],homeworkSubmissions:['homeworkSubmissions','homework']
};
const independentCommandRefresh:Partial<Record<string,readonly string[]>>={
  'banner-status':['banners'],'pin-announcement':['announcements']
};
export const AppProvider=({children}:{children:React.ReactNode})=>{
  const auth=useAuth(),client=useQueryClient();const [yearId,setYear]=useState('');
  const [modules,setModules]=useState<string[]>([]),[pages,setPages]=useState<Record<string,PageState>>({});
  const [selectedId,setSelectedId]=useState<string|null>(null),[dossierInitialTab,setDossierInitialTab]=useState<AppContextType['dossierInitialTab']>('profile');
  const [activeMobileTab,setActiveMobileTab]=useState('dashboard'),[activeToast,setToast]=useState<AppContextType['activeToast']>(null),[busy,setBusy]=useState(false);
  const [clock,setClock]=useState(getSchoolClock);
  const entered=React.useRef(false);
  useEffect(()=>{const timer=setInterval(()=>setClock(getSchoolClock()),30000);return()=>clearInterval(timer);},[]);
  const scope:RequestScope=useMemo(()=>({membershipId:auth.member.id,csrf:auth.user.csrf,yearId:yearId||undefined}),[auth.member.id,auth.user.csrf,yearId]);
  const metadata=useQuery({queryKey:['workspace',scope.membershipId,yearId],queryFn:({signal})=>request<Workspace>('/workspace',{scope,signal}),staleTime:30000,refetchInterval:auth.member.role==='vice_principal'?60000:false});
  const currentYear=metadata.data?.years.find(y=>y.isCurrent);
  const activeYear=metadata.data?.years.find(y=>y.id===yearId)||currentYear;
  const effectiveScope=useMemo(()=>({...scope,yearId:activeYear?.id}),[scope,activeYear?.id]);
  const resources=useMemo(()=>Array.from(new Set([...baseResources,...roleResources[auth.member.role]||[],...modules])).filter(k=>auth.member.role!=='platform_admin'||['schools','banners','announcements','questionBank'].includes(k)),[auth.member.role,modules]);
  const queries=useQueries({queries:resources.map(kind=>{
    const page=pages[kind]||{offset:0,search:''};
    const includeFinance=kind==='students'&&modules.includes('feeItems');
    return {queryKey:['resource',scope.membershipId,activeYear?.id,kind,page,...(kind==='students'?[includeFinance]:[])],enabled:!!metadata.data,queryFn:({signal}:{signal:AbortSignal})=>request<Page>(`/resources/${kind}?${new URLSearchParams({limit:'25',offset:String(page.offset),search:page.search,...includeFinance?{includeFinance:'true'}:{},...page.classId?{classId:page.classId}:{}})}`,{scope:effectiveScope,signal}),staleTime:30000,retry:false};
  })});
  const collections:Record<string,Record<string,unknown>[]>=Object.fromEntries(['schools','classes','students','schedule','announcements','banners','notifications','grades','homework','homeworkSubmissions','exams','teachers','vicePrincipals','feeItems','questionBank','attendanceSessions'].map(k=>[k,[]]));
  resources.forEach((kind,i)=>{collections[kind]=queries[i].data?.items||[];});
  const loadResource=useCallback((kind:string)=>setModules(previous=>previous.includes(kind)?previous:[...previous,kind]),[]);
  const summary=useQuery({queryKey:['dashboard',scope.membershipId,activeYear?.id],enabled:!!metadata.data,queryFn:({signal})=>request<Record<string,number>>('/dashboard',{scope:effectiveScope,signal}),staleTime:30000});
  const absencePage=pages.dailyAbsences||{offset:0,search:''};
  const absences=useQuery({queryKey:['daily-absences',scope.membershipId,activeYear?.id,absencePage],enabled:!!metadata.data&&!!activeYear&&['principal','vice_principal'].includes(auth.member.role),queryFn:({signal})=>request<{items:RemoteApp['dailyAbsences'];total:number}>(`/attendance/daily-absences?${new URLSearchParams({limit:'25',offset:String(absencePage.offset),search:absencePage.search})}`,{scope:effectiveScope,signal}),staleTime:30000});
  const linked=metadata.data?.currentStudentId;
  const dossier=useQuery({queryKey:['student',scope.membershipId,activeYear?.id,selectedId||linked],enabled:!!metadata.data&&!!(selectedId||linked),queryFn:({signal})=>request<Student>(`/students/${selectedId||linked}`,{scope:effectiveScope,signal}),retry:false});
  const studentList=(collections.students||[]) as unknown as Student[];
  const currentStudent=linked?(dossier.data?.id===linked?dossier.data:studentList.find(s=>s.id===linked)):undefined;
  const selectedStudent=selectedId&&dossier.data?.id===selectedId?dossier.data:null;
  const school=(collections.schools||[]).find(s=>s.id===auth.member.school_id);
  const activePermissions={...denied,...auth.member.permissions,...auth.member.role==='vice_principal'?(metadata.data?.profile?.permissions as Partial<VicePrincipalPermissions>||{}):{}};
  const canManageSchool=(permission:keyof VicePrincipalPermissions)=>auth.member.role==='principal'||(auth.member.role==='vice_principal'&&activePermissions[permission]);
  const retryKeys=React.useRef(new Map<string,string>());
  const execute=async(path:string,body:unknown,method='POST',headers?:Record<string,string>)=>{
    const fingerprint=JSON.stringify([scope.membershipId,activeYear?.id,path,body,method]);
    const key=retryKeys.current.get(fingerprint)||crypto.randomUUID();retryKeys.current.set(fingerprint,key);setBusy(true);
    try{
      const result=await request<Record<string,unknown>>(path,{method,body,scope:effectiveScope,key,headers});
      retryKeys.current.delete(fingerprint);
      const [,group,name]=path.split('/');
      const refreshKinds=group==='resources'?independentResourceRefresh[name]:group==='commands'?independentCommandRefresh[name]:undefined;
      if(refreshKinds){
        // A committed write succeeds independently of the subsequent list refresh.
        void client.invalidateQueries({predicate:q=>q.queryKey[0]==='resource'&&q.queryKey[1]===scope.membershipId&&q.queryKey[2]===activeYear?.id&&refreshKinds.includes(String(q.queryKey[3]))}).catch(()=>{
          // Fetch errors remain visible through the existing query error/retry UI.
        });
      }else{
        await client.invalidateQueries({predicate:q=>q.queryKey[0]!=='auth'});
      }
      setToast({title:'عملیات ثبت شد',message:'اطلاعات با موفقیت در سرور ذخیره شد.',type:'success'});return {ok:true,...result};
    }catch(e){const error=e instanceof Error?e.message:'ثبت ممکن نشد.';setToast({title:'ثبت انجام نشد',message:error,type:'warning'});return {ok:false,error};}
    finally{setBusy(false);}
  };
  const command=(action:string,body:Record<string,unknown>)=>execute(`/commands/${action}`,body);
  const prepare=async(kind:string,input:Record<string,unknown>)=>{
    const data={...input};const purpose=kind==='homework'?'homework':kind==='homeworkSubmissions'?'submission':'post';
    const uploaded=new Map<string,string>();
    if(Array.isArray(data.attachments))data.attachments=await Promise.all(data.attachments.map(async(file:Record<string,unknown>)=>{const url=typeof file.url==='string'?await uploadDataUrl(file.url,String(file.name),effectiveScope,{purpose,...data.classGroupId?{classId:String(data.classGroupId)}:{}}):undefined;if(typeof file.url==='string'&&url)uploaded.set(file.url,url);return {...file,url};}));
    for(const key of ['coverImage','imageUrl'])if(typeof data[key]==='string'&&data[key].startsWith('data:'))data[key]=uploaded.get(data[key])||await uploadDataUrl(data[key],key,effectiveScope,{purpose:'post'});
    return data;
  };
  const create=async(kind:string,input:Record<string,unknown>)=>{
    try{return await execute(`/resources/${kind}`,await prepare(kind,input));}catch(e){const error=(e as Error).message;setToast({title:'پیوست ثبت نشد',message:error,type:'warning'});return {ok:false,error};}
  };
  const version=(kind:string,id:string)=>Number((collections[kind]||[]).find(r=>r.id===id)?.version||(kind==='students'&&dossier.data?.id===id?(dossier.data as Student&{version:number}).version:0));
  const update=(kind:string,id:string,changes:Record<string,unknown>)=>execute(`/resources/${kind}/${id}`,{version:version(kind,id),changes},'PATCH');
  const remove=(kind:string,id:string)=>execute(`/resources/${kind}/${id}`,undefined,'DELETE',{'If-Match':String(version(kind,id))});
  const actions:Record<string,unknown>={
    addSchool:(v:Record<string,unknown>)=>create('schools',v),addStudent:(v:Record<string,unknown>)=>create('students',v),updateStudent:(id:string,v:Record<string,unknown>)=>update('students',id,v),removeStudent:(studentId:string)=>command('remove-student',{studentId}),
    addClassGroup:(v:Record<string,unknown>)=>create('classes',v),deleteClassGroup:(id:string)=>remove('classes',id),addScheduleSlot:(v:Record<string,unknown>)=>create('schedule',v),updateScheduleSlot:(v:Record<string,unknown>)=>{const {id,version:_,schoolId:__,academicYearId:___,...changes}=v;return update('schedule',String(id),changes);},deleteScheduleSlot:(id:string)=>remove('schedule',id),
    addTeacher:(v:Record<string,unknown>)=>create('teachers',v),updateTeacher:(id:string,v:Record<string,unknown>)=>update('teachers',id,v),deleteTeacher:(id:string)=>remove('teachers',id),addVicePrincipal:(v:Record<string,unknown>)=>create('vicePrincipals',v),updateVicePrincipal:(id:string,v:Record<string,unknown>)=>update('vicePrincipals',id,v),deleteVicePrincipal:(id:string)=>remove('vicePrincipals',id),
    convertTeacherToVicePrincipal:(id:string,roleTitle:string,permissions?:object)=>command('convert-staff',{id,to:'vice_principal',roleTitle,permissions}),convertVicePrincipalToTeacher:(id:string,teachingSubjects:string[],assignedClassIds:string[])=>command('convert-staff',{id,to:'teacher',teachingSubjects,assignedClassIds}),
    updateVicePrincipalProfilePermissions:(vpId:string,permissions:object)=>command('permissions',{vpId,permissions}),updateVicePrincipalPermissions:(permissions:object)=>command('permissions',{vpId:metadata.data?.profile?.id,permissions}),
    submitAttendance:(scheduleSlotId:string,records:unknown[],platform:string)=>command('attendance',{scheduleSlotId,records,platform}),addGradeItem:(v:Record<string,unknown>)=>create('grades',v),addHomework:(v:Record<string,unknown>)=>create('homework',v),submitHomework:(v:Record<string,unknown>)=>create('homeworkSubmissions',v),gradeHomeworkSubmission:(submissionId:string,score:number,feedback:string)=>command('homework-grade',{submissionId,score,feedback}),addOnlineExam:(v:Record<string,unknown>)=>create('exams',v),
    addQuestionBankItem:(v:Record<string,unknown>)=>create('questionBank',v),addBannerAd:(v:Record<string,unknown>)=>create('banners',v),updateBannerAd:(id:string,v:Record<string,unknown>)=>update('banners',id,v),toggleBannerStatus:(id:string)=>command('banner-status',{id}),clickBanner:(id:string)=>request<Record<string,unknown>>('/commands/banner-click',{method:'POST',body:{id},scope:effectiveScope,key:crypto.randomUUID()}).then(result=>({ok:true,...result})).catch(e=>({ok:false,error:e instanceof Error?e.message:'ثبت کلیک ممکن نشد.'})),addAnnouncement:(v:Record<string,unknown>)=>create('announcements',v),updateAnnouncement:async(id:string,v:Record<string,unknown>)=>{try{return await update('announcements',id,await prepare('announcements',v));}catch(e){return {ok:false,error:(e as Error).message};}},deleteAnnouncement:(id:string)=>remove('announcements',id),togglePinAnnouncement:(id:string)=>command('pin-announcement',{id}),
    addDisciplinaryRecord:(studentId:string,record:object)=>command('discipline',{studentId,record}),updateParentContact:(studentId:string,changes:object)=>command('contact',{studentId,changes}),sendNotification:(v:Record<string,unknown>)=>command('notify',{studentId:v.studentId,message:v.message,platform:v.platform}),
    transferStudentClass:(studentId:string,classGroupId:string)=>command('student-status',{studentId,status:'active',classGroupId}),markStudentActive:(studentId:string,classGroupId:string)=>command('student-status',{studentId,status:'active',classGroupId}),markStudentGraduated:(studentId:string,details:object)=>command('student-status',{studentId,status:'graduated',details}),markStudentTransferred:(studentId:string,details:object)=>command('student-status',{studentId,status:'transferred',details}),
    setActiveTermId:(termId:string)=>command('term',{termId}),addAcademicYear:(v:Record<string,unknown>)=>create('academicYears',v),updateAcademicYear:(id:string,changes:Record<string,unknown>)=>execute(`/resources/academicYears/${id}`,{version:Number((metadata.data?.years as unknown as Record<string,unknown>[]||[]).find(y=>y.id===id)?.version),changes},'PATCH'),rolloverAcademicYear:(v:Record<string,unknown>)=>command('rollover',v),
    addFeeItem:(v:Record<string,unknown>)=>create('feeItems',v),updateFeeItem:(id:string,v:Record<string,unknown>)=>update('feeItems',id,v),deleteFeeItem:(id:string)=>remove('feeItems',id),assignFeeItemToStudents:(feeItemId:string,targetScope:string,classGroupId?:string)=>command('assign-fee',{feeItemId,targetScope,classGroupId}),
    recordStudentPayment:async(v:Record<string,unknown>)=>{try{const input={...v};if(input.method==='online')return {ok:false,error:'درگاه پرداخت هنوز فعال نشده است.'};if(input.methodDetails){const details={...input.methodDetails as Record<string,unknown>};if(typeof details.receiptImageUrl==='string')details.receiptImageUrl=await uploadDataUrl(details.receiptImageUrl,'receipt',effectiveScope,{purpose:'receipt',studentId:String(input.studentId)});input.methodDetails=details;}return await command('payment',input);}catch(e){return {ok:false,error:(e as Error).message};}},updatePaymentTransactionStatus:(studentId:string,transactionId:string,status:string)=>command('payment-status',{studentId,transactionId,status}),applyStudentDiscount:(studentId:string,feeItemId:string,amount:number,reason:string)=>command('discount',{studentId,feeItemId,amount,reason}),sendPaymentReminder:(studentId:string,message?:string)=>command('payment-reminder',{studentId,message:message||'لطفاً وضعیت بدهی پرونده مدرسه را بررسی کنید.'}),
  };
  const setActiveAcademicYearId=(id:string)=>{if(!metadata.data?.years.some(y=>y.id===id))return;void client.cancelQueries({predicate:q=>q.queryKey[0]!=='auth'});client.removeQueries({predicate:q=>q.queryKey[0]!=='auth'});setSelectedId(null);setPages({});setYear(id);};
  const setCurrentRole=(role:UserRole)=>{const m=auth.memberships.find(m=>m.role===role&&m.school_id===auth.member.school_id)||auth.memberships.find(m=>m.role===role);if(m)auth.select(m.id);};
  const openStudentDossier=(student:Student,tab:AppContextType['dossierInitialTab']='profile')=>{setDossierInitialTab(tab);setSelectedId(student.id);};
  if(metadata.isPending)return <Status text="در حال دریافت اطلاعات مدرسه…"/>;
  if(metadata.error)return <Status text={metadata.error.message} onRetry={()=>void metadata.refetch()}/>;
  if(!entered.current){if(queries.some(query=>query.isPending)||(linked&&dossier.isPending))return <Status text="در حال دریافت اطلاعات…"/>;entered.current=true;}
  const errors=queries.filter(q=>q.error).map(q=>q.error!.message);
  const value={...collections,...actions,currentRole:auth.member.role,setCurrentRole,currentSchoolId:auth.member.school_id||'',setCurrentSchoolId:(id:string)=>{const m=auth.memberships.find(m=>m.school_id===id);if(m)auth.select(m.id);},currentSchool:school?{...school,studentCount:summary.data?.students??school.studentCount,teacherCount:summary.data?.teachers??school.teacherCount,classesCount:summary.data?.classes??school.classesCount,attendanceRateToday:summary.data?.attendanceRate??0,attendanceRecordedCount:summary.data?.recorded??0}:undefined,currentUser:metadata.data!.user,currentStudent,schoolClock:clock,
    academicYears:metadata.data!.years,activeAcademicYearId:activeYear?.id||'',activeAcademicYear:activeYear,activeTerm:activeYear?.terms.find(t=>t.id===activeYear.currentTermId),isViewingArchivedYear:activeYear?.status==='archived',isViewingNonCurrentYear:!!activeYear&&!activeYear.isCurrent,setActiveAcademicYearId,returnToCurrentAcademicYear:()=>{if(currentYear)setActiveAcademicYearId(currentYear.id);},
    vicePrincipalPermissions:activePermissions,activeVicePrincipalPermissions:activePermissions,activeVicePrincipalId:metadata.data?.profile?.id||'',setActiveVicePrincipalId:()=>{},canManageSchool,
    selectedStudentForDossier:selectedStudent,setSelectedStudentForDossier:(s:Student|null)=>{if(s)openStudentDossier(s,dossierInitialTab);else setSelectedId(null);},openStudentDossier,dossierInitialTab,setDossierInitialTab,activeMobileTab,setActiveMobileTab,activeToast,clearToast:()=>setToast(null),resetAllData:()=>{},findStudentForEnrollment:(nationalCode:string)=>studentList.find(s=>s.nationalCode===nationalCode),
    page:(kind:string)=>({...pages[kind]||{offset:0,search:''},total:kind==='dailyAbsences'?absences.data?.total||0:queries[resources.indexOf(kind)]?.data?.total||0,loading:kind==='dailyAbsences'?absences.isFetching:queries[resources.indexOf(kind)]?.isFetching||false}),setPage:(kind:string,change:Partial<PageState>)=>setPages(previous=>({...previous,[kind]:{...previous[kind]||{offset:0,search:''},...change}})),loadResource,busy,dashboard:summary.data||{},dailyAbsences:absences.data?.items||[],
    students:studentList.map(s=>dossier.data?.id===s.id?dossier.data:s),
  } as unknown as RemoteApp;
  return <Context.Provider value={value}>{errors.length>0&&<div role="alert" className="bg-rose-50 text-rose-800 p-3 text-sm text-center">{errors[0]}<button className="min-h-11 px-3 font-bold" onClick={()=>void client.invalidateQueries({queryKey:['resource']})}>تلاش مجدد</button></div>}{selectedId&&dossier.error&&<div role="alert" className="p-3 bg-rose-50 text-rose-800">{dossier.error.message}<button className="min-h-11 px-3" onClick={()=>setSelectedId(null)}>بستن</button></div>}{children}</Context.Provider>;
};
export function useApp(){const context=useContext(Context);if(!context)throw new Error('useApp requires AppProvider');return context;}
export function useResource(kind:string){const app=useApp();useEffect(()=>app.loadResource(kind),[kind,app.loadResource]);}
export function useClassRoster(classId:string|undefined){const auth=useAuth();const app=useApp();return useQuery({queryKey:['roster',auth.member.id,app.activeAcademicYearId,classId],enabled:!!classId,queryFn:({signal})=>request<{items:Student[]}>(`/classes/${classId}/roster`,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),retry:false,staleTime:30000});}
