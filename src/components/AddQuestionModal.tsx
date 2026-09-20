import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  defaultGrade?: string;
}

export const AddQuestionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultSubject = 'ریاضی',
  defaultGrade = 'پایه دهم'
}) => {
  const { addQuestionBankItem, currentUser, currentSchool } = useApp();

  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [qSubject, setQSubject] = useState(defaultSubject);
  const [qGrade, setQGrade] = useState(defaultGrade);
  const [qDifficulty, setQDifficulty] = useState<'آسان' | 'متوسط' | 'دشوار'>('متوسط');
  const [qType, setQType] = useState<'تستی' | 'تشریحی'>('تستی');
  const [qOption1, setQOption1] = useState('');
  const [qOption2, setQOption2] = useState('');
  const [qOption3, setQOption3] = useState('');
  const [qOption4, setQOption4] = useState('');
  const [qCorrect, setQCorrect] = useState('');

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setQTitle('');
    setQContent('');
    setQOption1('');
    setQOption2('');
    setQOption3('');
    setQOption4('');
    setQCorrect('');
    onClose();
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qContent.trim()) return;

    addQuestionBankItem({
      title: qTitle.trim(),
      content: qContent.trim(),
      subject: qSubject.trim() || 'عمومی',
      grade: qGrade,
      difficulty: qDifficulty,
      type: qType,
      options:
        qType === 'تستی'
          ? [qOption1, qOption2, qOption3, qOption4].filter((opt) => opt.trim().length > 0)
          : undefined,
      correctAnswer: qCorrect.trim(),
      authorName: currentUser.name,
      authorSchool: currentSchool?.name || 'مدارس شهرستان',
      isSharedRegional: true,
      tags: [qSubject.trim() || 'عمومی', qGrade, 'طراحی همکاران منطقه']
    });

    handleResetAndClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto w-full max-w-full">
      <div
        id="add-question-modal-card"
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-slate-200 m-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                افزودن سوال به بانک سوالات مشترک شهرستان
              </h3>
              <p className="text-[11px] text-slate-500">
                طراحی و اشتراک‌گذاری آزمون با سایر همکاران و مدارس منطقه
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              عنوان سوال یا مبحث <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: ریشه‌های معادله درجه دو و تعیین علامت"
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              متن صورت سوال <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="متن کامل سوال را بنویسید..."
              value={qContent}
              onChange={(e) => setQContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block font-medium text-slate-600 mb-1">درس</label>
              <input
                type="text"
                value={qSubject}
                onChange={(e) => setQSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">پایه</label>
              <select
                value={qGrade}
                onChange={(e) => setQGrade(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
              >
                <option value="پایه هفتم">پایه هفتم</option>
                <option value="پایه هشتم">پایه هشتم</option>
                <option value="پایه نهم">پایه نهم</option>
                <option value="پایه دهم">پایه دهم</option>
                <option value="پایه یازدهم">پایه یازدهم</option>
                <option value="پایه دوازدهم">پایه دوازدهم</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">سطح سختی</label>
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
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
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
              >
                <option value="تستی">تستی چهارگزینه‌ای</option>
                <option value="تشریحی">تشریحی / حل مسئله</option>
              </select>
            </div>
          </div>

          {qType === 'تستی' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-semibold text-slate-700 block text-xs">گزینه‌های سوال:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="گزینه ۱"
                  value={qOption1}
                  onChange={(e) => setQOption1(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="گزینه ۲"
                  value={qOption2}
                  onChange={(e) => setQOption2(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="گزینه ۳"
                  value={qOption3}
                  onChange={(e) => setQOption3(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="گزینه ۴"
                  value={qOption4}
                  onChange={(e) => setQOption4(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              پاسخ صحیح یا کلید تشریحی
            </label>
            <input
              type="text"
              placeholder="پاسخ صحیح یا گزینه درست را بنویسید..."
              value={qCorrect}
              onChange={(e) => setQCorrect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors"
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
  );
};
