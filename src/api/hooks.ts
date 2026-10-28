import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../auth/AuthContext';
import {useApp} from '../context/AppContext';
import {request} from './client';
import type {AttendanceSession} from '../types';

export function useStudentRecords<T>(studentId:string,kind:'grades'|'attendanceSessions',offset:number){
  const auth=useAuth(),app=useApp();
  return useQuery({queryKey:['student-records',auth.member.id,app.activeAcademicYearId,studentId,kind,offset],queryFn:({signal})=>request<{items:T[];total:number}>(`/students/${studentId}/records/${kind}?offset=${offset}`,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),staleTime:30000});
}
export function useAttendanceSession(scheduleSlotId:string|undefined,enabled=true){
  const auth=useAuth(),app=useApp();
  return useQuery({queryKey:['attendance-session',auth.member.id,app.activeAcademicYearId,scheduleSlotId,app.schoolClock.date],enabled:enabled&&!!scheduleSlotId,queryFn:({signal})=>request<AttendanceSession|null>(`/attendance/session?scheduleSlotId=${scheduleSlotId}`,{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId}}),staleTime:15000});
}
