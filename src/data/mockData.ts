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
  NotificationLog
} from '../types';

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

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', schoolId: 'school-1', classGroupId: 'cls-1', name: 'آرین احمدی', nationalCode: '۴۰۲۸۹۱۰۰۱', parentName: 'بهروز احمدی', parentPhone: '۰۹۱۸۷۷۷۵۰۵۵', parentBaleAccount: '@behrooz_ahmadi' },
  { id: 'std-2', schoolId: 'school-1', classGroupId: 'cls-1', name: 'امیرعلی رضایی', nationalCode: '۴۰۲۸۹۱۰۰۲', parentName: 'محسن رضایی', parentPhone: '۰۹۱۸۱۱۱۲۲۳۳', parentBaleAccount: '@m_rezaei' },
  { id: 'std-3', schoolId: 'school-1', classGroupId: 'cls-1', name: 'پارسا قاسمی', nationalCode: '۴۰۲۸۹۱۰۰۳', parentName: 'صادق قاسمی', parentPhone: '۰۹۱۸۲۲۲۳۳۴۴', parentBaleAccount: '@sadegh_gh' },
  { id: 'std-4', schoolId: 'school-1', classGroupId: 'cls-1', name: 'سینا محمدی', nationalCode: '۴۰۲۸۹۱۰۰۴', parentName: 'داوود محمدی', parentPhone: '۰۹۱۸۳۳۳۴۴۵۵', parentBaleAccount: '@d_mohammadi' },
  { id: 'std-5', schoolId: 'school-1', classGroupId: 'cls-1', name: 'دانیال کریمی', nationalCode: '۴۰۲۸۹۱۰۰۵', parentName: 'عباس کریمی', parentPhone: '۰۹۱۸۴۴۴۵۵۶۶', parentBaleAccount: '@karimi_a' },
  { id: 'std-6', schoolId: 'school-1', classGroupId: 'cls-1', name: 'مهدی یوسفی', nationalCode: '۴۰۲۸۹۱۰۰۶', parentName: 'سعید یوسفی', parentPhone: '۰۹۱۸۵۵۵۶۶۷۷', parentBaleAccount: '@saeed_yousefi' },
  { id: 'std-7', schoolId: 'school-1', classGroupId: 'cls-1', name: 'علی صادقی', nationalCode: '۴۰۲۸۹۱۰۰۷', parentName: 'حسین صادقی', parentPhone: '۰۹۱۸۶۶۶۷۷۸۸', parentBaleAccount: '@h_sadeghi' },
  { id: 'std-8', schoolId: 'school-1', classGroupId: 'cls-1', name: 'محمدمهدی اکبری', nationalCode: '۴۰۲۸۹۱۰۰۸', parentName: 'مهدی اکبری', parentPhone: '۰۹۱۸۷۷۷۸۸۹۹', parentBaleAccount: '@akbari_m' },
  { id: 'std-9', schoolId: 'school-1', classGroupId: 'cls-1', name: 'بردیا مرادی', nationalCode: '۴۰۲۸۹۱۰۰۹', parentName: 'فرهاد مرادی', parentPhone: '۰۹۱۸۸۸۸۹۹۰۰', parentBaleAccount: '@farhad_moradi' },
  { id: 'std-10', schoolId: 'school-1', classGroupId: 'cls-1', name: 'پوریا صالحی', nationalCode: '۴۰۲۸۹۱۰۱۰', parentName: 'مجید صالحی', parentPhone: '۰۹۱۸۹۹۹۰۰۱۱', parentBaleAccount: '@salehi_m' },
  { id: 'std-11', schoolId: 'school-1', classGroupId: 'cls-1', name: 'مانی رحیمی', nationalCode: '۴۰۲۸۹۱۰۱۱', parentName: 'اصغر رحیمی', parentPhone: '۰۹۱۸۱۱۱۲۲۴۴', parentBaleAccount: '@rahimi_asghar' },
  { id: 'std-12', schoolId: 'school-1', classGroupId: 'cls-1', name: 'کیان سلطانی', nationalCode: '۴۰۲۸۹۱۰۱۲', parentName: 'ابراهیم سلطانی', parentPhone: '۰۹۱۸۲۲۲۳۳۵۵', parentBaleAccount: '@soltani_eb' },
  { id: 'std-13', schoolId: 'school-1', classGroupId: 'cls-1', name: 'آراد حسینی', nationalCode: '۴۰۲۸۹۱۰۱۳', parentName: 'احمد حسینی', parentPhone: '۰۹۱۸۳۳۳۴۴۶۶', parentBaleAccount: '@hosseini_a' },
  { id: 'std-14', schoolId: 'school-1', classGroupId: 'cls-1', name: 'سامان شریفی', nationalCode: '۴۰۲۸۹۱۰۱۴', parentName: 'جمال شریفی', parentPhone: '۰۹۱۸۴۴۴۵۵۷۷', parentBaleAccount: '@sharifi_j' },
  { id: 'std-15', schoolId: 'school-1', classGroupId: 'cls-1', name: 'امیرمحمد نوری', nationalCode: '۴۰۲۸۹۱۰۱۵', parentName: 'قاسم نوری', parentPhone: '۰۹۱۸۵۵۵۶۶۸۸', parentBaleAccount: '@nouri_gh' },
  { id: 'std-16', schoolId: 'school-1', classGroupId: 'cls-1', name: 'نوید فتاحی', nationalCode: '۴۰۲۸۹۱۰۱۶', parentName: 'مرتضی فتاحی', parentPhone: '۰۹۱۸۶۶۶۷۷۹۹', parentBaleAccount: '@fattahi_m' },
  { id: 'std-17', schoolId: 'school-1', classGroupId: 'cls-1', name: 'عرفان باقری', nationalCode: '۴۰۲۸۹۱۰۱۷', parentName: 'جواد باقری', parentPhone: '۰۹۱۸۷۷۷۸۸۰۰', parentBaleAccount: '@bagheri_j' },
  { id: 'std-18', schoolId: 'school-1', classGroupId: 'cls-1', name: 'شایان حیدری', nationalCode: '۴۰۲۸۹۱۰۱۸', parentName: 'علی حیدری', parentPhone: '۰۹۱۸۸۸۸۹۹۱۱', parentBaleAccount: '@heydari_ali' }
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
    isCurrentPeriod: true // Teacher's immediately active class right now!
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
    title: 'آغاز رسمی فعالیت سامانه جامع مدیریت یکپارچه مدارس شهرستان',
    content: 'به اطلاع کلیه مدیران، معلمان گرامی و اولیا می‌رساند سامانه هوشمند با هدف تسهیل حداکثری فرآیندهای اداری، ثبت حضور و غیاب لحظه‌ای و دسترسی به بانک سوالات شهرستانی فعال گردید.',
    senderRole: 'مدیریت کل پلتفرم شهرستان',
    senderName: 'مهندس رضا رضایی',
    target: 'all',
    date: '۱۴۰۵/۰۶/۲۰',
    priority: 'important'
  },
  {
    id: 'anc-2',
    schoolId: 'school-1',
    title: 'جلسه مجمع عمومی اولیا و مربیان دبیرستان امام صادق (ع)',
    content: 'جلسه آشنایی با برنامه آموزشی سال جدید و ارائه گزارش سامانه هوشمند در روز چهارشنبه ساعت ۱۵:۳۰ در سالن همایش دبیرستان برگزار می‌شود.',
    senderRole: 'مدیر مدرسه',
    senderName: 'دکتر حسینی',
    target: 'parents',
    date: '۱۴۰۵/۰۶/۲۱',
    priority: 'normal'
  },
  {
    id: 'anc-3',
    schoolId: 'school-1',
    title: 'دستورالعمل ثبت حضور و غیاب الکترونیک در زنگ‌های اول',
    content: 'همکاران محترم آموزشی لطفاً در ۵ دقیقه ابتدایی هر زنگ، نسبت به تایید حضور و غیاب کلاس خود اقدام فرمایند تا پیامک و اعلان بله به صورت خودکار برای اولیا ارسال گردد.',
    senderRole: 'معاونت انضباطی',
    senderName: 'آقای مرادی',
    target: 'teachers',
    date: '۱۴۰5/۰۶/۲۲',
    priority: 'urgent'
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
      { studentId: 'std-8', status: 'present' },
      { studentId: 'std-9', status: 'present' },
      { studentId: 'std-10', status: 'present' }
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
