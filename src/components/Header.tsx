import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Building2,
  Bell,
  RotateCcw,
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

export const Header: React.FC = () => {
  const {
    currentRole,
    currentSchool,
    schools,
    setCurrentSchoolId,
    currentUser,
    notifications,
    resetAllData
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'platform_admin':
        return { label: 'مدیر کل پلتفرم شهرستان', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'principal':
        return { label: 'مدیر مدرسه', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'vice_principal':
        return { label: 'معاون آموزشی و انضباطی', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'teacher':
        return { label: 'معلم کلاس', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'student':
        return { label: 'دانش‌آموز', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'parent':
        return { label: 'اولیا دانش‌آموز', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'کاربر سامانه', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="main-header">
      {/* Top Notification / Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform identity */}
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  سامانه مدرسه هوشمند
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                  قطب مدارس شهرستان
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentRole === 'platform_admin'
                  ? 'مرکز پایش و مدیریت یکپارچه کلیه مدارس منطقه'
                  : currentSchool?.name || 'مدرسه هوشمند'}
              </p>
            </div>
          </div>

          {/* Center: School Switcher (for platform admin or multi-school test) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600 font-medium">مدرسه فعال:</span>
            <select
              id="school-select-header"
              aria-label="انتخاب مدرسه فعال"
              value={currentSchool?.id}
              onChange={(e) => setCurrentSchoolId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 border-0 focus:ring-0 cursor-pointer outline-none"
            >
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.type})
                </option>
              ))}
            </select>
          </div>

          {/* Left Actions: Date, SMS/Bale Bell, Profile, Reset */}
          <div className="flex items-center space-x-reverse space-x-3">
            {/* Live Date display */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>شنبه ۲۲ شهریور ۱۴۰۵</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>۰۸:۱۵</span>
            </div>

            {/* Simulated Bale / SMS notifications dropdown */}
            <div className="relative">
              <button
                id="notifications-toggle-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="تاریخچه پیام‌ها و اعلانات پیام‌رسان بله / پیامک به اولیا"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {toPersianDigits(notifications.length)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  id="notifications-flyout"
                  className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:left-0 top-16 sm:top-full sm:mt-2 max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      <span>پیام‌های خودکار مخابره شده به اولیا (بله / پیامک)</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{toPersianDigits(notifications.length)} پیام</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto px-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">پیامی ثبت نشده است</p>
                    ) : (
                      notifications.map((ntf) => (
                        <div key={ntf.id} className="py-2.5 px-2 hover:bg-slate-50 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{ntf.studentName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-teal-50 text-teal-700 font-medium">
                              ارسال با {ntf.platform}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                            {ntf.message}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>گیرنده: {ntf.recipientName}</span>
                            <span>{toPersianDigits(ntf.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reset sample data button */}
            <button
              id="reset-demo-data-btn"
              onClick={resetAllData}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="بازگردانی داده‌های پیش‌فرض نمونه"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Current Role badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleInfo.color}`}>
              {currentRole === 'platform_admin' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              <span>{roleInfo.label}</span>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pr-1">
              <div className={`w-8 h-8 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-right">
                <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500">{toPersianDigits(currentUser.phone)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
