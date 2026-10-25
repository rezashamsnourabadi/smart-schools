import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider, useApp } from '../src/context/AppContext';
import { INITIAL_ACADEMIC_YEARS, INITIAL_ANNOUNCEMENTS, INITIAL_CLASSES, INITIAL_NOTIFICATIONS, INITIAL_QUESTION_BANK, INITIAL_SCHOOLS, INITIAL_STUDENTS, INITIAL_USERS } from '../src/data/mockData';
import { INITIAL_FEE_ITEMS } from '../src/data/mockFinanceData';
import { canReadAnnouncement, canReadDossier, canReadNotification, canReadQuestion, canReadStudent, linkedStudent } from '../src/utils/accessScope';

// In-memory fixtures only. These checks never connect to the user's browser storage.
const own = INITIAL_STUDENTS[0];
const foreignSchool = INITIAL_SCHOOLS[1];
const foreign = { ...own, id: 'foreign-student', nationalCode: '0098765432', schoolId: foreignSchool.id, classGroupId: 'foreign-class' };
const schoolIds = [INITIAL_SCHOOLS[0], foreignSchool];
const parent = { ...INITIAL_USERS.parent, schoolId: own.schoolId, childStudentId: own.id };
const learner = { ...INITIAL_USERS.student, schoolId: own.schoolId, studentId: own.id };
const teacher = { ...INITIAL_USERS.teacher, schoolId: own.schoolId, assignedClassIds: [own.classGroupId] };

assert.equal(linkedStudent(parent, own.schoolId, [foreign, own])?.id, own.id);
assert.equal(linkedStudent({ ...learner, studentId: undefined }, own.schoolId, [foreign, own]), undefined);
assert.equal(linkedStudent(parent, foreign.schoolId, [foreign, own]), undefined);
assert.equal(canReadStudent(parent, own.schoolId, foreign), false);
assert.equal(canReadStudent(learner, own.schoolId, { ...own, id: 'unrelated-same-name' }), false);
assert.equal(canReadStudent(teacher, own.schoolId, { ...own, classGroupId: 'unassigned-class' }), false);
assert.equal(canReadStudent(teacher, own.schoolId, own), true);
const noDossier = { canManageAnnouncements: false, canManageSchedule: false, canManageStudentsAndClasses: true, canViewFullDossier: false, canLogDisciplinary: false };
assert.equal(canReadDossier({ ...INITIAL_USERS.vice_principal, schoolId: own.schoolId }, own.schoolId, own, noDossier), false);

const post = { ...INITIAL_ANNOUNCEMENTS[0], schoolId: foreign.schoolId, target: 'all' as const };
assert.equal(canReadAnnouncement(parent, own.schoolId, post), false);
assert.equal(canReadAnnouncement(parent, own.schoolId, { ...post, schoolId: 'all' }), true);
assert.equal(canReadAnnouncement(parent, own.schoolId, { ...post, schoolId: own.schoolId, target: 'teachers' }), false);
const log = { ...INITIAL_NOTIFICATIONS[0], schoolId: own.schoolId, studentId: own.id };
assert.equal(canReadNotification(parent, own.schoolId, log, schoolIds, own, [own, foreign]), true);
assert.equal(canReadNotification(parent, own.schoolId, { ...log, schoolId: foreign.schoolId }, schoolIds, own, [own, foreign]), false);
const legacyLog = { ...log, studentId: undefined, studentName: own.name, recipientPhone: own.parentPhone };
assert.equal(canReadNotification(parent, own.schoolId, legacyLog, schoolIds, own, [own, foreign]), true);
assert.equal(canReadNotification(parent, own.schoolId, legacyLog, schoolIds, own, [own, { ...own, id: 'ambiguous-recipient' }]), false);
const privateQuestion = { ...INITIAL_QUESTION_BANK[0], schoolId: foreign.schoolId, isSharedRegional: false };
assert.equal(canReadQuestion(learner, own.schoolId, privateQuestion, schoolIds), false);
assert.equal(canReadQuestion(learner, own.schoolId, { ...privateQuestion, isSharedRegional: true }, schoolIds), true);
assert.equal(canReadQuestion(INITIAL_USERS.platform_admin, own.schoolId, privateQuestion, schoolIds), true);

const fixtures = new Map<string, string>();
const save = (key: string, value: unknown) => fixtures.set(`smart_school_hub_data_v2_${key}`, JSON.stringify(value));
save('schools', schoolIds);
save('students', [own, foreign]);
save('classes', [...INITIAL_CLASSES, { ...INITIAL_CLASSES[0], id: foreign.classGroupId, schoolId: foreign.schoolId }]);
save('fee_items', [INITIAL_FEE_ITEMS[0], { ...INITIAL_FEE_ITEMS[0], id: 'foreign-fee', schoolId: foreign.schoolId }]);
save('announcements', [{ ...post, id: 'own-post', schoolId: own.schoolId }, post, { ...post, id: 'regional-post', schoolId: 'all' }]);
save('academic_years', [...INITIAL_ACADEMIC_YEARS, { ...INITIAL_ACADEMIC_YEARS[0], id: 'foreign-year', schoolId: foreign.schoolId }, { ...INITIAL_ACADEMIC_YEARS[0], id: 'unassigned-legacy-year', schoolId: undefined }]);
fixtures.set('smart_school_hub_data_v2_active_year_id', 'foreign-year');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => fixtures.get(key) ?? null } });
const captured: ReturnType<typeof useApp>[] = [];
function Probe() { captured.push(useApp()); return null; }
renderToString(createElement(AppProvider, { children: createElement(Probe) }));
const view = captured[0];
assert.ok(view, 'The actual provider must render with two-school fixtures');
assert.equal(view.findStudentForEnrollment(foreign.nationalCode)?.id, foreign.id, 'Regional enrollment uses an explicit exact national-code lookup');
assert.equal(view.findStudentForEnrollment(foreign.nationalCode.slice(0, 6)), undefined);
assert.deepEqual(view.students.map((student) => student.id), [own.id]);
assert.ok(view.classes.every((cls) => cls.schoolId === own.schoolId));
assert.ok(view.feeItems.every((fee) => fee.schoolId === own.schoolId));
assert.ok(view.academicYears.every((year) => year.schoolId === own.schoolId));
assert.equal(view.activeAcademicYear?.schoolId, own.schoolId);
assert.deepEqual(view.announcements.map((item) => item.id), ['own-post', 'regional-post']);
assert.ok(fixtures.get('smart_school_hub_data_v2_students')?.includes('foreign-student'), 'Scoping must preserve the backing data');
console.log('School boundaries, linked identity, recipient isolation, regional exceptions and actual provider reads: passed');
