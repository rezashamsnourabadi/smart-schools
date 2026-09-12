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
  FileText
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits } from '../utils/persianUtils';
import { Student } from '../types';

interface Props {
  onOpenQuestionBank: () => void;
  onOpenScheduleModal?: () => void;
  onOpenClassStudentModal?: () => void;
  onOpenPostModal?: () => void;
  onOpenVpPermsModal?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
}

export const PrincipalDashboard: React.FC<Props> = ({
  onOpenQuestionBank,
  onOpenScheduleModal,
  onOpenClassStudentModal,
  onOpenPostModal,
  onOpenVpPermsModal,
  onOpenStudentDossier
}) => {
  const {
    currentSchool,
    classes,
    students,
    attendanceSessions,
    announcements,
    setSelectedStudentForDossier
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'announcements'>('overview');

  const schoolClasses = classes.filter((c) => c.schoolId === currentSchool?.id);
  const schoolStudents = students.filter((s) => s.schoolId === currentSchool?.id);

  // Today's attendance sessions for this school
  const todaySessions = attendanceSessions.filter(
    (s) => s.schoolId === currentSchool?.id && s.date === '۱۴۰۵/۰۶/۲۲'
  );

  // Find absents today across all submitted sessions
  const absentRecords: { student: (typeof students)[0]; session: (typeof attendanceSessions)[0]; note?: string }[] = [];
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

  return (
    <div className="space-y-6" id="principal-dashboard-view">
      {/* Top Banner & Quick Management Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              میز کار مدیریت: {currentSchool?.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
              {currentSchool?.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مدیر واحد آموزشی: <strong>{currentSchool?.principalName}</strong> • کد سازمانی: <span className="font-mono">{toPersianDigits(currentSchool?.code || '')}</span>
          </p>
        </div>

        {/* Management Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenClassStudentModal && (
            <button
              onClick={onOpenClassStudentModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>کلاس‌بندی و دانش‌آموزان</span>
            </button>
          )}

          {onOpenScheduleModal && (
            <button
              onClick={onOpenScheduleModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>برنامه هفتگی</span>
            </button>
          )}

          {onOpenPostModal && (
            <button
              onClick={onOpenPostModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Megaphone className="w-4 h-4 text-teal-600" />
              <span>اخبار و رویدادها</span>
            </button>
          )}

          {onOpenVpPermsModal && (
            <button
              onClick={onOpenVpPermsModal}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Shield className="w-4 h-4 text-slate-600" />
              <span>دسترسی‌های معاون</span>
            </button>
          )}

          <button
            onClick={onOpenQuestionBank}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>بانک سوالات</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">دانش‌آموزان ثبت‌نامی</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {toPersianDigits(schoolStudents.length || currentSchool?.studentCount || 0)} نفر
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{toPersianDigits(schoolClasses.length)} کلاس دایر</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">درصد حضور امروز</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {toPersianDigits(currentSchool?.attendanceRateToday || 100)}٪
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {toPersianDigits(todaySessions.length)} کلاس ثبت حضورغیاب
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">غایبین ثبت‌شده امروز</div>
          <div className={`text-2xl font-black mt-1 ${absentRecords.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {toPersianDigits(absentRecords.length)} نفر
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">اعلان به اولیا در بله/پیامک</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">کادر آموزشی و معلمان</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {toPersianDigits(currentSchool?.teacherCount || 18)} نفر
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">در حال تدریس</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>پایش وضعیت امروز و غایبین</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'classes'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>کلاس‌ها و پرونده دانش‌آموزان</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>اخبار، رویدادها و گزارش‌ها ({toPersianDigits(announcements.length)})</span>
        </button>
      </div>

      {/* Tab 1: Today's Attendance Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                لیست غایبان امروز ({toPersianDigits(absentRecords.length)} دانش‌آموز)
              </h3>
              <span className="text-xs text-slate-400 font-mono">تاریخ: شنبه ۲۲ شهریور ۱۴۰۵</span>
            </div>

            {absentRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-700 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                <span>عالی است! هیچ دانش‌آموزی امروز غیبت ندارد یا حضورغیاب کلاس‌ها هنوز ثبت نشده است.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {absentRecords.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStudentClick(item.student)}
                          className="font-bold text-slate-900 hover:text-teal-700 underline text-sm"
                        >
                          {item.student.name}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          غایب
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          کلاس: {item.session.className}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        ولی: {item.student.parentName} ({toPersianDigits(item.student.parentPhone)}) • بله: {item.student.parentBaleAccount}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStudentClick(item.student)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>پرونده کامل</span>
                      </button>
                      <a
                        href={`tel:${item.student.parentPhone}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>تماس با ولی</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Classes List & Students */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">کلاس‌های فعال مدرسه ({toPersianDigits(schoolClasses.length)} کلاس)</h3>
            {onOpenClassStudentModal && (
              <button
                onClick={onOpenClassStudentModal}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                مدیریت کلاس‌بندی و دانش‌آموزان
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schoolClasses.map((cls) => {
              const clsStudents = schoolStudents.filter((s) => s.classGroupId === cls.id);
              return (
                <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                      {cls.grade}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{toPersianDigits(clsStudents.length || cls.studentCount)} دانش‌آموز</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{cls.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">اتاق: {toPersianDigits(cls.room)} • رشته: {cls.fieldOfStudy}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700 mb-2">دانش‌آموزان این کلاس (جهت مشاهده سوابق کلیک کنید):</div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {clsStudents.map((std) => (
                        <button
                          key={std.id}
                          onClick={() => handleStudentClick(std)}
                          className="w-full text-right p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 transition-colors flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-800">{std.name}</span>
                          <span className="text-[11px] text-teal-700 font-mono">معدل: {toPersianDigits(std.reportCards?.[0]?.gpa || '۱۹.۴')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Announcements, News, Events */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">تابلوی اعلانات، اخبار، رویدادها و گزارش‌ها</h3>
            {onOpenPostModal && (
              <button
                onClick={onOpenPostModal}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                انتشار رویداد یا خبر جدید
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      post.type === 'news' ? 'bg-blue-100 text-blue-800' :
                      post.type === 'event' ? 'bg-purple-100 text-purple-800' :
                      post.type === 'event_report' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {post.type === 'news' ? 'خبر' :
                       post.type === 'event' ? 'رویداد' :
                       post.type === 'event_report' ? 'گزارش رویداد' : 'اطلاعیه'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{post.title}</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{toPersianDigits(post.date)}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{post.content}</p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>منتشرکننده: {post.senderName} ({post.senderRole})</span>
                  <span>مخاطب: {post.target === 'all' ? 'همه' : post.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-intrusive sponsor banner */}
      <SponsorBannerCard audienceFilter="all" />
    </div>
  );
};
