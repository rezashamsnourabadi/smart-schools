import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AttendanceStatus
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
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;
  currentSchool: School | undefined;
  currentUser: UserProfile;
  schools: School[];
  classes: ClassGroup[];
  students: Student[];
  schedule: ScheduleSlot[];
  questionBank: QuestionBankItem[];
  banners: BannerAd[];
  announcements: Announcement[];
  attendanceSessions: AttendanceSession[];
  notifications: NotificationLog[];
  activeToast: { title: string; message: string; type: 'success' | 'info' | 'warning' } | null;
  clearToast: () => void;
  submitAttendance: (
    classGroupId: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    notifyViaBale: boolean
  ) => void;
  addQuestionBankItem: (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usageCount'>) => void;
  addBannerAd: (banner: Omit<BannerAd, 'id' | 'clicksCount'>) => void;
  toggleBannerStatus: (bannerId: string) => void;
  clickBanner: (bannerId: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  addSchool: (school: Omit<School, 'id' | 'todayAttendanceSubmitted' | 'attendanceRateToday'>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'smart_school_hub_data_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('teacher');
  const [currentSchoolId, setCurrentSchoolId] = useState<string>('school-1');

  const [schools, setSchools] = useState<School[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_schools`);
    return saved ? JSON.parse(saved) : INITIAL_SCHOOLS;
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_schedule`);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_qbank`);
    return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANK;
  });

  const [banners, setBanners] = useState<BannerAd[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_banners`);
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_announcements`);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_attendance`);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_schools`, JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_qbank`, JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_banners`, JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_announcements`, JSON.stringify(announcements));
  }, [announcements]);

  const currentSchool = schools.find((s) => s.id === currentSchoolId) || schools[0];
  const currentUser = INITIAL_USERS[currentRole] || INITIAL_USERS.teacher;

  const clearToast = () => setActiveToast(null);

  const submitAttendance = (
    classGroupId: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    notifyViaBale: boolean
  ) => {
    const cls = classes.find((c) => c.id === classGroupId);
    const className = cls?.name || 'کلاس درس';
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Count absents and lates
    const absents = records.filter((r) => r.status === 'absent');
    const lates = records.filter((r) => r.status === 'late');
    const presents = records.filter((r) => r.status === 'present');

    const newSession: AttendanceSession = {
      id: `att-${Date.now()}`,
      schoolId: currentSchoolId,
      classGroupId,
      className,
      subject: 'ریاضی ۱',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      date: '۱۴۰۵/۰۶/۲۲',
      period: 1,
      submittedAt: timeString,
      records,
      sentNotificationsCount: notifyViaBale ? absents.length + lates.length : 0
    };

    setAttendanceSessions((prev) => [newSession, ...prev]);

    // Generate notifications for parents
    if (notifyViaBale && (absents.length > 0 || lates.length > 0)) {
      const newNotifs: NotificationLog[] = [];

      absents.forEach((abs) => {
        const student = students.find((s) => s.id === abs.studentId);
        if (student) {
          newNotifs.push({
            id: `ntf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentName: student.name,
            recipientName: `${student.parentName} (ولی دانش‌آموز)`,
            recipientPhone: student.parentPhone,
            platform: 'بله',
            status: 'delivered',
            message: `سلام جناب ${student.parentName}؛ فرزند شما ${student.name} امروز در زنگ اول (${className}) غایب ثبت شد. در صورت موجه بودن، لطفاً با مدرسه هماهنگ فرمایید.`,
            timestamp: timeString,
            schoolName: currentSchool?.name || 'دبیرستان'
          });
        }
      });

      lates.forEach((lt) => {
        const student = students.find((s) => s.id === lt.studentId);
        if (student) {
          newNotifs.push({
            id: `ntf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentName: student.name,
            recipientName: `${student.parentName} (ولی دانش‌آموز)`,
            recipientPhone: student.parentPhone,
            platform: 'پیامک',
            status: 'sent',
            message: `ولی محترم دانش‌آموز ${student.name}؛ تاخیر در ورود به کلاس درس (${className}) در ساعت ${timeString} ثبت گردید.`,
            timestamp: timeString,
            schoolName: currentSchool?.name || 'دبیرستان'
          });
        }
      });

      setNotifications((prev) => [...newNotifs, ...prev]);
    }

    // Update School status
    setSchools((prev) =>
      prev.map((sch) => {
        if (sch.id === currentSchoolId) {
          const total = records.length;
          const rate = total > 0 ? Math.round(((presents.length + lates.length) / total) * 1000) / 10 : 100;
          return {
            ...sch,
            todayAttendanceSubmitted: true,
            attendanceRateToday: rate
          };
        }
        return sch;
      })
    );

    setActiveToast({
      title: 'حضور و غیاب با موفقیت ثبت شد',
      message: `${presents.length} حاضر، ${absents.length} غایب${notifyViaBale && absents.length > 0 ? ` (اعلان برای اولیا در پیام‌رسان بله و پیامک مخابره شد)` : ''}.`,
      type: 'success'
    });
  };

  const addQuestionBankItem = (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usageCount'>) => {
    const newItem: QuestionBankItem = {
      ...item,
      id: `q-${Date.now()}`,
      createdAt: '۱۴۰۵/۰۶/۲۲',
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
    const newAnc: Announcement = {
      ...announcement,
      id: `anc-${Date.now()}`,
      date: '۱۴۰۵/۰۶/۲۲'
    };
    setAnnouncements((prev) => [newAnc, ...prev]);
    setActiveToast({
      title: 'اطلاعیه با موفقیت صادر شد',
      message: 'اطلاعیه جدید در تابلوی اعلانات مخاطبان قرار گرفت.',
      type: 'success'
    });
  };

  const addSchool = (school: Omit<School, 'id' | 'todayAttendanceSubmitted' | 'attendanceRateToday'>) => {
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

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_schools`);
    localStorage.removeItem(`${STORAGE_KEY}_classes`);
    localStorage.removeItem(`${STORAGE_KEY}_students`);
    localStorage.removeItem(`${STORAGE_KEY}_schedule`);
    localStorage.removeItem(`${STORAGE_KEY}_qbank`);
    localStorage.removeItem(`${STORAGE_KEY}_banners`);
    localStorage.removeItem(`${STORAGE_KEY}_announcements`);
    localStorage.removeItem(`${STORAGE_KEY}_attendance`);
    localStorage.removeItem(`${STORAGE_KEY}_notifications`);

    setSchools(INITIAL_SCHOOLS);
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setSchedule(INITIAL_SCHEDULE);
    setQuestionBank(INITIAL_QUESTION_BANK);
    setBanners(INITIAL_BANNERS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAttendanceSessions(INITIAL_ATTENDANCE_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);

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
        schools,
        classes,
        students,
        schedule,
        questionBank,
        banners,
        announcements,
        attendanceSessions,
        notifications,
        activeToast,
        clearToast,
        submitAttendance,
        addQuestionBankItem,
        addBannerAd,
        toggleBannerStatus,
        clickBanner,
        addAnnouncement,
        addSchool,
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
