import React, { useState } from 'react';
import { Award, BookOpen, CalendarDays, CheckCheck, Eye, FileQuestion, MessageSquare, PlusCircle, Search, Send, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Student } from '../types';
import { attendanceKey, attendanceLabels, isSlotLive, schoolTimeMinutes } from '../utils/attendance';
import { normalizeSchoolDate, toEnglishDigits, toPersianDigits } from '../utils/persianUtils';
import { SponsorBannerCard } from './SponsorBannerCard';
import { AddQuestionModal } from './AddQuestionModal';

interface Props {
  onOpenQuestionBank: () => void;
  onOpenGradeEntryModal?: () => void;
  onOpenHomeworkExamModal?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
}
const colors: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  absent: 'bg-rose-50 border-rose-300 text-rose-900',
  late: 'bg-amber-50 border-amber-300 text-amber-900',
  excused: 'bg-blue-50 border-blue-200 text-blue-900'
};
const nextStatus: Record<AttendanceStatus, AttendanceStatus> = { present: 'absent', absent: 'late', late: 'excused', excused: 'present' };

export const TeacherDashboard: React.FC<Props> = ({ onOpenQuestionBank, onOpenGradeEntryModal, onOpenHomeworkExamModal, onOpenStudentDossier }) => {
  const { currentSchool, currentUser, students, schedule, attendanceSessions, submitAttendance, setSelectedStudentForDossier, schoolClock, activeAcademicYear } = useApp();
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule'>('attendance');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [platform, setPlatform] = useState<'bale' | 'sms'>('bale');
  const [query, setQuery] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const todaySlots = schedule.filter((slot) => slot.dayOfWeek === schoolClock.dayOfWeek).slice().sort((a, b) => a.period - b.period || a.className.localeCompare(b.className, 'fa'));
  const currentSlot = todaySlots.find((slot) => slot.id === selectedSlotId) || todaySlots.find((slot) => isSlotLive(slot, schoolClock)) || todaySlots[0];
  const key = currentSlot ? attendanceKey({ ...currentSlot, date: schoolClock.date }) || '' : '';
  const existingSession = attendanceSessions.find((session) => attendanceKey(session) === key);
  const classStudents = students.filter((student) => student.classGroupId === currentSlot?.classGroupId && (!student.status || student.status === 'active'));
  const attendanceMap = Object.fromEntries(classStudents.map((student) => [student.id, drafts[key]?.[student.id] || existingSession?.records.find((row) => row.studentId === student.id)?.status || 'present'])) as Record<string, AttendanceStatus>;
  const search = toEnglishDigits(query).trim();
  const filtered = classStudents.filter((student) => student.name.includes(query.trim()) || toEnglishDigits(student.nationalCode).includes(search));
  const count = (status: AttendanceStatus) => classStudents.filter((student) => attendanceMap[student.id] === status).length;
  const dirty = !existingSession || classStudents.some((student) => attendanceMap[student.id] !== existingSession.records.find((row) => row.studentId === student.id)?.status);
  const start = currentSlot ? schoolTimeMinutes(currentSlot.startTime) : undefined;
  const canSubmit = !!currentSlot && !!classStudents.length && start !== undefined && schoolClock.minuteOfDay >= start && !!activeAcademicYear?.isCurrent && activeAcademicYear.status === 'active' && dirty;
  const toggle = (studentId: string) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [studentId]: nextStatus[attendanceMap[studentId]] } }));
    setFeedback(null);
  };
  const submit = () => {
    if (!currentSlot) return;
    const result = submitAttendance(currentSlot.id, classStudents.map((student) => ({ studentId: student.id, status: attendanceMap[student.id], note: existingSession?.records.find((row) => row.studentId === student.id)?.note })), platform);
    if (!result.ok) { setFeedback({ error: true, text: result.error }); return; }
    setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setFeedback({ error: false, text: result.changed ? `ثبت شد؛ ${toPersianDigits(result.notificationsSent)} اعلان آزمایشی جدید.` : 'این جلسه قبلاً با همین اطلاعات ثبت شده است.' });
  };

  return (
    <div className="space-y-4 sm:space-y-6" id="teacher-dashboard-view">
      <header className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="min-w-0"><h1 className="font-bold text-lg text-slate-900">سلام، {currentUser.name}</h1><p className="text-xs text-slate-500 mt-1">{currentSchool?.name}</p></div>
          <span className="text-xs text-teal-800 bg-teal-50 rounded-xl px-3 py-2">{toPersianDigits(schoolClock.dateLabel)}</span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {onOpenGradeEntryModal && <button onClick={onOpenGradeEntryModal} className="min-h-11 px-3 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2"><Award className="size-4 shrink-0" />ثبت نمرات</button>}
          {onOpenHomeworkExamModal && <button onClick={onOpenHomeworkExamModal} className="min-h-11 px-3 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-2"><FileQuestion className="size-4 shrink-0" />تکالیف و آزمون</button>}
          <button id="open-question-bank-btn" onClick={onOpenQuestionBank} className="min-h-11 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"><BookOpen className="size-4 shrink-0" />بانک سؤال</button>
          <button id="quick-add-question-btn" onClick={() => setShowAddQuestion(true)} className="min-h-11 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"><PlusCircle className="size-4 shrink-0" />افزودن سؤال</button>
        </div>
      </header>
      <div role="tablist" aria-label="میز کار دبیر" className="grid grid-cols-2 gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl">
        {(['attendance', 'schedule'] as const).map((tab) => <button key={tab} id={`teacher-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={tab === 'attendance' ? 'attendance-section' : 'schedule-section'} onClick={() => setActiveTab(tab)} className={`min-h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{tab === 'attendance' ? <CheckCheck className="size-4" /> : <CalendarDays className="size-4" />}{tab === 'attendance' ? 'حضور و غیاب' : 'برنامه هفتگی'}</button>)}
      </div>
      {activeTab === 'attendance' && <section id="attendance-section" role="tabpanel" aria-labelledby="teacher-tab-attendance" className="space-y-3">
        {!currentSlot ? <div id="teacher-no-schedule" role="status" className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3"><p className="text-sm text-slate-700">برای امروز برنامه‌ای به این حساب دبیر متصل نیست.</p><button onClick={() => setActiveTab('schedule')} className="min-h-11 text-teal-800 text-sm font-bold">مشاهده برنامه هفتگی</button></div> : <>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <label htmlFor="attendance-slot-select" className="block text-xs font-bold text-slate-700">کلاس و زنگ امروز</label>
            <select id="attendance-slot-select" value={currentSlot.id} onChange={(event) => { setSelectedSlotId(event.target.value); setQuery(''); setFeedback(null); }} className="w-full min-h-11 p-2.5 rounded-xl border border-slate-300 bg-white text-sm">
              {todaySlots.map((slot) => <option key={slot.id} value={slot.id}>{toPersianDigits(`زنگ ${slot.period} • ${slot.className} • ${slot.subject}`)}</option>)}
            </select>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><Users className="size-4" /><span>{toPersianDigits(classStudents.length)} دانش‌آموز</span><span dir="ltr">{toPersianDigits(currentSlot.startTime)} – {toPersianDigits(currentSlot.endTime)}</span><span className="font-bold text-teal-800">{isSlotLive(currentSlot, schoolClock) ? 'زنگ در حال برگزاری' : start !== undefined && schoolClock.minuteOfDay < start ? 'شروع نشده' : 'جلسه امروز'}</span></div>
            <p id="attendance-session-note" className="text-xs text-slate-500 leading-6">وضعیت پیش‌فرض، حاضر است و با دکمه ثبت نهایی می‌شود. هر لمس وضعیت را تغییر می‌دهد. غیبت، تأخیر و اصلاح آن‌ها اعلان آزمایشی خودکار دارند.</p>
            {!activeAcademicYear?.isCurrent && <p role="status" className="text-xs text-amber-800">برای ثبت، سال تحصیلی فعال مدرسه را انتخاب کنید.</p>}
            <div className="flex flex-wrap gap-2 text-xs">
              {(Object.keys(attendanceLabels) as AttendanceStatus[]).map((status) => <span key={status} className={`px-2 py-1 rounded-lg border ${colors[status]}`}>{attendanceLabels[status]}: {toPersianDigits(count(status))}</span>)}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 flex-1 min-w-0"><Search className="size-4 shrink-0 text-slate-400" /><input id="attendance-student-search" aria-label="جستجوی دانش‌آموز" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام یا کد ملی" className="min-h-11 w-full min-w-0 text-sm outline-none bg-transparent" /></label>
              <button id="btn-all-present" onClick={() => { setDrafts((prev) => ({ ...prev, [key]: Object.fromEntries(classStudents.map((student) => [student.id, 'present'])) })); setFeedback(null); }} className="min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">همه حاضرند</button>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" aria-label="وضعیت دانش‌آموزان">
            {filtered.map((student, index) => <li key={student.id} id={`student-att-card-${student.id}`} className={`flex rounded-2xl border overflow-hidden ${colors[attendanceMap[student.id]]}`}>
              <button onClick={() => toggle(student.id)} aria-label={`${student.name}، ${attendanceLabels[attendanceMap[student.id]]}؛ تغییر وضعیت`} className="flex-1 min-w-0 min-h-20 p-3 text-right flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:-outline-offset-2">
                <span className="text-xs opacity-60 shrink-0">{toPersianDigits(index + 1)}</span><span className="flex-1 min-w-0"><span className="block font-bold text-sm break-words">{student.name}</span><span className="block text-[11px] opacity-75 mt-1 break-words">ولی: {student.parentName}</span></span><span className="text-[11px] font-bold shrink-0 px-2 py-1 rounded-lg bg-white/70">{attendanceLabels[attendanceMap[student.id]]}</span>
              </button>
              <button aria-label={`پرونده ${student.name}`} onClick={() => onOpenStudentDossier ? onOpenStudentDossier(student) : setSelectedStudentForDossier(student)} className="min-w-11 min-h-11 border-s border-current/10 flex items-center justify-center bg-white/40"><Eye className="size-4" /></button>
            </li>)}
          </ul>
          {!filtered.length && <p role="status" className="p-4 text-sm text-slate-500">دانش‌آموزی با این جستجو پیدا نشد.</p>}
          {existingSession && <p className="text-xs text-slate-600 leading-6">آخرین ثبت: {toPersianDigits(existingSession.updatedAt || existingSession.submittedAt)} • {toPersianDigits(existingSession.sentNotificationsCount)} اعلان آزمایشی در سابقه این جلسه</p>}
          {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm ${feedback.error ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-900'}`}>{feedback.text}</p>}
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:bottom-4 z-30 p-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 sm:flex-1"><MessageSquare className="size-4 text-teal-700 shrink-0" /><span>اعلان خودکار</span><select id="attendance-notification-channel" aria-label="کانال اعلان خودکار" value={platform} onChange={(event) => setPlatform(event.target.value === 'sms' ? 'sms' : 'bale')} className="min-h-11 flex-1 sm:flex-none px-3 rounded-xl border border-slate-200 bg-white"><option value="bale">بله، با جایگزین پیامک</option><option value="sms">پیامک</option></select></label>
            <button id="submit-final-attendance-btn" onClick={submit} disabled={!canSubmit} aria-describedby="attendance-session-note" className="min-h-12 px-5 bg-teal-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Send className="size-4" />{existingSession ? dirty ? 'ثبت اصلاحات' : 'ثبت شده' : 'ثبت حضور و غیاب'}</button>
          </div>
        </>}
      </section>}
      {activeTab === 'schedule' && <section id="schedule-section" role="tabpanel" aria-labelledby="teacher-tab-schedule" className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3"><h2 className="font-bold text-sm">برنامه هفتگی من</h2>{!schedule.length && <p role="status" className="text-sm text-slate-500">برنامه‌ای برای این حساب ثبت نشده است.</p>}<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{schedule.map((slot) => <div key={slot.id} className={`p-3 rounded-xl border space-y-2 ${isSlotLive(slot, schoolClock) ? 'border-teal-400 bg-teal-50' : 'border-slate-200'}`}><p className="font-bold text-sm">{slot.className}</p><p className="text-xs text-teal-800">{slot.subject}</p><p className="text-xs text-slate-600">{slot.dayOfWeek} • زنگ {toPersianDigits(slot.period)}</p><p dir="ltr" className="text-xs text-right">{toPersianDigits(slot.startTime)} – {toPersianDigits(slot.endTime)}</p>{slot.dayOfWeek === schoolClock.dayOfWeek && <button onClick={() => { setSelectedSlotId(slot.id); setActiveTab('attendance'); setFeedback(null); }} className="min-h-11 text-xs font-bold text-teal-800">حضور و غیاب این جلسه</button>}</div>)}</div></section>}
      <SponsorBannerCard audienceFilter="teachers" />
      <AddQuestionModal isOpen={showAddQuestion} onClose={() => setShowAddQuestion(false)} defaultSubject={currentUser.teachingSubjects?.[0] || 'عمومی'} />
    </div>
  );
};
