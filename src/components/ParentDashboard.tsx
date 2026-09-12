import React, { useState } from 'react';
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
  Building2,
  FileText,
  Eye,
  GraduationCap,
  Settings,
  Save,
  Megaphone,
  Smartphone,
  Phone,
  Check
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits } from '../utils/persianUtils';
import { Student } from '../types';

interface Props {
  onOpenStudentDossier?: (student: Student) => void;
}

export const ParentDashboard: React.FC<Props> = ({ onOpenStudentDossier }) => {
  const {
    currentSchool,
    currentUser,
    notifications,
    students,
    updateStudent,
    announcements,
    sendNotification,
    setSelectedStudentForDossier
  } = useApp();

  // Child info
  const child = students.find((s) => s.id === 'std-1') || students[0];

  // Contact settings state
  const [baleAccount, setBaleAccount] = useState(child.parentBaleAccount || '@rezaei_parent');
  const [phone, setPhone] = useState(child.parentPhone || '09123456789');
  const [emergency, setEmergency] = useState(child.emergencyPhone || '02188776655');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Check if there is any attendance alert for the child today
  const childNotifications = notifications.filter((n) => n.studentName.includes(child.name));

  // Announcements targeted to parents or all
  const parentAnnouncements = announcements.filter(
    (a) => a.target === 'all' || a.target === 'parents'
  );

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(child.id, {
      parentBaleAccount: baleAccount.trim(),
      parentPhone: phone.trim(),
      emergencyPhone: emergency.trim()
    });
    setSavedSuccess(true);
    sendNotification({
      recipientName: currentUser.name,
      recipientPhone: phone.trim(),
      studentName: child.name,
      message: `ولی محترم؛ مشخصات ارتباطی شما (شناسه بله: ${baleAccount.trim()} و شماره تماس) با موفقیت در سامانه هوشمند آموزشگاه به‌روزرسانی شد.`,
      type: 'general',
      platform: 'bale'
    });
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleOpenChildDossier = () => {
    if (onOpenStudentDossier) {
      onOpenStudentDossier(child);
    } else {
      setSelectedStudentForDossier(child);
    }
  };

  return (
    <div className="space-y-6" id="parent-dashboard-view">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              سلام جناب {currentUser.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
              پنل اولیای گرامی
            </span>
          </div>
          <p className="text-xs text-slate-500">
            پیگیری وضعیت تحصیلی و انضباطی فرزند شما: <strong>{child.name}</strong> • {currentSchool?.name}
          </p>
        </div>

        {/* Live Attendance Status Pill & Dossier Link */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenChildDossier}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>مشاهده پرونده کامل و کارنامه نوبت اول/دوم</span>
          </button>

          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-[11px] text-emerald-800 font-bold">وضعیت حضور امروز:</div>
              <div className="text-xs text-emerald-700 font-medium">
                حاضر در کلاس زنگ اول (ریاضی ۱) • ساعت ورود: {toPersianDigits('۰۷:۵۵')}
              </div>
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
              <span className="text-xs text-slate-500 font-mono">حساب بله: {child.parentBaleAccount}</span>
            </div>

            <div className="space-y-3">
              {childNotifications.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed text-center">
                  تا این لحظه هیچ پیام اخطار یا غیبتی برای شما صادر نشده است و فرزندتان بدون تاخیر در مدرسه حضور دارد.
                </div>
              ) : (
                childNotifications.map((ntf) => (
                  <div
                    key={ntf.id}
                    className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1.5 text-xs text-right"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900">
                        پیام خودکار سامانه هوشمند مدرسه ({ntf.platform})
                      </span>
                      <span className="text-[10px] text-teal-700 font-mono">{toPersianDigits(ntf.timestamp)}</span>
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
                  <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits('۱۴۰۵/۰۶/۲۰')}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  ولی محترم دانش‌آموز {child.name}؛ سال تحصیلی جدید در {currentSchool?.name} با ساماندهی هوشمند کلاس‌ها آغاز گردید. گزارش حضور و غیاب روزانه، کارنامه‌ها و وضعیت انضباطی از طریق همین درگاه برای شما در دسترس است.
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
                <Award className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  خلاصه وضعیت تحصیلی {child.name}
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">سطح عملکرد: بسیار عالی</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">ریاضی ۱ (پرسش کلاسی استاد کاظمی):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{toPersianDigits('۱۹.۵')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">فیزیک ۱ (آزمون کوییز دوره اول):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{toPersianDigits('۲۰')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 flex justify-between items-center">
                <span className="text-slate-700">نمره انضباط تا امروز:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">{toPersianDigits('۲۰')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="font-bold text-[11px] text-slate-700 block">ارتباط سریع با کادر دبیرستان:</span>
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <span>تلفن دفتر دبیرستان: {toPersianDigits(currentSchool?.phone || '')}</span>
                <a
                  href={`tel:${currentSchool?.phone}`}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>تماس</span>
                </a>
              </div>
            </div>
          </div>

          {/* Parent Communication & Bale Profile Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  تنظیمات شناسه بله و تماس اولیا
                </h3>
              </div>
              <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                دریافت اعلانات هوشمند
              </span>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  شناسه پیام‌رسان بله (Bale ID):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={baleAccount}
                    onChange={(e) => setBaleAccount(e.target.value)}
                    placeholder="@username یا شماره بله"
                    className="w-full text-xs p-2.5 pe-8 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  جهت ارسال خودکار وضعیت ورود، خروج و غیبت فرزند به پیام‌رسان بله شما
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  شماره تلفن همراه (پیامک سراسری):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 pe-8 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  تلفن تماس ضروری منزل / محل کار:
                </label>
                <input
                  type="tel"
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none"
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>اطلاعات تماس و پیام‌رسان بله با موفقیت ذخیره شد.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تنظیمات ارتباطی اولیا</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Announcements for Parents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">
              اطلاعیه‌ها و اخبار عمومی مدرسه برای اولیا
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {toPersianDigits(parentAnnouncements.length)} اطلاعیه ثبت‌شده
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {parentAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{toPersianDigits(ann.date)}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                <span>مرجع صادرکننده: {ann.sender}</span>
                {ann.priority === 'urgent' && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm">فوری</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Non-intrusive Sponsor Banner for Parent */}
      <SponsorBannerCard audienceFilter="parents" />
    </div>
  );
};
