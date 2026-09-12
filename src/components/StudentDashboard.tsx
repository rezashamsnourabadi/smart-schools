import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronLeft,
  FileQuestion,
  Eye,
  Send,
  Upload,
  Paperclip,
  Megaphone,
  AlertCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits } from '../utils/persianUtils';
import { Student, HomeworkItem } from '../types';

interface Props {
  onOpenQuestionBank: () => void;
  onOpenStudentDossier?: (student: Student) => void;
}

export const StudentDashboard: React.FC<Props> = ({ onOpenQuestionBank, onOpenStudentDossier }) => {
  const {
    currentSchool,
    currentUser,
    schedule,
    questionBank,
    homework,
    homeworkSubmissions,
    submitHomework,
    exams,
    students,
    announcements,
    setSelectedStudentForDossier
  } = useApp();

  const currentStudent = students.find((s) => s.id === 'std-1') || students[0];

  // Pick a sample practice question for the student
  const sampleQuestion = questionBank[0];
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

  // Homework submission modal state
  const [activeHwForSubmit, setActiveHwForSubmit] = useState<HomeworkItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const handleTestAnswer = (opt: string) => {
    setSelectedOption(opt);
    setIsAnswerSubmitted(true);
  };

  const handleOpenMyDossier = () => {
    if (onOpenStudentDossier) {
      onOpenStudentDossier(currentStudent);
    } else {
      setSelectedStudentForDossier(currentStudent);
    }
  };

  const handleSendHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHwForSubmit || !submissionText.trim()) return;

    submitHomework({
      homeworkId: activeHwForSubmit.id,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      textContent: submissionText.trim(),
      attachments: attachmentName.trim()
        ? [{ name: attachmentName.trim(), type: 'pdf' }]
        : []
    });

    setSubmissionText('');
    setAttachmentName('');
    setActiveHwForSubmit(null);
  };

  // Filter announcements for students
  const studentAnnouncements = announcements.filter(
    (a) => a.target === 'all' || a.target === 'students'
  );

  return (
    <div className="space-y-6" id="student-dashboard-view">
      {/* Top Greeting Card */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-bold border border-teal-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>پروفایل اختصاصی دانش‌آموز</span>
            </div>
            <h1 className="text-2xl font-black">
              سلام {currentUser.name} عزیز، روزت پر از یادگیری!
            </h1>
            <p className="text-xs text-teal-100 max-w-xl leading-relaxed">
              کلاس {currentStudent.grade} • {currentSchool?.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenMyDossier}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm border border-white/30 flex items-center gap-2 transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-teal-200" />
              <span>مشاهده کارنامه و پرونده تحصیلی من</span>
            </button>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/20">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-teal-200 font-medium">وضعیت حضور امروز شما:</div>
                <div className="text-xs font-bold text-white">حاضر در کلاس درس</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Today's Schedule, Active Homework, Upcoming Exams */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  برنامه درسی امروز شما (شنبه)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">۲۲ شهریور</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">زنگ اول: ریاضی ۱</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                      کلاس هم‌اکنون در حال برگزاری
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">دبیر: استاد کاظمی • مبحث: مجموعه‌ها و دنباله حسابی</p>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {toPersianDigits('۰۸:۰۰')} - {toPersianDigits('۰۹:۳۰')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs opacity-85">
                <div>
                  <div className="font-bold text-slate-900">زنگ دوم: زبان انگلیسی</div>
                  <p className="text-slate-500 mt-0.5">دبیر: آقای حسنی • درس اول</p>
                </div>
                <span className="font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {toPersianDigits('۰۹:۴۵')} - {toPersianDigits('۱۱:۱۵')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs opacity-85">
                <div>
                  <div className="font-bold text-slate-900">زنگ سوم: فیزیک ۱</div>
                  <p className="text-slate-500 mt-0.5">دبیر: مهندس نوری • اندازه‌گیری و چگالی</p>
                </div>
                <span className="font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {toPersianDigits('۱۱:۳۰')} - {toPersianDigits('۱۲:۴۵')}
                </span>
              </div>
            </div>
          </div>

          {/* Active Homework & Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  تکالیف درسی و آزمون‌های پیش‌رو
                </h3>
              </div>
              <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                {toPersianDigits(homework.length + exams.length)} مورد فعال
              </span>
            </div>

            <div className="space-y-3">
              {homework.map((hw) => {
                const mySubmission = homeworkSubmissions.find(
                  (s) => s.homeworkId === hw.id && s.studentId === currentStudent.id
                );

                return (
                  <div
                    key={hw.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                            تکلیف: {hw.subject}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{hw.title}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{hw.description}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-[10px] text-slate-400 block">مهلت تحویل:</span>
                        <span className="font-mono font-bold text-rose-700 text-xs">{toPersianDigits(hw.dueDate)}</span>
                      </div>
                    </div>

                    {/* Submission status or CTA */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      {mySubmission ? (
                        <div className="w-full space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>پاسخ شما ارسال شده است ({toPersianDigits(mySubmission.submissionDate)})</span>
                            </span>
                            {mySubmission.status === 'graded' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                نمره دبیر: {toPersianDigits(mySubmission.teacherScore ?? 0)} از ۲۰
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                                در نوبت بررسی دبیر
                              </span>
                            )}
                          </div>
                          {mySubmission.teacherFeedback && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-700">نظر دبیر: </span>
                                <span>{mySubmission.teacherFeedback}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[11px] text-amber-700 font-medium">
                            پاسخ این تکلیف هنوز ثبت نشده است
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveHwForSubmit(hw)}
                            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>ارسال پاسخ تکلیف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {exams.slice(0, 1).map((ex) => (
                <div key={ex.id} className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 font-bold text-[10px]">
                        آزمون آنلاین: {ex.subject}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{ex.title}</span>
                    </div>
                    <p className="text-purple-800 text-[11px]">
                      مدت آزمون: {toPersianDigits(ex.durationMinutes)} دقیقه • تعداد سوالات: {toPersianDigits(ex.questionsCount)}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-purple-700 block">زمان آزمون:</span>
                    <span className="font-mono font-bold text-purple-900 text-xs">{toPersianDigits(ex.examDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements for Students */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  اطلاعیه‌ها و رویدادهای مهم مدرسه
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {toPersianDigits(studentAnnouncements.length)} اطلاعیه
              </span>
            </div>

            <div className="space-y-3">
              {studentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits(ann.date)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                    <span>فرستنده: {ann.sender}</span>
                    {ann.priority === 'urgent' && (
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm">فوری</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Practice Question of the Day & Question Bank Link */}
        <div className="lg:col-span-5 space-y-5">
          {/* Question of the Day */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  سوال تمرینی روز (از بانک شهرستان)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
                {sampleQuestion.subject} • {sampleQuestion.difficulty}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 leading-snug">
                {sampleQuestion.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {sampleQuestion.content}
              </p>
            </div>

            {/* Options */}
            {sampleQuestion.options && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">گزینه صحیح را انتخاب کنید:</span>
                <div className="grid grid-cols-2 gap-2">
                  {sampleQuestion.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === sampleQuestion.correctAnswer;
                    let btnColor = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnColor = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-300';
                      } else if (isSelected) {
                        btnColor = 'bg-rose-50 border-rose-300 text-rose-800 line-through';
                      }
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleTestAnswer(opt)}
                        className={`p-2.5 rounded-xl border text-xs text-center transition-all ${btnColor}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswerSubmitted && (
                  <div className="p-3 rounded-xl bg-teal-50 text-teal-900 text-xs mt-2 border border-teal-200 flex items-center justify-between">
                    <span>
                      پاسخ صحیح: <strong>{sampleQuestion.correctAnswer}</strong>
                    </span>
                    <span className="text-[10px] text-teal-700">طراح: {sampleQuestion.authorName}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onOpenQuestionBank}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>مشاهده سایر نمونه سوالات پایه دهم</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Non-intrusive Educational/Cultural Sponsor Spot for Student */}
      <SponsorBannerCard audienceFilter="students" />

      {/* Homework Submission Modal */}
      {activeHwForSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">ارسال پاسخ تکلیف درسی</h3>
                  <span className="text-[11px] text-teal-700 font-medium">
                    {activeHwForSubmit.subject} • {activeHwForSubmit.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveHwForSubmit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-800">شرح تکلیف:</div>
              <p className="leading-relaxed">{activeHwForSubmit.description}</p>
              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-200">
                <span>دبیر: {activeHwForSubmit.teacherName}</span>
                <span>مهلت تحویل: {toPersianDigits(activeHwForSubmit.dueDate)}</span>
              </div>
            </div>

            <form onSubmit={handleSendHomework} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پاسخ و توضیحات حل تمرین: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="راه حل سوالات، مراحل محاسبات یا توضیحات تمرین را در این قسمت بنویسید..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پیوست فایل یا تصویر تمرین (اختیاری):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="مثال: Taklif-Fizik-AliRezaei.pdf یا تصویر حل تمرین"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="w-full text-xs p-2.5 ps-8 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                    />
                    <Paperclip className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveHwForSubmit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت نهایی و ارسال به دبیر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
