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
  MessageSquare,
  ChevronDown,
  Sparkles,
  Settings
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

interface HeaderProps {
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfileModal }) => {
  const {
    currentRole,
    currentSchool,
    schools,
    setCurrentSchoolId,
    currentUser,
    notifications,
    resetAllData,
    activeAcademicYear,
    activeTerm,
    isViewingArchivedYear
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBrandName, setSelectedBrandName] = useState<'دانا' | 'رایان' | 'پژواک'>('دانا');
  const [showBrandPicker, setShowBrandPicker] = useState(false);

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'platform_admin':
        return { label: 'مدیر کل منطقه', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'principal':
        return { label: 'مدیر مدرسه', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'vice_principal':
        return { label: 'معاون مدرسه', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'teacher':
        return { label: 'دبیر کلاس', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'student':
        return { label: 'دانش‌آموز', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'parent':
        return { label: 'اولیا دانش‌آموز', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'کاربر سامانه', color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Logo & Platform identity (Short, Elegant, 3 Short Name options) */}
          <div className="flex items-center space-x-reverse space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowBrandPicker(!showBrandPicker)}
                  className="font-black text-slate-900 text-base sm:text-lg tracking-tight hover:text-teal-700 transition-colors flex items-center gap-1"
                  title="انتخاب نام کوتاه سامانه (دانا، رایان، پژواک)"
                >
                  <span>{selectedBrandName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <span className="hidden sm:inline-block text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80">
                  سامانه هوشمند مدارس
                </span>
              </div>

              {/* Quick Brand Switcher Popup (3 Short Names) */}
              {showBrandPicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-48 z-50 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-100">
                    انتخاب نام سامانه:
                  </div>
                  {(['دانا', 'رایان', 'پژواک'] as const).map((brand) => (
                    <button
                      key={brand}
                      onClick={() => {
                        setSelectedBrandName(brand);
                        setShowBrandPicker(false);
                      }}
                      className={`w-full text-right px-3 py-1.5 rounded-xl font-bold flex items-center justify-between transition-colors ${
                        selectedBrandName === brand
                          ? 'bg-teal-50 text-teal-800'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{brand}</span>
                      {selectedBrandName === brand && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-[200px] md:max-w-xs">
                {currentRole === 'platform_admin'
                  ? 'مدیریت و پایش مدارس منطقه'
                  : currentSchool?.name || 'مدرسه هوشمند'}
              </p>
            </div>
          </div>

          {/* Center: School Switcher */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
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
          <div className="flex items-center space-x-reverse space-x-2 sm:space-x-3">
            {/* Academic Year Badge */}
            <div
              className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-bold ${
                isViewingArchivedYear
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-teal-50/80 text-teal-900 border-teal-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>سال {toPersianDigits(activeAcademicYear?.title || '')}</span>
              <span className="text-[10px] font-normal text-slate-500">
                ({activeTerm?.title.split(' ')[0]} {activeTerm?.title.split(' ')[1] || ''})
              </span>
            </div>

            {/* Live Date display */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
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
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
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
                  className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:left-0 top-16 sm:top-full sm:mt-2 max-w-sm sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in"
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      <span>پیام‌های ارسال شده به اولیا (بله / پیامک)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono font-bold">
                      {toPersianDigits(notifications.length)} پیام
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto px-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">پیامی ثبت نشده است</p>
                    ) : (
                      notifications.map((ntf) => (
                        <div key={ntf.id} className="py-2.5 px-2 hover:bg-slate-50 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{ntf.studentName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-medium">
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
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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

            {/* Profile Avatar & Interactive Access Button (Opens UserProfileModal) */}
            <button
              id="header-user-profile-btn"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-right group cursor-pointer"
              title="مشاهده اطلاعات کاربری و ویرایش مشخصات ارتباطی"
            >
              <div
                className={`w-8 h-8 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 group-hover:scale-105 transition-transform`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Settings className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {toPersianDigits(currentUser.phone)}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
