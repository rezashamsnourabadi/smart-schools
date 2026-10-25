import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  School,
  UserProfile,
  ClassGroup,
  Student,
  ScheduleSlot,
  QuestionBankItem,
  BannerAd,
  Announcement,
  AttendanceSession,
  NotificationLog,
  NotificationInput,
  AttendanceStatus,
  AttendanceActionResult,
  ScheduleActionResult,
  GradeItem,
  GradeActionResult,
  HomeworkItem,
  HomeworkSubmission,
  OnlineExam,
  VicePrincipalPermissions,
  VicePrincipalProfile,
  TeacherProfile,
  DisciplinaryRecord,
  PostType,
  AcademicYear,
  AcademicTerm,
  AcademicTermId,
  YearRolloverOptions,
  YearRolloverResult,
  SchoolFeeItem,
  StudentFinancialSummary,
  PaymentTransaction,
  FinancialActionResult
} from '../types';
import {
  INITIAL_SCHOOLS,
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULE,
  INITIAL_QUESTION_BANK,
  INITIAL_BANNERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_GRADES,
  INITIAL_HOMEWORK,
  INITIAL_HOMEWORK_SUBMISSIONS,
  INITIAL_EXAMS,
  INITIAL_VICE_PRINCIPAL_PERMISSIONS,
  INITIAL_VICE_PRINCIPALS,
  INITIAL_TEACHERS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_FEE_ITEMS
} from '../data/mockData';
import { toEnglishDigits, toPersianDigits, formatPersianCurrency, getSchoolDate, getSchoolClock, SchoolClock } from '../utils/persianUtils';
import { AttendanceError, attendanceLabel, canonicalAttendance, recordedAttendance, schoolAttendance, schoolTimeMinutes, upsertAttendance } from '../utils/attendance';
import { validateGradeItem } from '../utils/gradeUtils';
import { assignFee, calculateFinancialSummary, changePaymentStatus, createEmptyFinancialSummary, FinancialError, grantDiscount, matchesFeeTarget, recordPayment } from '../utils/financialLedger';
import { canManageSchoolAction } from '../utils/permissions';
import { normalizePaymentMethod } from '../utils/paymentUtils';
import { rolloverStudents } from '../utils/academicYear';
import { scheduleConflict } from '../utils/schedule';
import { linkedStudent, canReadStudent, canReadDossier, canReadAnnouncement, canReadNotification, canReadQuestion } from '../utils/accessScope';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;
  currentSchool: School | undefined;
  currentUser: UserProfile;
  currentStudent: Student | undefined;
  schoolClock: SchoolClock;
  findStudentForEnrollment: (nationalCode: string) => Student | undefined;
  schools: School[];
  classes: ClassGroup[];
  students: Student[];
  schedule: ScheduleSlot[];
  questionBank: QuestionBankItem[];
  banners: BannerAd[];
  announcements: Announcement[];
  attendanceSessions: AttendanceSession[];
  notifications: NotificationLog[];
  grades: GradeItem[];
  homework: HomeworkItem[];
  homeworkSubmissions: HomeworkSubmission[];
  exams: OnlineExam[];
  vicePrincipalPermissions: VicePrincipalPermissions;
  vicePrincipals: VicePrincipalProfile[];
  teachers: TeacherProfile[];
  activeVicePrincipalId: string;
  setActiveVicePrincipalId: (id: string) => void;
  updateVicePrincipalProfilePermissions: (vpId: string, perms: Partial<VicePrincipalPermissions>) => void;
  activeVicePrincipalPermissions: VicePrincipalPermissions;
  
  // Staff Management (Vice Principals & Teachers)
  addTeacher: (teacher: Omit<TeacherProfile, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<TeacherProfile>) => void;
  deleteTeacher: (id: string) => void;
  addVicePrincipal: (vp: Omit<VicePrincipalProfile, 'id'>) => void;
  updateVicePrincipal: (id: string, updates: Partial<VicePrincipalProfile>) => void;
  deleteVicePrincipal: (id: string) => void;
  convertTeacherToVicePrincipal: (teacherId: string, roleTitle: string, permissions?: Partial<VicePrincipalPermissions>) => void;
  convertVicePrincipalToTeacher: (vpId: string, teachingSubjects: string[], assignedClassIds: string[]) => void;

  selectedStudentForDossier: Student | null;
  setSelectedStudentForDossier: (student: Student | null) => void;
  dossierInitialTab: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances';
  setDossierInitialTab: (tab: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances') => void;
  openStudentDossier: (student: Student, tab?: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances') => void;
  activeMobileTab: string;
  setActiveMobileTab: (tab: string) => void;
  activeToast: { title: string; message: string; type: 'success' | 'info' | 'warning' } | null;
  clearToast: () => void;
  canManageSchool: (permission: keyof VicePrincipalPermissions) => boolean;
  sendNotification: (input: NotificationInput) => void;
  
  // Actions
  submitAttendance: (
    scheduleSlotId: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    platform: 'bale' | 'sms'
  ) => AttendanceActionResult;
  addQuestionBankItem: (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usageCount'>) => void;
  addBannerAd: (banner: Omit<BannerAd, 'id' | 'clicksCount'>) => void;
  toggleBannerStatus: (bannerId: string) => void;
  clickBanner: (bannerId: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  addSchool: (school: Omit<School, 'id' | 'todayAttendanceSubmitted' | 'attendanceRateToday'>) => void;
  
  // Management Actions
  addStudent: (studentData: Omit<Student, 'id' | 'attendanceStats' | 'disciplinaryRecords' | 'reportCards' | 'pastYearHistory' | 'financialSummary'>) => void;
  updateStudent: (studentId: string, updates: Omit<Partial<Student>, 'financialSummary'>) => void;
  removeStudent: (studentId: string) => void;
  transferStudentClass: (studentId: string, newClassGroupId: string) => void;
  markStudentGraduated: (studentId: string, details: { year: string; university?: string; major?: string; rank?: string; notes?: string }) => void;
  markStudentTransferred: (studentId: string, details: { destinationSchoolName: string; date: string; reason?: string }) => void;
  markStudentActive: (studentId: string, classGroupId: string) => void;
  addClassGroup: (classData: Omit<ClassGroup, 'id' | 'studentCount'>) => void;
  deleteClassGroup: (classId: string) => void;
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => ScheduleActionResult | undefined;
  updateScheduleSlot: (slot: ScheduleSlot) => void;
  deleteScheduleSlot: (slotId: string) => void;
  updateVicePrincipalPermissions: (perms: Partial<VicePrincipalPermissions>) => void;
  addDisciplinaryRecord: (studentId: string, record: Omit<DisciplinaryRecord, 'id'>) => void;
  addGradeItem: (grade: Omit<GradeItem, 'id'>) => GradeActionResult;
  addHomework: (hw: Omit<HomeworkItem, 'id' | 'submissionsCount'>) => void;
  submitHomework: (submission: Omit<HomeworkSubmission, 'id' | 'submissionDate' | 'status'>) => void;
  gradeHomeworkSubmission: (submissionId: string, score: number, feedback: string) => void;
  addOnlineExam: (exam: Omit<OnlineExam, 'id'>) => void;
  updateParentContact: (studentId: string, data: { address?: string; emergencyPhone?: string; parentPhone?: string; parentBaleAccount?: string }) => void;
  
  // Academic Year Management
  academicYears: AcademicYear[];
  activeAcademicYearId: string;
  activeAcademicYear: AcademicYear | undefined;
  activeTerm: AcademicTerm | undefined;
  isViewingArchivedYear: boolean;
  isViewingNonCurrentYear: boolean;
  setActiveAcademicYearId: (id: string) => void;
  setActiveTermId: (termId: AcademicTermId) => void;
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'isCurrent'>) => void;
  updateAcademicYear: (id: string, updates: Partial<AcademicYear>) => void;
  rolloverAcademicYear: (options: YearRolloverOptions) => YearRolloverResult;
  returnToCurrentAcademicYear: () => void;

  // School Financial & Student Accounting
  feeItems: SchoolFeeItem[];
  addFeeItem: (feeItem: Omit<SchoolFeeItem, 'id' | 'createdAt'>) => FinancialActionResult;
  updateFeeItem: (id: string, updates: Partial<SchoolFeeItem>) => void;
  deleteFeeItem: (id: string) => void;
  assignFeeItemToStudents: (feeItemId: string, targetScope: string, classGroupId?: string) => void;
  recordStudentPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => FinancialActionResult;
  updatePaymentTransactionStatus: (studentId: string, transactionId: string, status: 'confirmed' | 'rejected') => FinancialActionResult;
  sendPaymentReminder: (studentId: string, customMessage?: string) => void;
  applyStudentDiscount: (studentId: string, feeItemId: string, discountAmount: number, reason?: string) => FinancialActionResult;

  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'smart_school_hub_data_v2';
const protectedStorageKeys = new Set<string>();
const storageReadFailures = new Set<string>();
const storageWriteFailures = new Set<string>();
const storageKey = (suffix: string) => `${STORAGE_KEY}_${suffix}`;

function readStoredValue<T>(suffix: string, fallback: T): T {
  const key = storageKey(suffix);
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    const validShape = Array.isArray(fallback)
      ? Array.isArray(parsed) && parsed.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
      : fallback !== null && typeof fallback === 'object'
        ? parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        : typeof parsed === typeof fallback;
    if (!validShape) throw new Error('Stored value has an unexpected shape');
    return parsed as T;
  } catch {
    protectedStorageKeys.add(key);
    storageReadFailures.add(key);
    return fallback;
  }
}

function readStoredString(suffix: string, fallback: string): string {
  const key = storageKey(suffix);
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value;
  } catch {
    protectedStorageKeys.add(key);
    storageReadFailures.add(key);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('principal');
  const [currentSchoolId, setCurrentSchoolIdState] = useState<string>('school-1');
  const [schoolClock, setSchoolClock] = useState(() => getSchoolClock());
  useEffect(() => {
    const timer = setInterval(() => setSchoolClock(getSchoolClock()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossierInitialTab, setDossierInitialTab] = useState<'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances'>('profile');
  const [activeMobileTab, setActiveMobileTab] = useState<string>('dashboard');

  const openStudentDossier = (student: Student, tab: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances' = 'profile') => {
    setDossierInitialTab(tab);
    setSelectedStudentForDossier(student);
  };

  const [schools, setSchools] = useState<School[]>(() => {
    return readStoredValue('schools', INITIAL_SCHOOLS);
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    return readStoredValue('classes', INITIAL_CLASSES);
  });

  const [students, setStudentsState] = useState<Student[]>(() => {
    const list = readStoredValue('students', INITIAL_STUDENTS);
    const validStudents = list.filter((student) => student && typeof student.id === 'string' && typeof student.schoolId === 'string' && typeof student.name === 'string');
    if (validStudents.length !== list.length) {
      protectedStorageKeys.add(storageKey('students'));
      storageReadFailures.add(storageKey('students'));
    }
    return validStudents.map((st) => {
      if (!Array.isArray(st.reportCards) || !Array.isArray(st.disciplinaryRecords) || !Array.isArray(st.pastYearHistory)) {
        protectedStorageKeys.add(storageKey('students'));
        storageReadFailures.add(storageKey('students'));
      }
      const source = st.financialSummary && typeof st.financialSummary === 'object' ? st.financialSummary : undefined;
      if (source && (!Array.isArray(source.transactions) || !Array.isArray(source.assignedFees) || !Array.isArray(source.installments) || !Array.isArray(source.discounts) || !Array.isArray(source.audit))) {
        protectedStorageKeys.add(storageKey('students'));
        storageReadFailures.add(storageKey('students'));
      }
      const normalizedSummary = source
        ? { ...createEmptyFinancialSummary(), ...source,
            transactions: (Array.isArray(source.transactions) ? source.transactions : []).map((transaction) => ({ ...transaction, method: normalizePaymentMethod(transaction.method) || transaction.method })),
            assignedFees: Array.isArray(source.assignedFees) ? source.assignedFees : [],
            installments: Array.isArray(source.installments) ? source.installments : [],
            discounts: Array.isArray(source.discounts) ? source.discounts : [],
            audit: Array.isArray(source.audit) ? source.audit : [] }
        : createEmptyFinancialSummary();
      return {
        ...st,
        reportCards: Array.isArray(st?.reportCards) ? st.reportCards : [],
        disciplinaryRecords: Array.isArray(st?.disciplinaryRecords) ? st.disciplinaryRecords : [],
        pastYearHistory: Array.isArray(st?.pastYearHistory) ? st.pastYearHistory : [],
        attendanceStats: st?.attendanceStats && typeof st.attendanceStats === 'object' ? st.attendanceStats : { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 },
        financialSummary: normalizedSummary
      };
    });
  });

  // All student mutations pass through this synchronous snapshot, including rapid repeated submissions.
  const studentsRef = useRef(students);
  const setStudents: React.Dispatch<React.SetStateAction<Student[]>> = (action) => {
    const next = typeof action === 'function' ? action(studentsRef.current) : action;
    studentsRef.current = next;
    setStudentsState(next);
  };

  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    return readStoredValue('schedule', INITIAL_SCHEDULE);
  });

  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => {
    return readStoredValue('qbank', INITIAL_QUESTION_BANK);
  });

  const [banners, setBanners] = useState<BannerAd[]>(() => {
    return readStoredValue('banners', INITIAL_BANNERS);
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    return readStoredValue('announcements', INITIAL_ANNOUNCEMENTS);
  });

  const [attendanceSessions, setAttendanceSessionsState] = useState<AttendanceSession[]>(() => {
    return readStoredValue('attendance', INITIAL_ATTENDANCE_LOGS);
  });
  const attendanceSessionsRef = useRef(attendanceSessions);
  const setAttendanceSessions: React.Dispatch<React.SetStateAction<AttendanceSession[]>> = (action) => {
    const next = typeof action === 'function' ? action(attendanceSessionsRef.current) : action;
    attendanceSessionsRef.current = next;
    setAttendanceSessionsState(next);
  };

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    return readStoredValue('notifications', INITIAL_NOTIFICATIONS);
  });

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    return readStoredValue('grades', INITIAL_GRADES);
  });

  const [homework, setHomework] = useState<HomeworkItem[]>(() => {
    return readStoredValue('homework', INITIAL_HOMEWORK);
  });

  const [exams, setExams] = useState<OnlineExam[]>(() => {
    return readStoredValue('exams', INITIAL_EXAMS);
  });

  const [vicePrincipalPermissions, setVicePrincipalPermissions] = useState<VicePrincipalPermissions>(() => {
    return readStoredValue('vp_perms', INITIAL_VICE_PRINCIPAL_PERMISSIONS);
  });

  const [vicePrincipals, setVicePrincipals] = useState<VicePrincipalProfile[]>(() => {
    return readStoredValue('vice_principals', INITIAL_VICE_PRINCIPALS);
  });

  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => {
    return readStoredValue('teachers', INITIAL_TEACHERS);
  });

  const [activeVicePrincipalId, setActiveVicePrincipalIdState] = useState<string>('vp-1');

  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>(() => {
    return readStoredValue('homework_subs', INITIAL_HOMEWORK_SUBMISSIONS);
  });

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    const years = readStoredValue('academic_years', INITIAL_ACADEMIC_YEARS);
    return years.map((year) => year.schoolId || !INITIAL_ACADEMIC_YEARS.some((initial) => initial.id === year.id)
      ? year
      : { ...year, schoolId: 'school-1' });
  });

  const [activeAcademicYearId, setActiveAcademicYearIdState] = useState<string>(() => {
    return readStoredString('active_year_id', 'ay-1404-1405');
  });

  const [feeItems, setFeeItems] = useState<SchoolFeeItem[]>(() => {
    return readStoredValue('fee_items', INITIAL_FEE_ITEMS);
  });

  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(() => storageReadFailures.size ? {
    title: 'داده ذخیره‌شده نیاز به بررسی دارد',
    message: 'بخشی از داده مرورگر قابل خواندن نبود. داده اصلی دست‌نخورده نگه داشته شده؛ نسخه پیش‌فرض نمایش داده می‌شود و تا رفع مورد، همان بخش ذخیره نخواهد شد.',
    type: 'warning'
  } : null);

  const persistStoredValue = (suffix: string, value: unknown) => {
    const key = storageKey(suffix);
    if (protectedStorageKeys.has(key)) return;
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch {
      if (storageWriteFailures.has(key)) return;
      storageWriteFailures.add(key);
      setActiveToast({ title: 'ذخیره‌سازی انجام نشد', message: 'مرورگر نتوانست داده را ذخیره کند؛ احتمالاً فضای ذخیره‌سازی کافی نیست. داده‌های این تغییر در حافظه موقت می‌مانند.', type: 'warning' });
    }
  };

  // Sync to localStorage
  useEffect(() => {
    persistStoredValue('schools', schools);
  }, [schools]);

  useEffect(() => {
    persistStoredValue('classes', classes);
  }, [classes]);

  useEffect(() => {
    persistStoredValue('students', students);
  }, [students]);

  useEffect(() => {
    persistStoredValue('schedule', schedule);
  }, [schedule]);

  useEffect(() => {
    persistStoredValue('attendance', attendanceSessions);
  }, [attendanceSessions]);

  useEffect(() => {
    persistStoredValue('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    persistStoredValue('qbank', questionBank);
  }, [questionBank]);

  useEffect(() => {
    persistStoredValue('banners', banners);
  }, [banners]);

  useEffect(() => {
    persistStoredValue('announcements', announcements);
  }, [announcements]);

  useEffect(() => {
    persistStoredValue('grades', grades);
  }, [grades]);

  useEffect(() => {
    persistStoredValue('homework', homework);
  }, [homework]);

  useEffect(() => {
    persistStoredValue('exams', exams);
  }, [exams]);

  useEffect(() => {
    persistStoredValue('vp_perms', vicePrincipalPermissions);
  }, [vicePrincipalPermissions]);

  useEffect(() => {
    persistStoredValue('vice_principals', vicePrincipals);
  }, [vicePrincipals]);

  useEffect(() => {
    persistStoredValue('teachers', teachers);
  }, [teachers]);

  useEffect(() => {
    persistStoredValue('homework_subs', homeworkSubmissions);
  }, [homeworkSubmissions]);

  useEffect(() => {
    persistStoredValue('academic_years', academicYears);
  }, [academicYears]);

  useEffect(() => {
    persistStoredValue('active_year_id', activeAcademicYearId);
  }, [activeAcademicYearId]);

  useEffect(() => {
    persistStoredValue('fee_items', feeItems);
  }, [feeItems]);

  const schoolYears = academicYears.filter((year) => year.schoolId === currentSchoolId);
  const activeAcademicYear = schoolYears.find((y) => y.id === activeAcademicYearId) || schoolYears.find((y) => y.isCurrent) || schoolYears[0];
  const activeTerm = activeAcademicYear?.terms.find((t) => t.id === activeAcademicYear?.currentTermId) || activeAcademicYear?.terms[0];
  const isViewingArchivedYear = activeAcademicYear?.status === 'archived';
  const isViewingNonCurrentYear = !!activeAcademicYear && (!activeAcademicYear.isCurrent || activeAcademicYear.status !== 'active');

  const schoolProfiles = schools.map((school) => {
    const attendance = schoolAttendance(students, attendanceSessions, school.id, schoolClock.date);
    return { ...school, todayAttendanceSubmitted: attendance.recordedCount > 0, attendanceRateToday: attendance.rate ?? 0, attendanceRecordedCount: attendance.recordedCount };
  });
  const currentSchool = schoolProfiles.find((s) => s.id === currentSchoolId);
  const schoolVPs = vicePrincipals.filter((vp) => vp.schoolId === currentSchoolId);
  const currentVP = schoolVPs.find((vp) => vp.id === activeVicePrincipalId) || schoolVPs[0];
  const deniedPermissions: VicePrincipalPermissions = { canManageAnnouncements: false, canManageSchedule: false, canManageStudentsAndClasses: false, canViewFullDossier: false, canLogDisciplinary: false, canManageFinances: false };
  const activeVicePrincipalPermissions = currentVP?.permissions || deniedPermissions;
  const previewUser = INITIAL_USERS[currentRole];
  const currentUser: UserProfile = currentRole === 'principal' && currentSchool
    ? { ...previewUser, schoolId: currentSchoolId, name: currentSchool.principalName }
    : currentRole === 'vice_principal' && currentVP
      ? { ...previewUser, ...currentVP, role: 'vice_principal' }
      : currentRole === 'parent' || currentRole === 'student'
        ? { ...previewUser, schoolId: students.find((student) => student.id === (currentRole === 'parent' ? previewUser.childStudentId : previewUser.studentId))?.schoolId || previewUser.schoolId }
        : previewUser;
  const attendanceStudents = students.map((student) => recordedAttendance(student, attendanceSessions, schoolClock.date));
  const currentStudent = linkedStudent(currentUser, currentSchoolId, attendanceStudents);
  const userIsInSchool = !!currentSchool && currentUser.schoolId === currentSchoolId;
  const visibleStudents = currentRole === 'platform_admin' ? attendanceStudents : attendanceStudents.filter((student) => canReadStudent(currentUser, currentSchoolId, student));
  const visibleClasses = classes.filter((cls) => currentRole === 'platform_admin' || (userIsInSchool && cls.schoolId === currentSchoolId && (
    currentRole === 'teacher' ? currentUser.assignedClassIds?.includes(cls.id) : currentRole === 'parent' || currentRole === 'student' ? cls.id === currentStudent?.classGroupId : true
  ))).map((cls) => ({
    ...cls,
    studentCount: students.filter((student) => student.schoolId === cls.schoolId && student.classGroupId === cls.id && (!student.status || student.status === 'active')).length
  }));
  const visibleClassIds = new Set(visibleClasses.map((cls) => cls.id));
  const visibleStudentIds = new Set(visibleStudents.map((student) => student.id));
  const visibleHomework = homework.filter((item) => (currentRole === 'platform_admin' || item.schoolId === currentSchoolId) && visibleClassIds.has(item.classGroupId) && (currentRole !== 'teacher' || item.teacherId === currentUser.id));
  const visibleHomeworkIds = new Set(visibleHomework.map((item) => item.id));
  const selectedStudentForDossier = attendanceStudents.find((student) => student.id === selectedStudentId && canReadDossier(currentUser, currentSchoolId, student, activeVicePrincipalPermissions)) || null;

  const setSelectedStudentForDossier = (student: Student | null) => {
    setSelectedStudentId(student && canReadDossier(currentUser, currentSchoolId, student, activeVicePrincipalPermissions) ? student.id : null);
  };
  const clearWorkspaceSelection = () => { setSelectedStudentId(null); setDossierInitialTab('profile'); setActiveMobileTab('dashboard'); setActiveToast(null); };
  const setCurrentRole = (role: UserRole) => { clearWorkspaceSelection(); setCurrentRoleState(role); };
  const setCurrentSchoolId = (id: string) => {
    if (!schools.some((school) => school.id === id)) return;
    clearWorkspaceSelection();
    setCurrentSchoolIdState(id);
    const years = academicYears.filter((year) => year.schoolId === id);
    setActiveAcademicYearIdState((years.find((year) => year.isCurrent) || years[0])?.id || '');
    setActiveVicePrincipalIdState(vicePrincipals.find((vp) => vp.schoolId === id)?.id || '');
  };
  const setActiveVicePrincipalId = (id: string) => {
    if (!schoolVPs.some((vp) => vp.id === id)) return;
    clearWorkspaceSelection();
    setActiveVicePrincipalIdState(id);
  };
  const setActiveAcademicYearId = (id: string) => {
    if (schoolYears.some((year) => year.id === id)) setActiveAcademicYearIdState(id);
  };
  const findStudentForEnrollment = (nationalCode: string) => {
    if (!canManageSchool('canManageStudentsAndClasses')) return undefined;
    const code = toEnglishDigits(nationalCode).trim();
    return /^\d{10}$/.test(code) ? students.find((student) => toEnglishDigits(student.nationalCode).trim() === code) : undefined;
  };

  const updateVicePrincipalProfilePermissions = (vpId: string, perms: Partial<VicePrincipalPermissions>) => {
    if (!requireOwnEntity(vicePrincipals.find((vp) => vp.id === vpId))) return;
    if (!requireRole('principal')) return;
    setVicePrincipals((prev) =>
      prev.map((vp) =>
        vp.id === vpId
          ? { ...vp, permissions: { ...vp.permissions, ...perms } }
          : vp
      )
    );
    // Also keep active vicePrincipalPermissions synced if it's the active one
    if (vpId === activeVicePrincipalId) {
      setVicePrincipalPermissions((prev) => ({ ...prev, ...perms }));
    }
    setActiveToast({
      title: 'سطح دسترسی تفکیک‌شده معاونت بروز شد',
      message: 'تنظیمات اختصاصی این معاون با موفقیت ذخیره گردید.',
      type: 'success'
    });
  };

  const clearToast = () => setActiveToast(null);

  const canManageSchool = (permission: keyof VicePrincipalPermissions) =>
    userIsInSchool && canManageSchoolAction(currentRole, activeVicePrincipalPermissions, permission);

  const denyAction = () => {
    setActiveToast({ title: 'دسترسی مجاز نیست', message: 'برای این عملیات مجوز لازم را ندارید.', type: 'warning' });
    return false;
  };

  const requireSchoolPermission = (permission: keyof VicePrincipalPermissions) =>
    canManageSchool(permission) || denyAction();

  const requireRole = (...roles: UserRole[]) => (roles.includes(currentRole) && (currentRole === 'platform_admin' || userIsInSchool)) || denyAction();
  const requireOwnEntity = (entity?: { schoolId?: string }) => (!!entity && userIsInSchool && entity.schoolId === currentSchoolId) || denyAction();
  const requireCurrentAcademicYear = () => {
    if (activeAcademicYear?.isCurrent && activeAcademicYear.status === 'active') return true;
    setActiveToast({ title: 'سال تحصیلی فقط‌خواندنی است', message: 'برای تغییر داده‌های اجرایی، سال فعال مدرسه را انتخاب کنید. سوابق سال‌های دیگر در این نسخه تفکیک کامل نشده‌اند.', type: 'warning' });
    return false;
  };
  const requireStudent = (id: string) => requireOwnEntity(students.find((student) => student.id === id));
  const requireClass = (id: string) => {
    const cls = classes.find((item) => item.id === id);
    return requireOwnEntity(cls) && (currentRole !== 'teacher' || currentUser.assignedClassIds?.includes(id) === true || denyAction());
  };

  // Local simulation only: no network delivery is performed.
  const sendNotification = (input: NotificationInput) => {
    if (!requireRole('principal', 'vice_principal', 'teacher', 'parent')) return;
    if (input.studentId && !students.some((student) => student.id === input.studentId && canReadStudent(currentUser, currentSchoolId, student))) return;
    if (currentRole === 'parent' && input.studentId !== currentStudent?.id) return;
    const notification: NotificationLog = {
      ...input,
      schoolId: currentSchoolId,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      platform: input.platform === 'bale' ? 'بله' : 'پیامک',
      status: 'simulated',
      timestamp: `${getSchoolClock().date} ${getSchoolClock().time}`,
      schoolName: currentSchool?.name || ''
    };
    setNotifications((prev) => [notification, ...prev]);
    setActiveToast({ title: 'اعلان آزمایشی ثبت شد', message: input.message, type: 'info' });
  };

  const submitAttendance = (scheduleSlotId: string, records: AttendanceSession['records'], platform: 'bale' | 'sms'): AttendanceActionResult => {
    const fail = (error: string): AttendanceActionResult => {
      setActiveToast({ title: 'حضور و غیاب ثبت نشد', message: error, type: 'warning' });
      return { ok: false, error };
    };
    const slot = schedule.find((item) => item.id === scheduleSlotId && item.schoolId === currentSchoolId);
    if (!slot || !requireClass(slot.classGroupId) || (currentRole === 'teacher' ? slot.teacherId !== currentUser.id : !requireSchoolPermission('canLogDisciplinary'))) return fail('دسترسی به این جلسه مجاز نیست.');
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') return fail('برای ثبت حضور و غیاب، سال تحصیلی فعال مدرسه را انتخاب کنید.');
    if (platform !== 'bale' && platform !== 'sms') return fail('کانال اعلان معتبر نیست.');
    const now = getSchoolClock();
    const start = schoolTimeMinutes(slot.startTime), end = schoolTimeMinutes(slot.endTime);
    if (slot.dayOfWeek !== now.dayOfWeek || start === undefined || end === undefined || start >= end) return fail('این زنگ در برنامه امروز مدرسه قرار ندارد یا ساعت آن نامعتبر است.');
    if (now.minuteOfDay < start) return fail('زمان شروع این زنگ هنوز نرسیده است.');
    const roster = studentsRef.current.filter((student) => student.schoolId === currentSchoolId && student.classGroupId === slot.classGroupId && (!student.status || student.status === 'active'));
    if (!roster.length || records.length !== roster.length || records.some((row) => !roster.some((student) => student.id === row.studentId))) return fail('حضور و غیاب باید شامل فهرست کامل دانش‌آموزان فعال این کلاس باشد.');
    try {
      const cls = classes.find((item) => item.id === slot.classGroupId)!;
      const result = upsertAttendance(attendanceSessionsRef.current, {
        id: '', schoolId: currentSchoolId, classGroupId: cls.id, className: cls.name,
        subject: slot.subject, teacherId: slot.teacherId, teacherName: slot.teacherName,
        scheduleSlotId: slot.id, academicYearId: activeAcademicYear.id, recordedBy: currentUser.name,
        date: now.date, period: slot.period, submittedAt: now.time, records: records.map((row) => ({ ...row })), sentNotificationsCount: 0
      });
      if (!result.changed) {
        setActiveToast({ title: 'جلسه قبلاً ثبت شده است', message: 'اطلاعات جلسه تغییری نکرده است.', type: 'info' });
        return { ok: true, changed: false, notificationsSent: 0 };
      }
      setAttendanceSessions(result.sessions);
      const rosterIds = new Set(roster.map((student) => student.id));
      setStudents((prev) => prev.map((student) => rosterIds.has(student.id) ? recordedAttendance(student, result.sessions, now.date) : student));
      for (const change of result.changes) {
        const student = roster.find((item) => item.id === change.studentId)!;
        const correction = change.status === 'present' || change.status === 'excused';
        const message = correction
          ? `ولی محترم ${student.name}؛ وضعیت زنگ ${toPersianDigits(slot.period)} درس ${slot.subject} در تاریخ ${toPersianDigits(now.date)} از «${attendanceLabel(change.previousStatus)}» به «${attendanceLabel(change.status)}» اصلاح شد.`
          : `ولی محترم ${student.name}؛ وضعیت «${attendanceLabel(change.status)}» در زنگ ${toPersianDigits(slot.period)} درس ${slot.subject} (${cls.name}) در تاریخ ${toPersianDigits(now.date)} و ساعت ${toPersianDigits(now.time)} ثبت شد.`;
        sendNotification({ studentId: student.id, studentName: student.name, recipientName: student.parentName, recipientPhone: student.parentPhone,
          platform: platform === 'bale' && student.parentBaleAccount ? 'bale' : 'sms', message,
          type: correction ? 'attendance_correction' : change.status === 'absent' ? 'attendance_absent' : 'attendance_late',
          attendanceSessionId: result.session.id, attendanceRevision: result.session.revision });
      }
      setActiveToast({ title: 'حضور و غیاب ثبت شد', message: `زنگ ${toPersianDigits(slot.period)} • ${toPersianDigits(records.length)} دانش‌آموز • ${toPersianDigits(result.changes.length)} اعلان آزمایشی جدید`, type: 'success' });
      return { ok: true, changed: true, notificationsSent: result.changes.length };
    } catch (error) {
      if (!(error instanceof AttendanceError)) throw error;
      return fail(error.message);
    }
  };

  const addQuestionBankItem = (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usageCount'>) => {
    if (!requireRole('teacher', 'platform_admin')) return;
    const newItem: QuestionBankItem = {
      ...item,
      schoolId: currentSchoolId,
      id: `q-${Date.now()}`,
      createdAt: getSchoolDate(),
      usageCount: 1
    };
    setQuestionBank((prev) => [newItem, ...prev]);
    setActiveToast({
      title: 'سوال به بانک مشترک شهرستان اضافه شد',
      message: `سوال "${newItem.title}" اکنون برای تمام معلمان شهرستان در دسترس است.`,
      type: 'success'
    });
  };

  const addBannerAd = (banner: Omit<BannerAd, 'id' | 'clicksCount'>) => {
    if (!requireRole('platform_admin')) return;
    const newBanner: BannerAd = {
      ...banner,
      id: `ad-${Date.now()}`,
      clicksCount: 0
    };
    setBanners((prev) => [newBanner, ...prev]);
    setActiveToast({
      title: 'بنر و اطلاع‌رسانی فعال شد',
      message: 'بنر جدید در بخش تعیین‌شده پنل کاربران به نمایش درآمد.',
      type: 'info'
    });
  };

  const toggleBannerStatus = (bannerId: string) => {
    if (!requireRole('platform_admin')) return;
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const clickBanner = (bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, clicksCount: b.clicksCount + 1 } : b))
    );
    setActiveToast({
      title: 'لینک رویداد باز شد',
      message: 'هدایت به بخش ثبت‌نام و اطلاعات رویداد شهرستان انجام شد.',
      type: 'info'
    });
  };

  const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'date'>) => {
    if (currentRole !== 'platform_admin' && !requireOwnEntity(announcement)) return;
    if (!(currentRole === 'platform_admin' && announcement.schoolId === 'all') && !requireSchoolPermission('canManageAnnouncements')) return;
    const typeLabel = 
      announcement.type === 'news' ? 'خبر' :
      announcement.type === 'event' ? 'رویداد' :
      announcement.type === 'event_report' ? 'گزارش رویداد' : 'اطلاعیه';
      
    const newAnc: Announcement = {
      ...announcement,
      id: `anc-${Date.now()}`,
      date: getSchoolDate()
    };
    setAnnouncements((prev) => [newAnc, ...prev]);
    setActiveToast({
      title: `${typeLabel} با موفقیت منتشر شد`,
      message: `مورد جدید در تابلوی اعلانات مخاطبان قرار گرفت.`,
      type: 'success'
    });
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    if (!requireOwnEntity(announcements.find((post) => post.id === id)) || (updates.schoolId !== undefined && updates.schoolId !== currentSchoolId)) return;
    if (!requireSchoolPermission('canManageAnnouncements')) return;
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    setActiveToast({
      title: 'اطلاعیه ویرایش شد',
      message: 'تغییرات با موفقیت ذخیره گردید.',
      type: 'success'
    });
  };

  const deleteAnnouncement = (id: string) => {
    if (!requireOwnEntity(announcements.find((post) => post.id === id))) return;
    if (!requireSchoolPermission('canManageAnnouncements')) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setActiveToast({
      title: 'مورد حذف شد',
      message: 'مطلب از تابلوی اعلانات و اخبار برداشته شد.',
      type: 'info'
    });
  };

  const togglePinAnnouncement = (id: string) => {
    if (!requireOwnEntity(announcements.find((post) => post.id === id))) return;
    if (!requireSchoolPermission('canManageAnnouncements')) return;
    setAnnouncements((prev) => {
      const target = prev.find((a) => a.id === id);
      const willPin = !target?.isPinned;
      return prev.map((a) => {
        if (a.schoolId !== currentSchoolId) return a;
        if (a.id === id) {
          return { ...a, isPinned: willPin };
        }
        // only one announcement can be pinned
        return { ...a, isPinned: false };
      });
    });
    setActiveToast({
      title: 'وضعیت سنجاق بروزرسانی شد',
      message: 'تنها یک اطلاعیه در بالاترین جایگاه تابلوی اعلانات پین می‌شود.',
      type: 'info'
    });
  };

  const addSchool = (school: Omit<School, 'id' | 'todayAttendanceSubmitted' | 'attendanceRateToday'>) => {
    if (!requireRole('platform_admin')) return;
    const newSchool: School = {
      ...school,
      id: `school-${Date.now()}`,
      todayAttendanceSubmitted: false,
      attendanceRateToday: 100
    };
    setSchools((prev) => [...prev, newSchool]);
    setActiveToast({
      title: 'مدرسه جدید به سامانه افزوده شد',
      message: `پروفایل مدرسه "${newSchool.name}" با کد ${newSchool.code} با موفقیت فعال شد.`,
      type: 'success'
    });
  };

  // Student management with Smart Linking by National Code
  const addStudent = (studentData: Omit<Student, 'id' | 'attendanceStats' | 'disciplinaryRecords' | 'reportCards' | 'pastYearHistory' | 'financialSummary'>) => {
    if (!requireOwnEntity(studentData) || !requireClass(studentData.classGroupId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const normCode = toEnglishDigits(studentData.nationalCode).trim();
    if (!/^\d{10}$/.test(normCode)) {
      setActiveToast({ title: 'کد ملی نامعتبر است', message: 'کد ملی باید شامل ده رقم باشد.', type: 'warning' });
      return;
    }
    const existingStudent = students.find(
      (s) => toEnglishDigits(s.nationalCode).trim() === normCode
    );

    if (existingStudent) {
      // STUDENT ALREADY EXISTS! Do not duplicate entity; link and transfer academic history
      const prevSchool = schools.find((s) => s.id === existingStudent.schoolId);
      const prevSchoolName = prevSchool?.name || 'مدرسه قبلی شهرستان';
      const isFromOtherSchool = existingStudent.schoolId !== studentData.schoolId;

      const updatedPastHistory = [...(existingStudent.pastYearHistory || [])];
      if (isFromOtherSchool) {
        const lastReportCard = existingStudent.reportCards?.[0];
        updatedPastHistory.unshift({
          year: lastReportCard?.year || 'سال نامشخص',
          grade: existingStudent.grade || 'پایه قبلی',
          schoolName: prevSchoolName,
          ...(lastReportCard && Number.isFinite(lastReportCard.gpa) ? { gpa: lastReportCard.gpa } : {}),
          ...(lastReportCard && Number.isFinite(lastReportCard.disciplineScore) ? { disciplineScore: lastReportCard.disciplineScore } : {}),
          status: 'انتقال پرونده تحصیلی به مدرسه جدید'
        });
      }

      // Update student count in old class if needed
      if (existingStudent.classGroupId && existingStudent.classGroupId !== studentData.classGroupId) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === existingStudent.classGroupId
              ? { ...c, studentCount: Math.max(0, c.studentCount - 1) }
              : c
          )
        );
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.id === existingStudent.id
            ? {
                ...s,
                ...studentData,
                id: existingStudent.id, // Preserve single entity identity
                status: 'active',
                pastYearHistory: updatedPastHistory,
                attendanceStats: s.attendanceStats || { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 },
                disciplinaryRecords: s.disciplinaryRecords || [],
                reportCards: s.reportCards || []
              }
            : s
        )
      );

      // Update new class student count
      setClasses((prev) =>
        prev.map((c) => (c.id === studentData.classGroupId ? { ...c, studentCount: c.studentCount + 1 } : c))
      );

      setActiveToast({
        title: 'پرونده یکپارچه دانش‌آموز متصل شد',
        message: isFromOtherSchool
          ? `دانش‌آموز با کد ملی ${studentData.nationalCode} قبلاً در "${prevSchoolName}" ثبت بوده و پرونده، کارنامه‌ها و سوابق وی بدون ایجاد موجودیت تکراری به این مدرسه پیوند یافت.`
          : `پرونده دانش‌آموز با موفقیت به روزرسانی و در کلاس جدید فعال شد.`,
        type: 'success'
      });
      return;
    }

    // Brand new student creation
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`,
      status: 'active',
      attendanceStats: { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 },
      disciplinaryRecords: [],
      reportCards: [],
      pastYearHistory: []
    };
    setStudents((prev) => [newStudent, ...prev]);
    // update class student count
    setClasses((prev) =>
      prev.map((c) => (c.id === studentData.classGroupId ? { ...c, studentCount: c.studentCount + 1 } : c))
    );
    setActiveToast({
      title: 'دانش‌آموز جدید ثبت شد',
      message: `${studentData.name} با شماره پرونده به مدرسه افزوده گردید.`,
      type: 'success'
    });
  };

  const markStudentGraduated = (
    studentId: string,
    details: { year: string; university?: string; major?: string; rank?: string; notes?: string }
  ) => {
    if (!requireStudent(studentId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'graduated',
            graduationDetails: details
          };
        }
        return s;
      })
    );

    if (student.classGroupId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === student.classGroupId
            ? { ...c, studentCount: Math.max(0, c.studentCount - 1) }
            : c
        )
      );
    }

    setActiveToast({
      title: 'انتقال به لیست فارغ‌التحصیلان',
      message: `${student.name} با موفقیت در لیست فارغ‌التحصیلان ثبت شد${details.university ? ` (قبولی: ${details.university})` : ''}.`,
      type: 'success'
    });
  };

  const markStudentTransferred = (
    studentId: string,
    details: { destinationSchoolName: string; date: string; reason?: string }
  ) => {
    if (!requireStudent(studentId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'transferred',
            transferDetails: details
          };
        }
        return s;
      })
    );

    if (student.classGroupId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === student.classGroupId
            ? { ...c, studentCount: Math.max(0, c.studentCount - 1) }
            : c
        )
      );
    }

    setActiveToast({
      title: 'انتقال پرونده تحصیلی',
      message: `پرونده تحصیلی ${student.name} به "${details.destinationSchoolName}" منتقل گردید. سوابق وی در سامانه جهت ارجاعات بعدی حفظ می‌شود.`,
      type: 'info'
    });
  };

  const markStudentActive = (studentId: string, classGroupId: string) => {
    if (!requireStudent(studentId) || !requireClass(classGroupId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, status: 'active', classGroupId, pendingClassGrade: undefined }
          : s
      )
    );

    setClasses((prev) =>
      prev.map((c) => (c.id === classGroupId ? { ...c, studentCount: c.studentCount + 1 } : c))
    );

    setActiveToast({
      title: 'فعال‌سازی مجدد دانش‌آموز',
      message: `${student.name} مجدداً در وضعیت فعال تحصیلی قرار گرفت.`,
      type: 'success'
    });
  };

  const updateStudent = (studentId: string, updates: Omit<Partial<Student>, 'financialSummary'>) => {
    if (!requireStudent(studentId) || (updates.schoolId !== undefined && updates.schoolId !== currentSchoolId) || (updates.classGroupId !== undefined && !requireClass(updates.classGroupId))) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s))
    );
    setActiveToast({
      title: 'اطلاعات دانش‌آموز بروز شد',
      message: 'تغییرات پرونده با موفقیت ذخیره گردید.',
      type: 'success'
    });
  };

  const removeStudent = (studentId: string) => {
    if (!requireStudent(studentId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const student = studentsRef.current.find((s) => s.id === studentId);
    if (!student) return;
    if (student.financialSummary?.assignedFees.length || student.financialSummary?.transactions.length) {
      financialFailure('دانش‌آموز دارای سابقه مالی قابل حذف نیست؛ وضعیت انتقال یا فارغ‌التحصیلی را ثبت کنید.');
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setClasses((prev) =>
      prev.map((c) => (c.id === student.classGroupId ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c))
    );
    if (selectedStudentForDossier?.id === studentId) {
      setSelectedStudentForDossier(null);
    }
    setActiveToast({
      title: 'دانش‌آموز حذف شد',
      message: `${student.name} از سامانه مدرسه خارج گردید.`,
      type: 'info'
    });
  };

  const transferStudentClass = (studentId: string, newClassGroupId: string) => {
    if (!requireStudent(studentId) || !requireClass(newClassGroupId)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const student = students.find((s) => s.id === studentId);
    const targetClass = classes.find((c) => c.id === newClassGroupId);
    if (!student || !targetClass) return;

    const oldClassId = student.classGroupId;

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, classGroupId: newClassGroupId } : s))
    );

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === oldClassId) return { ...c, studentCount: Math.max(0, c.studentCount - 1) };
        if (c.id === newClassGroupId) return { ...c, studentCount: c.studentCount + 1 };
        return c;
      })
    );

    setActiveToast({
      title: 'کلاس‌بندی بروز شد',
      message: `دانش‌آموز ${student.name} به ${targetClass.name} انتقال یافت.`,
      type: 'success'
    });
  };

  const addClassGroup = (classData: Omit<ClassGroup, 'id' | 'studentCount'>) => {
    if (!requireOwnEntity(classData)) return;
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const newClass: ClassGroup = {
      ...classData,
      id: `cls-${Date.now()}`,
      studentCount: 0
    };
    setClasses((prev) => [...prev, newClass]);
    setActiveToast({
      title: 'کلاس جدید ایجاد شد',
      message: `${newClass.name} با ظرفیت اختصاصی ثبت شد.`,
      type: 'success'
    });
  };

  const deleteClassGroup = (classId: string) => {
    if (!requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    const target = classes.find((cls) => cls.id === classId && cls.schoolId === currentSchoolId);
    if (!target) return;
    if (students.some((student) => student.classGroupId === classId) || schedule.some((slot) => slot.classGroupId === classId)) {
      setActiveToast({ title: 'کلاس قابل حذف نیست', message: 'ابتدا دانش‌آموزان و برنامه‌های مرتبط با این کلاس را تعیین تکلیف کنید.', type: 'warning' });
      return;
    }
    setClasses((prev) => prev.filter((cls) => cls.id !== classId));
    setActiveToast({ title: 'کلاس حذف شد', message: target.name, type: 'info' });
  };

  const addScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
    if (!requireOwnEntity(slot) || !requireClass(slot.classGroupId)) return;
    if (!requireSchoolPermission('canManageSchedule')) return;
    if (!requireCurrentAcademicYear()) return;
    const teacher = teachers.find((item) => item.id === slot.teacherId && item.schoolId === currentSchoolId);
    if (!teacher || teacher.name !== slot.teacherName || !teacher.assignedClassIds.includes(slot.classGroupId)) {
      const error = 'دبیر باید از فهرست پرسنل مدرسه و کلاس‌های انتسابی او انتخاب شود.';
      setActiveToast({ title: 'برنامه ثبت نشد', message: error, type: 'warning' });
      return { ok: false, error };
    }
    const conflict = scheduleConflict(schedule, slot);
    if (conflict) {
      setActiveToast({ title: 'تداخل برنامه', message: conflict, type: 'warning' });
      return { ok: false, error: conflict };
    }
    const newSlot: ScheduleSlot = {
      ...slot,
      id: `sch-${Date.now()}`
    };
    setSchedule((prev) => [...prev, newSlot]);
    setActiveToast({
      title: 'برنامه هفتگی بروز شد',
      message: `زنگ آموزشی برای روز ${slot.dayOfWeek} اختصاص یافت.`,
      type: 'success'
    });
    return { ok: true };
  };

  const updateScheduleSlot = (slot: ScheduleSlot) => {
    if (!requireOwnEntity(schedule.find((item) => item.id === slot.id)) || !requireOwnEntity(slot) || !requireClass(slot.classGroupId)) return;
    if (!requireSchoolPermission('canManageSchedule')) return;
    if (!requireCurrentAcademicYear()) return;
    const conflict = scheduleConflict(schedule, slot, slot.id);
    if (conflict) {
      setActiveToast({ title: 'تداخل برنامه', message: conflict, type: 'warning' });
      return;
    }
    setSchedule((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
    setActiveToast({
      title: 'برنامه هفتگی ذخیره شد',
      message: 'تغییرات زنگ کلاسی ثبت گردید.',
      type: 'success'
    });
  };

  const deleteScheduleSlot = (slotId: string) => {
    if (!requireOwnEntity(schedule.find((item) => item.id === slotId))) return;
    if (!requireSchoolPermission('canManageSchedule')) return;
    if (!requireCurrentAcademicYear()) return;
    setSchedule((prev) => prev.filter((s) => s.id !== slotId));
    setActiveToast({
      title: 'زنگ کلاسی حذف شد',
      message: 'برنامه آموزشی بازآرایی شد.',
      type: 'info'
    });
  };

  const updateVicePrincipalPermissions = (perms: Partial<VicePrincipalPermissions>) => {
    if (!requireRole('principal')) return;
    if (!currentVP) return;
    updateVicePrincipalProfilePermissions(currentVP.id, perms);
    setActiveToast({
      title: 'سطح دسترسی معاونت تغییر کرد',
      message: 'تنظیمات دسترسی معاونین با موفقیت اعمال گردید.',
      type: 'success'
    });
  };

  const addDisciplinaryRecord = (studentId: string, record: Omit<DisciplinaryRecord, 'id'>) => {
    if (!requireStudent(studentId)) return;
    if (!requireSchoolPermission('canLogDisciplinary')) return;
    if (!requireCurrentAcademicYear()) return;
    const newRecord: DisciplinaryRecord = {
      ...record,
      id: `disc-${Date.now()}`
    };
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            disciplinaryRecords: [newRecord, ...(s.disciplinaryRecords || [])]
          };
        }
        return s;
      })
    );
    setActiveToast({
      title: 'مورد انضباطی ثبت شد',
      message: `سند جدید در پرونده انضباطی دانش‌آموز بایگانی گردید.`,
      type: 'info'
    });
  };

  const addGradeItem = (grade: Omit<GradeItem, 'id'>): GradeActionResult => {
    if (!requireOwnEntity(grade) || !requireClass(grade.classGroupId) || !requireRole('teacher')) return { ok: false, error: 'برای ثبت این ارزشیابی دسترسی لازم را ندارید.' };
    if (!requireCurrentAcademicYear()) return { ok: false, error: 'برای ثبت نمره، سال تحصیلی فعال مدرسه را انتخاب کنید.' };
    const validationError = validateGradeItem(grade);
    if (validationError) return { ok: false, error: validationError };
    const classRoster = students.filter((student) => student.schoolId === currentSchoolId && student.classGroupId === grade.classGroupId && (!student.status || student.status === 'active'));
    const rosterIds = new Set(classRoster.map((student) => student.id));
    if (grade.scores.length !== rosterIds.size || grade.scores.some((score) => !rosterIds.has(score.studentId))) return { ok: false, error: 'فهرست نمره‌ها باید دقیقاً با دانش‌آموزان فعال همین کلاس مطابقت داشته باشد.' };
    const newGrade: GradeItem = {
      ...grade,
      id: `grd-${Date.now()}`
    };
    setGrades((prev) => [newGrade, ...prev]);
    setActiveToast({
      title: 'نمرات با موفقیت ثبت شد',
      message: `ریز نمرات درس ${grade.subject} با عنوان "${grade.title}" ذخیره گردید.`,
      type: 'success'
    });
    return { ok: true };
  };

  const addHomework = (hw: Omit<HomeworkItem, 'id' | 'submissionsCount'>) => {
    if (!requireOwnEntity(hw) || !requireClass(hw.classGroupId) || hw.teacherId !== currentUser.id) return;
    if (!requireRole('teacher')) return;
    if (!requireCurrentAcademicYear()) return;
    const newHw: HomeworkItem = {
      ...hw,
      id: `hw-${Date.now()}`,
      submissionsCount: 0
    };
    setHomework((prev) => [newHw, ...prev]);
    setActiveToast({
      title: 'تکلیف جدید ثبت شد',
      message: `تکلیف برای دانش‌آموزان کلاس ${hw.className} ارسال شد.`,
      type: 'success'
    });
  };

  const submitHomework = (submission: Omit<HomeworkSubmission, 'id' | 'submissionDate' | 'status'>) => {
    if (!currentStudent || submission.studentId !== currentStudent.id || !visibleHomeworkIds.has(submission.homeworkId)) { denyAction(); return; }
    if (!requireRole('student')) return;
    if (!requireCurrentAcademicYear()) return;
    const newSub: HomeworkSubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submissionDate: '۱۴۰۵/۰۶/۲۳ - ۲۰:۱۵',
      status: 'submitted'
    };
    setHomeworkSubmissions((prev) => [newSub, ...prev]);
    // increment submissionsCount in homework item
    setHomework((prev) =>
      prev.map((h) =>
        h.id === submission.homeworkId ? { ...h, submissionsCount: h.submissionsCount + 1 } : h
      )
    );
    setActiveToast({
      title: 'تکلیف با موفقیت ارسال شد',
      message: 'پاسخ شما با موفقیت برای دبیر ارسال گردید.',
      type: 'success'
    });
  };

  const gradeHomeworkSubmission = (submissionId: string, score: number, feedback: string) => {
    const target = homeworkSubmissions.find((submission) => submission.id === submissionId);
    const assignment = homework.find((item) => item.id === target?.homeworkId);
    if (!assignment || !requireOwnEntity(assignment) || !requireClass(assignment.classGroupId)) return;
    if (!requireRole('teacher')) return;
    if (!requireCurrentAcademicYear()) return;
    setHomeworkSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? { ...sub, status: 'graded', teacherScore: score, teacherFeedback: feedback }
          : sub
      )
    );
    setActiveToast({
      title: 'نمره و بازخورد تکلیف ثبت شد',
      message: 'ارزیابی تکلیف دانش‌آموز با موفقیت ذخیره شد.',
      type: 'success'
    });
  };

  const addOnlineExam = (exam: Omit<OnlineExam, 'id'>) => {
    if (!requireOwnEntity(exam) || !requireClass(exam.classGroupId)) return;
    if (!requireRole('teacher')) return;
    if (!requireCurrentAcademicYear()) return;
    const newExam: OnlineExam = {
      ...exam,
      id: `exam-${Date.now()}`
    };
    setExams((prev) => [newExam, ...prev]);
    setActiveToast({
      title: 'آزمون در تقویم ثبت شد',
      message: `«${exam.title}» برای تاریخ ${exam.examDate} زمان‌بندی شد؛ افزودن سؤال و شرکت آنلاین در این نسخه فعال نیست.`,
      type: 'success'
    });
  };

  const updateParentContact = (
    studentId: string,
    data: { address?: string; emergencyPhone?: string; parentPhone?: string; parentBaleAccount?: string }
  ) => {
    if (currentRole === 'parent' ? !currentStudent || studentId !== currentStudent.id : !requireStudent(studentId)) { denyAction(); return; }
    if (currentRole !== 'parent' && !requireSchoolPermission('canManageStudentsAndClasses')) return;
    if (!requireCurrentAcademicYear()) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            address: data.address !== undefined ? data.address : s.address,
            emergencyPhone: data.emergencyPhone !== undefined ? data.emergencyPhone : s.emergencyPhone,
            parentPhone: data.parentPhone !== undefined ? data.parentPhone : s.parentPhone,
            parentBaleAccount: data.parentBaleAccount !== undefined ? data.parentBaleAccount : s.parentBaleAccount
          };
        }
        return s;
      })
    );
    setActiveToast({
      title: 'اطلاعات تماس و سکونت ذخیره شد',
      message: 'اطلاعات پرونده توسط اولیا با موفقیت بروزرسانی شد.',
      type: 'success'
    });
  };

  // Staff Management Actions
  const addTeacher = (teacherData: Omit<TeacherProfile, 'id'>) => {
    if (!requireOwnEntity(teacherData) || teacherData.assignedClassIds.some((id) => !requireClass(id))) return;
    if (!requireRole('principal')) return;
    const newTeacher: TeacherProfile = {
      ...teacherData,
      id: `teacher-${Date.now()}`
    };
    setTeachers((prev) => [...prev, newTeacher]);
    setActiveToast({
      title: 'دبیر جدید ثبت شد',
      message: `${newTeacher.name} با دروس و کلاس‌های مشخص شده به کادر مدرسه اضافه گردید.`,
      type: 'success'
    });
  };

  const updateTeacher = (id: string, updates: Partial<TeacherProfile>) => {
    if (!requireOwnEntity(teachers.find((teacher) => teacher.id === id)) || (updates.schoolId !== undefined && updates.schoolId !== currentSchoolId) || updates.assignedClassIds?.some((classId) => !requireClass(classId))) return;
    if (!requireRole('principal')) return;
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    setActiveToast({
      title: 'اطلاعات دبیر بروز شد',
      message: 'تغییرات در مشخصات و دروس تدریسی ذخیره گردید.',
      type: 'success'
    });
  };

  const deleteTeacher = (id: string) => {
    if (!requireOwnEntity(teachers.find((teacher) => teacher.id === id))) return;
    if (!requireRole('principal')) return;
    const teacher = teachers.find((t) => t.id === id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setActiveToast({
      title: 'حذف دبیر از کادر آموزشگاه',
      message: `${teacher?.name || 'دبیر'} از لیست معلمان مدرسه حذف شد.`,
      type: 'info'
    });
  };

  const addVicePrincipal = (vpData: Omit<VicePrincipalProfile, 'id'>) => {
    if (!requireOwnEntity(vpData)) return;
    if (!requireRole('principal')) return;
    const newVP: VicePrincipalProfile = {
      ...vpData,
      id: `vp-${Date.now()}`
    };
    setVicePrincipals((prev) => [...prev, newVP]);
    setActiveToast({
      title: 'معاون جدید ثبت شد',
      message: `${newVP.name} به عنوان ${newVP.roleTitle} به کادر مدرسه افزوده شد.`,
      type: 'success'
    });
  };

  const updateVicePrincipal = (id: string, updates: Partial<VicePrincipalProfile>) => {
    if (!requireOwnEntity(vicePrincipals.find((vp) => vp.id === id)) || (updates.schoolId !== undefined && updates.schoolId !== currentSchoolId)) return;
    if (!requireRole('principal')) return;
    setVicePrincipals((prev) =>
      prev.map((vp) => (vp.id === id ? { ...vp, ...updates } : vp))
    );
    setActiveToast({
      title: 'اطلاعات معاون بروز شد',
      message: 'مشخصات یا عنوان سازمانی معاون با موفقیت ویرایش گردید.',
      type: 'success'
    });
  };

  const deleteVicePrincipal = (id: string) => {
    if (!requireOwnEntity(vicePrincipals.find((vp) => vp.id === id))) return;
    if (!requireRole('principal')) return;
    const vp = vicePrincipals.find((v) => v.id === id);
    setVicePrincipals((prev) => prev.filter((v) => v.id !== id));
    if (activeVicePrincipalId === id) {
      const remaining = vicePrincipals.filter((v) => v.id !== id);
      if (remaining.length > 0) {
        setActiveVicePrincipalId(remaining[0].id);
      }
    }
    setActiveToast({
      title: 'معاون حذف شد',
      message: `${vp?.name || 'معاون'} از کادر مدیریتی آموزشگاه حذف گردید.`,
      type: 'info'
    });
  };

  const convertTeacherToVicePrincipal = (
    teacherId: string,
    roleTitle: string,
    permissions?: Partial<VicePrincipalPermissions>
  ) => {
    if (!requireOwnEntity(teachers.find((teacher) => teacher.id === teacherId))) return;
    if (!requireRole('principal')) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    const newVP: VicePrincipalProfile = {
      id: `vp-${Date.now()}`,
      name: teacher.name,
      phone: teacher.phone,
      schoolId: teacher.schoolId,
      avatarBg: teacher.avatarBg || 'bg-teal-600',
      roleTitle,
      permissions: {
        canManageAnnouncements: true,
        canManageSchedule: true,
        canManageStudentsAndClasses: true,
        canViewFullDossier: true,
        canLogDisciplinary: true,
        ...permissions
      }
    };
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    setVicePrincipals((prev) => [...prev, newVP]);
    setActiveToast({
      title: 'تغییر نقش به معاونت',
      message: `${teacher.name} به عنوان ${roleTitle} در کادر اجرایی منصوب شد.`,
      type: 'success'
    });
  };

  const convertVicePrincipalToTeacher = (
    vpId: string,
    teachingSubjects: string[],
    assignedClassIds: string[]
  ) => {
    if (!requireOwnEntity(vicePrincipals.find((vp) => vp.id === vpId)) || assignedClassIds.some((id) => !requireClass(id))) return;
    if (!requireRole('principal')) return;
    const vp = vicePrincipals.find((v) => v.id === vpId);
    if (!vp) return;
    const newTeacher: TeacherProfile = {
      id: `teacher-${Date.now()}`,
      name: vp.name,
      phone: vp.phone,
      schoolId: vp.schoolId,
      avatarBg: vp.avatarBg || 'bg-indigo-600',
      teachingSubjects,
      assignedClassIds,
      roleTitle: 'دبیر رسمی'
    };
    setVicePrincipals((prev) => prev.filter((v) => v.id !== vpId));
    setTeachers((prev) => [...prev, newTeacher]);
    if (activeVicePrincipalId === vpId) {
      const remaining = vicePrincipals.filter((v) => v.id !== vpId);
      if (remaining.length > 0) {
        setActiveVicePrincipalId(remaining[0].id);
      }
    }
    setActiveToast({
      title: 'تغییر نقش به تدریس',
      message: `${vp.name} به کادر دبیران و اساتید آموزشگاه انتقال یافت.`,
      type: 'success'
    });
  };

  const setActiveTermId = (termId: AcademicTermId) => {
    if (!requireRole('principal')) return;
    if (!activeAcademicYear) return;
    if (!requireCurrentAcademicYear()) return;
    setAcademicYears((prev) =>
      prev.map((y) => {
        if (y.id === activeAcademicYear.id && y.schoolId === currentSchoolId) {
          return {
            ...y,
            currentTermId: termId,
            terms: y.terms.map((t) => ({
              ...t,
              isCurrent: t.id === termId
            }))
          };
        }
        return y;
      })
    );
    const termNames: Record<AcademicTermId, string> = {
      term1: 'نوبت اول (مهر تا دی)',
      term2: 'نوبت دوم (بهمن تا خرداد)',
      summer: 'دوره تابستان'
    };
    setActiveToast({
      title: 'تغییر نوبت تحصیلی',
      message: `نوبت رسمی آموزشگاه به «${termNames[termId] || termId}» تغییر یافت.`,
      type: 'success'
    });
  };

  const addAcademicYear = (newYearData: Omit<AcademicYear, 'id' | 'isCurrent'>) => {
    if (!requireRole('principal')) return;
    const newId = `ay-${Date.now()}`;
    const newYear: AcademicYear = {
      ...newYearData,
      schoolId: currentSchoolId,
      id: newId,
      isCurrent: false
    };
    setAcademicYears((prev) => [...prev, newYear]);
    setActiveToast({
      title: 'ثبت سال تحصیلی جدید',
      message: `سال تحصیلی ${newYear.title} با موفقیت در تقویم آموزشی آموزشگاه تعریف شد.`,
      type: 'success'
    });
  };

  const updateAcademicYear = (yearId: string, updates: Partial<AcademicYear>) => {
    if (!requireOwnEntity(academicYears.find((year) => year.id === yearId)) || (updates.schoolId !== undefined && updates.schoolId !== currentSchoolId)) return;
    if (!requireRole('principal')) return;
    setAcademicYears((prev) => prev.map((y) => (y.id === yearId ? { ...y, ...updates } : y)));
    setActiveToast({
      title: 'ویرایش سال تحصیلی',
      message: 'مشخصات سال تحصیلی به‌روزرسانی شد.',
      type: 'success'
    });
  };

  const rolloverAcademicYear = (options: YearRolloverOptions) => {
    const fail = (error: string): YearRolloverResult => {
      setActiveToast({ title: 'سال‌بندی انجام نشد', message: error, type: 'warning' });
      return { ok: false, error };
    };
    if (!requireRole('principal')) return { ok: false, error: 'این عملیات فقط برای مدیر مدرسه مجاز است.' };
    if (!activeAcademicYear || !currentSchool) return fail('سال تحصیلی فعال مدرسه مشخص نیست.');
    if (!requireCurrentAcademicYear()) return { ok: false, error: 'برای سال‌بندی، سال فعال مدرسه را انتخاب کنید.' };

    const currentMatch = toEnglishDigits(activeAcademicYear.title).replace(/\s/g, '').match(/^(\d{4})-(\d{4})$/);
    const newTitle = options.newYearTitle.trim();
    const newMatch = toEnglishDigits(newTitle).replace(/\s/g, '').match(/^(\d{4})-(\d{4})$/);
    if (!currentMatch || !newMatch) return fail('عنوان سال باید مانند ۱۴۰۵-۱۴۰۶ و شامل دو سال چهارضرقمی باشد.');
    const currentStart = Number(currentMatch[1]);
    const currentEnd = Number(currentMatch[2]);
    const newStart = Number(newMatch[1]);
    const newEnd = Number(newMatch[2]);
    if (currentEnd !== currentStart + 1 || newStart !== currentEnd || newEnd !== newStart + 1) {
      return fail('سال جدید باید دقیقاً سال بعد از سال فعال باشد.');
    }
    const normalizedNewTitle = newMatch[0];
    if (schoolYears.some((year) => toEnglishDigits(year.title).replace(/\s/g, '') === normalizedNewTitle)) {
      return fail('این سال از قبل در تقویم مدرسه ثبت شده است.');
    }

    const prevYearTitle = activeAcademicYear.title;
    const newYearId = `ay-${currentSchoolId}-${Date.now()}`;
    const newStartTitle = toPersianDigits(String(newStart));
    const newEndTitle = toPersianDigits(String(newEnd));
    const updatedYears = academicYears.map((year) => year.schoolId !== currentSchoolId ? year : ({
      ...year,
      isCurrent: false,
      ...(year.isCurrent ? { status: 'archived' as const } : {})
    }));
    const newYear: AcademicYear = {
      id: newYearId,
      schoolId: currentSchoolId,
      title: newTitle,
      startDate: `${newStartTitle}/۰۷/۰۱`,
      endDate: `${newEndTitle}/۰۶/۳۱`,
      status: 'active',
      isCurrent: true,
      currentTermId: 'term1',
      terms: [
        { id: 'term1', title: 'نوبت اول (مهر تا دی)', startDate: `${newStartTitle}/۰۷/۰۱`, endDate: `${newStartTitle}/۱۰/۳۰`, isCurrent: true },
        { id: 'term2', title: 'نوبت دوم (بهمن تا خرداد)', startDate: `${newStartTitle}/۱۱/۰۱`, endDate: `${newEndTitle}/۰۳/۳۱`, isCurrent: false },
        { id: 'summer', title: 'دوره تابستان', startDate: `${newEndTitle}/۰۴/۰۱`, endDate: `${newEndTitle}/۰۶/۳۱`, isCurrent: false }
      ],
      description: `سال تحصیلی فعال آموزشگاه (${newTitle})`
    };
    const result = rolloverStudents(students, classes, {
      schoolId: currentSchoolId,
      schoolName: currentSchool.name,
      currentYearTitle: prevYearTitle,
      newYearId,
      newYearTitle: newTitle,
      options
    });
    setAcademicYears([...updatedYears, newYear]);
    setActiveAcademicYearIdState(newYearId);
    setStudents(result.students);
    sendNotification({
      studentName: 'دانش‌آموزان مدرسه',
      recipientName: 'اولیا و دانش‌آموزان',
      recipientPhone: 'اعلان آزمایشی سراسری',
      platform: 'bale',
      type: 'general',
      message: `سال تحصیلی ${newTitle} برای مدرسه آغاز شد. ارتقا و فراغت فقط بر پایه کارنامه نهایی منتشرشده انجام شده است؛ ${result.pendingClassAssignment} نفر نیازمند کلاس‌بندی هستند.`
    });
    setActiveToast({
      title: 'سال تحصیلی جدید فعال شد',
      message: `${result.promoted} ارتقا، ${result.graduated} فراغت، ${result.pendingClassAssignment} نیازمند کلاس‌بندی، ${result.notEligible} فاقد شرایط قابل تأیید و ${result.archivedReportCards} سابقه ثبت‌شده. این عملیات آرشیو کامل جزئیات سال قبل نیست.`,
      type: 'success'
    });
    return { ok: true, promoted: result.promoted, graduated: result.graduated, pendingClassAssignment: result.pendingClassAssignment, archivedReportCards: result.archivedReportCards, notEligible: result.notEligible };
  };

  const returnToCurrentAcademicYear = () => {
    const curr = schoolYears.find((y) => y.isCurrent) || schoolYears[0];
    if (curr) {
      setActiveAcademicYearId(curr.id);
      setActiveToast({
        title: 'بازگشت به سال جاری',
        message: `سامانه به سال تحصیلی فعال (${curr.title}) منتقل شد.`,
        type: 'info'
      });
    }
  };

  // --- Financial Management Operations (validated against current local state) ---
  const financialFailure = (error: string): FinancialActionResult => {
    setActiveToast({ title: 'عملیات مالی انجام نشد', message: error, type: 'warning' });
    return { ok: false, error };
  };
  const operation = (prefix: string) => ({ id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`, date: getSchoolDate(), recordedBy: currentUser.name });
  const commitFinance = (studentId: string, update: (summary: StudentFinancialSummary) => StudentFinancialSummary): FinancialActionResult => {
    const student = studentsRef.current.find((item) => item.id === studentId);
    if (!student || student.schoolId !== currentSchoolId) return financialFailure('پرونده مالی در مدرسه جاری یافت نشد.');
    try {
      const source = student.financialSummary || createEmptyFinancialSummary();
      const next = update(source);
      if (next !== source) setStudents((prev) => prev.map((item) => item.id === studentId ? { ...item, financialSummary: next } : item));
      return { ok: true };
    } catch (error) {
      if (!(error instanceof FinancialError)) throw error;
      return financialFailure(error.message);
    }
  };
  const feeIsAssigned = (id: string) => studentsRef.current.some((student) => student.financialSummary?.assignedFees.some((fee) => fee.feeItemId === id));

  const addFeeItem = (data: Omit<SchoolFeeItem, 'id' | 'createdAt'>): FinancialActionResult => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') return financialFailure('ثبت تعرفه و سوابق مالی فقط در سال فعال امکان‌پذیر است.');
    if (!requireOwnEntity(data) || !requireSchoolPermission('canManageFinances') || !schoolYears.some((year) => year.id === data.academicYearId)) return financialFailure('مدرسه، سال تحصیلی یا دسترسی تعرفه معتبر نیست.');
    if (!data.title.trim() || !Number.isSafeInteger(data.amount) || data.amount <= 0) return financialFailure('عنوان تعرفه و مبلغ صحیح مثبت بر حسب تومان لازم است.');
    const op = operation('fee');
    const fee: SchoolFeeItem = { ...data, title: data.title.trim(), id: op.id, createdAt: op.date };
    try {
      // Validate dates and the charge even when there are currently no target students.
      assignFee(createEmptyFinancialSummary(), fee, op);
      const next = studentsRef.current.map((student) => fee.targetScope !== 'selective' && (fee.isMandatory || fee.targetScope === 'all') && matchesFeeTarget(student, fee)
        ? { ...student, financialSummary: assignFee(student.financialSummary || createEmptyFinancialSummary(), fee, { ...op, id: `${op.id}-${student.id}` }) }
        : student);
      setFeeItems((prev) => [fee, ...prev]);
      setStudents(next);
      setActiveToast({ title: 'تعرفه مالی ثبت شد', message: `${fee.title}: ${formatPersianCurrency(fee.amount)}`, type: 'success' });
      return { ok: true };
    } catch (error) {
      if (!(error instanceof FinancialError)) throw error;
      return financialFailure(error.message);
    }
  };

  const updateFeeItem = (id: string, updates: Partial<SchoolFeeItem>) => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') { financialFailure('ویرایش تعرفه فقط در سال فعال امکان‌پذیر است.'); return; }
    const fee = feeItems.find((item) => item.id === id);
    if (!requireOwnEntity(fee) || !requireSchoolPermission('canManageFinances')) return;
    if (!fee || feeIsAssigned(id)) { financialFailure('تعرفه تخصیص‌یافته قابل ویرایش نیست؛ برای مبلغ جدید سرفصل جدا تعریف کنید.'); return; }
    const next = { ...fee, ...updates };
    if (next.id !== id || next.schoolId !== currentSchoolId || !schoolYears.some((year) => year.id === next.academicYearId) || !next.title.trim()) { financialFailure('مشخصات تعرفه معتبر نیست.'); return; }
    try { assignFee(createEmptyFinancialSummary(), next, operation('validate-fee')); }
    catch (error) { if (!(error instanceof FinancialError)) throw error; financialFailure(error.message); return; }
    setFeeItems((prev) => prev.map((item) => item.id === id ? next : item));
    setActiveToast({ title: 'تعرفه ویرایش شد', message: next.title, type: 'success' });
  };

  const deleteFeeItem = (id: string) => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') { financialFailure('حذف تعرفه فقط در سال فعال امکان‌پذیر است.'); return; }
    if (!requireOwnEntity(feeItems.find((fee) => fee.id === id)) || !requireSchoolPermission('canManageFinances')) return;
    if (feeIsAssigned(id)) { financialFailure('تعرفه دارای سابقه تخصیص قابل حذف نیست.'); return; }
    setFeeItems((prev) => prev.filter((fee) => fee.id !== id));
    setActiveToast({ title: 'تعرفه حذف شد', message: 'سرفصل بدون سابقه تخصیص حذف شد.', type: 'info' });
  };

  const assignFeeItemToStudents = (id: string, scope: string, classId?: string) => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') { financialFailure('تخصیص تعرفه فقط در سال فعال امکان‌پذیر است.'); return; }
    const fee = feeItems.find((item) => item.id === id);
    if (!fee || !requireOwnEntity(fee) || !requireSchoolPermission('canManageFinances') || (classId && !requireClass(classId))) return;
    if (scope !== fee.targetScope || (scope === 'selective' && !classId)) { financialFailure('برای تخصیص انتخابی یک کلاس مشخص انتخاب کنید؛ دامنه مصوب تعرفه باید رعایت شود.'); return; }
    const op = operation('assign');
    let count = 0;
    try {
      const next = studentsRef.current.map((student) => {
        if (!matchesFeeTarget(student, fee, fee.targetScope, classId) || student.financialSummary?.assignedFees.some((item) => item.feeItemId === id)) return student;
        const financialSummary = assignFee(student.financialSummary || createEmptyFinancialSummary(), fee, { ...op, id: `${op.id}-${student.id}` });
        count += 1;
        return { ...student, financialSummary };
      });
      setStudents(next);
      setActiveToast({ title: 'تخصیص مالی انجام شد', message: `تعداد تخصیص جدید: ${toPersianDigits(count)}`, type: 'success' });
    } catch (error) { if (!(error instanceof FinancialError)) throw error; financialFailure(error.message); }
  };

  const notifyPayment = (student: Student, payment: PaymentTransaction) => {
    const state = payment.status === 'confirmed' ? payment.isSimulated ? 'تأیید آزمایشی شد' : 'تأیید شد' : payment.status === 'rejected' ? 'رد شد' : 'برای بررسی ثبت شد';
    sendNotification({ studentId: student.id, studentName: student.name, recipientName: student.parentName, recipientPhone: student.parentPhone, platform: 'bale', type: 'payment',
      message: `سند پرداخت ${formatPersianCurrency(payment.amount)} برای ${student.name} ${state}. شماره پیگیری: ${toPersianDigits(payment.trackingCode)}` });
  };
  const recordStudentPayment = (data: Omit<PaymentTransaction, 'id' | 'date'>): FinancialActionResult => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') return financialFailure('ثبت پرداخت فقط در سال فعال امکان‌پذیر است.');
    if (!requireStudent(data.studentId) || !requireOwnEntity(data) || (currentRole === 'parent' && data.studentId !== currentStudent?.id) || (currentRole !== 'parent' && !requireSchoolPermission('canManageFinances'))) return financialFailure('دسترسی ثبت پرداخت این دانش‌آموز مجاز نیست.');
    const student = studentsRef.current.find((item) => item.id === data.studentId);
    if (!student || (data.feeItemId && !requireOwnEntity(feeItems.find((fee) => fee.id === data.feeItemId)))) return financialFailure('تعرفه یا پرونده پرداخت معتبر نیست.');
    const method = normalizePaymentMethod(data.method);
    if (!method) return financialFailure('روش پرداخت معتبر نیست.');
    const op = operation('payment');
    const status = currentRole === 'parent' ? method === 'online' ? 'confirmed' : 'pending_verification' : data.status;
    const payment: PaymentTransaction = { ...data, method, id: op.id, date: op.date, studentName: student.name, trackingCode: toEnglishDigits(data.trackingCode).trim(), recordedBy: currentUser.name, status, isSimulated: method === 'online' };
    const result = commitFinance(student.id, (source) => recordPayment(source, payment, op));
    if (result.ok) {
      notifyPayment(student, payment);
      setActiveToast({ title: status === 'confirmed' ? 'سند پرداخت ثبت شد' : 'رسید در انتظار بررسی ثبت شد', message: payment.isSimulated ? 'پرداخت آنلاین صرفاً آزمایشی است.' : 'وضعیت سند در پرونده مالی قابل مشاهده است.', type: 'success' });
    }
    return result;
  };

  const updatePaymentTransactionStatus = (studentId: string, transactionId: string, status: 'confirmed' | 'rejected'): FinancialActionResult => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') return financialFailure('تغییر وضعیت پرداخت فقط در سال فعال امکان‌پذیر است.');
    if (!requireStudent(studentId) || !requireSchoolPermission('canManageFinances')) return financialFailure('دسترسی بررسی سند مجاز نیست.');
    const student = studentsRef.current.find((item) => item.id === studentId);
    const transaction = student?.financialSummary?.transactions.find((item) => item.id === transactionId);
    if (!student || !transaction) return financialFailure('سند پرداخت یافت نشد.');
    if (transaction.status === status) return { ok: true };
    const result = commitFinance(studentId, (source) => changePaymentStatus(source, transactionId, status, operation('payment-status')));
    if (result.ok) {
      notifyPayment(student, { ...transaction, status });
      setActiveToast({ title: status === 'confirmed' ? 'سند تأیید شد' : 'سند رد شد', message: 'مانده و اقساط از اسناد تأییدشده محاسبه شدند.', type: 'info' });
    }
    return result;
  };

  const sendPaymentReminder = (studentId: string, customMessage?: string) => {
    if (!requireCurrentAcademicYear()) return;
    if (!requireStudent(studentId) || !requireSchoolPermission('canManageFinances')) return;
    const student = studentsRef.current.find((item) => item.id === studentId);
    if (!student) return;
    try {
      const summary = calculateFinancialSummary(student.financialSummary || createEmptyFinancialSummary());
      if (!summary.remainingDebt) { financialFailure('این پرونده مانده بدهی ندارد.'); return; }
      sendNotification({ studentId: student.id, studentName: student.name, recipientName: student.parentName, recipientPhone: student.parentPhone, platform: 'bale', type: 'reminder',
        message: customMessage || `ولی محترم ${student.name}؛ مانده بدهی پرونده مالی ${formatPersianCurrency(summary.remainingDebt)} است. لطفاً جهت بررسی یا تسویه به پنل اولیا مراجعه کنید.` });
    } catch (error) { if (!(error instanceof FinancialError)) throw error; financialFailure(error.message); }
  };

  const applyStudentDiscount = (studentId: string, feeId: string, amount: number, reason = ''): FinancialActionResult => {
    if (!activeAcademicYear?.isCurrent || activeAcademicYear.status !== 'active') return financialFailure('ثبت تخفیف فقط در سال فعال امکان‌پذیر است.');
    if (!requireStudent(studentId) || !requireSchoolPermission('canManageFinances')) return financialFailure('دسترسی ثبت تخفیف مجاز نیست.');
    const result = commitFinance(studentId, (source) => grantDiscount(source, feeId, amount, reason, operation('discount')));
    if (result.ok) setActiveToast({ title: 'تخفیف ثبت شد', message: 'علت و ثبت‌کننده تخفیف در سابقه مالی نگهداری شد.', type: 'success' });
    return result;
  };

  const resetAllData = () => {
    if (!requireRole('platform_admin')) return;
    const suffixes = ['schools', 'classes', 'students', 'schedule', 'qbank', 'banners', 'announcements', 'attendance', 'notifications', 'grades', 'homework', 'exams', 'vp_perms', 'vice_principals', 'teachers', 'homework_subs', 'academic_years', 'active_year_id', 'fee_items'];
    try {
      suffixes.forEach((suffix) => localStorage.removeItem(storageKey(suffix)));
      suffixes.forEach((suffix) => {
        protectedStorageKeys.delete(storageKey(suffix));
        storageWriteFailures.delete(storageKey(suffix));
      });
    } catch {
      setActiveToast({ title: 'بازنشانی ذخیره نشد', message: 'مرورگر اجازه پاک‌کردن داده‌های محلی را نداد؛ اطلاعات فعلی تغییر نکرد.', type: 'warning' });
      return;
    }

    setSchools(INITIAL_SCHOOLS);
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setSchedule(INITIAL_SCHEDULE);
    setQuestionBank(INITIAL_QUESTION_BANK);
    setBanners(INITIAL_BANNERS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAttendanceSessions(INITIAL_ATTENDANCE_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setGrades(INITIAL_GRADES);
    setHomework(INITIAL_HOMEWORK);
    setHomeworkSubmissions(INITIAL_HOMEWORK_SUBMISSIONS);
    setExams(INITIAL_EXAMS);
    setVicePrincipalPermissions(INITIAL_VICE_PRINCIPAL_PERMISSIONS);
    setVicePrincipals(INITIAL_VICE_PRINCIPALS);
    setTeachers(INITIAL_TEACHERS);
    setAcademicYears(INITIAL_ACADEMIC_YEARS.map((year) => ({ ...year, schoolId: 'school-1' })));
    setCurrentSchoolIdState('school-1');
    setActiveAcademicYearIdState('ay-1404-1405');
    setFeeItems(INITIAL_FEE_ITEMS);
    setSelectedStudentForDossier(null);

    setActiveToast({
      title: 'اطلاعات به وضعیت اولیه بازگشت',
      message: 'کلیه اطلاعات پیش‌فرض سامانه مجدداً بارگذاری شد.',
      type: 'info'
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentSchoolId,
        setCurrentSchoolId,
        currentSchool,
        currentUser,
        currentStudent,
        schoolClock,
        findStudentForEnrollment,
        schools: schoolProfiles,
        classes: visibleClasses,
        students: visibleStudents,
        schedule: schedule.filter((slot) => (currentRole === 'platform_admin' || slot.schoolId === currentSchoolId) && visibleClassIds.has(slot.classGroupId) && (currentRole !== 'teacher' || slot.teacherId === currentUser.id)),
        questionBank: questionBank.filter((item) => canReadQuestion(currentUser, currentSchoolId, item, schools)),
        banners,
        announcements: announcements.filter((post) => canReadAnnouncement(currentUser, currentSchoolId, post)),
        attendanceSessions: canonicalAttendance(attendanceSessions).filter((session) => (currentRole === 'platform_admin' || session.schoolId === currentSchoolId) && visibleClassIds.has(session.classGroupId)).map((session) => ({ ...session, previousVersions: undefined, records: session.records.filter((record) => visibleStudentIds.has(record.studentId)) })),
        notifications: notifications.filter((log) => canReadNotification(currentUser, currentSchoolId, log, schools, currentStudent, students)),
        grades: grades.filter((grade) => (currentRole === 'platform_admin' || grade.schoolId === currentSchoolId) && visibleClassIds.has(grade.classGroupId)).map((grade) => ({ ...grade, scores: grade.scores.filter((score) => visibleStudentIds.has(score.studentId)) })),
        homework: visibleHomework,
        homeworkSubmissions: homeworkSubmissions.filter((submission) => visibleHomeworkIds.has(submission.homeworkId) && visibleStudentIds.has(submission.studentId)),
        exams: exams.filter((exam) => (currentRole === 'platform_admin' || exam.schoolId === currentSchoolId) && visibleClassIds.has(exam.classGroupId)),
        vicePrincipalPermissions: activeVicePrincipalPermissions,
        vicePrincipals: vicePrincipals.filter((vp) => currentRole === 'platform_admin' || (userIsInSchool && vp.schoolId === currentSchoolId)),
        teachers: teachers.filter((teacher) => currentRole === 'platform_admin' || (userIsInSchool && teacher.schoolId === currentSchoolId)),
        activeVicePrincipalId: currentVP?.id || '',
        setActiveVicePrincipalId,
        updateVicePrincipalProfilePermissions,
        activeVicePrincipalPermissions,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addVicePrincipal,
        updateVicePrincipal,
        deleteVicePrincipal,
        convertTeacherToVicePrincipal,
        convertVicePrincipalToTeacher,
        selectedStudentForDossier,
        setSelectedStudentForDossier,
        dossierInitialTab,
        setDossierInitialTab,
        openStudentDossier,
        activeMobileTab,
        setActiveMobileTab,
        activeToast,
        clearToast,
        canManageSchool,
        sendNotification,
        submitAttendance,
        addQuestionBankItem,
        addBannerAd,
        toggleBannerStatus,
        clickBanner,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        addSchool,
        addStudent,
        updateStudent,
        removeStudent,
        transferStudentClass,
        markStudentGraduated,
        markStudentTransferred,
        markStudentActive,
        addClassGroup,
        deleteClassGroup,
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
        updateVicePrincipalPermissions,
        addDisciplinaryRecord,
        addGradeItem,
        addHomework,
        submitHomework,
        gradeHomeworkSubmission,
        addOnlineExam,
        updateParentContact,
        academicYears: currentRole === 'platform_admin' ? academicYears : userIsInSchool ? schoolYears : [],
        activeAcademicYearId: activeAcademicYear?.id || '',
        activeAcademicYear: currentRole === 'platform_admin' || userIsInSchool ? activeAcademicYear : undefined,
        activeTerm: currentRole === 'platform_admin' || userIsInSchool ? activeTerm : undefined,
        isViewingArchivedYear,
        isViewingNonCurrentYear,
        setActiveAcademicYearId,
        setActiveTermId,
        addAcademicYear,
        updateAcademicYear,
        rolloverAcademicYear,
        returnToCurrentAcademicYear,
        feeItems: feeItems.filter((fee) => currentRole === 'platform_admin' || (userIsInSchool && fee.schoolId === currentSchoolId)),
        addFeeItem,
        updateFeeItem,
        deleteFeeItem,
        assignFeeItemToStudents,
        recordStudentPayment,
        updatePaymentTransactionStatus,
        sendPaymentReminder,
        applyStudentDiscount,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
