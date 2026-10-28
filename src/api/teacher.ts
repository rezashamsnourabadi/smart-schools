import {useRef} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/AuthContext';
import {useApp} from '../context/AppContext';
import {refreshTeacherData,type TeacherChange} from './teacherCache';
import {request} from './client';
import type {TeachingContext,TeacherClasses,Classroom,TeacherRecordMap,TeacherPerformance,PerformanceSection} from '../types/teacher';
export function useTeacherData<T>(path:string,enabled=true,staleTime=15000){
 const auth=useAuth(),app=useApp();
 return useQuery({queryKey:['teacher',auth.member.id,app.activeAcademicYearId,path],enabled:enabled&&!!app.activeAcademicYearId,queryFn:({signal})=>request<T>(path,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),staleTime,retry:false});
}
export function teachingParams(context:TeachingContext|undefined){return new URLSearchParams({classId:context?.classId||'',subject:context?.subject||''}).toString();}
export const useTeacherClasses=()=>useTeacherData<TeacherClasses>('/teacher/classes');
export const useClassroom=(context:TeachingContext|undefined,period=0)=>useTeacherData<Classroom>(`/teacher/classroom?${teachingParams(context)}&period=${period}`,!!context);
export const useTeacherRecords=<K extends keyof TeacherRecordMap>(context:TeachingContext|undefined,kind:K,offset=0,enabled=true)=>useTeacherData<{items:TeacherRecordMap[K][];total:number}>(`/teacher/records?${teachingParams(context)}&kind=${kind}&offset=${offset}`,!!context&&enabled);
export const performancePath=(context:TeachingContext,studentId:string,section:PerformanceSection='overview')=>`/teacher/student/${studentId}?${teachingParams(context)}&section=${section}`;
export const useTeacherPerformance=(context:TeachingContext,studentId:string,section:PerformanceSection='overview')=>useTeacherData<TeacherPerformance>(performancePath(context,studentId,section),true,60000);
export function usePrefetchTeacherPerformance(){
 const auth=useAuth(),app=useApp(),client=useQueryClient();
 return (context:TeachingContext,studentId:string)=>{
  const path=performancePath(context,studentId);
  void client.prefetchQuery({queryKey:['teacher',auth.member.id,app.activeAcademicYearId,path],queryFn:({signal})=>request<TeacherPerformance>(path,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),staleTime:60000}).catch(()=>{});
 };
}
export function useTeacherWrite(){
 const auth=useAuth(),app=useApp(),client=useQueryClient(),keys=useRef(new Map<string,string>());
 return async(path:string,body:unknown,method='POST',context?:{classId:string;subject:string;slotId?:string})=>{
  const fingerprint=JSON.stringify([auth.member.id,app.activeAcademicYearId,path,body,method]);const key=keys.current.get(fingerprint)||crypto.randomUUID();keys.current.set(fingerprint,key);
  const result=await request<Record<string,unknown>>(path,{method,body,key,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}});keys.current.delete(fingerprint);
  const payload=body as {classId?:string;subject?:string;studentId?:string};
  const kind:TeacherChange['kind']=path.startsWith('/teacher/sessions/')?'attendance':path.startsWith('/teacher/grades/')?'grades':'event';
  void refreshTeacherData(client,auth.member.id,app.activeAcademicYearId,{kind,classId:context?.classId||payload.classId,subject:context?.subject||payload.subject,studentId:payload.studentId,slotId:context?.slotId}).catch(()=>{});
  return result;
 };
}
