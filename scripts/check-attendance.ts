import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider, useApp } from '../src/context/AppContext';
import { INITIAL_CLASSES, INITIAL_STUDENTS } from '../src/data/mockData';
import { AttendanceSession, ScheduleSlot } from '../src/types';
import { attendanceKey, AttendanceError, canonicalAttendance, dailyAbsences, isSlotLive, recordedAttendance, schoolAttendance, upsertAttendance } from '../src/utils/attendance';
import { getSchoolClock, normalizeSchoolDate } from '../src/utils/persianUtils';

const beforeMidnight = getSchoolClock(new Date('2026-10-24T20:29:00Z'));
const afterMidnight = getSchoolClock(new Date('2026-10-24T20:45:00Z'));
assert.notEqual(beforeMidnight.date, afterMidnight.date);
assert.equal(afterMidnight.date, '1405/08/03');
assert.equal(afterMidnight.time, '00:15');
assert.equal(afterMidnight.dayOfWeek, 'یکشنبه');
assert.equal(normalizeSchoolDate('۱۴۰۵/۸/۳'), '1405/08/03');
const slot: ScheduleSlot = { id: 'slot', schoolId: 'school-1', classGroupId: 'cls-1', className: 'کلاس نمونه', teacherId: 'user-t1', teacherName: 'دبیر نمونه', subject: 'ریاضی', dayOfWeek: 'یکشنبه', period: 1, startTime: '۰۰:۰۰', endTime: '۰۰:۳۰' };
assert.equal(isSlotLive(slot, afterMidnight), true);
assert.equal(isSlotLive(slot, { ...afterMidnight, minuteOfDay: 30 }), false);
const student = INITIAL_STUDENTS[0];
const second = { ...student, id: 'second' };
const session: AttendanceSession = { ...slot, id: 'draft', academicYearId: 'ay-1404-1405', scheduleSlotId: slot.id, date: afterMidnight.date, submittedAt: '08:00', records: [{ studentId: student.id, status: 'absent' }, { studentId: second.id, status: 'present' }], sentNotificationsCount: 0 };
const rawBefore = JSON.stringify(student);
const first = upsertAttendance([], session);
assert.equal(first.changes.length, 1);
assert.equal(first.session.revision, 1);
assert.equal(first.session.sentNotificationsCount, 1);
const repeated = upsertAttendance(first.sessions, { ...session, date: '۱۴۰۵/۰۸/۰۳', records: session.records.slice().reverse() });
assert.equal(repeated.changed, false);
assert.equal(repeated.sessions, first.sessions);
const correction = upsertAttendance(first.sessions, { ...session, submittedAt: '08:05', records: [{ studentId: student.id, status: 'present' }, { studentId: second.id, status: 'present' }] });
assert.equal(correction.changes[0].previousStatus, 'absent');
assert.equal(correction.changes[0].status, 'present');
assert.equal(correction.session.id, first.session.id);
assert.equal(correction.session.previousVersions?.length, 1);
assert.equal(recordedAttendance(student, correction.sessions, afterMidnight.date).attendanceStats.absentDays, 0);
const anotherPeriod = upsertAttendance(correction.sessions, { ...session, id: 'period-2', period: 2, records: [{ studentId: student.id, status: 'late' }, { studentId: second.id, status: 'absent' }] });
const stats = recordedAttendance(student, anotherPeriod.sessions, afterMidnight.date);
assert.equal(stats.attendanceStats.totalDays, 1, 'Two periods must not count as two days');
assert.equal(stats.attendanceStats.lateDays, 1);
assert.equal(stats.legacyAttendanceStats?.totalDays, student.attendanceStats.totalDays);
assert.equal(stats.todayStatus, 'late');
assert.equal(recordedAttendance(student, anotherPeriod.sessions, '1405/08/04').todayStatus, undefined);
assert.equal(recordedAttendance(student, anotherPeriod.sessions, '1405/08/02').attendanceStats.totalDays, 0);
const thirdPeriod = upsertAttendance(anotherPeriod.sessions, { ...session, id: 'period-3', period: 3 });
assert.equal(recordedAttendance(student, thirdPeriod.sessions, afterMidnight.date).todayStatus, 'absent');
assert.equal(dailyAbsences([student, second], thirdPeriod.sessions, afterMidnight.date).length, 2);
const daily = schoolAttendance([student, second, { ...student, id: 'unrecorded' }], anotherPeriod.sessions, student.schoolId, afterMidnight.date);
assert.equal(daily.recordedCount, 2);
assert.equal(daily.rate, 50);
assert.equal(schoolAttendance([student], [], student.schoolId, afterMidnight.date).rate, undefined);
assert.equal(recordedAttendance({ ...student, attendanceAcademicYearId: 'new-year' }, anotherPeriod.sessions, afterMidnight.date).attendanceStats.totalDays, 0);
const duplicates = [{ ...first.session, id: 'newer', updatedAt: '08:04' }, { ...first.session, id: 'older', updatedAt: '08:01' }];
assert.equal(canonicalAttendance(duplicates).length, 1);
const consolidated = upsertAttendance(duplicates, { ...session, records: correction.session.records, submittedAt: '08:05' });
assert.equal(consolidated.sessions.length, 1);
assert.equal(consolidated.session.previousVersions?.length, 2, 'Duplicate documents must be retained as prior versions');
assert.equal(attendanceKey({ ...session, schoolId: 'school-2' }) === attendanceKey(session), false);
assert.throws(() => upsertAttendance([], { ...session, records: [session.records[0], session.records[0]] }), AttendanceError);
assert.throws(() => upsertAttendance([], { ...session, records: [] }), AttendanceError);
assert.throws(() => upsertAttendance([], { ...session, date: 'invalid' }), AttendanceError);
assert.throws(() => upsertAttendance(first.sessions, { ...session, academicYearId: 'another-year' }), AttendanceError);
assert.equal(JSON.stringify(student), rawBefore);

// Actual Context commands use process-local fixtures and refs, not browser storage or a simulated React runtime.
const now = getSchoolClock();
const day = (['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'] as const).find((value) => value === now.dayOfWeek);
if (day) {
  const currentSlot = { ...slot, dayOfWeek: day, startTime: '00:00', endTime: '23:59' };
  const foreignSlot = { ...currentSlot, id: 'foreign-slot', schoolId: 'school-2' };
  const saved = new Map<string, string>([
    ['smart_school_hub_data_v2_students', JSON.stringify([student, second])],
    ['smart_school_hub_data_v2_classes', JSON.stringify(INITIAL_CLASSES)],
    ['smart_school_hub_data_v2_schedule', JSON.stringify([currentSlot, foreignSlot])],
    ['smart_school_hub_data_v2_attendance', '[]']
  ]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => saved.get(key) ?? null } });
  const captured: ReturnType<typeof useApp>[] = [];
  function Probe() { captured.push(useApp()); return null; }
  renderToString(createElement(AppProvider, { children: createElement(Probe) }));
  const context = captured[0];
  const result = context.submitAttendance(currentSlot.id, session.records, 'bale');
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.notificationsSent, 1);
  const repeat = context.submitAttendance(currentSlot.id, session.records, 'sms');
  assert.equal(repeat.ok && repeat.changed, false);
  assert.equal(repeat.ok && repeat.notificationsSent, 0);
  const changed = context.submitAttendance(currentSlot.id, correction.session.records, 'bale');
  assert.equal(changed.ok && changed.notificationsSent, 1);
  assert.equal(context.submitAttendance(foreignSlot.id, session.records, 'bale').ok, false);
  assert.equal(context.submitAttendance(currentSlot.id, [session.records[0]], 'bale').ok, false);
  assert.equal(saved.get('smart_school_hub_data_v2_attendance'), '[]');
  console.log('Attendance Context commands: passed');
} else console.log('Attendance Context success path skipped on a non-school weekday; pure checks still cover all transitions');
console.log('Attendance deduplication, correction alerts, daily counts, legacy preservation, date boundaries and school isolation: passed');
