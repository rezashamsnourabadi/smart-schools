import { ClassGroup, Student, YearRolloverOptions } from '../types';
import { toEnglishDigits } from './persianUtils';

const normalized = (value: string) => toEnglishDigits(value).replace(/\s/g, '').trim();

function isValidPublishedFinalCard(card: Student['reportCards'][number], yearTitle: string): boolean {
  return normalized(card.year) === normalized(yearTitle)
    && card.term === 'term2'
    && card.isPublished
    && Number.isFinite(card.gpa) && card.gpa >= 0 && card.gpa <= 20
    && card.subjects.length > 0
    && card.subjects.every((subject) => (subject.status === 'قبول' || subject.status === 'تجدید')
      && Number.isFinite(subject.unit) && subject.unit > 0
      && [subject.continuousScore, subject.finalScore, subject.totalScore].every((score) => Number.isFinite(score) && score >= 0 && score <= 20));
}

export function isFinalYearRecordPublished(student: Student, yearTitle: string): boolean {
  return student.reportCards.some((card) => isValidPublishedFinalCard(card, yearTitle) && card.subjects.every((subject) => subject.status === 'قبول'));
}

function nextGrade(grade: string): string | undefined {
  if (grade.includes('دهم') || normalized(grade).includes('10')) return 'پایه یازدهم';
  if (grade.includes('یازدهم') || normalized(grade).includes('11')) return 'پایه دوازدهم';
  return undefined;
}

function matchingDestination(student: Student, grade: string, schoolId: string, classes: ClassGroup[]): ClassGroup | undefined {
  const candidates = classes.filter((item) => item.schoolId === schoolId && normalized(item.grade) === normalized(grade) && (!student.fieldOfStudy || !item.major || normalized(item.major) === normalized(student.fieldOfStudy)));
  return candidates.length === 1 ? candidates[0] : undefined;
}

export interface RolloverStudentSummary {
  students: Student[];
  promoted: number;
  graduated: number;
  pendingClassAssignment: number;
  archivedReportCards: number;
  notEligible: number;
}

export function rolloverStudents(
  students: Student[],
  classes: ClassGroup[],
  input: { schoolId: string; schoolName: string; currentYearTitle: string; newYearId: string; newYearTitle: string; options: YearRolloverOptions }
): RolloverStudentSummary {
  let promoted = 0, graduated = 0, pendingClassAssignment = 0, archivedReportCards = 0, notEligible = 0;
  const endYear = normalized(input.newYearTitle).split('-')[1] || input.newYearTitle;
  const updated = students.map((student) => {
    if (student.schoolId !== input.schoolId || (student.status && student.status !== 'active')) return student;
    const finalReportCard = student.reportCards.find((card) => isValidPublishedFinalCard(card, input.currentYearTitle))
      || student.reportCards.find((card) => normalized(card.year) === normalized(input.currentYearTitle) && card.term === 'term2' && card.isPublished);
    const eligible = isFinalYearRecordPublished(student, input.currentYearTitle);
    const matchingReports = student.reportCards.filter((card) => normalized(card.year) === normalized(input.currentYearTitle) && card.isPublished);
    const reportToArchive = matchingReports.slice().sort((a, b) => Number(b.term === 'term2') - Number(a.term === 'term2'))[0];
    let pastYearHistory = student.pastYearHistory || [];
    if (input.options.archiveCurrentGrades && reportToArchive && !pastYearHistory.some((record) => normalized(record.year) === normalized(input.currentYearTitle))) {
      pastYearHistory = [{
        year: reportToArchive.year,
        grade: student.grade,
        schoolName: input.schoolName,
        ...(Number.isFinite(reportToArchive.gpa) && reportToArchive.gpa >= 0 && reportToArchive.gpa <= 20 ? { gpa: reportToArchive.gpa } : {}),
        ...(Number.isFinite(reportToArchive.disciplineScore) && reportToArchive.disciplineScore >= 0 && reportToArchive.disciplineScore <= 20 ? { disciplineScore: reportToArchive.disciplineScore } : {}),
        status: eligible ? 'قبول خرداد'
          : finalReportCard && finalReportCard.subjects.some((subject) => subject.status === 'تجدید') ? 'دارای تجدید'
            : finalReportCard ? 'نیازمند بررسی' : 'نتیجه ثبت نشده'
      }, ...pastYearHistory];
      archivedReportCards += 1;
    }

    let grade = student.grade;
    let classGroupId = student.classGroupId;
    let status: NonNullable<Student['status']> = student.status || 'active';
    let pendingGrade: string | undefined;
    let graduationDetails = student.graduationDetails;
    const isTwelfth = grade.includes('دوازدهم') || normalized(grade).includes('12');
    const shouldGraduate = input.options.graduateTwelfthGraders && isTwelfth;
    const promotedGrade = input.options.promoteStudents ? nextGrade(grade) : undefined;
    const requestedProgress = shouldGraduate || !!promotedGrade;
    if (requestedProgress && !eligible) notEligible += 1;
    if (requestedProgress && eligible && shouldGraduate) {
      status = 'graduated';
      graduationDetails = { year: endYear, notes: `ثبت پایان پایه بر اساس کارنامه منتشرشده سال ${input.currentYearTitle}` };
      graduated += 1;
    } else if (requestedProgress && eligible && promotedGrade) {
      grade = promotedGrade;
      const destination = matchingDestination(student, promotedGrade, input.schoolId, classes);
      if (destination) {
        classGroupId = destination.id;
        status = 'active';
        promoted += 1;
      } else {
        classGroupId = '';
        status = 'pending_class_assignment';
        pendingGrade = promotedGrade;
        pendingClassAssignment += 1;
      }
    }
    const preserveLegacy = student.legacyAttendanceStats || (student.attendanceStatsSource !== 'sessions' && student.attendanceStats.totalDays ? student.attendanceStats : undefined);
    const attendanceStats = input.options.resetAttendanceLogs ? { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 } : student.attendanceStats;
    return {
      ...student,
      grade,
      classGroupId,
      status,
      pendingClassGrade: pendingGrade,
      graduationDetails,
      pastYearHistory,
      legacyAttendanceStats: preserveLegacy,
      attendanceStats,
      todayStatus: undefined,
      attendanceAcademicYearId: input.options.resetAttendanceLogs ? input.newYearId : student.attendanceAcademicYearId
    };
  });
  return { students: updated, promoted, graduated, pendingClassAssignment, archivedReportCards, notEligible };
}
