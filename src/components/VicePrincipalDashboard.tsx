import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileCheck2,
  Clock,
  UserX,
  PhoneCall,
  Send,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';

export const VicePrincipalDashboard: React.FC = () => {
  const { currentSchool, students, attendanceSessions, notifications } = useApp();

  // Find all attendance records today
  const todaySessions = attendanceSessions.filter(
    (s) => s.schoolId === currentSchool?.id && s.date === '۱۴۰۵/۰۶/۲۲'
  );

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentForNote, setSelectedStudentForNote] = useState('');
  const [disciplinaryType, setDisciplinaryType] = useState<'تشویقی' | 'انضباطی' | 'تاخیر'>('تشویقی');
  const [disciplinaryNote, setDisciplinaryNote] = useState('');
  const [disciplinaryLogs, setDisciplinaryLogs] = useState<{
    id: string;
    studentName: string;
    type: 'تشویقی' | 'انضباطی' | 'تاخیر';
    note: string;
    date: string;
  }[]>([
    {
      id: 'd-1',
      studentName: 'آرین احمدی',
      type: 'تشویقی',
      note: 'کسب رتبه برتر در پرسش کلاسی ریاضی ۱ و پاسخگویی خلاقانه',
      date: '۱۴۰۵/۰۶/۲۲'
    },
    {
      id: 'd-2',
      studentName: 'دانیال کریمی',
      type: 'تاخیر',
      note: 'تاخیر ۱۰ دقیقه‌ای در زنگ اول با موجه‌سازی تلفنی ولی',
      date: '۱۴۰۵/۰۶/۲۲'
    }
  ]);

  const handleAddDisciplinaryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForNote || !disciplinaryNote.trim()) return;

    setDisciplinaryLogs([
      {
        id: `d-${Date.now()}`,
        studentName: selectedStudentForNote,
        type: disciplinaryType,
        note: disciplinaryNote,
        date: '۱۴۰۵/۰۶/۲۲'
      },
      ...disciplinaryLogs
    ]);

    setSelectedStudentForNote('');
    setDisciplinaryNote('');
  };

  return (
    <div className="space-y-6" id="vice-principal-view">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              میز کار معاونت آموزشی و انضباطی
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
              {currentSchool?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پیگیری غیبت‌های زنگ‌ها، ارتباط فوری با اولیا، ثبت موارد انضباطی و تشویقی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>امروز: شنبه ۲۲ شهریور ۱۴۰۵</span>
          </span>
        </div>
      </div>

      {/* Two columns: 1. Absent Radar & Notification history, 2. Disciplinary logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (8 cols): Absentees & Message Dispatch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  رادار غیبت‌ها و تاخیرهای ثبت‌شده امروز مدرسه
                </h3>
              </div>
              <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                پیگیری بلادرنگ
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">غیبتی در زنگ‌های امروز ثبت نشده است.</p>
              ) : (
                notifications.map((ntf) => (
                  <div key={ntf.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ntf.studentName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        تحویل داده شده از طریق پیام‌رسان {ntf.platform}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                      {ntf.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>تماس اولیا: {ntf.recipientPhone}</span>
                      <span>ساعت ارسال: {ntf.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Disciplinary Note Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">
                ثبت تشویق یا تذکر انضباطی
              </h3>
            </div>

            <form onSubmit={handleAddDisciplinaryNote} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">انتخاب دانش‌آموز</label>
                <select
                  required
                  value={selectedStudentForNote}
                  onChange={(e) => setSelectedStudentForNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- انتخاب دانش‌آموز --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name} ({st.parentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع ارزیابی</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisciplinaryType('تشویقی')}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      disciplinaryType === 'تشویقی'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    تشویقی (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisciplinaryType('تاخیر')}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      disciplinaryType === 'تاخیر'
                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    تاخیر ورود
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisciplinaryType('انضباطی')}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      disciplinaryType === 'انضباطی'
                        ? 'bg-rose-50 border-rose-400 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    تذکر (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شرح عملکرد یا تذکر</label>
                <textarea
                  required
                  rows={2}
                  placeholder="توضیح کوتاه جهت ثبت در سوابق..."
                  value={disciplinaryNote}
                  onChange={(e) => setDisciplinaryNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs"
              >
                ثبت در پرونده الکترونیک
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-[11px] text-slate-700 block">آخرین سوابق ثبت‌شده:</span>
              {disciplinaryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.studentName}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                        log.type === 'تشویقی'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.type === 'تاخیر'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.type}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{log.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SponsorBannerCard audienceFilter="teachers" />
    </div>
  );
};
