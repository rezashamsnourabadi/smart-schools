import assert from 'node:assert/strict';
import { ScheduleSlot } from '../src/types';
import { scheduleConflict } from '../src/utils/schedule';

const makeSlot = (id: string, classGroupId: string, teacherId: string): ScheduleSlot => ({
  id,
  schoolId: 'school-1',
  classGroupId,
  className: classGroupId,
  teacherId,
  teacherName: teacherId,
  subject: 'ریاضی',
  dayOfWeek: 'دوشنبه',
  period: 1,
  startTime: '۰۸:۰۰',
  endTime: '۰۹:۳۰'
});
const first = makeSlot('one', 'class-a', 'teacher-a');
assert.match(scheduleConflict([first], { ...first, id: 'new' }) || '', /این کلاس/);
assert.match(scheduleConflict([first], { ...first, id: 'new', classGroupId: 'class-b' }) || '', /این دبیر/);
assert.equal(scheduleConflict([first], { ...first, id: 'new', classGroupId: 'class-b', teacherId: 'teacher-b' }), undefined);
assert.equal(scheduleConflict([first], first, 'one'), undefined, 'Updating a slot must ignore itself');
assert.equal(scheduleConflict([first], { ...first, schoolId: 'school-2', id: 'foreign' }), undefined, 'A different school must not cause a conflict');
console.log('Schedule conflicts for class, teacher, school and self-update: passed');
