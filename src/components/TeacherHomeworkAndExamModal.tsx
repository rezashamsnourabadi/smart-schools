import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  FileQuestion,
  Send,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Paperclip,
  Check,
  UploadCloud,
  Trash2,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/persianUtils';

interface TeacherHomeworkAndExamModalProps {
  onClose: () => void;
}

export const TeacherHomeworkAndExamModal: React.FC<TeacherHomeworkAndExamModalProps> = ({ onClose }) => {
  const {
    classes,
    homework,
    homeworkSubmissions,
    gradeHomeworkSubmission,
    exams,
    currentSchoolId,
    currentUser,
    addHomework,
    addOnlineExam
  } = useApp();

  const [activeTab, setActiveTab] = useState<'homework' | 'exams'>('homework');
  const [showAddHw, setShowAddHw] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [expandedGradingHwId, setExpandedGradingHwId] = useState<string | null>(null);
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { score: number; feedback: string }>>({});

  // Homework form states
  const [hwClassId, setHwClassId] = useState(classes[0]?.id || 'cls-1');
  const [hwSubject, setHwSubject] = useState('ریاضی ۱');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('۱۴۰۵/۰۶/۲۸');
  const [hwUploadedFile, setHwUploadedFile] = useState<{
    name: string;
    size: string;
    url: string;
    type: 'image' | 'pdf' | 'doc';
  } | null>(null);

  const handleHwFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const isImg = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    const reader = new FileReader();
    reader.onload = () => {
      setHwUploadedFile({
        name: file.name,
        size: `${toPersianDigits(sizeInMb)} مگابایت`,
        url: reader.result as string,
        type: isImg ? 'image' : isPdf ? 'pdf' : 'doc'
      });
    };
    reader.readAsDataURL(file);
  };

  // Exam form states
  const [exClassId, setExClassId] = useState(classes[0]?.id || 'cls-1');
  const [exSubject, setExSubject] = useState('ریاضی ۱');
  const [exTitle, setExTitle] = useState('');
  const [exDate, setExDate] = useState('۱۴۰۵/۰۶/۳۰');
  const [exTime, setExTime] = useState('۱۰:۰۰');
  const [exDuration, setExDuration] = useState(45);
  const [exQuestionsCount, setExQuestionsCount] = useState(10);

  const handleSaveGrade = (submissionId: string) => {
    const draft = gradingDrafts[submissionId];
    if (!draft || draft.score === undefined || isNaN(draft.score)) return;
    gradeHomeworkSubmission(submissionId, draft.score, draft.feedback || '');
  };

  const handleAddHw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;

    const targetClass = classes.find((c) => c.id === hwClassId);

    addHomework({
      schoolId: currentSchoolId,
      classGroupId: hwClassId,
      className: targetClass?.name || 'کلاس درس',
      subject: hwSubject,
      title: hwTitle,
      description: hwDesc,
      dueDate: hwDueDate,
      createdAt: '۱۴۰۵/۰۶/۲۲',
      teacherName: currentUser.name,
      totalStudents: targetClass?.studentCount || 30,
      attachments: hwUploadedFile ? [hwUploadedFile] : undefined
    });

    setHwTitle('');
    setHwDesc('');
    setHwUploadedFile(null);
    setShowAddHw(false);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exTitle.trim()) return;

    const targetClass = classes.find((c) => c.id === exClassId);

    addOnlineExam({
      schoolId: currentSchoolId,
      classGroupId: exClassId,
      className: targetClass?.name || 'کلاس درس',
      subject: exSubject,
      title: exTitle,
      durationMinutes: exDuration,
      examDate: exDate,
      startTime: exTime,
      teacherName: currentUser.name,
      questionsCount: exQuestionsCount,
      isPublished: true,
      status: 'scheduled',
      questions: [
        {
          id: 'q1',
          text: 'ریشه‌های معادله درجه دوم داده شده کدام گزینه است؟',
          options: ['x = 2 و x = -3', 'x = 1 و x = 4', 'x = -1 و x = -2', 'معادله فاقد ریشه حقیقی است'],
          correctOptionIndex: 0,
          score: 2
        }
      ]
    });

    setExTitle('');
    setShowAddExam(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl my-auto max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-lg">مدیریت تکالیف درسی و آزمون‌ها</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">تعریف تکالیف هفتگی، تحویل فایل، تصحیح و ثبت نتایج</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="بستن"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('homework')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'homework'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              تکالیف درسی ({toPersianDigits(homework.length)})
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'exams'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              آزمون‌های آنلاین ({toPersianDigits(exams.length)})
            </button>
          </div>

          {activeTab === 'homework' ? (
            <button
              onClick={() => setShowAddHw(!showAddHw)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              تعریف تکلیف
            </button>
          ) : (
            <button
              onClick={() => setShowAddExam(!showAddExam)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              طراحی آزمون
            </button>
          )}
        </div>

        {/* Add Homework Form */}
        {activeTab === 'homework' && showAddHw && (
          <form onSubmit={handleAddHw} className="bg-teal-50/70 p-4 border-b border-teal-200 space-y-3 shrink-0">
            <div className="font-bold text-xs text-teal-900">تعریف تکلیف جدید برای دانش‌آموزان</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">کلاس هدف:</label>
                <select
                  value={hwClassId}
                  onChange={(e) => setHwClassId(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">درس:</label>
                <input
                  type="text"
                  value={hwSubject}
                  onChange={(e) => setHwSubject(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">مهلت ارسال پاسخ:</label>
                <input
                  type="text"
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">عنوان تکلیف:</label>
                <input
                  type="text"
                  placeholder="مثال: حل تمرین‌های دوره فصل اول هندسه"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">شرح و سوالات تکلیف:</label>
                <textarea
                  rows={2}
                  placeholder="صفحات مورد نظر و نکات مهم در حل..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Real Homework File / Sheet Upload */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>آپلود فایل یا تصویر برگ تکلیف (PDF یا عکس تمرین):</span>
                </label>

                <input
                  type="file"
                  id="hw-file-upload"
                  onChange={handleHwFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {!hwUploadedFile ? (
                  <label
                    htmlFor="hw-file-upload"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 rounded-xl cursor-pointer transition-colors text-center"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600 font-medium">
                      کلیک برای پیوست کاربرگ PDF یا تصویر تمرین‌ها
                    </span>
                  </label>
                ) : (
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      {hwUploadedFile.type === 'image' ? (
                        <img
                          src={hwUploadedFile.url}
                          alt="preview"
                          className="w-9 h-9 rounded-lg object-cover border border-teal-300"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-teal-700" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{hwUploadedFile.name}</span>
                        <span className="text-[10px] text-slate-500">{hwUploadedFile.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHwUploadedFile(null)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddHw(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
              >
                ارسال به کلاس
              </button>
            </div>
          </form>
        )}

        {/* Add Exam Form */}
        {activeTab === 'exams' && showAddExam && (
          <form onSubmit={handleAddExam} className="bg-teal-50/70 p-4 border-b border-teal-200 space-y-3 shrink-0">
            <div className="font-bold text-xs text-teal-900">طراحی آزمون آنلاین چندگزینه‌ای</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">کلاس هدف:</label>
                <select
                  value={exClassId}
                  onChange={(e) => setExClassId(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">درس:</label>
                <input
                  type="text"
                  value={exSubject}
                  onChange={(e) => setExSubject(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">مدت زمان (دقیقه):</label>
                <input
                  type="number"
                  value={exDuration}
                  onChange={(e) => setExDuration(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono text-center"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">عنوان آزمون:</label>
                <input
                  type="text"
                  placeholder="مثال: آزمون هماهنگ ماهانه ریاضی و تابع"
                  value={exTitle}
                  onChange={(e) => setExTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">تاریخ آزمون:</label>
                <input
                  type="text"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExam(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
              >
                انتشار و زمان‌بندی آزمون
              </button>
            </div>
          </form>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-3">
          {activeTab === 'homework' ? (
            homework.map((hw) => (
              <div
                key={hw.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                        {hw.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        کلاس: {hw.className}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">{hw.title}</h4>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block">مهلت ارسال</span>
                    <span className="text-xs font-bold text-rose-700 font-mono">{toPersianDigits(hw.dueDate)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {hw.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>دبیر: <strong>{hw.teacherName}</strong></span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تحویل داده‌شده: {toPersianDigits(hw.submissionsCount)} از {toPersianDigits(hw.totalStudents)} نفر</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedGradingHwId(expandedGradingHwId === hw.id ? null : hw.id)}
                      className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      {expandedGradingHwId === hw.id ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>بستن لیست پاسخ‌ها</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>مشاهده و تصحیح پاسخ‌ها</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submissions Grading Drawer */}
                {expandedGradingHwId === hw.id && (
                  <div className="mt-4 pt-3 border-t border-teal-100 bg-teal-50/40 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-teal-700" />
                        <span>پاسخ‌های ارسال‌شده دانش‌آموزان برای این تکلیف:</span>
                      </h5>
                      <span className="text-[11px] text-teal-700 font-semibold">
                        {toPersianDigits(homeworkSubmissions.filter((s) => s.homeworkId === hw.id).length)} پاسخ ثبت‌شده
                      </span>
                    </div>

                    {homeworkSubmissions.filter((s) => s.homeworkId === hw.id).length === 0 ? (
                      <div className="p-4 rounded-xl bg-white text-center text-xs text-slate-500 border border-slate-200">
                        تاکنون پاسخی از سوی دانش‌آموزان برای این تکلیف ثبت نگردیده است.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {homeworkSubmissions
                          .filter((s) => s.homeworkId === hw.id)
                          .map((sub) => {
                            const currentDraft = gradingDrafts[sub.id] || {
                              score: sub.teacherScore ?? 20,
                              feedback: sub.teacherFeedback || ''
                            };

                            return (
                              <div
                                key={sub.id}
                                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                                      {sub.studentName.slice(0, 1)}
                                    </div>
                                    <span className="font-bold text-xs text-slate-900">{sub.studentName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      تاریخ ارسال: {toPersianDigits(sub.submissionDate)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {sub.status === 'graded' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                        تصحیح شده (نمره: {toPersianDigits(sub.teacherScore ?? 0)} از ۲۰)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                        در انتظار تصحیح
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                                  <div className="text-[10px] text-slate-400 font-medium mb-1">متن پاسخ دانش‌آموز:</div>
                                  <p>{sub.textContent}</p>
                                </div>

                                {sub.attachments && sub.attachments.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                    <span className="text-[10px] text-slate-400">فایل‌های پیوست:</span>
                                    {sub.attachments.map((att, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]"
                                      >
                                        <Paperclip className="w-3 h-3 text-slate-400" />
                                        <span>{att.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Grading Form Controls */}
                                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                                  <div className="sm:col-span-3">
                                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                      نمره ارزشیابی (از ۲۰):
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={20}
                                      step={0.25}
                                      value={currentDraft.score}
                                      onChange={(e) =>
                                        setGradingDrafts({
                                          ...gradingDrafts,
                                          [sub.id]: {
                                            ...currentDraft,
                                            score: parseFloat(e.target.value) || 0
                                          }
                                        })
                                      }
                                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold"
                                    />
                                  </div>

                                  <div className="sm:col-span-6">
                                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                      بازخورد آموزشی و توصیه دبیر:
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="مثال: روش حل عالی بود، به نکات صفحه ۴ دقت شود..."
                                      value={currentDraft.feedback}
                                      onChange={(e) =>
                                        setGradingDrafts({
                                          ...gradingDrafts,
                                          [sub.id]: {
                                            ...currentDraft,
                                            feedback: e.target.value
                                          }
                                        })
                                      }
                                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                                    />
                                  </div>

                                  <div className="sm:col-span-3">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveGrade(sub.id)}
                                      className="w-full px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>ثبت نمره و نظر</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                        {exam.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        کلاس: {exam.className}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">{exam.title}</h4>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block">زمان آزمون</span>
                    <span className="text-xs font-bold text-purple-700 font-mono">
                      {toPersianDigits(exam.examDate)} ساعت {toPersianDigits(exam.startTime)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>مدت زمان: <strong>{toPersianDigits(exam.durationMinutes)} دقیقه</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                    <span>تعداد سوالات: <strong>{toPersianDigits(exam.questionsCount)} سوال</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>وضعیت: <strong className="text-emerald-700">برنامه‌ریزی‌شده</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>طراح آزمون: <strong>{exam.teacherName}</strong></span>
                  <button className="text-xs text-teal-700 font-bold hover:underline">
                    مشاهده سوالات و پاسخنامه
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
