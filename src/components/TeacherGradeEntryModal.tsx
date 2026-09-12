import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  Save,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits, formatPersianScore } from '../utils/persianUtils';

interface TeacherGradeEntryModalProps {
  onClose: () => void;
}

export const TeacherGradeEntryModal: React.FC<TeacherGradeEntryModalProps> = ({ onClose }) => {
  const { classes, students, currentSchoolId, addGradeItem, grades } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-1');
  const [subject, setSubject] = useState<string>('ریاضی ۱');
  const [category, setCategory] = useState<'continuous' | 'term1' | 'term2' | 'quiz'>('continuous');
  const [title, setTitle] = useState<string>('ارزشیابی مستمر کلاسی و حل تمرین');
  const [maxScore, setMaxScore] = useState<number>(20);

  const classStudents = students.filter((s) => s.classGroupId === selectedClassId);

  // Map of studentId -> score string
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    classStudents.forEach((s) => {
      initial[s.id] = '۱۹';
    });
    return initial;
  });

  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleScoreChange = (studentId: string, val: string) => {
    setScores((prev) => ({ ...prev, [studentId]: val }));
  };

  const handleNoteChange = (studentId: string, val: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const categoryTitleMap = {
      continuous: 'نمره مستمر کلاسی',
      term1: 'امتحان نوبت اول دی‌ماه',
      term2: 'امتحان نوبت دوم خرداد',
      quiz: 'کوییز و آزمون کلاسی'
    };

    const formattedScores = classStudents.map((s) => {
      const parsed = parseFloat(scores[s.id] || '0');
      return {
        studentId: s.id,
        score: isNaN(parsed) ? 0 : parsed,
        note: notes[s.id] || undefined
      };
    });

    addGradeItem({
      schoolId: currentSchoolId,
      classGroupId: selectedClassId,
      subject,
      title,
      category,
      categoryTitle: categoryTitleMap[category],
      date: '۱۴۰۵/۰۶/۲۲',
      maxScore,
      scores: formattedScores
    });

    onClose();
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

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
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">ثبت نمرات و ارزشیابی تحصیلی</h3>
              <p className="text-xs text-slate-400">ثبت نمره مستمر، امتحانات دوره‌ای و آزمون‌های کلاسی دبیر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">کلاس:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
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
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">نوع نمره:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="continuous">نمره مستمر کلاسی</option>
                <option value="quiz">کوییز کلاسی</option>
                <option value="term1">امتحان نوبت اول (دی‌ماه)</option>
                <option value="term2">امتحان نوبت دوم (خرداد)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">سقف نمره:</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-center font-mono"
                min={5}
                max={100}
                required
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">عنوان ارزشیابی:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: پرسش شفاهی فصل ۲ یا آزمون میان‌ترم"
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Student Grading List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium px-1">
              <span>لیست دانش‌آموزان کلاس {currentClass?.name} ({toPersianDigits(classStudents.length)} نفر)</span>
              <span>نمره از {toPersianDigits(maxScore)}</span>
            </div>

            {classStudents.map((std, idx) => (
              <div
                key={std.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-xs w-6 text-center">{toPersianDigits(idx + 1)}</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                    {std.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">{std.name}</div>
                    <div className="text-[11px] text-slate-400">ش.دانش‌آموزی: {toPersianDigits(std.studentNumber)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="یادداشت معلم..."
                    value={notes[std.id] || ''}
                    onChange={(e) => handleNoteChange(std.id, e.target.value)}
                    className="flex-1 sm:w-44 text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={maxScore}
                      value={scores[std.id] || ''}
                      onChange={(e) => handleScoreChange(std.id, e.target.value)}
                      className="w-16 p-1.5 text-center font-mono font-bold text-teal-800 text-sm bg-teal-50/50 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="۲۰"
                      required
                    />
                    <span className="text-xs text-slate-400 font-mono">/ {toPersianDigits(maxScore)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              ذخیره نمرات و ارسال گزارش به اولیا
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
