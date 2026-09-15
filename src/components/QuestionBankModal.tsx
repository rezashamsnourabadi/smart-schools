import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuestionBankItem } from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import { AddQuestionModal } from './AddQuestionModal';
import {
  BookOpen,
  Search,
  Filter,
  PlusCircle,
  X,
  Check,
  Copy,
  Sparkles,
  Building2,
  Tag,
  HelpCircle,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionBankModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { questionBank } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Subjects list dynamically
  const subjects = Array.from(new Set(questionBank.map((q) => q.subject)));
  const grades = Array.from(new Set(questionBank.map((q) => q.grade)));

  // Filtered questions
  const filteredQuestions = questionBank.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || q.grade === selectedGrade;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchesType = selectedType === 'all' || q.type === selectedType;

    return matchesSearch && matchesSubject && matchesGrade && matchesDifficulty && matchesType;
  });

  const toggleAnswerReveal = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyQuestion = (q: QuestionBankItem) => {
    const textToCopy = `${q.title}\n${q.content}\n${
      q.options ? q.options.map((opt, i) => `${i + 1}) ${opt}`).join('\n') : ''
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-50/80 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  بانک سوالات متمرکز و مشترک مدارس شهرستان
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200 shrink-0">
                  {toPersianDigits(questionBank.length)} سوال ثبت‌شده
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
                منبع سراسری سوالات استاندارد امتحانی طراحی‌شده توسط دبیران کلیه مدارس منطقه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              id="btn-add-question-from-bank"
              onClick={() => setShowAddQuestionModal(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن سوال</span>
            </button>

            <button
              id="btn-close-question-bank"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در متن سوال، مبحث، یا کلمات کلیدی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label="انتخاب درس"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">همه درس‌ها</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <select
                aria-label="انتخاب مقطع تحصیلی"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">همه پایه‌ها</option>
                {grades.map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>

              <select
                aria-label="انتخاب سطح سختی"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">همه سطوح سختی</option>
                <option value="آسان">آسان</option>
                <option value="متوسط">متوسط</option>
                <option value="دشوار">دشوار</option>
              </select>

              <select
                aria-label="انتخاب نوع سوال"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">همه انواع سوال</option>
                <option value="تستی">تستی چهارگزینه‌ای</option>
                <option value="تشریحی">تشریحی</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              سوالی با فیلترهای انتخابی یافت نشد.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredQuestions.map((q) => {
                const isRevealed = revealedAnswers[q.id];
                const isCopied = copiedId === q.id;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs hover:border-teal-300 transition-all text-right"
                  >
                    {/* Tags and Metadata */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {q.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {q.grade}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            q.difficulty === 'آسان'
                              ? 'bg-emerald-50 text-emerald-700'
                              : q.difficulty === 'متوسط'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          سطح: {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600">
                          نوع: {q.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>طراح: {q.authorName} ({q.authorSchool})</span>
                        </span>
                        <span>• استفاده: {q.usageCount} بار</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 mb-1">{q.title}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                        {q.content}
                      </p>
                    </div>

                    {/* Options if Multiple Choice */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isRevealed && opt === q.correctAnswer
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Revealed Answer Box */}
                    {isRevealed && q.correctAnswer && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                        <div>
                          <strong>پاسخ صحیح / راهنما:</strong> {q.correctAnswer}
                        </div>
                        <span className="text-[10px] text-emerald-700">تایید شده توسط گروه آموزشی</span>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {q.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {q.correctAnswer && (
                          <button
                            onClick={() => toggleAnswerReveal(q.id)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-semibold px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                          >
                            {isRevealed ? 'مخفی‌سازی پاسخ' : 'مشاهده کلید و پاسخ'}
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyQuestion(q)}
                          className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 font-medium"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>کپی متن سوال</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Question Modal */}
        <AddQuestionModal
          isOpen={showAddQuestionModal}
          onClose={() => setShowAddQuestionModal(false)}
        />
      </div>
    </div>
  );
};
