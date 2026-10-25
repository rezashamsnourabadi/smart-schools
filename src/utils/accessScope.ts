import { Announcement, NotificationLog, QuestionBankItem, School, Student, UserProfile, VicePrincipalPermissions } from '../types';
import { toEnglishDigits } from './persianUtils';

export function linkedStudent(user: UserProfile, schoolId: string, students: Student[]): Student | undefined {
  const id = user.role === 'parent' ? user.childStudentId : user.role === 'student' ? user.studentId : undefined;
  return id ? students.find((student) => student.id === id && student.schoolId === schoolId) : undefined;
}

export function canReadStudent(user: UserProfile, schoolId: string, student: Student): boolean {
  if (student.schoolId !== schoolId || user.schoolId !== schoolId) return false;
  switch (user.role) {
    case 'principal':
    case 'vice_principal': return true;
    case 'teacher': return user.assignedClassIds?.includes(student.classGroupId) === true;
    case 'student': return student.id === user.studentId;
    case 'parent': return student.id === user.childStudentId;
    default: return false;
  }
}

export function canReadDossier(user: UserProfile, schoolId: string, student: Student, permissions: VicePrincipalPermissions): boolean {
  return canReadStudent(user, schoolId, student) && (user.role !== 'vice_principal' || permissions.canViewFullDossier);
}

export function canReadAnnouncement(user: UserProfile, schoolId: string, post: Announcement): boolean {
  if (user.role === 'platform_admin') return true;
  if (user.schoolId !== schoolId || (post.schoolId !== 'all' && post.schoolId !== schoolId)) return false;
  if (user.role === 'principal' || user.role === 'vice_principal') return true;
  const audience = user.role === 'teacher' ? 'teachers' : user.role === 'parent' ? 'parents' : 'students';
  return post.target === 'all' || post.target === audience;
}

export function canReadQuestion(user: UserProfile, schoolId: string, item: QuestionBankItem, schools: School[]): boolean {
  if (user.role === 'platform_admin' || item.isSharedRegional) return true;
  if (user.schoolId !== schoolId) return false;
  const matches = schools.filter((school) => school.name === item.authorSchool);
  return (item.schoolId || (matches.length === 1 ? matches[0].id : undefined)) === schoolId;
}

/** Old logs without IDs are shown only when school and recipient match unambiguously. */
export function canReadNotification(user: UserProfile, schoolId: string, log: NotificationLog, schools: School[], student?: Student, students: Student[] = []): boolean {
  if (user.role === 'platform_admin') return true;
  if (user.schoolId !== schoolId) return false;
  const matches = schools.filter((school) => school.name === log.schoolName);
  const logSchoolId = log.schoolId || (matches.length === 1 ? matches[0].id : undefined);
  if (logSchoolId !== schoolId) return false;
  if (user.role === 'principal' || user.role === 'vice_principal') return true;
  if (user.role !== 'parent' || !student) return false;
  if (log.studentId) return log.studentId === student.id;
  const phone = toEnglishDigits(log.recipientPhone).replace(/\D/g, '');
  if (!phone) return false;
  const recipients = students.filter((item) => item.schoolId === schoolId && item.name === log.studentName && toEnglishDigits(item.parentPhone).replace(/\D/g, '') === phone);
  return recipients.length === 1 && recipients[0].id === student.id;
}
