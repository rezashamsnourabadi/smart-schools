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
  AttendanceStatus,
  GradeItem,
  HomeworkItem,
  OnlineExam,
  VicePrincipalPermissions,
  DisciplinaryRecord,
  PostType
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
  INITIAL_EXAMS,
  INITIAL_VICE_PRINCIPAL_PERMISSIONS
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
  grades: GradeItem[];
  homework: HomeworkItem[];
  exams: OnlineExam[];
  vicePrincipalPermissions: VicePrincipalPermissions;
  selectedStudentForDossier: Student | null;
  setSelectedStudentForDossier: (student: Student | null) => void;
  activeMobileTab: string;
  setActiveMobileTab: (tab: string) => void;
  activeToast: { title: string; message: string; type: 'success' | 'info' | 'warning' } | null;
  clearToast: () => void;
  
  // Actions
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
  deleteAnnouncement: (id: string) => void;
  addSchool: (school: Omit<School, 'id' | 'todayAttendanceSubmitted' | 'attendanceRateToday'>) => void;
  
  // Management Actions
  addStudent: (studentData: Omit<Student, 'id' | 'attendanceStats' | 'disciplinaryRecords' | 'reportCards' | 'pastYearHistory'>) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  removeStudent: (studentId: string) => void;
  transferStudentClass: (studentId: string, newClassGroupId: string) => void;
  addClassGroup: (classData: Omit<ClassGroup, 'id' | 'studentCount'>) => void;
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  updateScheduleSlot: (slot: ScheduleSlot) => void;
  deleteScheduleSlot: (slotId: string) => void;
  updateVicePrincipalPermissions: (perms: Partial<VicePrincipalPermissions>) => void;
  addDisciplinaryRecord: (studentId: string, record: Omit<DisciplinaryRecord, 'id'>) => void;
  addGradeItem: (grade: Omit<GradeItem, 'id'>) => void;
  addHomework: (hw: Omit<HomeworkItem, 'id' | 'submissionsCount'>) => void;
  addOnlineExam: (exam: Omit<OnlineExam, 'id'>) => void;
  updateParentContact: (studentId: string, data: { address?: string; emergencyPhone?: string; parentPhone?: string; parentBaleAccount?: string }) => void;
  
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'smart_school_hub_data_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('principal');
  const [currentSchoolId, setCurrentSchoolId] = useState<string>('school-1');
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<Student | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('dashboard');

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

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_grades`);
    return saved ? JSON.parse(saved) : INITIAL_GRADES;
  });

  const [homework, setHomework] = useState<HomeworkItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_homework`);
    return saved ? JSON.parse(saved) : INITIAL_HOMEWORK;
  });

  const [exams, setExams] = useState<OnlineExam[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_exams`);
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [vicePrincipalPermissions, setVicePrincipalPermissions] = useState<VicePrincipalPermissions>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vp_perms`);
    return saved ? JSON.parse(saved) : INITIAL_VICE_PRINCIPAL_PERMISSIONS;
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
    localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_schedule`, JSON.stringify(schedule));
  }, [schedule]);

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

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_grades`, JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_homework`, JSON.stringify(homework));
  }, [homework]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_exams`, JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_vp_perms`, JSON.stringify(vicePrincipalPermissions));
  }, [vicePrincipalPermissions]);

  const currentSchool = schools.find((s) => s.id === currentSchoolId) || schools[0];
  const currentUser = INITIAL_USERS[currentRole] || INITIAL_USERS.principal;

  const clearToast = () => setActiveToast(null);

  // Submit attendance & trigger Bale/SMS notifications
  const submitAttendance = (
    classGroupId: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    notifyViaBale: boolean
  ) => {
    const cls = classes.find((c) => c.id === classGroupId);
    const className = cls?.name || 'کلاس درس';
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
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
    const typeLabel = 
      announcement.type === 'news' ? 'خبر' :
      announcement.type === 'event' ? 'رویداد' :
      announcement.type === 'event_report' ? 'گزارش رویداد' : 'اطلاعیه';
      
    const newAnc: Announcement = {
      ...announcement,
      id: `anc-${Date.now()}`,
      date: '۱۴۰۵/۰۶/۲۲'
    };
    setAnnouncements((prev) => [newAnc, ...prev]);
    setActiveToast({
      title: `${typeLabel} با موفقیت منتشر شد`,
      message: `مورد جدید در تابلوی اعلانات مخاطبان قرار گرفت.`,
      type: 'success'
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setActiveToast({
      title: 'مورد حذف شد',
      message: 'مطلب از تابلوی اعلانات و اخبار برداشته شد.',
      type: 'info'
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

  // Student management
  const addStudent = (studentData: Omit<Student, 'id' | 'attendanceStats' | 'disciplinaryRecords' | 'reportCards' | 'pastYearHistory'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`,
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

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
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
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
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

  const addScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
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
  };

  const updateScheduleSlot = (slot: ScheduleSlot) => {
    setSchedule((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
    setActiveToast({
      title: 'برنامه هفتگی ذخیره شد',
      message: 'تغییرات زنگ کلاسی ثبت گردید.',
      type: 'success'
    });
  };

  const deleteScheduleSlot = (slotId: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== slotId));
    setActiveToast({
      title: 'زنگ کلاسی حذف شد',
      message: 'برنامه آموزشی بازآرایی شد.',
      type: 'info'
    });
  };

  const updateVicePrincipalPermissions = (perms: Partial<VicePrincipalPermissions>) => {
    setVicePrincipalPermissions((prev) => ({ ...prev, ...perms }));
    setActiveToast({
      title: 'سطح دسترسی معاونت تغییر کرد',
      message: 'تنظیمات دسترسی معاونین با موفقیت اعمال گردید.',
      type: 'success'
    });
  };

  const addDisciplinaryRecord = (studentId: string, record: Omit<DisciplinaryRecord, 'id'>) => {
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

  const addGradeItem = (grade: Omit<GradeItem, 'id'>) => {
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
  };

  const addHomework = (hw: Omit<HomeworkItem, 'id' | 'submissionsCount'>) => {
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

  const addOnlineExam = (exam: Omit<OnlineExam, 'id'>) => {
    const newExam: OnlineExam = {
      ...exam,
      id: `exam-${Date.now()}`
    };
    setExams((prev) => [newExam, ...prev]);
    setActiveToast({
      title: 'آزمون آنلاین ایجاد شد',
      message: `آزمون "${exam.title}" برای تاریخ ${exam.examDate} برنامه‌ریزی گردید.`,
      type: 'success'
    });
  };

  const updateParentContact = (
    studentId: string,
    data: { address?: string; emergencyPhone?: string; parentPhone?: string; parentBaleAccount?: string }
  ) => {
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
    localStorage.removeItem(`${STORAGE_KEY}_grades`);
    localStorage.removeItem(`${STORAGE_KEY}_homework`);
    localStorage.removeItem(`${STORAGE_KEY}_exams`);
    localStorage.removeItem(`${STORAGE_KEY}_vp_perms`);

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
    setExams(INITIAL_EXAMS);
    setVicePrincipalPermissions(INITIAL_VICE_PRINCIPAL_PERMISSIONS);
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
        schools,
        classes,
        students,
        schedule,
        questionBank,
        banners,
        announcements,
        attendanceSessions,
        notifications,
        grades,
        homework,
        exams,
        vicePrincipalPermissions,
        selectedStudentForDossier,
        setSelectedStudentForDossier,
        activeMobileTab,
        setActiveMobileTab,
        activeToast,
        clearToast,
        submitAttendance,
        addQuestionBankItem,
        addBannerAd,
        toggleBannerStatus,
        clickBanner,
        addAnnouncement,
        deleteAnnouncement,
        addSchool,
        addStudent,
        updateStudent,
        removeStudent,
        transferStudentClass,
        addClassGroup,
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
        updateVicePrincipalPermissions,
        addDisciplinaryRecord,
        addGradeItem,
        addHomework,
        addOnlineExam,
        updateParentContact,
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
