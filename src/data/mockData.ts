import {
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
  HomeworkItem,
  HomeworkSubmission,
  OnlineExam,
  VicePrincipalPermissions,
  VicePrincipalProfile,
  TeacherProfile,
  ReportCard,
  GradeItem,
  AcademicYear,
  AcademicTerm
} from '../types';

export const INITIAL_VICE_PRINCIPAL_PERMISSIONS: VicePrincipalPermissions = {
  canManageAnnouncements: true,
  canManageSchedule: true,
  canManageStudentsAndClasses: true,
  canViewFullDossier: true,
  canLogDisciplinary: true
};

export const INITIAL_VICE_PRINCIPALS: VicePrincipalProfile[] = [
  {
    id: 'vp-1',
    name: 'آقای حمید مرادی',
    roleTitle: 'معاون آموزشی',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۳۳۳-۲۰۲۲',
    avatarBg: 'bg-teal-600',
    permissions: {
      canManageAnnouncements: false,
      canManageSchedule: true,
      canManageStudentsAndClasses: true,
      canViewFullDossier: true,
      canLogDisciplinary: false
    }
  },
  {
    id: 'vp-2',
    name: 'آقای صادق بیات',
    roleTitle: 'معاون پرورشی و فرهنگی',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۳۳۳-۵۰۵۵',
    avatarBg: 'bg-emerald-600',
    permissions: {
      canManageAnnouncements: true,
      canManageSchedule: false,
      canManageStudentsAndClasses: false,
      canViewFullDossier: true,
      canLogDisciplinary: true
    }
  },
  {
    id: 'vp-3',
    name: 'آقای بهنام صالحی',
    roleTitle: 'معاون اجرایی و فناوری',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۳۳۳-۸۰۸۸',
    avatarBg: 'bg-indigo-600',
    permissions: {
      canManageAnnouncements: true,
      canManageSchedule: true,
      canManageStudentsAndClasses: true,
      canViewFullDossier: true,
      canLogDisciplinary: false
    }
  }
];

export const INITIAL_TEACHERS: TeacherProfile[] = [
  {
    id: 'teacher-1',
    name: 'استاد علیرضا احمدی',
    phone: '۰۹۱۲-۱۱۱-۲۲۳۳',
    avatarBg: 'bg-teal-600',
    schoolId: 'school-1',
    teachingSubjects: ['دینی', 'عربی'],
    assignedClassIds: ['cls-1', 'cls-2'],
    roleTitle: 'دبیر رسمی'
  },
  {
    id: 'teacher-2',
    name: 'مهندس جواد باقری',
    phone: '۰۹۱۲-۴۴۴-۵۵۶۶',
    avatarBg: 'bg-indigo-600',
    schoolId: 'school-1',
    teachingSubjects: ['فیزیک', 'هندسه'],
    assignedClassIds: ['cls-1', 'cls-3'],
    roleTitle: 'دبیر تخصصی'
  },
  {
    id: 'teacher-3',
    name: 'دکتر مجید اسدی',
    phone: '۰۹۱۲-۷۷۷-۸۸۹۹',
    avatarBg: 'bg-emerald-600',
    schoolId: 'school-1',
    teachingSubjects: ['شیمی', 'آزمایشگاه علوم'],
    assignedClassIds: ['cls-2', 'cls-3'],
    roleTitle: 'دبیر رسمی'
  },
  {
    id: 'teacher-4',
    name: 'استاد رضا حسینی',
    phone: '۰۹۱۲-۳۳۳-۹۹۰۰',
    avatarBg: 'bg-amber-600',
    schoolId: 'school-1',
    teachingSubjects: ['ریاضی', 'حسابان'],
    assignedClassIds: ['cls-1'],
    roleTitle: 'دبیر رسمی'
  }
];

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'school-1',
    name: 'دبیرستان نمونه دولتی امام صادق (ع)',
    code: '۴۰۲۸۹۱',
    type: 'دبیرستان دوره دوم',
    principalName: 'دکتر علیرضا حسینی',
    address: 'بلوار معلم، خیابان دانشجو، پلاک ۱۲',
    phone: '۰۲۱-۵۵۴۲۳۱۱',
    studentCount: 320,
    teacherCount: 22,
    classesCount: 11,
    todayAttendanceSubmitted: false,
    attendanceRateToday: 96.2,
    accentColor: 'indigo'
  },
  {
    id: 'school-2',
    name: 'هنرستان فنی و حرفه‌ای شهید رجایی',
    code: '۴۰۲۳۱۵',
    type: 'هنرستان فنی و حرفه‌ای',
    principalName: 'مهندس محمدرضا شفیعی',
    address: 'میدان آزادی، ابتدای خیابان صنعت',
    phone: '۰۲۱-۵۵۷۸۹۰۰',
    studentCount: 285,
    teacherCount: 19,
    classesCount: 9,
    todayAttendanceSubmitted: true,
    attendanceRateToday: 94.5,
    accentColor: 'emerald'
  },
  {
    id: 'school-3',
    name: 'دبستان و پیش‌دبستانی هوشمند رازی',
    code: '۴۰۱۰۸۲',
    type: 'دبستان هوشمند',
    principalName: 'سرکار خانم فاطمه موسوی',
    address: 'خیابان حافظ، روبروی پارک لاله',
    phone: '۰۲۱-۵۵۲۱۴۴۰',
    studentCount: 310,
    teacherCount: 16,
    classesCount: 10,
    todayAttendanceSubmitted: true,
    attendanceRateToday: 98.1,
    accentColor: 'amber'
  }
];

export const INITIAL_USERS: Record<string, UserProfile> = {
  platform_admin: {
    id: 'user-platform',
    name: 'مهندس رضا رضایی',
    role: 'platform_admin',
    phone: '۰۹۱۲-۳۴۵-۶۷۸۹',
    avatarBg: 'bg-rose-600'
  },
  principal: {
    id: 'user-p1',
    name: 'دکتر علیرضا حسینی',
    role: 'principal',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۲۲۲-۱۰۱۱',
    avatarBg: 'bg-indigo-600'
  },
  vice_principal: {
    id: 'user-vp1',
    name: 'آقای حمید مرادی',
    role: 'vice_principal',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۳۳۳-۲۰۲۲',
    avatarBg: 'bg-teal-600'
  },
  teacher: {
    id: 'user-t1',
    name: 'استاد مسعود کاظمی',
    role: 'teacher',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۴۴۴-۳۰۳۳',
    avatarBg: 'bg-blue-600',
    teachingSubjects: ['ریاضی ۱', 'حسابان', 'هندسه تحلیلی'],
    assignedClassIds: ['cls-1', 'cls-2']
  },
  student: {
    id: 'user-s1',
    name: 'آرین احمدی',
    role: 'student',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۵۵۵-۴۰۴۴',
    avatarBg: 'bg-cyan-600',
    studentClassId: 'cls-1'
  },
  parent: {
    id: 'user-par1',
    name: 'آقای بهروز احمدی (ولی آرین)',
    role: 'parent',
    schoolId: 'school-1',
    phone: '۰۹۱۸-۷۷۷-۵۰۵۵',
    avatarBg: 'bg-purple-600',
    childStudentId: 'std-1'
  }
};

export const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'cls-1',
    schoolId: 'school-1',
    name: 'کلاس دهم ریاضی - الف',
    grade: 'پایه دهم',
    major: 'ریاضی و فیزیک',
    room: 'اتاق ۱۰۱ (طبقه اول)',
    studentCount: 18
  },
  {
    id: 'cls-2',
    schoolId: 'school-1',
    name: 'کلاس یازدهم تجربی - ۲',
    grade: 'پایه یازدهم',
    major: 'علوم تجربی',
    room: 'اتاق ۲۰۴ (طبقه دوم)',
    studentCount: 22
  },
  {
    id: 'cls-3',
    schoolId: 'school-1',
    name: 'کلاس دوازدهم انسانی',
    grade: 'پایه دوازدهم',
    major: 'ادبیات و علوم انسانی',
    room: 'اتاق ۳۰۲ (طبقه سوم)',
    studentCount: 16
  }
];

const sampleSubjectsTerm1 = [
  { name: 'ریاضی ۱', unit: 4, continuousScore: 19.5, finalScore: 19.0, totalScore: 19.25, status: 'قبول' as const, teacherName: 'استاد کاظمی' },
  { name: 'فیزیک ۱', unit: 3, continuousScore: 20.0, finalScore: 19.5, totalScore: 19.75, status: 'قبول' as const, teacherName: 'مهندس نوری' },
  { name: 'شیمی ۱', unit: 3, continuousScore: 18.5, finalScore: 19.0, totalScore: 18.75, status: 'قبول' as const, teacherName: 'دکتر صابری' },
  { name: 'هندسه ۱', unit: 2, continuousScore: 19.0, finalScore: 18.5, totalScore: 18.75, status: 'قبول' as const, teacherName: 'استاد کاظمی' },
  { name: 'فارسی و نگارش ۱', unit: 3, continuousScore: 19.5, finalScore: 19.5, totalScore: 19.5, status: 'قبول' as const, teacherName: 'دکتر حسینی' },
  { name: 'عربی، زبان قرآن ۱', unit: 2, continuousScore: 19.0, finalScore: 20.0, totalScore: 19.5, status: 'قبول' as const, teacherName: 'استاد جعفری' },
  { name: 'دین و زندگی ۱', unit: 2, continuousScore: 20.0, finalScore: 20.0, totalScore: 20.0, status: 'قبول' as const, teacherName: 'حجت‌الاسلام تقوی' },
  { name: 'زبان انگلیسی ۱', unit: 2, continuousScore: 19.0, finalScore: 18.5, totalScore: 18.75, status: 'قبول' as const, teacherName: 'آقای حسنی' },
  { name: 'جغرافیای ایران', unit: 2, continuousScore: 19.5, finalScore: 19.0, totalScore: 19.25, status: 'قبول' as const, teacherName: 'آقای شمس' },
  { name: 'کارگاه کارآفرینی و تولید', unit: 2, continuousScore: 20.0, finalScore: 20.0, totalScore: 20.0, status: 'قبول' as const, teacherName: 'مهندس طاهری' }
];

const sampleSubjectsTerm2 = [
  { name: 'ریاضی ۱', unit: 4, continuousScore: 19.5, finalScore: 19.5, totalScore: 19.5, status: 'قبول' as const, teacherName: 'استاد کاظمی' },
  { name: 'فیزیک ۱', unit: 3, continuousScore: 20.0, finalScore: 20.0, totalScore: 20.0, status: 'قبول' as const, teacherName: 'مهندس نوری' },
  { name: 'شیمی ۱', unit: 3, continuousScore: 19.0, finalScore: 19.5, totalScore: 19.25, status: 'قبول' as const, teacherName: 'دکتر صابری' },
  { name: 'هندسه ۱', unit: 2, continuousScore: 19.5, finalScore: 19.0, totalScore: 19.25, status: 'قبول' as const, teacherName: 'استاد کاظمی' },
  { name: 'فارسی و نگارش ۱', unit: 3, continuousScore: 19.5, finalScore: 19.5, totalScore: 19.5, status: 'قبول' as const, teacherName: 'دکتر حسینی' },
  { name: 'عربی، زبان قرآن ۱', unit: 2, continuousScore: 20.0, finalScore: 19.5, totalScore: 19.75, status: 'قبول' as const, teacherName: 'استاد جعفری' },
  { name: 'دین و زندگی ۱', unit: 2, continuousScore: 20.0, finalScore: 20.0, totalScore: 20.0, status: 'قبول' as const, teacherName: 'حجت‌الاسلام تقوی' },
  { name: 'زبان انگلیسی ۱', unit: 2, continuousScore: 19.5, finalScore: 19.0, totalScore: 19.25, status: 'قبول' as const, teacherName: 'آقای حسنی' },
  { name: 'جغرافیای ایران', unit: 2, continuousScore: 20.0, finalScore: 19.5, totalScore: 19.75, status: 'قبول' as const, teacherName: 'آقای شمس' },
  { name: 'کارگاه کارآفرینی و تولید', unit: 2, continuousScore: 20.0, finalScore: 20.0, totalScore: 20.0, status: 'قبول' as const, teacherName: 'مهندس طاهری' }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'آرین احمدی',
    nationalCode: '۴۰۲۸۹۱۰۰۱',
    birthDate: '۱۳۸۹/۰۴/۱۵',
    fatherName: 'بهروز',
    motherName: 'فاطمه',
    studentPhone: '۰۹۱۸۵۵۵۴۰۴۴',
    parentName: 'بهروز احمدی',
    parentPhone: '۰۹۱۸۷۷۷۵۰۵۵',
    emergencyPhone: '۰۲۱-۵۵۴۲۸۸۹',
    address: 'شهرستان، خیابان مطهری، کوچه گلستان ۴، پلاک ۱۸، زنگ ۲',
    parentBaleAccount: '@behrooz_ahmadi',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۱',
    status: 'active',
    attendanceStats: {
      totalDays: 142,
      presentDays: 140,
      absentDays: 1,
      lateDays: 1,
      excusedDays: 0
    },
    disciplinaryRecords: [
      {
        id: 'disc-1',
        type: 'تشویقی',
        title: 'کسب رتبه نخست مسابقات آزمایشگاهی و ابتکارات فیزیک',
        note: 'اهدای تقدیرنامه کتبی و ۲ نمره مثبت در نمره مستمر فیزیک',
        date: '۱۴۰۴/۰۹/۱۰',
        recordedBy: 'دکتر حسینی (مدیر مدرسه)'
      },
      {
        id: 'disc-2',
        type: 'تاخیر',
        title: 'تاخیر زنگ اول با موجه‌سازی ولی',
        note: 'به علت ترافیک شهری با هماهنگی تلفنی ولی',
        date: '۱۴۰۴/۱۱/۰۴',
        recordedBy: 'آقای مرادی (معاونت انضباطی)'
      }
    ],
    reportCards: [
      {
        term: 'term1',
        termTitle: 'کارنامه نوبت اول (دی‌ماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 19.42,
        rankInClass: 2,
        disciplineScore: 20,
        subjects: sampleSubjectsTerm1,
        isPublished: true
      },
      {
        term: 'term2',
        termTitle: 'کارنامه نوبت دوم (خردادماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 19.68,
        rankInClass: 1,
        disciplineScore: 20,
        subjects: sampleSubjectsTerm2,
        isPublished: true
      }
    ],
    pastYearHistory: [
      {
        year: '۱۴۰۳-۱۴۰۴',
        grade: 'پایه نهم (دوره اول)',
        schoolName: 'مدرسه شهید بهشتی',
        gpa: 19.85,
        disciplineScore: 20,
        status: 'قبول با رتبه ممتاز'
      },
      {
        year: '۱۴۰۲-۱۴۰۳',
        grade: 'پایه هشتم (دوره اول)',
        schoolName: 'مدرسه شهید بهشتی',
        gpa: 19.78,
        disciplineScore: 20,
        status: 'قبول با رتبه ممتاز'
      }
    ]
  },
  {
    id: 'std-2',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'امیرعلی رضایی',
    nationalCode: '۴۰۲۸۹۱۰۰۲',
    birthDate: '۱۳۸۹/۰۶/۲۰',
    fatherName: 'محسن',
    parentName: 'محسن رضایی',
    parentPhone: '۰۹۱۸۱۱۱۲۲۳۳',
    address: 'خیابان تختی، فرعی سوم، پلاک ۴',
    parentBaleAccount: '@m_rezaei',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۲',
    attendanceStats: { totalDays: 142, presentDays: 139, absentDays: 2, lateDays: 1, excusedDays: 0 },
    disciplinaryRecords: [
      { id: 'disc-r2', type: 'تشویقی', title: 'فعالیت در مسابقات ورزشی شطرنج', note: 'مقام سوم ناحیه', date: '۱۴۰۴/۰۸/۱۴', recordedBy: 'آقای مرادی' }
    ],
    reportCards: [
      {
        term: 'term1',
        termTitle: 'کارنامه نوبت اول (دی‌ماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 18.90,
        rankInClass: 4,
        disciplineScore: 19.5,
        subjects: sampleSubjectsTerm1.map(s => ({ ...s, totalScore: Math.max(16, s.totalScore - 0.5) })),
        isPublished: true
      }
    ],
    pastYearHistory: [
      { year: '۱۴۰۳-۱۴۰۴', grade: 'پایه نهم', schoolName: 'دبیرستان امام صادق (ع)', gpa: 19.10, disciplineScore: 20, status: 'قبول خرداد' }
    ]
  },
  {
    id: 'std-3',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'پارسا قاسمی',
    nationalCode: '۴۰۲۸۹۱۰۰۳',
    birthDate: '۱۳۸۹/۰۲/۱۲',
    fatherName: 'صادق',
    parentName: 'صادق قاسمی',
    parentPhone: '۰۹۱۸۲۲۲۳۳۴۴',
    address: 'میدان قدس، کوی فرهنگیان، بلوک ب',
    parentBaleAccount: '@sadegh_gh',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۳',
    attendanceStats: { totalDays: 142, presentDays: 135, absentDays: 5, lateDays: 2, excusedDays: 1 },
    disciplinaryRecords: [
      { id: 'disc-r3', type: 'تذکر', title: 'تاخیرهای مکرر در زنگ اول', note: 'دعوت از ولی جهت بررسی سرویس ایاب و ذهاب', date: '۱۴۰۴/۱۰/۱۵', recordedBy: 'آقای مرادی' }
    ],
    reportCards: [
      {
        term: 'term1',
        termTitle: 'کارنامه نوبت اول (دی‌ماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 17.65,
        rankInClass: 9,
        disciplineScore: 18.5,
        subjects: sampleSubjectsTerm1.map(s => ({ ...s, totalScore: Math.max(14, s.totalScore - 1.8) })),
        isPublished: true
      }
    ],
    pastYearHistory: [
      { year: '۱۴۰۳-۱۴۰۴', grade: 'پایه نهم', schoolName: 'مدرسه شهید فهمیده', gpa: 18.40, disciplineScore: 19, status: 'قبول خرداد' }
    ]
  },
  {
    id: 'std-4',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'سینا محمدی',
    nationalCode: '۴۰۲۸۹۱۰۰۴',
    birthDate: '۱۳۸۹/۰۷/۰۱',
    fatherName: 'داوود',
    parentName: 'داوود محمدی',
    parentPhone: '۰۹۱۸۳۳۳۴۴۵۵',
    address: 'خیابان امام خمینی، روبروی بانک ملی',
    parentBaleAccount: '@d_mohammadi',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۴',
    attendanceStats: { totalDays: 142, presentDays: 141, absentDays: 0, lateDays: 1, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [
      {
        term: 'term1',
        termTitle: 'کارنامه نوبت اول (دی‌ماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 19.15,
        rankInClass: 3,
        disciplineScore: 20,
        subjects: sampleSubjectsTerm1,
        isPublished: true
      }
    ],
    pastYearHistory: [
      { year: '۱۴۰۳-۱۴۰۴', grade: 'پایه نهم', schoolName: 'دبیرستان امام صادق (ع)', gpa: 19.30, disciplineScore: 20, status: 'قبول با رتبه ممتاز' }
    ]
  },
  {
    id: 'std-5',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'دانیال کریمی',
    nationalCode: '۴۰۲۸۹۱۰۰۵',
    birthDate: '۱۳۸۹/۰۸/۲۲',
    fatherName: 'عباس',
    parentName: 'عباس کریمی',
    parentPhone: '۰۹۱۸۴۴۴۵۵۶۶',
    address: 'بلوار استقلال، مجتمع نگین، واحد ۶',
    parentBaleAccount: '@karimi_a',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۵',
    attendanceStats: { totalDays: 142, presentDays: 137, absentDays: 3, lateDays: 2, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [
      {
        term: 'term1',
        termTitle: 'کارنامه نوبت اول (دی‌ماه)',
        year: '۱۴۰۴-۱۴۰۵',
        gpa: 18.20,
        rankInClass: 7,
        disciplineScore: 19.0,
        subjects: sampleSubjectsTerm1.map(s => ({ ...s, totalScore: Math.max(15, s.totalScore - 1.2) })),
        isPublished: true
      }
    ],
    pastYearHistory: []
  },
  {
    id: 'std-6',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'مهدی یوسفی',
    nationalCode: '۴۰۲۸۹۱۰۰۶',
    birthDate: '۱۳۸۹/۰۱/۱۸',
    fatherName: 'سعید',
    parentName: 'سعید یوسفی',
    parentPhone: '۰۹۱۸۵۵۵۶۶۷۷',
    address: 'خیابان ۱۷ شهریور، پلاک ۲۵',
    parentBaleAccount: '@saeed_yousefi',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۶',
    attendanceStats: { totalDays: 142, presentDays: 142, absentDays: 0, lateDays: 0, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [],
    pastYearHistory: []
  },
  {
    id: 'std-7',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'علی صادقی',
    nationalCode: '۴۰۲۸۹۱۰۰۷',
    birthDate: '۱۳۸۹/۰۳/۰۵',
    fatherName: 'حسین',
    parentName: 'حسین صادقی',
    parentPhone: '۰۹۱۸۶۶۶۷۷۸۸',
    address: 'میدان رسالت، کوچه بهار، پلاک ۹',
    parentBaleAccount: '@h_sadeghi',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۷',
    attendanceStats: { totalDays: 142, presentDays: 138, absentDays: 2, lateDays: 2, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [],
    pastYearHistory: []
  },
  {
    id: 'std-8',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'محمدمهدی اکبری',
    nationalCode: '۴۰۲۸۹۱۰۰۸',
    birthDate: '۱۳۸۹/۰۹/۱۰',
    fatherName: 'مهدی',
    parentName: 'مهدی اکبری',
    parentPhone: '۰۹۱۸۷۷۷۸۸۹۹',
    address: 'خیابان فلسطین، روبروی پارک ملت',
    parentBaleAccount: '@akbari_m',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۸',
    attendanceStats: { totalDays: 142, presentDays: 140, absentDays: 1, lateDays: 1, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [],
    pastYearHistory: []
  },
  {
    id: 'std-grad-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'مهدی محمدی',
    nationalCode: '۴۰۲۸۹۱۰۰۹',
    birthDate: '۱۳۸۵/۰۴/۰۲',
    fatherName: 'جواد',
    parentName: 'جواد محمدی',
    parentPhone: '۰۹۱۸۲۳۴۵۶۷۸',
    address: 'خیابان شریعتی، کوچه بهار، پلاک ۷',
    parentBaleAccount: '@j_mohammadi',
    grade: 'فارغ‌التحصیل',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۱۱۰۳۱۱',
    status: 'graduated',
    graduationDetails: {
      year: '۱۴۰۴',
      university: 'دانشگاه صنعتی شریف',
      major: 'مهندسی کامپیوتر',
      rank: 'رتبه ۴۲ منطقه ۱',
      notes: 'عضو تیم المپیاد کامپیوتر شهرستان - آمادگی برای هدایت تحصیلی و کارگاه‌های کنکور'
    },
    attendanceStats: { totalDays: 180, presentDays: 178, absentDays: 1, lateDays: 1, excusedDays: 0 },
    disciplinaryRecords: [
      { id: 'disc-g1', type: 'تشویقی', title: 'کسب مدال برنز المپیاد کامپیوتر کشوری', note: 'تجلیل در همایش نخبگان شهرستان', date: '۱۴۰۳/۱۱/۲۰', recordedBy: 'دکتر حسینی' }
    ],
    reportCards: [
      {
        term: 'term2',
        termTitle: 'کارنامه نهایی دیپلم',
        year: '۱۴۰۳-۱۴۰۴',
        gpa: 19.92,
        rankInClass: 1,
        disciplineScore: 20,
        subjects: sampleSubjectsTerm2,
        isPublished: true
      }
    ],
    pastYearHistory: [
      { year: '۱۴۰۳-۱۴۰۴', grade: 'پایه دوازدهم', schoolName: 'دبیرستان نمونه دولتی امام صادق (ع)', gpa: 19.92, disciplineScore: 20, status: 'قبول با رتبه ممتاز' }
    ]
  },
  {
    id: 'std-grad-2',
    schoolId: 'school-1',
    classGroupId: 'cls-2',
    name: 'نگار صابری',
    nationalCode: '۴۰۲۸۹۱۰۱۰',
    birthDate: '۱۳۸۴/۱۱/۱۵',
    fatherName: 'رضا',
    parentName: 'رضا صابری',
    parentPhone: '۰۹۱۸۳۴۵۶۷۸۹',
    address: 'بلوار انقلاب، کوچه لاله ۳، پلاک ۱۲',
    parentBaleAccount: '@r_saberi',
    grade: 'فارغ‌التحصیل',
    fieldOfStudy: 'علوم تجربی',
    studentNumber: '۴۰۰۱۰۱۱۵',
    status: 'graduated',
    graduationDetails: {
      year: '۱۴۰۳',
      university: 'دانشگاه علوم پزشکی تهران',
      major: 'دندان‌پزشکی',
      rank: 'رتبه ۱۱۸ کشوری',
      notes: 'برگزارکننده وبینار انتقال تجربه و تکنیک‌های تست‌زنی برای دانش‌آموزان سال دوازدهم'
    },
    attendanceStats: { totalDays: 180, presentDays: 176, absentDays: 2, lateDays: 2, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [],
    pastYearHistory: []
  },
  {
    id: 'std-trans-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    name: 'علی کاظمی‌نژاد',
    nationalCode: '۴۰۲۸۹۱۰۱۱',
    birthDate: '۱۳۸۹/۰۵/۱۸',
    fatherName: 'سعید',
    parentName: 'سعید کاظمی‌نژاد',
    parentPhone: '۰۹۱۲۴۴۴۵۵۶۶',
    address: 'تهران، منطقه ۶ (محل سکونت سابق: شهرستان، خیابان سعدی)',
    parentBaleAccount: '@s_kazeminejad',
    grade: 'پایه دهم',
    fieldOfStudy: 'ریاضی و فیزیک',
    studentNumber: '۴۰۲۱۰۸۹۹',
    status: 'transferred',
    transferDetails: {
      destinationSchoolName: 'دبیرستان ماندگار البرز تهران',
      date: '۱۴۰۴/۰۷/۱۰',
      reason: 'انتقال محل کار پدر به پایتخت و تغییر نشانی سکونت'
    },
    attendanceStats: { totalDays: 20, presentDays: 19, absentDays: 1, lateDays: 0, excusedDays: 0 },
    disciplinaryRecords: [],
    reportCards: [],
    pastYearHistory: [
      { year: '۱۴۰۳-۱۴۰۴', grade: 'پایه نهم', schoolName: 'دبیرستان امام صادق (ع)', gpa: 19.45, disciplineScore: 20, status: 'قبول خرداد' }
    ]
  }
];

export const INITIAL_SCHEDULE: ScheduleSlot[] = [
  {
    id: 'sch-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    teacherId: 'user-t1',
    teacherName: 'استاد مسعود کاظمی',
    subject: 'ریاضی ۱ (مجموعه‌ها و دنباله)',
    dayOfWeek: 'شنبه',
    period: 1,
    startTime: '۰۸:۰۰',
    endTime: '۰۹:۳۰',
    isCurrentPeriod: true
  },
  {
    id: 'sch-2',
    schoolId: 'school-1',
    classGroupId: 'cls-2',
    className: 'یازدهم تجربی - ۲',
    teacherId: 'user-t1',
    teacherName: 'استاد مسعود کاظمی',
    subject: 'ریاضی ۲ (تابع و معادلات)',
    dayOfWeek: 'شنبه',
    period: 2,
    startTime: '۰۹:۴۵',
    endTime: '۱۱:۱۵',
    isCurrentPeriod: false
  },
  {
    id: 'sch-3',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    teacherId: 'user-t1',
    teacherName: 'استاد مسعود کاظمی',
    subject: 'هندسه ۱ (استدلال و قضیه تالس)',
    dayOfWeek: 'دوشنبه',
    period: 1,
    startTime: '۰۸:۰۰',
    endTime: '۰۹:۳۰',
    isCurrentPeriod: false
  },
  {
    id: 'sch-4',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    teacherId: 'user-t2',
    teacherName: 'مهندس نوری',
    subject: 'فیزیک ۱ (چگالی و اندازه‌گیری)',
    dayOfWeek: 'یکشنبه',
    period: 2,
    startTime: '۰۹:۴۵',
    endTime: '۱۱:۱۵',
    isCurrentPeriod: false
  },
  {
    id: 'sch-5',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    teacherId: 'user-t3',
    teacherName: 'دکتر حسینی',
    subject: 'فارسی و نگارش ۱',
    dayOfWeek: 'سه‌شنبه',
    period: 1,
    startTime: '۰۸:۰۰',
    endTime: '۰۹:۳۰',
    isCurrentPeriod: false
  },
  {
    id: 'sch-6',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    teacherId: 'user-t4',
    teacherName: 'استاد حسنی',
    subject: 'زبان انگلیسی ۱',
    dayOfWeek: 'چهارشنبه',
    period: 3,
    startTime: '۱۱:۳۰',
    endTime: '۱۲:۴۵',
    isCurrentPeriod: false
  }
];

export const INITIAL_HOMEWORK: HomeworkItem[] = [
  {
    id: 'hw-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    subject: 'ریاضی ۱',
    teacherId: 'user-t1',
    teacherName: 'استاد مسعود کاظمی',
    title: 'تمرینات تکمیلی فصل اول: دنباله حسابی و هندسی',
    description: 'حل تمرین‌های صفحه ۲۴ و ۲۵ کتاب درسی (مسائل ۴ تا ۹) همراه با استدلال در دفتر ریاضی.',
    assignedDate: '۱۴۰۵/۰۶/۲۲',
    dueDate: '۱۴۰۵/۰۶/۲۵',
    submissionsCount: 14,
    totalStudents: 18,
    status: 'active',
    attachments: [
      { name: 'کاربرگ_تمرین_دنباله_حسابی.pdf', type: 'pdf', size: '۱.۲ مگابایت' },
      { name: 'تصویر_صفحه_۲۴_کتاب.jpg', type: 'image', size: '۸۵۰ کیلوبایت' }
    ]
  },
  {
    id: 'hw-2',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    subject: 'فیزیک ۱',
    teacherId: 'user-t2',
    teacherName: 'مهندس نوری',
    title: 'گزارش کار آزمایشگاه: اندازه‌گیری چگالی مایعات',
    description: 'ترسیم جدول خطای اندازه‌گیری و پاسخ به پرسش‌های آزمایشگاهی انتهای فصل ۱.',
    assignedDate: '۱۴۰۵/۰۶/۲۰',
    dueDate: '۱۴۰۵/۰۶/۲۴',
    submissionsCount: 16,
    totalStudents: 18,
    status: 'active',
    attachments: [
      { name: 'راهنمای_تنظیم_جدول_خطا.pdf', type: 'pdf', size: '۶۲۰ کیلوبایت' }
    ]
  }
];

export const INITIAL_HOMEWORK_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 'sub-1',
    homeworkId: 'hw-1',
    studentId: 'std-1',
    studentName: 'آرین احمدی',
    submissionDate: '۱۴۰۵/۰۶/۲۳ - ۱۹:۴۰',
    textContent: 'استاد گرامی تمرینات ۴ تا ۹ حل شد. در سوال ۷ از رابطه جملات متوالی دنباله هندسی استفاده کردم.',
    attachments: [
      { name: 'پاسخ_دست‌نویس_آرین_احمدی.jpg', type: 'image' }
    ],
    status: 'graded',
    teacherScore: 20,
    teacherFeedback: 'بسیار عالی و دقیق حل شده است. استدلال سوال ۷ کاملاً صحیح است.'
  }
];

export const INITIAL_EXAMS: OnlineExam[] = [
  {
    id: 'exam-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    subject: 'ریاضی ۱',
    teacherName: 'استاد مسعود کاظمی',
    title: 'آزمون آنلاین کوییز: مجموعه‌ها و متناهی/نامتناهی',
    examDate: '۱۴۰۵/۰۶/۲۵',
    startTime: '۱۷:۰۰',
    durationMinutes: 20,
    totalScore: 20,
    status: 'scheduled',
    questions: [
      {
        id: 'eq-1',
        question: 'تعداد زیرمجموعه‌های محض یک مجموعه ۶ عضوی کدام است؟',
        options: ['۶۳', '۶۴', '۳۱', '۳۲'],
        correctAnswer: '۶۳',
        score: 10
      },
      {
        id: 'eq-2',
        question: 'اگر A و B دو مجموعه جدا از هم باشند، اشتراک آن‌ها چه ویژگی دارد؟',
        options: ['برابر با تهی است', 'برابر با مجموعه مرجع است', 'برابر با اجتماع است', 'نامتناهی است'],
        correctAnswer: 'برابر با تهی است',
        score: 10
      }
    ]
  }
];

export const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'q-1',
    title: 'تعداد زیرمجموعه‌های یک مجموعه متناهی',
    content: 'اگر مجموعه‌ای دارای ۶ عضو باشد، تعداد زیرمجموعه‌های حداقل ۲ عضوی آن کدام است؟',
    subject: 'ریاضی',
    grade: 'پایه دهم',
    difficulty: 'متوسط',
    type: 'تستی',
    options: ['۵۷', '۶۴', '۵۸', '۲۶'],
    correctAnswer: '۵۷',
    authorName: 'مسعود کاظمی',
    authorSchool: 'دبیرستان نمونه دولتی امام صادق (ع)',
    isSharedRegional: true,
    tags: ['مجموعه‌ها', 'آنالیز ترکیبی', 'کنکور'],
    usageCount: 42,
    createdAt: '۱۴۰۵/۰۶/۱۰'
  },
  {
    id: 'q-2',
    title: 'تعیین دامنه توابع رادیکالی با فرجه زوج',
    content: 'دامنه تابع با ضابطه f(x) = √(۴ - x²) / (x - ۱) را به‌صورت بازه بنویسید و مقادیر صحیح آن را مشخص کنید.',
    subject: 'حسابان و ریاضی',
    grade: 'پایه یازدهم',
    difficulty: 'متوسط',
    type: 'تشریحی',
    correctAnswer: 'دامنه برابر است با [-2, 2] منهای نقطه {1}. مقادیر صحیح: -2, -1, 0, 2',
    authorName: 'مسعود کاظمی',
    authorSchool: 'دبیرستان نمونه دولتی امام صادق (ع)',
    isSharedRegional: true,
    tags: ['تابع', 'دامنه', 'ریشه'],
    usageCount: 29,
    createdAt: '۱۴۰۵/۰۶/۱۵'
  },
  {
    id: 'q-3',
    title: 'مفهوم پتانسیل الکتریکی در خازن‌ها',
    content: 'با دو برابر کردن فاصله بین صفحات یک خازن تخت متصل به باتری، ظرفیت خازن و بار الکتریکی آن چه تغییری می‌کند؟',
    subject: 'فیزیک',
    grade: 'پایه یازدهم',
    difficulty: 'آسان',
    type: 'تستی',
    options: [
      'ظرفیت نصف، بار نصف می‌شود',
      'ظرفیت دو برابر، بار ثابت می‌ماند',
      'ظرفیت نصف، انرژی دو برابر می‌شود',
      'هیچ‌کدام تغییر نمی‌کنند'
    ],
    correctAnswer: 'ظرفیت نصف، بار نصف می‌شود',
    authorName: 'مهندس رضایی',
    authorSchool: 'هنرستان فنی شهید رجایی',
    isSharedRegional: true,
    tags: ['الکتریسیته', 'خازن', 'امتحان نهایی'],
    usageCount: 55,
    createdAt: '۱۴۰۵/۰۶/۱۸'
  },
  {
    id: 'q-4',
    title: 'آرایه ادبی حسن تعلیل و ایهام تناسب',
    content: 'در بیت «رسم بدعهدی ایام چو دید ابر بهار / گریه‌اش بر سمن و سنبل و نسرین آمد» چه آرایه‌هایی برجسته است؟',
    subject: 'فارسی و نگارش',
    grade: 'پایه دهم',
    difficulty: 'دشوار',
    type: 'تشریحی',
    correctAnswer: 'حسن تعلیل (دلیل آوردن گریستن ابر به خاطر بدعهدی زمانه) و تشخیص (جان‌بخشی به ابر و بهار).',
    authorName: 'دکتر حسینی',
    authorSchool: 'دبیرستان نمونه دولتی امام صادق (ع)',
    isSharedRegional: true,
    tags: ['ادبیات', 'آرایه‌ها', 'امتحان هماهنگ'],
    usageCount: 38,
    createdAt: '۱۴۰۵/۰۶/۲۰'
  },
  {
    id: 'q-5',
    title: 'ساختار شبکه و آدرس IP در سیستم‌های رایانه‌ای',
    content: 'کدام آدرس IP در محدوده شبکه محلی خصوصی (Private IP) کلاس C قرار دارد؟',
    subject: 'فناوری و شبکه',
    grade: 'هنرستان فنی',
    difficulty: 'متوسط',
    type: 'تستی',
    options: ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'],
    correctAnswer: '192.168.1.1',
    authorName: 'مهندس شفیعی',
    authorSchool: 'هنرستان فنی و حرفه‌ای شهید رجایی',
    isSharedRegional: true,
    tags: ['شبکه', 'کامپیوتر', 'آی‌پی'],
    usageCount: 19,
    createdAt: '۱۴۰۵/۰۶/۲۱'
  }
];

export const INITIAL_BANNERS: BannerAd[] = [
  {
    id: 'ad-1',
    title: 'جشنواره کتابخوانی و خلاقیت دانش‌آموزی شهرستان',
    description: 'همراه با مسابقات کتابخوانی، معرفی نخبگان و اهدای تبلت و بن کتاب ۵ میلیون ریالی به برگزیدگان',
    sponsorName: 'اداره کتابخانه‌های عمومی و پژوهش‌سرای منطقه',
    targetAudience: ['all', 'students', 'parents'],
    linkText: 'ثبت‌نام و دانلود فهرست کتاب‌ها',
    category: 'کتابخوانی',
    badge: 'رویداد فرهنگی منطقه',
    isActive: true,
    clicksCount: 142
  },
  {
    id: 'ad-2',
    title: 'دوره‌های مهارت‌محور هوش مصنوعی و برنامه‌نویسی پایتون',
    description: 'ویژه دانش‌آموزان متوسطه اول و دوم با تخفیف ۵۰٪ برای مدارس تحت پوشش سامانه هوشمند',
    sponsorName: 'کانون رشد و نوآوری فناوری اطلاعات شهرستان',
    targetAudience: ['students', 'parents'],
    linkText: 'مشاهده سرفصل‌ها و دریافت کد تخفیف',
    category: 'فناوری',
    badge: 'تخفیف ویژه مدارس',
    isActive: true,
    clicksCount: 209
  },
  {
    id: 'ad-3',
    title: 'طرح سلامت بینایی و پایش ساختار اسکلتی دانش‌آموزان',
    description: 'معاینات رایگان اپتومتری و اصلاح ناهنجاری‌های قامتی در درمانگاه فرهنگیان شهرستان',
    sponsorName: 'شبکه بهداشت و درمان و اداره سلامت آموزش و پرورش',
    targetAudience: ['parents'],
    linkText: 'رزرو نوبت معاینه رایگان',
    category: 'خدمات شهری',
    badge: 'خدمات سلامت',
    isActive: true,
    clicksCount: 98
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    schoolId: 'all',
    type: 'announcement',
    title: 'آغاز رسمی فعالیت سامانه جامع مدیریت یکپارچه مدارس شهرستان',
    content: 'به اطلاع کلیه مدیران، معلمان گرامی و اولیا می‌رساند سامانه هوشمند با هدف تسهیل حداکثری فرآیندهای اداری، ثبت حضور و غیاب لحظه‌ای و دسترسی به بانک سوالات شهرستانی فعال گردید.',
    senderRole: 'مدیریت کل پلتفرم شهرستان',
    senderName: 'مهندس رضا رضایی',
    target: 'all',
    date: '۱۴۰۵/۰۶/۲۰',
    priority: 'important',
    coverImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=60',
    attachments: [
      { name: 'شیوه‌نامه_اجرایی_سامانه_مدارس.pdf', type: 'file', caption: 'بخشنامه رسمی اداره آموزش و پرورش شهرستان' }
    ]
  },
  {
    id: 'anc-2',
    schoolId: 'school-1',
    type: 'event',
    title: 'جلسه مجمع عمومی اولیا و مربیان دبیرستان امام صادق (ع)',
    content: 'جلسه آشنایی با برنامه آموزشی سال جدید و ارائه گزارش عملکرد سامانه هوشمند دبیرستان.',
    senderRole: 'مدیر مدرسه',
    senderName: 'دکتر حسینی',
    target: 'parents',
    date: '۱۴۰۵/۰۶/۲۱',
    eventDate: 'چهارشنبه ۲۶ شهریور - ساعت ۱۵:۳۰',
    eventLocation: 'سالن همایش‌های دبیرستان امام صادق (ع)',
    priority: 'normal',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60',
    attachments: [
      { name: 'دعوت‌نامه_رسمی_مجمع_اولیا.pdf', type: 'file', caption: 'متن دعوتنامه و دستور جلسه' }
    ]
  },
  {
    id: 'anc-3',
    schoolId: 'school-1',
    type: 'announcement',
    title: 'دستورالعمل ثبت حضور و غیاب الکترونیک در زنگ‌های اول',
    content: 'همکاران محترم آموزشی لطفاً در ۵ دقیقه ابتدایی هر زنگ، نسبت به تایید حضور و غیاب کلاس خود اقدام فرمایند تا پیامک و اعلان بله به صورت خودکار برای اولیا ارسال گردد.',
    senderRole: 'معاونت انضباطی',
    senderName: 'آقای مرادی',
    target: 'teachers',
    date: '۱۴۰۵/۰۶/۲۲',
    priority: 'urgent',
    attachments: [
      { name: 'راهنمای_سریع_ثبت_غیبت.pdf', type: 'file' }
    ]
  },
  {
    id: 'anc-4',
    schoolId: 'school-1',
    type: 'event_report',
    title: 'گزارش تصویری: کسب رتبه نخست المپیاد ریاضی استانی توسط دانش‌آموزان دبیرستان',
    content: 'تیم ریاضی دبیرستان امام صادق (ع) با سرپرستی استاد کاظمی موفق به کسب مدال طلا و مقام برتر استانی گردیدند. از تلاش ستودنی فرزندان و همراهی اولیا سپاسگزاریم.',
    senderRole: 'مدیر مدرسه',
    senderName: 'دکتر حسینی',
    target: 'all',
    date: '۱۴۰۵/۰۶/۱۸',
    priority: 'normal',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60',
    attachments: [
      { name: 'عکس_یادگاری_اهدای_جوایز.jpg', type: 'image', caption: 'مراسم اهدای لوح تقدیر با حضور مسئولین شهرستان' },
      { name: 'ویدیو_کوتاه_مراسم_تقدیر.mp4', type: 'video', caption: 'کلیپ ۱ دقیقه‌ای لحظه اعلام نتایج المپیاد' }
    ]
  },
  {
    id: 'anc-5',
    schoolId: 'school-1',
    type: 'news',
    title: 'تجهیز سالن رایانه و آزمایشگاه فیزیک به ابزارهای نوین چندرسانه‌ای',
    content: 'با مشارکت انجمن اولیا و مربیان، کارگاه کامپیوتر مدرسه به سیستم‌های پیشرفته و اینترنت ملی پرسرعت مجهز شد.',
    senderRole: 'مدیر مدرسه',
    senderName: 'دکتر حسینی',
    target: 'all',
    date: '۱۴۰۵/۰۶/۱۵',
    priority: 'normal',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60',
    attachments: [
      { name: 'تصویر_کارگاه_کامپیوتر_جدید.jpg', type: 'image' }
    ]
  }
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceSession[] = [
  {
    id: 'att-session-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    className: 'دهم ریاضی - الف',
    subject: 'ریاضی ۱',
    teacherId: 'user-t1',
    teacherName: 'استاد مسعود کاظمی',
    date: '۱۴۰۵/۰۶/۲۲',
    period: 1,
    submittedAt: '۰۸:۰۴:۱۵',
    records: [
      { studentId: 'std-1', status: 'present' },
      { studentId: 'std-2', status: 'present' },
      { studentId: 'std-3', status: 'absent', note: 'بدون هماهنگی قبلی' },
      { studentId: 'std-4', status: 'present' },
      { studentId: 'std-5', status: 'late', note: '۱۰ دقیقه تاخیر' },
      { studentId: 'std-6', status: 'present' },
      { studentId: 'std-7', status: 'present' },
      { studentId: 'std-8', status: 'present' }
    ],
    sentNotificationsCount: 2
  }
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'ntf-1',
    studentName: 'پارسا قاسمی',
    recipientName: 'صادق قاسمی (ولی دانش‌آموز)',
    recipientPhone: '۰۹۱۸۲۲۲۳۳۴۴',
    platform: 'بله',
    status: 'delivered',
    message: 'سلام جناب آقای صادق قاسمی؛ فرزند شما پارسا قاسمی در زنگ اول (درس ریاضی ۱) مورخ ۱۴۰۵/۰۶/۲۲ غیبت ثبت شده است. جهت پیگیری با دبیرستان امام صادق (ع) تماس حاصل فرمایید.',
    timestamp: '۰۸:۰۵:۱۰',
    schoolName: 'دبیرستان نمونه دولتی امام صادق (ع)'
  },
  {
    id: 'ntf-2',
    studentName: 'دانیال کریمی',
    recipientName: 'عباس کریمی (ولی دانش‌آموز)',
    recipientPhone: '۰۹۱۸۴۴۴۵۵۶۶',
    platform: 'پیامک',
    status: 'sent',
    message: 'ولی محترم دانش‌آموز دانیال کریمی، تاخیر ۱۰ دقیقه‌ای در ورود به کلاس درس در ساعت ۰۸:۱۰ ثبت شد.',
    timestamp: '۰۸:۰۵:۱۵',
    schoolName: 'دبیرستان نمونه دولتی امام صادق (ع)'
  }
];

export const INITIAL_GRADES: GradeItem[] = [
  {
    id: 'grd-1',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    subject: 'ریاضی ۱',
    title: 'ارزشیابی مستمر مهر و آبان',
    category: 'continuous',
    categoryTitle: 'نمره مستمر کلاسی',
    date: '۱۴۰۴/۰۸/۲۸',
    maxScore: 20,
    scores: [
      { studentId: 'std-1', score: 19.5, note: 'عالی، حل تمرین در پای تخته' },
      { studentId: 'std-2', score: 18.0 },
      { studentId: 'std-3', score: 16.5 },
      { studentId: 'std-4', score: 19.0 },
      { studentId: 'std-5', score: 17.5 },
      { studentId: 'std-6', score: 18.5 },
      { studentId: 'std-7', score: 17.0 },
      { studentId: 'std-8', score: 18.0 }
    ]
  },
  {
    id: 'grd-2',
    schoolId: 'school-1',
    classGroupId: 'cls-1',
    subject: 'ریاضی ۱',
    title: 'امتحان نوبت اول (دی‌ماه)',
    category: 'term1',
    categoryTitle: 'امتحان نوبت اول دی‌ماه',
    date: '۱۴۰۴/۱۰/۱۸',
    maxScore: 20,
    scores: [
      { studentId: 'std-1', score: 19.0 },
      { studentId: 'std-2', score: 18.5 },
      { studentId: 'std-3', score: 15.5 },
      { studentId: 'std-4', score: 19.0 },
      { studentId: 'std-5', score: 17.0 },
      { studentId: 'std-6', score: 18.0 },
      { studentId: 'std-7', score: 16.5 },
      { studentId: 'std-8', score: 17.5 }
    ]
  }
];

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay-1403-1404',
    title: '۱۴۰۳-۱۴۰۴',
    startDate: '۱۴۰۳/۰۷/۰۱',
    endDate: '۱۴۰۴/۰۶/۳۱',
    status: 'archived',
    isCurrent: false,
    currentTermId: 'term2',
    terms: [
      { id: 'term1', title: 'نوبت اول (مهر تا دی)', startDate: '۱۴۰۳/۰۷/۰۱', endDate: '۱۴۰۳/۱۰/۳۰', isCurrent: false },
      { id: 'term2', title: 'نوبت دوم (بهمن تا خرداد)', startDate: '۱۴۰۳/۱۱/۰۱', endDate: '۱۴۰۴/۰۳/۳۱', isCurrent: false },
      { id: 'summer', title: 'دوره تابستان', startDate: '۱۴۰۴/۰۴/۰۱', endDate: '۱۴۰۴/۰۶/۳۱', isCurrent: false }
    ],
    description: 'سال تحصیلی گذشته - بایگانی نمرات و کارنامه‌ها'
  },
  {
    id: 'ay-1404-1405',
    title: '۱۴۰۴-۱۴۰۵',
    startDate: '۱۴۰۴/۰۷/۰۱',
    endDate: '۱۴۰۵/۰۶/۳۱',
    status: 'active',
    isCurrent: true,
    currentTermId: 'term2',
    terms: [
      { id: 'term1', title: 'نوبت اول (مهر تا دی)', startDate: '۱۴۰۴/۰۷/۰۱', endDate: '۱۴۰۴/۱۰/۳۰', isCurrent: false },
      { id: 'term2', title: 'نوبت دوم (بهمن تا خرداد)', startDate: '۱۴۰۴/۱۱/۰۱', endDate: '۱۴۰۵/۰۳/۳۱', isCurrent: true },
      { id: 'summer', title: 'دوره تابستان', startDate: '۱۴۰۵/۰۴/۰۱', endDate: '۱۴۰۵/۰۶/۳۱', isCurrent: false }
    ],
    description: 'سال تحصیلی جاری و فعال آموزشگاه'
  },
  {
    id: 'ay-1405-1406',
    title: '۱۴۰۵-۱۴۰۶',
    startDate: '۱۴۰۵/۰۷/۰۱',
    endDate: '۱۴۰۶/۰۶/۳۱',
    status: 'planned',
    isCurrent: false,
    currentTermId: 'term1',
    terms: [
      { id: 'term1', title: 'نوبت اول (مهر تا دی)', startDate: '۱۴۰۵/۰۷/۰۱', endDate: '۱۴۰۵/۱۰/۳۰', isCurrent: true },
      { id: 'term2', title: 'نوبت دوم (بهمن تا خرداد)', startDate: '۱۴۰۵/۱۱/۰۱', endDate: '۱۴۰۶/۰۳/۳۱', isCurrent: false },
      { id: 'summer', title: 'دوره تابستان', startDate: '۱۴۰۶/۰۴/۰۱', endDate: '۱۴۰۶/۰۶/۳۱', isCurrent: false }
    ],
    description: 'سال تحصیلی آینده - در حال برنامه‌ریزی و پیش‌ثبت‌نام'
  }
];



