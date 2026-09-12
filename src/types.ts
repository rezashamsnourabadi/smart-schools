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

export interface Student {
  id: string;
  schoolId: string;
  classGroupId: string;
  name: string;
  nationalCode: string;
  parentName: string;
  parentPhone: string;
  parentBaleAccount: string;
  todayStatus?: 'present' | 'absent' | 'late' | 'excused';
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

export interface GradeItem {
  id: string;
  schoolId: string;
  classGroupId: string;
  subject: string;
  title: string;
  date: string;
  maxScore: number;
  scores: { studentId: string; score: number }[];
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

export interface Announcement {
  id: string;
  schoolId: string | 'all'; // 'all' means platform-wide
  title: string;
  content: string;
  senderRole: string;
  senderName: string;
  target: 'all' | 'teachers' | 'parents' | 'students';
  date: string;
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
