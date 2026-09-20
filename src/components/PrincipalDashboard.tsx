import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneCall,
  Megaphone,
  BookOpen,
  UserCheck,
  Send,
  Calendar,
  Shield,
  Plus,
  Eye,
  ArrowRightLeft,
  UserPlus,
  FileText,
  DoorOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  MessageSquare
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';
import { Student } from '../types';
import { CalendarRange, CreditCard } from 'lucide-react';

interface Props {
  onOpenQuestionBank: () => void;
  onOpenScheduleModal?: () => void;
  onOpenClassModal?: () => void;
  onOpenStudentModal?: () => void;
  onOpenClassStudentModal?: () => void;
  onOpenPostModal?: () => void;
  onOpenVpPermsModal?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
  onOpenAcademicYearModal?: () => void;
  onOpenFinanceModal?: () => void;
}

export const PrincipalDashboard: React.FC<Props> = ({
  onOpenQuestionBank,
  onOpenScheduleModal,
  onOpenClassModal,
  onOpenStudentModal,
  onOpenClassStudentModal,
  onOpenPostModal,
  onOpenVpPermsModal,
  onOpenStudentDossier,
  onOpenAcademicYearModal,
  onOpenFinanceModal
}) => {
  const {
    currentSchool,
    classes,
    students,
    attendanceSessions,
    announcements,
    setSelectedStudentForDossier,
    activeAcademicYear,
    activeTerm,
    isViewingArchivedYear,
    returnToCurrentAcademicYear
  } = useApp();

  const [activeTab, setActiveTab] = useState<'absents' | 'live_classes' | 'recent_posts'>('absents');

  const schoolClasses = classes.filter((c) => c.schoolId === currentSchool?.id);
  const schoolStudents = students.filter(
    (s) => s.schoolId === currentSchool?.id && (s.status === 'active' || !s.status)
  );

  // Today's attendance sessions for this school
  const todaySessions = attendanceSessions.filter(
    (s) => s.schoolId === currentSchool?.id && s.date === '۱۴۰۵/۰۶/۲۲'
  );

  // Collect absent records today
  const absentRecords: { student: Student; session: (typeof attendanceSessions)[0]; note?: string }[] = [];
  todaySessions.forEach((session) => {
    session.records.forEach((rec) => {
      if (rec.status === 'absent') {
        const std = students.find((s) => s.id === rec.studentId);
        if (std) {
          absentRecords.push({ student: std, session, note: rec.note });
        }
      }
    });
  });

  const handleStudentClick = (student: Student) => {
    if (onOpenStudentDossier) {
      onOpenStudentDossier(student);
    } else {
      setSelectedStudentForDossier(student);
    }
  };

  const handleOpenStudents = () => {
    if (onOpenStudentModal) onOpenStudentModal();
    else if (onOpenClassStudentModal) onOpenClassStudentModal();
  };

  const handleOpenClasses = () => {
    if (onOpenClassModal) onOpenClassModal();
    else if (onOpenClassStudentModal) onOpenClassStudentModal();
  };

  const totalRegistered = schoolStudents.length || 1;
  const attendanceRate = Math.max(0, Math.round(((totalRegistered - absentRecords.length) / totalRegistered) * 100));

  return (
    <div className="space-y-4 sm:space-y-5" id="principal-dashboard-view">
      {/* Modern School Administrative Header & Pulse Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {currentSchool?.name}
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                {currentSchool?.type}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                کد سازمانی: {toPersianDigits(currentSchool?.code || '')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">
                مدیر آموزشگاه: <strong>{currentSchool?.principalName}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <button
                id="btn-header-academic-year"
                onClick={onOpenAcademicYearModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors font-bold text-xs shadow-2xs"
                title="مدیریت سال و نوبت تحصیلی"
              >
                <CalendarRange className="w-3.5 h-3.5 text-teal-700" />
                <span>سال تحصیلی {toPersianDigits(activeAcademicYear?.title || '')}</span>
                <span className="text-teal-600 font-normal">({activeTerm?.title.split(' ')[0]} {activeTerm?.title.split(' ')[1] || ''})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-2xl border border-slate-200 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>شنبه ۲۲ شهریور</span>
            <span className="text-slate-300">|</span>
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-bold text-slate-800">زنگ ۲ (۰۹:۳۰ - ۱۱:۰۰)</span>
          </div>
        </div>

        {/* Live School Vital Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">نرخ حضور امروز</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-emerald-950">
                {toPersianDigits(attendanceRate)}٪
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">مطلوب</span>
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800">غایبین امروز</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-rose-950">
                {toPersianDigits(absentRecords.length)}
              </span>
              <span className="text-[10px] text-rose-700 font-medium">اطلاع به بله</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800">کلاس‌های دایر</span>
              <DoorOpen className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-teal-950">
                {toPersianDigits(schoolClasses.length)}
              </span>
              <span className="text-[10px] text-teal-700 font-medium">کلاس فعال</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800">کل دانش‌آموزان</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-indigo-950">
                {toPersianDigits(schoolStudents.length)}
              </span>
              <span className="text-[10px] text-indigo-700 font-medium">نفر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner when viewing past archived academic year */}
      {isViewingArchivedYear && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">حالت مرور سوابق: </span>
              <span>
                شما در حال حاضر سوابق سال تحصیلی بایگانی‌شده ({toPersianDigits(activeAcademicYear?.title || '')}) را مشاهده می‌کنید.
              </span>
            </div>
          </div>
          <button
            onClick={returnToCurrentAcademicYear}
            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0 self-end sm:self-auto shadow-2xs"
          >
            بازگشت به سال تحصیلی جاری
          </button>
        </div>
      )}

      {/* Operational Hub: Thumb-Friendly Action Cards (Separated Class & Student) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 px-1">
          بخش‌های اجرایی و مدیریت آموزشگاه
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
          {/* 1. Academic Year & Calendar Management */}
          <button
            id="btn-manage-academic-year"
            onClick={onOpenAcademicYearModal}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-teal-50/60 border border-teal-200/80 hover:border-teal-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-950">
                سال و تقویم تحصیلی
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                سال‌بندی، نوبت‌ها و ارتقای پایه
              </div>
            </div>
          </button>
          {/* 1. Student Management (Separated) */}
          <button
            id="btn-manage-students"
            onClick={handleOpenStudents}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-950">
                مدیریت دانش‌آموزان
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                پرونده‌ها، ثبت‌نام و فارغ‌التحصیلان
              </div>
            </div>
          </button>

          {/* 2. Class & Room Management (Separated) */}
          <button
            id="btn-manage-classes"
            onClick={handleOpenClasses}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 group-hover:bg-cyan-700 text-cyan-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-cyan-950">
                کلاس‌بندی و پایه‌ها
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                اتاق‌ها، ظرفیت‌ها و دبیران راهنما
              </div>
            </div>
          </button>

          {/* 3. Schedule Planner */}
          <button
            id="btn-manage-schedule"
            onClick={onOpenScheduleModal}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-700 text-indigo-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-950">
                برنامه هفتگی دروس
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                چیدمان ساعات و اساتید
              </div>
            </div>
          </button>

          {/* 4. Posts & Announcements with File Upload */}
          <button
            id="btn-manage-posts"
            onClick={onOpenPostModal}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-700 text-amber-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-950">
                اخبار و رویدادها
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                انتشار با آپلود مستقیم پوستر
              </div>
            </div>
          </button>

          {/* 5. Staff Management (Vice Principals & Teachers) */}
          <button
            id="btn-manage-staff"
            onClick={onOpenVpPermsModal}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-950">
                مدیریت کادر مدرسه
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                معاونین، دبیران، دروس و اختیارات
              </div>
            </div>
          </button>

          {/* 6. Question Bank */}
          <button
            id="btn-manage-qbank"
            onClick={onOpenQuestionBank}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-400 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-700 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-950">
                بانک سوالات منطقه
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                مخزن نمونه‌سوالات امتحانی
              </div>
            </div>
          </button>

          {/* 7. Financial & Tuition Management */}
          <button
            id="btn-manage-finances"
            onClick={onOpenFinanceModal}
            className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-emerald-50/60 border border-emerald-200 hover:border-emerald-500 transition-all text-right shadow-2xs group flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-700 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-950">
                امور مالی و شهریه
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                بدهکاران، اقساط و اسناد
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Daily Operations Monitoring Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('absents')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'absents'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>غایبین امروز ({toPersianDigits(absentRecords.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('live_classes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'live_classes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>کلاس‌های زنگ جاری ({toPersianDigits(todaySessions.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('recent_posts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'recent_posts'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-600" />
              <span>اعلانات و اخبار اخیر ({toPersianDigits(announcements.length)})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            بروزرسانی لحظه‌ای سیستم هوشمند
          </span>
        </div>

        {/* Tab 1: Absents */}
        {activeTab === 'absents' && (
          <div className="p-4 sm:p-5 space-y-3">
            {absentRecords.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                تا این لحظه غیبتی در کلاس‌های امروز ثبت نشده است. تمام دانش‌آموزان در کلاس‌ها حاضرند.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {absentRecords.map((rec, idx) => (
                  <div
                    key={idx}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {rec.student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {rec.student.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {rec.session.className}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          درس: {rec.session.subject} • زنگ {toPersianDigits(rec.session.period)} • ثبت در {toPersianDigits(rec.session.submittedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-medium flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>ارسال خودکار به بله اولیا</span>
                      </span>

                      <button
                        onClick={() => handleStudentClick(rec.student)}
                        className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>پرونده دانش‌آموز</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Classes */}
        {activeTab === 'live_classes' && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{session.className}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                      زنگ {toPersianDigits(session.period)}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    درس: <strong className="text-slate-800">{session.subject}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>دبیر: {session.teacherName}</span>
                    <span className="text-emerald-700 font-bold">حضور و غیاب ثبت‌شده</span>
                  </div>
                </div>
              ))}
            </div>

            {todaySessions.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                هنوز کلاسی در این زنگ ثبت جلسه نشده است.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recent Posts */}
        {activeTab === 'recent_posts' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {announcements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits(ann.date)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>صادرکننده: {ann.sender}</span>
                    <span>مخاطب: {ann.target === 'all' ? 'عمومی' : ann.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
