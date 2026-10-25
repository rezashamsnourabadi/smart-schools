import { AttendanceEntry, AttendanceSession, AttendanceStats, AttendanceStatus, ScheduleSlot, Student } from '../types';
import { normalizeSchoolDate, SchoolClock, toEnglishDigits } from './persianUtils';

export class AttendanceError extends Error {}
export const attendanceLabels: Record<AttendanceStatus, string> = { present: 'حاضر', absent: 'غایب', late: 'با تأخیر', excused: 'غیبت موجه' };
export const attendanceLabel = (status?: AttendanceStatus) => status ? attendanceLabels[status] : 'ثبت نشده';
const severity: Record<AttendanceStatus, number> = { present: 0, excused: 1, late: 2, absent: 3 };
const isStatus = (value: string): value is AttendanceStatus => Object.hasOwn(severity, value);

export function schoolTimeMinutes(time: string): number | undefined {
  const match = toEnglishDigits(time).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return match && +match[1] < 24 && +match[2] < 60 ? +match[1] * 60 + +match[2] : undefined;
}
export function isSlotLive(slot: ScheduleSlot, clock: SchoolClock): boolean {
  const start = schoolTimeMinutes(slot.startTime), end = schoolTimeMinutes(slot.endTime);
  return slot.dayOfWeek === clock.dayOfWeek && start !== undefined && end !== undefined && start <= clock.minuteOfDay && clock.minuteOfDay < end;
}
export function attendanceKey(session: Pick<AttendanceSession, 'schoolId' | 'classGroupId' | 'date' | 'period'>): string | undefined {
  const date = normalizeSchoolDate(session.date);
  return date && session.schoolId && session.classGroupId && Number.isInteger(session.period) && session.period >= 1 && session.period <= 4
    ? `${session.schoolId}:${session.classGroupId}:${date}:${session.period}` : undefined;
}
function latest(a: AttendanceSession, b: AttendanceSession): AttendanceSession {
  const time = (item: AttendanceSession) => schoolTimeMinutes(item.updatedAt || item.submittedAt) ?? -1;
  return time(b) > time(a) || (time(a) === time(b) && (b.revision || 0) > (a.revision || 0)) ? b : a;
}
export function canonicalAttendance(sessions: AttendanceSession[]): AttendanceSession[] {
  const unique = new Map<string, AttendanceSession>();
  for (const session of sessions) {
    const key = attendanceKey(session);
    if (!key) continue;
    const old = unique.get(key);
    unique.set(key, old ? latest(old, session) : session);
  }
  return [...unique.values()];
}

export interface AttendanceChange { studentId: string; status: AttendanceStatus; previousStatus?: AttendanceStatus }
export function upsertAttendance(sessions: AttendanceSession[], draft: AttendanceSession) {
  const key = attendanceKey(draft);
  if (!key || !draft.records.length || new Set(draft.records.map((row) => row.studentId)).size !== draft.records.length || draft.records.some((row) => !isStatus(row.status))) throw new AttendanceError('اطلاعات جلسه یا وضعیت دانش‌آموزان معتبر نیست.');
  const matches = sessions.filter((session) => attendanceKey(session) === key);
  const previous = matches.reduce<AttendanceSession | undefined>((old, item) => old ? latest(old, item) : item, undefined);
  if (previous?.academicYearId && draft.academicYearId && previous.academicYearId !== draft.academicYearId) throw new AttendanceError('این جلسه به سال تحصیلی دیگری تعلق دارد.');
  const sortedRecords = (records: AttendanceEntry[]) => records.slice().sort((a, b) => a.studentId.localeCompare(b.studentId)).map((row) => [row.studentId, row.status, row.note || '']);
  const same = previous && JSON.stringify(sortedRecords(previous.records)) === JSON.stringify(sortedRecords(draft.records)) && previous.teacherId === draft.teacherId && previous.subject === draft.subject && previous.className === draft.className && previous.academicYearId === draft.academicYearId && previous.scheduleSlotId === draft.scheduleSlotId;
  if (same && matches.length === 1) return { sessions, session: previous, changed: false, changes: [] as AttendanceChange[] };
  const changes = draft.records.flatMap<AttendanceChange>((row) => {
    const old = previous?.records.find((item) => item.studentId === row.studentId)?.status;
    return old !== row.status && (row.status === 'absent' || row.status === 'late' || old === 'absent' || old === 'late') ? [{ studentId: row.studentId, status: row.status, previousStatus: old }] : [];
  });
  const session: AttendanceSession = {
    ...draft, id: previous?.id || `attendance:${key}`, date: normalizeSchoolDate(draft.date)!,
    submittedAt: previous?.submittedAt || draft.submittedAt, updatedAt: draft.updatedAt || draft.submittedAt,
    revision: (previous?.revision || 0) + 1,
    sentNotificationsCount: matches.reduce((total, old) => total + old.sentNotificationsCount, 0) + changes.length,
    previousVersions: matches.flatMap(({ previousVersions, ...snapshot }) => [...(previousVersions || []), snapshot])
  };
  return { sessions: [session, ...sessions.filter((old) => attendanceKey(old) !== key)], session, changed: true, changes };
}

/** Each date contributes once. Absence > late > excused > present describes incidents during that day. */
export function recordedAttendance(student: Student, sessions: AttendanceSession[], today: string): Student {
  const days = new Map<string, AttendanceStatus>();
  for (const session of canonicalAttendance(sessions)) {
    if (session.schoolId !== student.schoolId || (student.attendanceAcademicYearId && session.academicYearId !== student.attendanceAcademicYearId)) continue;
    const row = session.records.find((item) => item.studentId === student.id);
    const date = normalizeSchoolDate(session.date);
    if (!row || !date || date > (normalizeSchoolDate(today) || '') || !isStatus(row.status)) continue;
    const old = days.get(date);
    if (!old || severity[row.status] > severity[old]) days.set(date, row.status);
  }
  const stats: AttendanceStats = { totalDays: days.size, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 };
  const field: Record<AttendanceStatus, keyof AttendanceStats> = { present: 'presentDays', absent: 'absentDays', late: 'lateDays', excused: 'excusedDays' };
  for (const status of days.values()) stats[field[status]] += 1;
  const legacy = student.legacyAttendanceStats || (student.attendanceStatsSource !== 'sessions' ? student.attendanceStats : undefined);
  return { ...student, attendanceStats: stats, attendanceStatsSource: 'sessions', todayStatus: days.get(normalizeSchoolDate(today) || ''), legacyAttendanceStats: legacy?.totalDays ? legacy : student.legacyAttendanceStats };
}

export function schoolAttendance(students: Student[], sessions: AttendanceSession[], schoolId: string, today: string) {
  const daily = students.filter((student) => student.schoolId === schoolId && (!student.status || student.status === 'active')).map((student) => recordedAttendance(student, sessions, today));
  const recorded = daily.filter((student) => student.todayStatus !== undefined);
  const present = recorded.filter((student) => student.todayStatus === 'present' || student.todayStatus === 'late').length;
  return { recordedCount: recorded.length, studentCount: daily.length, rate: recorded.length ? Math.round(present / recorded.length * 1000) / 10 : undefined };
}

export function dailyAbsences(students: Student[], sessions: AttendanceSession[], today: string) {
  const current = canonicalAttendance(sessions).filter((session) => normalizeSchoolDate(session.date) === normalizeSchoolDate(today));
  return students.filter((student) => !student.status || student.status === 'active').flatMap((student) => {
    const session = current.filter((item) => item.schoolId === student.schoolId && (!student.attendanceAcademicYearId || item.academicYearId === student.attendanceAcademicYearId)).sort((a, b) => b.period - a.period).find((item) => item.records.some((row) => row.studentId === student.id && row.status === 'absent'));
    return session ? [{ student, session, note: session.records.find((row) => row.studentId === student.id)?.note }] : [];
  });
}
