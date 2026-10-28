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
import type { SchoolClock } from '../utils/persianUtils';
export interface AppContextType {
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
    platform: 'bale' | 'sms',
    notifyParents?: boolean
  ) => AttendanceActionResult;
  addQuestionBankItem: (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usageCount'>) => void;
  addBannerAd: (banner: Omit<BannerAd, 'id' | 'clicksCount'>) => void;
  updateBannerAd: (id: string, changes: Partial<Omit<BannerAd, 'id' | 'clicksCount'>>) => void;
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
