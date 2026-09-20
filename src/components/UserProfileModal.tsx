import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Smartphone,
  Building2,
  GraduationCap,
  BookOpen,
  Shield,
  Save,
  Check,
  Calendar,
  IdCard,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/persianUtils';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const {
    currentUser,
    currentRole,
    currentSchool,
    students,
    updateStudent,
    sendNotification
  } = useApp();

  // If user is a parent or student, get the corresponding student record
  const child = students.find((s) => s.id === 'std-1') || students[0];

  // Parent contact states
  const [parentBale, setParentBale] = useState(child.parentBaleAccount || '@rezaei_parent');
  const [parentPhone, setParentPhone] = useState(child.parentPhone || '09123456789');
  const [emergencyPhone, setEmergencyPhone] = useState(child.emergencyPhone || '02188776655');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveParentContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(child.id, {
      parentBaleAccount: parentBale.trim(),
      parentPhone: parentPhone.trim(),
      emergencyPhone: emergencyPhone.trim()
    });
    setSavedSuccess(true);
    sendNotification({
      recipientName: currentUser.name,
      recipientPhone: parentPhone.trim(),
      studentName: child.name,
      message: `ولی محترم؛ مشخصات ارتباطی و شناسه بله شما با موفقیت در سامانه هوشمند دانا به‌روزرسانی شد.`,
      type: 'general',
      platform: 'bale'
    });
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const getRoleTitle = () => {
    switch (currentRole) {
      case 'platform_admin':
        return 'مدیر کل پلتفرم شهرستان';
      case 'principal':
        return 'مدیر واحد آموزشی';
      case 'vice_principal':
        return 'معاون مدرسه';
      case 'teacher':
        return 'دبیر تخصصی';
      case 'student':
        return 'دانش‌آموز';
      case 'parent':
        return 'ولی دانش‌آموز';
      default:
        return 'کاربر سامانه';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto w-full max-w-full">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with avatar banner */}
        <div className="bg-linear-to-r from-teal-800 to-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/20 shrink-0`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{currentUser.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {getRoleTitle()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentSchool?.name || 'مرکز پایش مدارس'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* General User Identity Info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[11px]">شماره تماس ثبت‌شده:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {toPersianDigits(currentUser.phone)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">آموزشگاه فعال:</span>
              <span className="font-bold text-slate-800 truncate block">
                {currentSchool?.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">کد سازمانی آموزشگاه:</span>
              <span className="font-mono text-slate-700">
                {toPersianDigits(currentSchool?.code || '')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">سال تحصیلی:</span>
              <span className="font-mono text-teal-800 font-bold">
                {toPersianDigits('۱۴۰۵-۱۴۰۴')}
              </span>
            </div>
          </div>

          {/* PARENT SPECIFIC: Bale Messenger & Contact Settings */}
          {currentRole === 'parent' && (
            <div className="space-y-3 bg-teal-50/50 p-4 rounded-2xl border border-teal-200">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <h4 className="font-bold text-xs text-teal-950">
                    تنظیمات شناسه پیام‌رسان بله و تماس اولیا
                  </h4>
                </div>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold">
                  فرزند: {child.name}
                </span>
              </div>

              <form onSubmit={handleSaveParentContact} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    شناسه در پیام‌رسان بله (Bale ID):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={parentBale}
                      onChange={(e) => setParentBale(e.target.value)}
                      placeholder="@username یا شماره بله"
                      className="w-full text-xs p-2.5 pe-8 bg-white border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    اعلانات ورود، خروج و غیبت فرزند به صورت آنی به این شناسه در بله ارسال می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    شماره تلفن همراه اولیا (پیامک اضطراری):
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full text-xs p-2.5 pe-8 bg-white border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    تلفن ثابت یا شماره تماس اضطراری دوم:
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-left outline-none"
                  />
                </div>

                {savedSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs flex items-center gap-1.5 font-medium border border-emerald-300">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>مشخصات ارتباطی با موفقیت در سامانه ذخیره شد.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات تماس</span>
                </button>
              </form>
            </div>
          )}

          {/* STUDENT SPECIFIC: Details */}
          {currentRole === 'student' && (
            <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200 space-y-2 text-xs">
              <div className="font-bold text-cyan-950 flex items-center gap-1.5 border-b border-cyan-200 pb-2">
                <GraduationCap className="w-4 h-4 text-cyan-700" />
                <span>مشخصات پرونده تحصیلی دانش‌آموز</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>کد ملی: <span className="font-mono font-bold">{toPersianDigits(child.nationalCode)}</span></div>
                <div>شماره دانش‌آموزی: <span className="font-mono font-bold">{toPersianDigits(child.studentNumber)}</span></div>
                <div>پایه و رشته: <span className="font-bold">{child.grade} {child.fieldOfStudy}</span></div>
                <div>نام پدر: <span className="font-bold">{child.fatherName}</span></div>
              </div>
            </div>
          )}

          {/* TEACHER SPECIFIC: Subjects */}
          {currentRole === 'teacher' && (
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-blue-950 flex items-center gap-1.5 border-b border-blue-200 pb-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>دروس و کلاس‌های تحت تدریس</span>
              </div>
              <p className="text-slate-600 text-xs">
                دبیر رسمی دروس ریاضی، حسابان و هندسه در پایه‌های دهم و یازدهم دبیرستان.
              </p>
            </div>
          )}

          {/* PRINCIPAL & VP SPECIFIC */}
          {(currentRole === 'principal' || currentRole === 'vice_principal') && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>سطح دسترسی سازمانی</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                دارای دسترسی مدیریتی جهت تنظیم کلاس‌ها، نظارت بر دبیران، حضور و غیاب، صدور کارنامه‌ها و تفویض اختیارات.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
