import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider, useApp } from '../src/context/AppContext';
import { INITIAL_ACADEMIC_YEARS, INITIAL_CLASSES, INITIAL_SCHOOLS, INITIAL_STUDENTS } from '../src/data/mockData';
import { ReportCard, Student, YearRolloverOptions } from '../src/types';
import { isFinalYearRecordPublished, rolloverStudents } from '../src/utils/academicYear';

const schoolId = INITIAL_SCHOOLS[0].id;
const otherSchoolId = INITIAL_SCHOOLS[1].id;
const reportCard = (year: string, term: 'term1' | 'term2' = 'term2', status: 'قبول' | 'تجدید' = 'قبول', gpa = 18.75): ReportCard => ({
  year,
  term,
  termTitle: term === 'term2' ? 'نوبت دوم' : 'نوبت اول',
  gpa,
  rankInClass: 2,
  disciplineScore: 19,
  isPublished: true,
  subjects: [{ name: 'ریاضی', unit: 2, continuousScore: 18, finalScore: 19, totalScore: 18.5, status, teacherName: 'دبیر نمونه' }]
});
const baseStudent: Student = {
  ...INITIAL_STUDENTS[0],
  schoolId,
  grade: 'پایه دهم',
  fieldOfStudy: 'ریاضی و فیزیک',
  classGroupId: 'old-class',
  status: 'active',
  pendingClassGrade: undefined,
  attendanceAcademicYearId: 'ay-1404-1405',
  attendanceStats: { totalDays: 20, presentDays: 17, absentDays: 1, lateDays: 1, excusedDays: 1 },
  pastYearHistory: [],
  reportCards: []
};
const options: YearRolloverOptions = { newYearTitle: '۱۴۰۵-۱۴۰۶', promoteStudents: true, graduateTwelfthGraders: true, archiveCurrentGrades: true, resetAttendanceLogs: true };
const classes = [{ ...INITIAL_CLASSES[0], id: 'grade-11-math', schoolId, grade: 'پایه یازدهم', major: baseStudent.fieldOfStudy, studentCount: 900 }];
const roll = (students: Student[], classList = classes) => rolloverStudents(students, classList, {
  schoolId,
  schoolName: INITIAL_SCHOOLS[0].name,
  currentYearTitle: '۱۴۰۴-۱۴۰۵',
  newYearId: 'new-year',
  newYearTitle: options.newYearTitle,
  options
});

const noCard = { ...baseStudent, id: 'no-card' };
const noCardResult = roll([noCard]);
assert.equal(noCardResult.students[0].grade, noCard.grade);
assert.equal(noCardResult.students[0].status, 'active');
assert.equal(noCardResult.students[0].pastYearHistory.length, 0, 'Missing records must not create a fake GPA or pass result');
assert.equal(noCardResult.notEligible, 1);
assert.deepEqual(noCardResult.students[0].attendanceStats, { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 });
assert.equal(noCardResult.students[0].attendanceAcademicYearId, 'new-year');

const firstTerm = { ...baseStudent, id: 'first-term', reportCards: [reportCard('۱۴۰۴-۱۴۰۵', 'term1')] };
const firstTermResult = roll([firstTerm]);
assert.equal(firstTermResult.students[0].grade, 'پایه دهم', 'A term-one report must not imply annual promotion');
assert.equal(firstTermResult.students[0].pastYearHistory[0].status, 'نتیجه ثبت نشده');

const failedFinal = { ...baseStudent, id: 'failed-final', reportCards: [reportCard('۱۴۰۴-۱۴۰۵', 'term2', 'تجدید')] };
const failedResult = roll([failedFinal]);
assert.equal(failedResult.students[0].grade, 'پایه دهم');
assert.equal(failedResult.students[0].pastYearHistory[0].status, 'دارای تجدید');

const passed = { ...baseStudent, id: 'passed', reportCards: [reportCard('۱۴۰۴-۱۴۰۵')] };
assert.equal(isFinalYearRecordPublished(passed, '1404-1405'), true, 'Persian and ASCII year titles must match');
const passedResult = roll([passed]);
assert.equal(passedResult.students[0].grade, 'پایه یازدهم');
assert.equal(passedResult.students[0].classGroupId, 'grade-11-math');
assert.equal(passedResult.promoted, 1);
assert.equal(passedResult.students[0].pastYearHistory[0].gpa, 18.75, 'Only a stored report-card score may be copied');

const noMatchingClass = { ...passed, id: 'no-matching-class', fieldOfStudy: 'علوم انسانی' };
const pendingResult = roll([noMatchingClass]);
assert.equal(pendingResult.students[0].status, 'pending_class_assignment');
assert.equal(pendingResult.students[0].pendingClassGrade, 'پایه یازدهم');
assert.equal(pendingResult.students[0].classGroupId, '', 'A promoted student must not remain in the old class');
assert.equal(pendingResult.pendingClassAssignment, 1);

const passedTwelfth = { ...passed, id: 'passed-twelfth', grade: 'پایه دوازدهم', classGroupId: 'grade-12', graduationDetails: undefined };
const graduation = roll([passedTwelfth]);
assert.equal(graduation.students[0].status, 'graduated');
assert.equal(graduation.graduated, 1);

const malformedFinal = { ...passed, id: 'invalid-score', reportCards: [reportCard('۱۴۰۴-۱۴۰۵', 'term2', 'قبول', 25)] };
assert.equal(isFinalYearRecordPublished(malformedFinal, '۱۴۰۴-۱۴۰۵'), false, 'Invalid stored scores must not authorize progression');

const foreignStudent = { ...passed, id: 'other-school', schoolId: otherSchoolId };
const multiSchool = roll([passed, foreignStudent]);
assert.equal(multiSchool.students[1], foreignStudent, 'Rollover must preserve other-school records unchanged');

const fixture = new Map<string, string>();
fixture.set('smart_school_hub_data_v2_active_year_id', 'ay-1403-1404');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => fixture.get(key) ?? null } });
const captures: ReturnType<typeof useApp>[] = [];
function Probe() { captures.push(useApp()); return null; }
renderToString(createElement(AppProvider, { children: createElement(Probe) }));
const view = captures[0];
assert.ok(view && view.isViewingArchivedYear && view.isViewingNonCurrentYear);
const beforeStudents = JSON.stringify(view.students);
const rollover = view.rolloverAcademicYear(options);
assert.equal(rollover.ok, false, 'An archived year must not allow rollover writes');
const { id: _id, attendanceStats: _stats, disciplinaryRecords: _discipline, reportCards: _reports, pastYearHistory: _history, financialSummary: _finance, ...newStudent } = INITIAL_STUDENTS[0];
view.addStudent(newStudent);
assert.equal(JSON.stringify(view.students), beforeStudents, 'An archived year must reject student mutations');
assert.equal(view.academicYears.find((year) => year.id === 'ay-1404-1405')?.isCurrent, true);

console.log('Academic-year eligibility, actual record archive, school isolation, pending class assignment and archived write guards: passed');
