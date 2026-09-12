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
  ChevronLeft
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';

interface Props {
  onOpenQuestionBank: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ onOpenQuestionBank }) => {
  const { currentSchool, currentUser, schedule, questionBank } = useApp();

  // Pick a sample practice question for the student
  const sampleQuestion = questionBank[0];
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

  const handleTestAnswer = (opt: string) => {
    setSelectedOption(opt);
    setIsAnswerSubmitted(true);
  };

  return (
    <div className="space-y-6" id="student-dashboard-view">
      {/* Top Greeting Card */}
      <div className="bg-linear-to-r from-teal-800 to-cyan-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
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
              کلاس دهم ریاضی - الف • {currentSchool?.name}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-teal-200 font-medium">وضعیت حضور امروز شما:</div>
              <div className="text-sm font-bold text-white">حاضر در کلاس درس</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Today's Schedule & Recent Grades */}
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
                  ۰۸:۰۰ - ۰۹:۳۰
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs opacity-85">
                <div>
                  <div className="font-bold text-slate-900">زنگ دوم: زبان انگلیسی</div>
                  <p className="text-slate-500 mt-0.5">دبیر: آقای حسنی • Lesson 1</p>
                </div>
                <span className="font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  ۰۹:۴۵ - ۱۱:۱۵
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs opacity-85">
                <div>
                  <div className="font-bold text-slate-900">زنگ سوم: فیزیک ۱</div>
                  <p className="text-slate-500 mt-0.5">دبیر: مهندس نوری • اندازه‌گیری و چگالی</p>
                </div>
                <span className="font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  ۱۱:۳۰ - ۱۲:۴۵
                </span>
              </div>
            </div>
          </div>

          {/* Academic Report / Recent Grades */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  آخرین نمرات و بازخوردهای کلاسی
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">معدل مستمر: ۱۹.۶</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-500">ریاضی ۱ (پرسش کلاسی)</div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">۱۹.۵</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">بسیار عالی</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-500">فیزیک ۱ (آزمون کوتاه)</div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">۲۰</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">نمره کامل</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-500">انضباط و حضور</div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">۲۰</div>
                <div className="text-[10px] text-teal-600 font-semibold mt-0.5">بدون تاخیر</div>
              </div>
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
              className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>مشاهده سایر نمونه سوالات درس‌های پایه دهم</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Non-intrusive Educational/Cultural Sponsor Spot for Student */}
      <SponsorBannerCard audienceFilter="students" />
    </div>
  );
};
