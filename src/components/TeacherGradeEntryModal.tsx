import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  Save,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  Search,
  CheckCheck,
  RotateCcw,
  MessageSquare,
  Plus,
  Minus
} from 'lucide-react';
import { useApp, useResource, useClassRoster } from '../context/AppContext';
import { getSchoolDate, toEnglishDigits, toPersianDigits } from '../utils/persianUtils';
import { parseGradeScore } from '../utils/gradeUtils';

interface TeacherGradeEntryModalProps {
  onClose: () => void;
}

export const TeacherGradeEntryModal: React.FC<TeacherGradeEntryModalProps> = ({ onClose }) => {
  useResource('grades');
  useResource('classes');
  const { classes, currentSchoolId, addGradeItem, currentUser } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [subject, setSubject] = useState<string>(currentUser.teachingSubjects?.[0] || '');
  const [category, setCategory] = useState<'continuous' | 'term1' | 'term2' | 'quiz'>('continuous');
  const [title, setTitle] = useState<string>('ارزشیابی مستمر کلاسی و حل تمرین');
  const [maxScore, setMaxScore] = useState<number>(20);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNoteForStudent, setShowNoteForStudent] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const roster = useClassRoster(selectedClassId);
  const classStudents = roster.data?.items || [];

  // Map of studentId -> score string
  const [scores, setScores] = useState<Record<string, string>>({});

  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleScoreChange = (studentId: string, val: string) => {
    setScores((prev) => ({ ...prev, [studentId]: val }));
    setFormError(null);
  };

  const adjustScore = (studentId: string, delta: number) => {
    const parsedCurrent = parseGradeScore(scores[studentId] || '0', maxScore);
    if (!parsedCurrent.ok) return;
    const current = parsedCurrent.value;
    const newScore = Math.max(0, Math.min(maxScore, current + delta));
    setScores((prev) => ({ ...prev, [studentId]: String(newScore) }));
    setFormError(null);
  };

  const handleNoteChange = (studentId: string, val: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: val }));
  };

  const toggleNoteInput = (studentId: string) => {
    setShowNoteForStudent((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleQuickFill = (scoreVal: number) => {
    const updated: Record<string, string> = {};
    classStudents.forEach((s) => {
      updated[s.id] = String(scoreVal);
    });
    setScores(updated);
    setFormError(null);
  };

  const categoryTitleMap = {
    continuous: 'نمره مستمر کلاسی',
    term1: 'امتحان نوبت اول دی‌ماه',
    term2: 'امتحان نوبت دوم خرداد',
    quiz: 'کوییز و آزمون کلاسی'
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classStudents.length) { setFormError('برای این کلاس دانش‌آموز فعالی جهت ثبت نمره وجود ندارد.'); return; }
    if (!subject.trim() || !title.trim()) { setFormError('نام درس و عنوان ارزشیابی را وارد کنید.'); setIsConfigOpen(true); return; }
    const parsedScores = classStudents.map((student) => ({ student, result: parseGradeScore(scores[student.id] || '', maxScore) }));
    const invalid = parsedScores.find((item) => !item.result.ok);
    if (invalid && !invalid.result.ok) { setFormError(`${invalid.student.name}: ${invalid.result.error}`); return; }
    const formattedScores = parsedScores.flatMap(({ student, result }) => result.ok ? [{ studentId: student.id, score: result.value, note: notes[student.id] || undefined }] : []);

    const result = await addGradeItem({
      schoolId: currentSchoolId,
      classGroupId: selectedClassId,
      subject: subject.trim(),
      title: title.trim(),
      category,
      categoryTitle: categoryTitleMap[category],
      date: getSchoolDate(),
      maxScore,
      scores: formattedScores
    });
    if (!result.ok) { setFormError(result.error); return; }
    onClose();
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const filteredStudents = classStudents.filter(
    (s) =>
      s.name.includes(searchQuery.trim()) ||
      toEnglishDigits(s.studentNumber).includes(toEnglishDigits(searchQuery).trim()) ||
      toEnglishDigits(s.nationalCode).includes(toEnglishDigits(searchQuery).trim())
  );

  const gradedCount = classStudents.filter((s) => parseGradeScore(scores[s.id] || '', maxScore).ok).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto w-full max-w-full"
      id="teacher-grade-entry-overlay"
    >
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl m-auto flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        id="teacher-grade-entry-dialog"
      >
        {/* Compact Modal Header */}
        <div className="bg-slate-900 text-white px-3.5 py-3 sm:px-5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base truncate">ثبت نمرات و ارزشیابی</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold hidden xs:inline-block">
                  {currentClass?.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {categoryTitleMap[category]} • درس {subject} (سقف {toPersianDigits(maxScore)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-11 min-h-11 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center justify-center"
            title="بستن"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsible / Compact Evaluation Setup Bar */}
        <div className="border-b border-slate-200 bg-slate-50 shrink-0">
          {/* Summary Row with Toggle */}
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap font-medium">
              <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-[11px]">
                {currentClass?.name}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]">
                {subject}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] hidden sm:inline-block">
                {categoryTitleMap[category]}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-[11px]">
                سقف: {toPersianDigits(maxScore)}
              </span>
            </div>

            <button
              type="button"
              id="btn-toggle-grade-config"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 hover:border-teal-300 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isConfigOpen ? 'بستن تنظیمات' : 'تغییر درس / سقف نمره'}</span>
              {isConfigOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Expanded Configuration Form (Collapsible to save 300px on mobile) */}
          {isConfigOpen && (
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-in fade-in duration-150">
            <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">کلاس آموزشی:</label>
                <select
                  id="grade-class-select"
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setFormError(null); }}
                  className="w-full min-h-11 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نام درس:</label>
                <input
                  id="grade-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setFormError(null); }}
                  className="w-full min-h-11 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع ارزشیابی:</label>
                <select
                  id="grade-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className="w-full min-h-11 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                >
                  <option value="continuous">نمره مستمر کلاسی</option>
                  <option value="quiz">کوییز و آزمون کلاسی</option>
                  <option value="term1">امتحان نوبت اول (دی‌ماه)</option>
                  <option value="term2">امتحان نوبت دوم (خرداد)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">سقف نمره:</label>
                <input
                  id="grade-max-score"
                  type="number"
                  value={maxScore}
                  onChange={(e) => { setMaxScore(Number(e.target.value)); setFormError(null); }}
                  className="w-full min-h-11 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-bold"
                  min={5}
                  max={100}
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان ارزشیابی:</label>
                <input
                  id="grade-title"
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFormError(null); }}
                  placeholder="مثال: پرسش شفاهی فصل ۲ یا حل تمرین صفحه ۴۵"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="w-full min-h-11 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  تایید و بازگشت به لیست
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Quick Grading Action Toolbar */}
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="grade-student-search"
                type="text"
                placeholder="جستجوی نام یا شماره..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="جستجوی دانش‌آموز با نام یا شماره"
                className="w-full min-h-11 text-xs pr-8 pl-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick Fill Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold hidden xs:inline">ثبت سریع:</span>
              <button
                type="button"
                id="btn-grade-fill-max"
                onClick={() => handleQuickFill(maxScore)}
                className="min-h-11 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors"
                title={`ثبت نمره ${toPersianDigits(maxScore)} برای تمام دانش‌آموزان`}
              >
                همه {toPersianDigits(maxScore)}
              </button>
              <button
                type="button"
                id="btn-grade-fill-one-below"
                onClick={() => handleQuickFill(Math.max(0, maxScore - 1))}
                className="min-h-11 px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold transition-colors"
                title={`ثبت نمره ${toPersianDigits(maxScore - 1)} برای تمام دانش‌آموزان`}
              >
                همه {toPersianDigits(maxScore - 1)}
              </button>
              <button
                type="button"
                id="btn-grade-clear-values"
                onClick={() => handleQuickFill(0)}
                className="min-w-11 min-h-11 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 transition-colors flex items-center justify-center"
                title="پاکسازی مقادیر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Student Grading List - Fully Scrollable & Spacious */}
          <div className="p-2.5 sm:p-4 overflow-y-auto flex-1 bg-slate-50/60 space-y-2 min-h-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 px-1 font-medium">
              <span>
                دانش‌آموزان کلاس {currentClass?.name} ({toPersianDigits(filteredStudents.length)} نفر)
              </span>
              <span className="font-mono text-[11px]">
                ثبت‌شده: <strong className="text-teal-700">{toPersianDigits(gradedCount)}</strong> از {toPersianDigits(classStudents.length)}
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                دانش‌آموزی با این مشخصات یافت نشد.
              </div>
            ) : (
              filteredStudents.map((std, idx) => {
                const parsedScore = parseGradeScore(scores[std.id] || '', maxScore);
                const currentScore = parsedScore.ok ? parsedScore.value : -1;
                const isPerfect = currentScore >= maxScore;
                const hasNote = Boolean(notes[std.id]);
                const isNoteOpen = showNoteForStudent[std.id] || hasNote;

                return (
                  <div
                    key={std.id}
                    id={`grade-student-card-${std.id}`}
                    className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Student Info */}
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="font-mono text-slate-400 text-xs w-5 text-center shrink-0">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-100">
                          {std.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {std.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ش.د: {toPersianDigits(std.studentNumber)}
                          </div>
                        </div>
                      </div>

                      {/* Score Input Controls (Touch-Friendly) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Note Toggle Button */}
                        <button
                          type="button"
                          id={`btn-grade-note-${std.id}`}
                          onClick={() => toggleNoteInput(std.id)}
                          className={`min-w-11 min-h-11 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center ${
                            hasNote
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          aria-label={`یادداشت برای ${std.name}`}
                          title="افزودن یادداشت برای اولیا"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Minus / Plus Steppers */}
                        <button
                          type="button"
                          id={`btn-grade-decrease-${std.id}`}
                          onClick={() => adjustScore(std.id, -0.5)}
                          aria-label={`کاهش نیم نمره ${std.name}`}
                          className="min-w-11 min-h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors active:scale-95"
                          title="کاهش ۰.۵ نمره"
                        >
                          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>

                        {/* Main Touch Score Input */}
                        <div className="relative">
                          <input
                            type="text"
                            id={`grade-score-${std.id}`}
                            inputMode="decimal"
                            dir="ltr"
                            aria-label={`نمره ${std.name} از ${toPersianDigits(maxScore)}`}
                            value={scores[std.id] || ''}
                            onChange={(e) => handleScoreChange(std.id, e.target.value)}
                            aria-invalid={!parsedScore.ok && Boolean(scores[std.id]?.trim())}
                            className={`w-[4.25rem] min-h-11 text-center font-mono font-bold text-sm sm:text-base rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                              !parsedScore.ok && Boolean(scores[std.id]?.trim()) ? 'bg-rose-50 border-rose-400 text-rose-900' : !parsedScore.ok ? 'bg-white border-slate-300 text-slate-900' : isPerfect
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-400 focus:ring-emerald-500'
                                : 'bg-teal-50/70 text-teal-900 border-teal-300 focus:ring-teal-500'
                            }`}
                            placeholder="۲۰"
                          />
                        </div>

                        <button
                          type="button"
                          id={`btn-grade-increase-${std.id}`}
                          onClick={() => adjustScore(std.id, 0.5)}
                          aria-label={`افزایش نیم نمره ${std.name}`}
                          className="min-w-11 min-h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors active:scale-95"
                          title="افزایش ۰.۵ نمره"
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>

                        <span className="text-[11px] text-slate-400 font-mono hidden xs:inline">
                          / {toPersianDigits(maxScore)}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Note Input Row */}
                    {isNoteOpen && (
                      <div className="pt-1 flex items-center gap-2 border-t border-slate-100 animate-in fade-in">
                        <input
                          type="text"
                          placeholder="یادداشت و توصیه دبیر به دانش‌آموز یا ولی..."
                          value={notes[std.id] || ''}
                          onChange={(e) => handleNoteChange(std.id, e.target.value)}
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                        />
                        {hasNote && (
                          <button
                            type="button"
                            onClick={() => handleNoteChange(std.id, '')}
                            className="text-[11px] text-rose-500 hover:underline px-1"
                          >
                            حذف یادداشت
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {formError && <p id="grade-entry-error" role="alert" className="mx-3 mt-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-800 text-xs leading-6 shrink-0">{formError}</p>}
          {/* Compact Sticky Modal Footer */}
          <div className="px-3 py-2.5 sm:px-5 sm:py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="text-[11px] sm:text-xs text-slate-500 hidden xs:block">
              نمره معتبر <strong className="text-teal-800 font-bold">{toPersianDigits(gradedCount)}</strong> دانش‌آموز ثبت شده است.
            </div>

            <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl min-h-[40px] font-medium"
              >
                انصراف
              </button>
              <button
                type="submit"
                id="btn-save-grades-submit"
                className="flex-1 xs:flex-initial px-4 sm:px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره نمرات</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

