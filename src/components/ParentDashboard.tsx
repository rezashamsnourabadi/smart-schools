import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Award,
  PhoneCall,
  Calendar,
  Building2,
  FileText,
  Smartphone,
  Megaphone,
  Settings,
  ChevronLeft,
  GraduationCap,
  Pin,
  CreditCard,
  Clock,
  Send,
  Lock
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits, formatPersianCurrency } from '../utils/persianUtils';
import { createInitialStudentFinancialSummary } from '../data/mockFinanceData';
import { Student } from '../types';
import { ParentPaymentModal } from './ParentPaymentModal';

interface Props {
  onOpenStudentDossier?: (student: Student) => void;
  onOpenProfileModal?: () => void;
}

export const ParentDashboard: React.FC<Props> = ({
  onOpenStudentDossier,
  onOpenProfileModal
}) => {
  const {
    currentSchool,
    currentUser,
    notifications,
    students,
    announcements,
    setSelectedStudentForDossier,
    openStudentDossier
  } = useApp();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Child info
  const child = students.find((s) => s.id === 'std-1') || students[0];

  // Check if there is any attendance alert for the child today
  const childNotifications = notifications.filter((n) => n.studentName.includes(child.name));

  // Announcements targeted to parents or all (pinned first)
  const parentAnnouncements = announcements
    .filter((a) => a.target === 'all' || a.target === 'parents')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleOpenChildDossier = (tab: 'profile' | 'finances' = 'profile') => {
    if (openStudentDossier) {
      openStudentDossier(child, tab);
    } else if (onOpenStudentDossier) {
      onOpenStudentDossier(child);
    } else {
      setSelectedStudentForDossier(child);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5" id="parent-dashboard-view">
      {/* Top Banner & Child Summary */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              سلام جناب {currentUser.name}
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
              پنل اولیای گرامی
            </span>
          </div>
          <p className="text-xs text-slate-500">
            فرزند شما: <strong>{child.name}</strong> • {child.grade} {child.fieldOfStudy} • {currentSchool?.name}
          </p>
        </div>

        {/* Live Attendance Status Pill & Dossier Link */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleOpenChildDossier}
            className="px-4 py-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده پرونده تحصیلی و کارنامه</span>
          </button>
        </div>
      </div>

      {/* Second Position Sponsor Ribbon */}
      <SponsorBannerCard audienceFilter="parents" variant="compact" />

      {/* Quick Status Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Attendance Today */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-800 font-bold block">حضور امروز در مدرسه</span>
            <span className="text-xs text-emerald-950 font-bold">
              حاضر در کلاس • ورود: {toPersianDigits('۰۷:۵۵')}
            </span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-indigo-800 font-bold block">معدل ترم گذشته</span>
            <span className="text-sm font-mono font-black text-indigo-950">
              {toPersianDigits('۱۹.۶۵')} (رتبه ممتاز)
            </span>
          </div>
        </div>

        {/* Bale Delivery Channel */}
        <div className="bg-teal-50/80 border border-teal-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-teal-800 font-bold block">شناسه متصل در بله</span>
              <span className="text-xs font-mono font-bold text-teal-950">
                {child.parentBaleAccount || '@rezaei_parent'}
              </span>
            </div>
          </div>
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="p-1.5 text-teal-700 hover:text-teal-900"
              title="تغییر مشخصات در پروفایل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Student Financial & Tuition Status Card */}
      {(() => {
        const childSummary = child.financialSummary || createInitialStudentFinancialSummary(child.id, child.name, child.grade, 'normal_partial');
        const isSettled = childSummary.remainingDebt <= 0;
        const isOverdue = childSummary.status === 'overdue';

        return (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 overflow-hidden" id="parent-tuition-summary-card">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 mt-0.5 sm:mt-0 shadow-2xs">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 break-words">
                    وضعیت شهریه و خدمات {child.name}
                  </h3>
                  {isSettled ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      تسویه کامل
                    </span>
                  ) : isOverdue ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 animate-pulse">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      دارای قسط معوقه
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-amber-600" />
                      مانده بدهی جاری
                    </span>
                  )}
                </div>

                {/* Mobile-optimized 3-box summary */}
                <div className="grid grid-cols-3 gap-2 mt-2.5 sm:hidden">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">صورتحساب</span>
                    <span className="text-[11px] font-bold font-mono text-slate-700 block mt-0.5 truncate">
                      {formatPersianCurrency(childSummary.totalBilled)}
                    </span>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-700 block">پرداختی</span>
                    <span className="text-[11px] font-bold font-mono text-emerald-800 block mt-0.5 truncate">
                      {formatPersianCurrency(childSummary.totalPaid)}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border text-center ${isSettled ? 'bg-emerald-50/60 border-emerald-100' : 'bg-rose-50/70 border-rose-100'}`}>
                    <span className={`text-[10px] block ${isSettled ? 'text-emerald-700' : 'text-rose-700'}`}>مانده بدهی</span>
                    <span className={`text-[11px] font-bold font-mono block mt-0.5 truncate ${isSettled ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {formatPersianCurrency(childSummary.remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* Desktop inline summary */}
                <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>کل صورتحساب: <strong>{formatPersianCurrency(childSummary.totalBilled)}</strong></span>
                  <span>•</span>
                  <span>پرداختی: <strong className="text-emerald-700">{formatPersianCurrency(childSummary.totalPaid)}</strong></span>
                  <span>•</span>
                  <span>
                    مانده بدهی: <strong className={isSettled ? 'text-emerald-700' : 'text-rose-700'}>
                      {formatPersianCurrency(childSummary.remainingDebt)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons: mobile touch-friendly */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <button
                type="button"
                id="btn-parent-view-installments"
                onClick={() => handleOpenChildDossier('finances')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>ریز اقساط و سوابق</span>
              </button>

              {!isSettled && (
                <button
                  type="button"
                  id="btn-parent-direct-pay"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>پرداخت آنلاین شهریه</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Messages from School (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  پیام‌های خودکار دریافتی از مدرسه (بله و پیامک)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {toPersianDigits(childNotifications.length)} پیام
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {childNotifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  هیچ پیام یا اخطار انضباطی برای فرزند شما ثبت نشده است.
                </div>
              ) : (
                childNotifications.map((ntf) => (
                  <div
                    key={ntf.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {ntf.type === 'attendance_absent' ? '🚨 اعلام غیبت در کلاس' : 'اطلاعیه مدرسه'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold">
                        ارسال شده با {ntf.platform}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {ntf.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>شناسه بله: {child.parentBaleAccount}</span>
                      <span>{toPersianDigits(ntf.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Academic Progress & Quick Contacts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">آخرین نمرات ثبت‌شده</h3>
              </div>
              <span className="text-[11px] text-slate-500">پاییز ۱۴۰۴</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">هندسه ۱ (آزمون ماهانه مهر):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{toPersianDigits('۱۹.۵')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">فیزیک ۱ (کوییز کلاسی):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{toPersianDigits('۲۰')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">نمره انضباط تا امروز:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">{toPersianDigits('۲۰')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="font-bold text-[11px] text-slate-700 block">ارتباط تلفنی با کادر مدرسه:</span>
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl">
                <span>تلفن دفتر آموزشگاه: {toPersianDigits(currentSchool?.phone || '')}</span>
                <a
                  href={`tel:${currentSchool?.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>تماس</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements for Parents */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">
              اطلاعیه‌ها و بخشنامه‌های عمومی آموزشگاه برای اولیا
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">
            {toPersianDigits(parentAnnouncements.length)} اطلاعیه
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {parentAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-3.5 rounded-2xl border transition-colors space-y-2 text-xs ${
                ann.isPinned
                  ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {ann.isPinned && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                      <span>پین</span>
                    </span>
                  )}
                  <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits(ann.date)}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                <span>مرجع صادرکننده: {ann.sender}</span>
                {ann.priority === 'urgent' && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">فوری</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Parent Payment Modal */}
      <ParentPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={child}
      />
    </div>
  );
};
