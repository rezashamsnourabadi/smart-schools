export type UserRole = 
  | 'platform_admin' 
  | 'principal' 
  | 'vice_principal' 
  | 'teacher' 
  | 'student' 
  | 'parent';

export type SchoolType = 
  | 'دبیرستان دوره دوم'
  | 'دبیرستان دوره اول'
  | 'هنرستان فنی و حرفه‌ای'
  | 'دبستان هوشمند';

export interface School {
  id: string;
  name: string;
  code: string;
  type: SchoolType;
  principalName: string;
  address: string;
  phone: string;
  studentCount: number;
  teacherCount: number;
  classesCount: number;
  todayAttendanceSubmitted: boolean;
  attendanceRateToday: number;
  accentColor: string;
}

export interface VicePrincipalPermissions {
  canManageAnnouncements: boolean;
  canManageSchedule: boolean;
  canManageStudentsAndClasses: boolean;
  canViewFullDossier: boolean;
  canLogDisciplinary: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  schoolId?: string; // Empty for platform_admin
  phone: string;
  avatarBg: string;
  teachingSubjects?: string[];
  assignedClassIds?: string[];
  studentClassId?: string;
  childStudentId?: string;
}

export interface AcademicSubjectScore {
  name: string;
  unit: number; // تعداد واحد
  continuousScore: number; // مستمر
  finalScore: number; // پایانی
  totalScore: number; // نمره نهایی
  status: 'قبول' | 'تجدید';
  teacherName: string;
}

export interface ReportCard {
  term: 'term1' | 'term2';
  termTitle: string; // کارنامه نوبت اول (دی‌ماه) یا نوبت دوم (خرداد)
  year: string; // ۱۴۰۴-۱۴۰۵
  gpa: number; // معدل
  rankInClass: number; // رتبه در کلاس
  disciplineScore: number; // انضباط
  subjects: AcademicSubjectScore[];
  isPublished: boolean; // آیا در دسترس اولیا و دانش‌آموزان قرار گرفته؟
}

export interface PastYearAcademicHistory {
  year: string;
  grade: string;
  schoolName: string;
  gpa: number;
  disciplineScore: number;
  status: 'قبول با رتبه ممتاز' | 'قبول خرداد';
}

export interface DisciplinaryRecord {
  id: string;
  type: 'تشویقی' | 'تذکر' | 'تاخیر';
  title: string;
  note: string;
  date: string;
  recordedBy: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
}

export interface Student {
  id: string;
  schoolId: string;
  classGroupId: string;
  name: string;
  nationalCode: string;
  birthDate: string;
  fatherName: string;
  motherName?: string;
  studentPhone?: string;
  parentName: string;
  parentPhone: string;
  emergencyPhone?: string;
  address: string;
  parentBaleAccount: string;
  grade: string;
  fieldOfStudy: string;
  studentNumber: string; // شماره دانش‌آموزی
  todayStatus?: 'present' | 'absent' | 'late' | 'excused';
  
  // Comprehensive Dossier History
  attendanceStats: AttendanceStats;
  disciplinaryRecords: DisciplinaryRecord[];
  reportCards: ReportCard[];
  pastYearHistory: PastYearAcademicHistory[];
}

export interface ClassGroup {
  id: string;
  schoolId: string;
  name: string;
  grade: string;
  major?: string;
  room: string;
  studentCount: number;
}

export interface ScheduleSlot {
  id: string;
  schoolId: string;
  classGroupId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  dayOfWeek: 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه';
  period: number; // 1, 2, 3, 4
  startTime: string;
  endTime: string;
  isCurrentPeriod?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  schoolId: string;
  classGroupId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  date: string;
  period: number;
  submittedAt: string;
  records: AttendanceEntry[];
  sentNotificationsCount: number;
}

export type GradeCategory = 'continuous' | 'term1' | 'term2' | 'quiz';

export interface GradeItem {
  id: string;
  schoolId: string;
  classGroupId: string;
  subject: string;
  title: string;
  category: GradeCategory;
  categoryTitle: string; // نمره مستمر، امتحان نوبت اول دی‌ماه، امتحان نوبت دوم، کوییز کلاسی
  date: string;
  maxScore: number;
  scores: { studentId: string; score: number; note?: string }[];
}

export interface HomeworkItem {
  id: string;
  schoolId: string;
  classGroupId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  submissionsCount: number;
  totalStudents: number;
  status: 'active' | 'expired';
}

export interface OnlineExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  score: number;
}

export interface OnlineExam {
  id: string;
  schoolId: string;
  classGroupId: string;
  className: string;
  subject: string;
  teacherName: string;
  title: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  totalScore: number;
  status: 'scheduled' | 'active' | 'completed';
  questions: OnlineExamQuestion[];
}

export interface QuestionBankItem {
  id: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
  difficulty: 'آسان' | 'متوسط' | 'دشوار';
  type: 'تستی' | 'تشریحی' | 'کوتاه‌پاسخ';
  options?: string[];
  correctAnswer?: string;
  authorName: string;
  authorSchool: string;
  isSharedRegional: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

export interface BannerAd {
  id: string;
  title: string;
  description: string;
  sponsorName: string;
  targetAudience: ('all' | 'students' | 'parents' | 'teachers')[];
  linkText: string;
  category: 'آموزشی' | 'فرهنگی' | 'کتابخوانی' | 'فناوری' | 'خدمات شهری';
  badge: string;
  isActive: boolean;
  clicksCount: number;
}

export type PostType = 'announcement' | 'news' | 'event' | 'event_report';

export interface Announcement {
  id: string;
  schoolId: string | 'all'; // 'all' means platform-wide
  type?: PostType; // 'announcement' | 'news' | 'event' | 'event_report'
  title: string;
  content: string;
  senderRole: string;
  senderName: string;
  target: 'all' | 'teachers' | 'parents' | 'students';
  date: string;
  eventDate?: string;
  eventLocation?: string;
  imageUrl?: string;
  priority: 'normal' | 'important' | 'urgent';
}

export interface NotificationLog {
  id: string;
  studentName: string;
  recipientName: string;
  recipientPhone: string;
  platform: 'بله' | 'ایتا' | 'پیامک';
  status: 'sent' | 'delivered';
  message: string;
  timestamp: string;
  schoolName: string;
}

