import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Award,
  PhoneCall,
  Calendar,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';

export const ParentDashboard: React.FC = () => {
  const { currentSchool, currentUser, notifications, students } = useApp();

  // Child info
  const child = students.find((s) => s.id === 'std-1') || students[0];

  // Check if there is any attendance alert for the child today
  const childNotifications = notifications.filter((n) => n.studentName.includes(child.name));

  return (
    <div className="space-y-6" id="parent-dashboard-view">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              سلام جناب {currentUser.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              پنل اولیای گرامی
            </span>
          </div>
          <p className="text-xs text-slate-500">
            پیگیری وضعیت تحصیلی و انضباطی فرزند شما: <strong>{child.name}</strong> • {currentSchool?.name}
          </p>
        </div>

        {/* Live Attendance Status Pill */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-right">
            <div className="text-[11px] text-emerald-800 font-bold">وضعیت حضور امروز:</div>
            <div className="text-xs text-emerald-700 font-medium">
              حاضر در کلاس زنگ اول (ریاضی ۱) • ساعت ورود: ۰۷:۵۵
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): SMS & Bale Notifications history */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  پیام‌های دریافتی از مدرسه (پیام‌رسان بله و پیامک)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">حساب بله: {child.parentBaleAccount}</span>
            </div>

            <div className="space-y-3">
              {childNotifications.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed text-center">
                  تا این لحظه پیام غیبتی برای شما صادر نشده است و فرزندتان بدون تاخیر در مدرسه حضور دارد.
                </div>
              ) : (
                childNotifications.map((ntf) => (
                  <div
                    key={ntf.id}
                    className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1.5 text-xs text-right"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900">
                        پیام خودکار سامانه مدرسه ({ntf.platform})
                      </span>
                      <span className="text-[10px] text-teal-700 font-mono">{ntf.timestamp}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{ntf.message}</p>
                  </div>
                ))
              )}

              {/* Sample Welcome Message */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs text-right">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    اطلاعیه شروع سال تحصیلی (پیام‌رسان بله)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">۱۴۰۵/۰۶/۲۰</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  ولی محترم دانش‌آموز آرین احمدی؛ سال تحصیلی جدید در دبیرستان امام صادق (ع) با ساماندهی هوشمند کلاس‌ها آغاز گردید. گزارش حضور و غیاب روزانه از طریق همین درگاه برای شما ارسال خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Academic snapshot & School Contacts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  وضعیت تحصیلی آرین
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600">سطح عملکرد: عالی</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-600">ریاضی ۱ (پرسش کلاسی استاد کاظمی):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">۱۹.۵</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-600">فیزیک ۱ (آزمون کوییز):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">۲۰</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-600">نمره انضباط تا امروز:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">۲۰</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="font-bold text-[11px] text-slate-700 block">ارتباط سریع با کادر دبیرستان:</span>
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <span>تلفن دفتر دبیرستان: {currentSchool?.phone}</span>
                <a
                  href={`tel:${currentSchool?.phone}`}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>تماس</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Non-intrusive Sponsor Banner for Parent (Health checkup or educational books) */}
      <SponsorBannerCard audienceFilter="parents" />
    </div>
  );
};
