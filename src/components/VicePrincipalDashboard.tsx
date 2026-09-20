import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Users,
  Megaphone,
  Eye,
  Plus,
  Building2,
  DoorOpen,
  Activity,
  PhoneCall,
  Award,
  BookOpen,
  Shield,
  FileText,
  CreditCard
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';
import { Student } from '../types';

interface Props {
  onOpenScheduleModal?: () => void;
  onOpenClassStudentModal?: () => void;
  onOpenClassModal?: () => void;
  onOpenStudentModal?: () => void;
  onOpenPostModal?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
  onOpenFinanceModal?: () => void;
}

export const VicePrincipalDashboard: React.FC<Props> = ({
  onOpenScheduleModal,
  onOpenClassStudentModal,
  onOpenClassModal,
  onOpenStudentModal,
  onOpenPostModal,
  onOpenQuestionBank,
  onOpenStudentDossier,
  onOpenFinanceModal
}) => {
  const {
    currentSchool,
    classes,
    students,
    attendanceSessions,
    notifications,
    announcements,
    vicePrincipals,
    activeVicePrincipalId,
    setActiveVicePrincipalId,
    activeVicePrincipalPermissions,
    addDisciplinaryRecord,
    setSelectedStudentForDossier,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'absents' | 'live_classes' | 'recent_posts' | 'discipline'>('absents');

  const currentVP = vicePrincipals.find((vp) => vp.id === activeVicePrincipalId) || vicePrincipals[0];

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

  // Disciplinary logging state
  const [selectedStudentId, setSelectedStudentId] = useState(schoolStudents[0]?.id || 'std-1');
  const [disciplinaryType, setDisciplinaryType] = useState<'تشویقی' | 'تذکر' | 'تاخیر'>('تشویقی');
  const [disciplinaryTitle, setDisciplinaryTitle] = useState('');
  const [disciplinaryNote, setDisciplinaryNote] = useState('');

  const handleStudentClick = (student: Student) => {
    if (activeVicePrincipalPermissions.canViewFullDossier) {
      if (onOpenStudentDossier) {
        onOpenStudentDossier(student);
      } else {
        setSelectedStudentForDossier(student);
      }
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

  const handleAddDisciplinaryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaryTitle.trim() || !selectedStudentId) return;

    addDisciplinaryRecord(selectedStudentId, {
      type: disciplinaryType,
      title: disciplinaryTitle,
      note: disciplinaryNote,
      date: '۱۴۰۵/۰۶/۲۲',
      recordedBy: currentVP ? `${currentVP.name} (${currentVP.roleTitle})` : currentUser.name
    });

    setDisciplinaryTitle('');
    setDisciplinaryNote('');
  };

  const totalRegistered = schoolStudents.length || 1;
  const attendanceRate = Math.max(0, Math.round(((totalRegistered - absentRecords.length) / totalRegistered) * 100));

  return (
    <div className="space-y-4 sm:space-y-5" id="vice-principal-view">
      {/* Modern Administrative Header & Active VP Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                میز کار معاونت آموزشگاه • {currentSchool?.name}
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                {currentSchool?.type}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                کد آموزشگاه: {toPersianDigits(currentSchool?.code || '')}
              </span>
            </div>
            
            {/* Active Vice Principal Profile Selector */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-500 font-medium">پروفایل فعال معاونت:</span>
              <div className="flex flex-wrap gap-1.5">
                {vicePrincipals.map((vp) => {
                  const isActive = vp.id === (currentVP?.id || 'vp-1');
                  return (
                    <button
                      key={vp.id}
                      onClick={() => setActiveVicePrincipalId(vp.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-700/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{vp.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {vp.roleTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-2xl border border-slate-200 text-slate-600 self-start md:self-auto">
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

      {/* Operational Hub: Thumb-Friendly Action Cards */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 px-1">
          بخش‌های اجرایی و مدیریت معاونت آموزشگاه
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* 1. Student Management */}
          {activeVicePrincipalPermissions.canManageStudentsAndClasses ? (
            <button
              id="vp-btn-manage-students"
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
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-right opacity-60 flex flex-col justify-between cursor-not-allowed">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="font-bold text-xs text-slate-600">مدیریت دانش‌آموزان</div>
                <div className="text-[10px] text-slate-400 mt-0.5">عدم دسترسی تفویض‌شده</div>
              </div>
            </div>
          )}

          {/* 2. Class Management */}
          {activeVicePrincipalPermissions.canManageStudentsAndClasses ? (
            <button
              id="vp-btn-manage-classes"
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
                  اتاق‌ها، ظرفیت‌ها و راهنما
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-right opacity-60 flex flex-col justify-between cursor-not-allowed">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="font-bold text-xs text-slate-600">کلاس‌بندی و پایه‌ها</div>
                <div className="text-[10px] text-slate-400 mt-0.5">عدم دسترسی تفویض‌شده</div>
              </div>
            </div>
          )}

          {/* 3. Weekly Schedule */}
          {activeVicePrincipalPermissions.canManageSchedule && onOpenScheduleModal ? (
            <button
              id="vp-btn-manage-schedule"
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
                  چیدمان زنگ‌ها و اساتید
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-right opacity-60 flex flex-col justify-between cursor-not-allowed">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="font-bold text-xs text-slate-600">برنامه هفتگی دروس</div>
                <div className="text-[10px] text-slate-400 mt-0.5">عدم دسترسی تفویض‌شده</div>
              </div>
            </div>
          )}

          {/* 4. Posts & Announcements */}
          {activeVicePrincipalPermissions.canManageAnnouncements && onOpenPostModal ? (
            <button
              id="vp-btn-manage-posts"
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
                  انتشار، ویرایش و پین
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-right opacity-60 flex flex-col justify-between cursor-not-allowed">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="font-bold text-xs text-slate-600">اخبار و رویدادها</div>
                <div className="text-[10px] text-slate-400 mt-0.5">عدم دسترسی تفویض‌شده</div>
              </div>
            </div>
          )}

          {/* 5. Fast Disciplinary Logging */}
          <button
            id="vp-btn-manage-discipline"
            onClick={() => setActiveTab('discipline')}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-right shadow-2xs group flex flex-col justify-between ${
              activeTab === 'discipline'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20'
                : 'bg-white hover:bg-purple-50/60 border-slate-200 hover:border-purple-400'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 group-hover:bg-purple-700 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-950">
                ثبت انضباطی و تشویق
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                تذکرات و تشویقی‌های روزانه
              </div>
            </div>
          </button>

          {/* 6. Regional Question Bank */}
          {onOpenQuestionBank && (
            <button
              id="vp-btn-manage-qbank"
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
          )}

          {/* 7. Financial Management with Permission check */}
          {activeVicePrincipalPermissions.canManageFinances && onOpenFinanceModal ? (
            <button
              id="vp-btn-manage-finances"
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
                  بدهکاران، اقساط و ثبت اسناد
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-right opacity-60 flex flex-col justify-between cursor-not-allowed">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="font-bold text-xs text-slate-600">امور مالی و شهریه</div>
                <div className="text-[10px] text-slate-400 mt-0.5">نیازمند تفویض مدیر</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Operations Monitoring Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
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

            <button
              onClick={() => setActiveTab('discipline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'discipline'
                  ? 'bg-white text-purple-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>ثبت سریع انضباطی</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            بروزرسانی لحظه‌ای سامانه
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
                          <button
                            onClick={() => handleStudentClick(rec.student)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-teal-700 text-right"
                          >
                            {rec.student.name}
                          </button>
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
                        <span>پیامک/بله ارسال شد</span>
                      </span>

                      <a
                        href={`tel:${rec.student.parentPhone}`}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="تماس فوری با ولی دانش‌آموز"
                      >
                        <PhoneCall className="w-3 h-3 text-teal-600" />
                        <span className="hidden sm:inline">تماس با ولی</span>
                      </a>

                      {activeVicePrincipalPermissions.canViewFullDossier && (
                        <button
                          onClick={() => handleStudentClick(rec.student)}
                          className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>پرونده</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Classes */}
        {activeTab === 'live_classes' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{session.className}</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                      زنگ {toPersianDigits(session.period)}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    مبحث درس: <strong>{session.subject}</strong>
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
                  className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                    ann.isPinned
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {ann.isPinned && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">
                          سنجاق‌شده
                        </span>
                      )}
                      <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits(ann.date)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>صادرکننده: {ann.senderName || ann.senderRole}</span>
                    <span>مخاطب: {ann.target === 'all' ? 'عمومی' : ann.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Fast Disciplinary Logger */}
        {activeTab === 'discipline' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">ثبت مستقیم مورد انضباطی یا تشویقی</h3>
                <p className="text-xs text-slate-500">
                  این مورد به صورت خودکار در پرونده دانش‌آموز ثبت و به ولی اطلاع داده می‌شود.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDisciplinaryNote} className="space-y-3 text-xs max-w-xl">
              <div>
                <label className="block text-slate-700 font-bold mb-1">انتخاب دانش‌آموز:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {schoolStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} • {std.grade} (کد ملی: {toPersianDigits(std.nationalCode)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع مورد:</label>
                  <select
                    value={disciplinaryType}
                    onChange={(e) => setDisciplinaryType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="تشویقی">تشویقی / دستاورد علمی-اخلاقی</option>
                    <option value="تذکر">تذکر انضباطی / پوشش و مقررات</option>
                    <option value="تاخیر">تاخیر غیرموجه در ورود</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">عنوان کوتاه:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رتبه اول مسابقات قرآن یا تاخیر زنگ دوم"
                    value={disciplinaryTitle}
                    onChange={(e) => setDisciplinaryTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">توضیحات و دستور معاونت:</label>
                <textarea
                  rows={2}
                  value={disciplinaryNote}
                  onChange={(e) => setDisciplinaryNote(e.target.value)}
                  placeholder="جزئیات مورد ثبت‌شده..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت در پرونده تحصیلی دانش‌آموز</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
