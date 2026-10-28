import type {QueryClient} from '@tanstack/react-query';
export type TeacherChange={kind:'attendance'|'grades'|'homework'|'exams'|'submission'|'event';classId?:string;subject?:string;studentId?:string;slotId?:string};
const kinds:Record<TeacherChange['kind'],string[]>={attendance:['sessions'],grades:['grades'],homework:['homework'],exams:['exams'],submission:['homework','submissions'],event:['events']};
/** Refresh related views only; a successful write does not wait for these reads. */
export function refreshTeacherData(client:QueryClient,membership:string,year:string|undefined,change:TeacherChange){
 return client.invalidateQueries({predicate:query=>{
  const key=query.queryKey;if(key[1]!==membership||key[2]!==year)return false;
  if(key[0]==='attendance-session')return change.kind==='attendance'&&(!change.slotId||key[3]===change.slotId);
  if(key[0]==='resource')return (change.kind==='attendance'?['attendanceSessions']:change.kind==='submission'?['homework','homeworkSubmissions']:kinds[change.kind]).includes(String(key[3]));
  if(key[0]!=='teacher'||typeof key[3]!=='string')return false;
  const path=new URL(key[3],'http://cache.local');
  if(change.classId&&path.searchParams.get('classId')!==change.classId)return false;
  if(change.subject&&path.searchParams.get('subject')!==change.subject)return false;
  if(path.pathname==='/teacher/classes')return false;
  if(path.pathname==='/teacher/classroom')return ['attendance','homework','submission'].includes(change.kind);
  if(path.pathname==='/teacher/records')return kinds[change.kind].includes(path.searchParams.get('kind')||'');
  if(path.pathname.startsWith('/teacher/student/'))return !change.studentId||path.pathname===`/teacher/student/${change.studentId}`;
  return false;
 }});
}
