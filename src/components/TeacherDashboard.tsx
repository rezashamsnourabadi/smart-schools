import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Student } from '../types';
import {
  Users,
  CheckCheck,
  UserX,
  Clock,
  Send,
  HelpCircle,
  PlusCircle,
  CalendarDays,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileQuestion
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits, formatPersianScore } from '../utils/persianUtils';

interface Props {
  onOpenQuestionBank: () => void;
  onOpenGradeEntryModal?: () => void;
  onOpenHomeworkExamModal?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  onOpenQuestionBank,
  onOpenGradeEntryModal,
  onOpenHomeworkExamModal,
  onOpenStudentDossier
}) => {
  const {
    currentSchool,
    currentUser,
    students,
    schedule,
    submitAttendance,
    attendanceSessions,
    addQuestionBankItem,
    setSelectedStudentForDossier
  } = useApp();

  // Find current period schedule slot
  const currentSlot = schedule.find((s) => s.isCurrentPeriod) || schedule[0];
  const classStudents = students.filter((s) => s.classGroupId === currentSlot.classGroupId);

  // Check if attendance already submitted for today's session
  const existingSession = attendanceSessions.find(
    (a) => a.classGroupId === currentSlot.classGroupId && a.date === '۱۴۰۵/۰۶/۲۲'
  );

  // Local state for attendance taking
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    if (existingSession) {
      const map: Record<string, AttendanceStatus> = {};
      existingSession.records.forEach((r) => {
        map[r.studentId] = r.status;
      });
      return map;
    }
    const defaultMap: Record<string, AttendanceStatus> = {};
    classStudents.forEach((st) => {
      defaultMap[st.id] = 'present';
    });
    return defaultMap;
  });

  const [notifyBale, setNotifyBale] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule'>('attendance');

  // Quick Add Question modal/state
  const [showAddQuestion, setShowAddQuestion] = useState<boolean>(false);
  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [qSubject, setQSubject] = useState(currentUser.teachingSubjects?.[0] || 'ریاضی ۱');
  const [qGrade, setQGrade] = useState('پایه دهم');
  const [qDifficulty, setQDifficulty] = useState<'آسان' | 'متوسط' | 'دشوار'>('متوسط');
  const [qType, setQType] = useState<'تستی' | 'تشریحی'>('تستی');
  const [qOption1, setQOption1] = useState('');
  const [qOption2, setQOption2] = useState('');
  const [qOption3, setQOption3] = useState('');
  const [qOption4, setQOption4] = useState('');
  const [qCorrect, setQCorrect] = useState('');

  // Cycle status on student card click
  const toggleStudentStatus = (studentId: string) => {
    const current = attendanceMap[studentId] || 'present';
    const next: Record<AttendanceStatus, AttendanceStatus> = {
      present: 'absent',
      absent: 'late',
      late: 'excused',
      excused: 'present'
    };
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: next[current]
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    classStudents.forEach((st) => {
      allPresent[st.id] = 'present';
    });
    setAttendanceMap(allPresent);
  };

  const handleFinalSubmitAttendance = () => {
    const records = classStudents.map((st) => ({
      studentId: st.id,
      status: attendanceMap[st.id] || 'present'
    }));
    submitAttendance(currentSlot.classGroupId, records, notifyBale);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qContent.trim()) return;

    addQuestionBankItem({
      title: qTitle,
      content: qContent,
      subject: qSubject,
      grade: qGrade,
      difficulty: qDifficulty,
      type: qType,
      options: qType === 'تستی' ? [qOption1, qOption2, qOption3, qOption4].filter(Boolean) : undefined,
      correctAnswer: qCorrect,
      authorName: currentUser.name,
      authorSchool: currentSchool?.name || 'مدرسه هوشمند',
      isSharedRegional: true,
      tags: [qSubject, qGrade, 'امتحان کلاسی']
    });

    setShowAddQuestion(false);
    setQTitle('');
    setQContent('');
    setQOption1('');
    setQOption2('');
    setQOption3('');
    setQOption4('');
    setQCorrect('');
  };

  const handleViewDossier = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenStudentDossier) {
      onOpenStudentDossier(student);
    } else {
      setSelectedStudentForDossier(student);
    }
  };

  // Stats
  const presentsCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentsCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const latesCount = Object.values(attendanceMap).filter((s) => s === 'late').length;

  return (
    <div className="space-y-6" id="teacher-dashboard-view">
      {/* Top Welcome Bar & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              سلام، {currentUser.name} گرامی
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
              دبیر ریاضیات و فیزیک
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentSchool?.name} • زمان‌بندی زنگ اول (ساعت {toPersianDigits('۰۸:۰۰')} الی {toPersianDigits('۰۹:۳۰')})
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenGradeEntryModal && (
            <button
              onClick={onOpenGradeEntryModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Award className="w-4 h-4" />
              <span>ثبت نمرات و ارزشیابی</span>
            </button>
          )}

          {onOpenHomeworkExamModal && (
            <button
              onClick={onOpenHomeworkExamModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors shadow-2xs"
            >
              <FileQuestion className="w-4 h-4 text-teal-600" />
              <span>تکالیف و آزمون آنلاین</span>
            </button>
          )}

          <button
            id="open-question-bank-btn"
            onClick={onOpenQuestionBank}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>بانک سوالات منطقه</span>
          </button>

          <button
            id="quick-add-question-btn"
            onClick={() => setShowAddQuestion(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>افزودن سوال</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher for Teacher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          id="teacher-tab-attendance"
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>حضور و غیاب کلاسی (سریع با یک لمس)</span>
        </button>

        <button
          id="teacher-tab-schedule"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>برنامه هفتگی من</span>
        </button>
      </div>

      {/* Tab 1: Instant Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-5" id="attendance-section">
          {/* Main Attendance Card */}
          <div className="bg-white rounded-2xl border-2 border-teal-500/20 shadow-sm p-5 sm:p-6 relative overflow-hidden">
            {/* Top Bar with Live Period Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      کلاس در حال برگزاری (هم‌اکنون)
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {currentSlot.className} — {currentSlot.subject}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>زنگ اول • {toPersianDigits(currentSlot.startTime)} تا {toPersianDigits(currentSlot.endTime)}</span>
                    <span>• {toPersianDigits(classStudents.length)} دانش‌آموز</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-all-present"
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>تایید سریع: همه حاضرند</span>
                </button>

                <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    حاضر: {toPersianDigits(presentsCount)}
                  </span>
                  <span className={`px-2 py-1 rounded-md font-bold ${absentsCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                    غایب: {toPersianDigits(absentsCount)}
                  </span>
                  <span className={`px-2 py-1 rounded-md font-bold ${latesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    تاخیر: {toPersianDigits(latesCount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="py-3 px-3.5 my-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>روش سریع:</strong> به طور پیش‌فرض همه حاضر هستند. کافیست روی هر دانش‌آموز کلیک کنید تا وضعیت او به <strong>غایب</strong>، <strong>تاخیر</strong> یا <strong>موجه</strong> تغییر کند.
                </span>
              </span>
              <div className="flex items-center gap-3 text-[11px] shrink-0 font-medium">
                <span className="flex items-center gap-1 text-emerald-700">● حاضر</span>
                <span className="flex items-center gap-1 text-rose-700">● غایب</span>
                <span className="flex items-center gap-1 text-amber-700">● تاخیر</span>
              </div>
            </div>

            {/* Student Attendance Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 my-4">
              {classStudents.map((st, idx) => {
                const status = attendanceMap[st.id] || 'present';
                let cardColor = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                let badgeText = 'حاضر';
                let badgeColor = 'bg-emerald-600 text-white';

                if (status === 'absent') {
                  cardColor = 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-300';
                  badgeText = 'غایب';
                  badgeColor = 'bg-rose-600 text-white';
                } else if (status === 'late') {
                  cardColor = 'bg-amber-50 border-amber-300 text-amber-900';
                  badgeText = 'تاخیر';
                  badgeColor = 'bg-amber-600 text-white';
                } else if (status === 'excused') {
                  cardColor = 'bg-blue-50 border-blue-300 text-blue-900';
                  badgeText = 'موجه';
                  badgeColor = 'bg-blue-600 text-white';
                }

                return (
                  <div
                    key={st.id}
                    id={`student-att-card-${st.id}`}
                    onClick={() => toggleStudentStatus(st.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-28 select-none hover:shadow-xs cursor-pointer active:scale-95 ${cardColor}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono text-slate-500">#{toPersianDigits(idx + 1)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs truncate">{st.name}</div>
                      <div className="text-[10px] opacity-80 truncate">ولی: {st.parentName}</div>
                    </div>

                    <div className="pt-1 border-t border-black/10 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-600">
                        معدل: {toPersianDigits(st.reportCards?.[0]?.gpa || '۱۹.۲')}
                      </span>
                      <button
                        title="مشاهده پرونده کامل"
                        onClick={(e) => handleViewDossier(st, e)}
                        className="p-1 rounded-md bg-white/70 hover:bg-white text-slate-700 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification and Final Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  id="notify-bale-checkbox"
                  checked={notifyBale}
                  onChange={(e) => setNotifyBale(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>ارسال خودکار پیامک و اعلان در پیام‌رسان بله به اولیای غایبین/تاخیرها</span>
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  id="submit-final-attendance-btn"
                  onClick={handleFinalSubmitAttendance}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>تایید و ثبت نهایی حضور و غیاب زنگ اول</span>
                </button>
              </div>
            </div>
          </div>

          {/* Today's Submission Log / Status */}
          {existingSession && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  حضور و غیاب کلاس {existingSession.className} در ساعت {toPersianDigits(existingSession.submittedAt)} با موفقیت در سامانه هاب ثبت و تایید شده است.
                </span>
              </div>
              <span className="font-bold text-emerald-700">
                {existingSession.sentNotificationsCount > 0
                  ? `${toPersianDigits(existingSession.sentNotificationsCount)} اعلان به اولیا ارسال شد`
                  : 'همه دانش‌آموزان حاضر بودند'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schedule */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4" id="schedule-section">
          <h3 className="font-bold text-slate-900 text-sm">
            برنامه کلاسی هفتگی {currentUser.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {schedule.map((sc) => (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all ${
                  sc.isCurrentPeriod
                    ? 'border-teal-400 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700">{sc.dayOfWeek} • زنگ {toPersianDigits(sc.period)}</span>
                  <span className="text-slate-500 font-mono">{toPersianDigits(sc.startTime)} - {toPersianDigits(sc.endTime)}</span>
                </div>
                <div className="font-bold text-sm text-slate-900">{sc.className}</div>
                <div className="text-xs text-teal-700 font-bold mt-1">{sc.subject}</div>
                {sc.isCurrentPeriod && (
                  <div className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>کلاس فعال امروز</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-intrusive Sponsor Banner for Educational Opportunities */}
      <SponsorBannerCard audienceFilter="teachers" />

      {/* Modal: Quick Add Question to Regional Question Bank */}
      {showAddQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  افزودن سوال به بانک سوالات مشترک شهرستان
                </h3>
              </div>
              <button
                onClick={() => setShowAddQuestion(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                انصراف
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان سوال یا مبحث</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ریشه‌های معادله درجه دو و تعیین علامت"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">متن صورت سوال</label>
                <textarea
                  required
                  rows={3}
                  placeholder="متن کامل سوال را بنویسید..."
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">درس</label>
                  <input
                    type="text"
                    value={qSubject}
                    onChange={(e) => setQSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">پایه</label>
                  <select
                    value={qGrade}
                    onChange={(e) => setQGrade(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="پایه دهم">پایه دهم</option>
                    <option value="پایه یازدهم">پایه یازدهم</option>
                    <option value="پایه دوازدهم">پایه دوازدهم</option>
                    <option value="پایه نهم">پایه نهم</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">سطح سختی</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="آسان">آسان</option>
                    <option value="متوسط">متوسط</option>
                    <option value="دشوار">دشوار</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">نوع سوال</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="تستی">تستی چهارگزینه‌ای</option>
                    <option value="تشریحی">تشریحی / حل مسئله</option>
                  </select>
                </div>
              </div>

              {qType === 'تستی' && (
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700 block">گزینه‌های سوال:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="گزینه ۱"
                      value={qOption1}
                      onChange={(e) => setQOption1(e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-md bg-white"
                    />
                    <input
                      type="text"
                      placeholder="گزینه ۲"
                      value={qOption2}
                      onChange={(e) => setQOption2(e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-md bg-white"
                    />
                    <input
                      type="text"
                      placeholder="گزینه ۳"
                      value={qOption3}
                      onChange={(e) => setQOption3(e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-md bg-white"
                    />
                    <input
                      type="text"
                      placeholder="گزینه ۴"
                      value={qOption4}
                      onChange={(e) => setQOption4(e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">پاسخ صحیح یا کلید تشریحی</label>
                <input
                  type="text"
                  placeholder="پاسخ صحیح یا گزینه درست را بنویسید..."
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-xs"
                >
                  ثبت در بانک سوالات شهرستان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
