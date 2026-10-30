import type {GradeView} from '../../shared/academic';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../auth/AuthContext';
import {useApp} from '../context/AppContext';
import {request} from './client';
import type {AttendanceSession} from '../types';

export function useStudentRecords<T>(studentId:string,kind:'grades'|'attendanceSessions',offset:number,gradeView:GradeView='all',inspection?:{schoolId:string;yearId:string},enabled=true){
  const auth=useAuth(),app=useApp();
  const yearId=inspection?.yearId||app.activeAcademicYearId,base=inspection?`/platform/schools/${inspection.schoolId}/inspection/years/${inspection.yearId}`:'';
  return useQuery({queryKey:['student-records',auth.member.id,yearId,studentId,kind,offset,gradeView,inspection?.schoolId||'self'],enabled,queryFn:({signal})=>request<{items:T[];total:number}>(`${base}/students/${studentId}/records/${kind}?offset=${offset}${kind==='grades'?`&gradeView=${gradeView}`:''}`,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId}}),staleTime:30000,retry:false});
}
export function useAttendanceSession(scheduleSlotId:string|undefined,enabled=true){
  const auth=useAuth(),app=useApp();
  return useQuery({queryKey:['attendance-session',auth.member.id,app.activeAcademicYearId,scheduleSlotId,app.schoolClock.date],enabled:enabled&&!!scheduleSlotId,queryFn:({signal})=>request<AttendanceSession|null>(`/attendance/session?scheduleSlotId=${scheduleSlotId}`,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),staleTime:15000});
}
