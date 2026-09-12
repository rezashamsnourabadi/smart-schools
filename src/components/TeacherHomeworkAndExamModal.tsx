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
  Award
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
    exams,
    currentSchoolId,
    currentUser,
    addHomework,
    addOnlineExam
  } = useApp();

  const [activeTab, setActiveTab] = useState<'homework' | 'exams'>('homework');
  const [showAddHw, setShowAddHw] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  // Homework form states
  const [hwClassId, setHwClassId] = useState(classes[0]?.id || 'cls-1');
  const [hwSubject, setHwSubject] = useState('ریاضی ۱');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('۱۴۰۵/۰۶/۲۸');

  // Exam form states
  const [exClassId, setExClassId] = useState(classes[0]?.id || 'cls-1');
  const [exSubject, setExSubject] = useState('ریاضی ۱');
  const [exTitle, setExTitle] = useState('');
  const [exDate, setExDate] = useState('۱۴۰۵/۰۶/۳۰');
  const [exTime, setExTime] = useState('۱۰:۰۰');
  const [exDuration, setExDuration] = useState(45);
  const [exQuestionsCount, setExQuestionsCount] = useState(10);

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
      totalStudents: targetClass?.studentCount || 30
    });

    setHwTitle('');
    setHwDesc('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">مدیریت تکالیف درسی و آزمون‌های آنلاین</h3>
              <p className="text-xs text-slate-400">تعریف تکالیف هفتگی، تاریخ تحویل، طراحی آزمون و پیگیری نتایج</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
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

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>دبیر: <strong>{hw.teacherName}</strong></span>
                  <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تحویل داده‌شده: {toPersianDigits(hw.submissionsCount)} از {toPersianDigits(hw.totalStudents)} نفر</span>
                  </div>
                </div>
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
