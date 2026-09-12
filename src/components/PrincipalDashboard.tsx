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
  School as SchoolIcon
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';

interface Props {
  onOpenQuestionBank: () => void;
}

export const PrincipalDashboard: React.FC<Props> = ({ onOpenQuestionBank }) => {
  const {
    currentSchool,
    classes,
    students,
    attendanceSessions,
    announcements,
    addAnnouncement,
    questionBank
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'announcements'>('overview');

  // New School Announcement state
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancTarget, setAncTarget] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');

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

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    addAnnouncement({
      schoolId: currentSchool?.id || 'school-1',
      title: ancTitle,
      content: ancContent,
      senderRole: 'مدیر مدرسه',
      senderName: currentSchool?.principalName || 'مدیر دبیرستان',
      target: ancTarget,
      priority: 'normal'
    });

    setAncTitle('');
    setAncContent('');
  };

  return (
    <div className="space-y-6" id="principal-dashboard-view">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              میز کار مدیریت: {currentSchool?.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              {currentSchool?.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مدیر واحد آموزشی: {currentSchool?.principalName} • کد سازمانی: {currentSchool?.code}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuestionBank}
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>بانک سوالات منطقه</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">دانش‌آموزان ثبت‌نامی</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{currentSchool?.studentCount} نفر</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{schoolClasses.length} کلاس فعال</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">درصد حضور امروز</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {currentSchool?.attendanceRateToday}٪
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {todaySessions.length} کلاس حضورغیاب شده
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">غایبین ثبت‌شده امروز</div>
          <div className={`text-2xl font-bold mt-1 ${absentRecords.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {absentRecords.length} نفر
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">اعلان به اولیا مخابره شد</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">کادر آموزشی و معلمان</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{currentSchool?.teacherCount} نفر</div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">در حال تدریس</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>پایش وضعیت امروز مدرسه</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>کلاس‌ها و دانش‌آموزان</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>تابلوی اعلانات و بخشنامه‌های داخلی</span>
        </button>
      </div>

      {/* Tab 1: Today's Attendance Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                لیست غایبان امروز ({absentRecords.length} دانش‌آموز)
              </h3>
              <span className="text-xs text-slate-400">تاریخ: شنبه ۲۲ شهریور ۱۴۰۵</span>
            </div>

            {absentRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-700 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                <span>عالی است! هیچ دانش‌آموزی امروز غیبت ندارد یا هنوز کلاسی ثبت نشده است.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {absentRecords.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.student.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          غایب
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          کلاس: {item.session.className}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ولی: {item.student.parentName} ({item.student.parentPhone}) • بله: {item.student.parentBaleAccount}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        ثبت توسط: {item.session.teacherName} (ساعت {item.session.submittedAt})
                      </span>
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

      {/* Tab 2: Classes List */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schoolClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {cls.grade}
                </span>
                <span className="text-xs text-slate-400">{cls.studentCount} دانش‌آموز</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
              <p className="text-xs text-slate-500">{cls.room} • رشته {cls.major}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              ارسال اطلاعیه داخلی دبیرستان
            </h3>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">عنوان اطلاعیه</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برگزاری آزمون میان‌ترم ریاضی و زبان"
                  value={ancTitle}
                  onChange={(e) => setAncTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">مخاطب</label>
                <select
                  value={ancTarget}
                  onChange={(e) => setAncTarget(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="all">همه اولیا و دانش‌آموزان</option>
                  <option value="teachers">کادر آموزشی و معلمان</option>
                  <option value="parents">فقط اولیا</option>
                  <option value="students">فقط دانش‌آموزان</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">متن کامل</label>
              <textarea
                required
                rows={2}
                placeholder="متن پیام مدیر مدرسه..."
                value={ancContent}
                onChange={(e) => setAncContent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ثبت در تابلوی مدرسه</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Non-intrusive sponsor banner */}
      <SponsorBannerCard audienceFilter="all" />
    </div>
  );
};
