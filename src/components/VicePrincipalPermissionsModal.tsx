import React from 'react';
import {
  X,
  Shield,
  Check,
  Lock,
  Unlock,
  AlertCircle,
  Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface VicePrincipalPermissionsModalProps {
  onClose: () => void;
}

export const VicePrincipalPermissionsModal: React.FC<VicePrincipalPermissionsModalProps> = ({
  onClose
}) => {
  const { vicePrincipalPermissions, updateVicePrincipalPermissions } = useApp();

  const handleToggle = (key: keyof typeof vicePrincipalPermissions) => {
    updateVicePrincipalPermissions({
      [key]: !vicePrincipalPermissions[key]
    });
  };

  const permissionItems = [
    {
      key: 'canManageAnnouncements' as const,
      title: 'انتشار و مدیریت اطلاعیه‌ها، اخبار و رویدادها',
      desc: 'اجازه درج اخبار جدید مدرسه، گزارش رویدادها و ارسال اعلانات عمومی به اولیا و دانش‌آموزان'
    },
    {
      key: 'canManageSchedule' as const,
      title: 'چیدمان و تغییر برنامه هفتگی',
      desc: 'اجازه جابجایی ساعات کلاسی، تخصیص دروس و ویرایش برنامه آموزشی پایه‌ها'
    },
    {
      key: 'canManageClassesAndStudents' as const,
      title: 'کلاس‌بندی و مدیریت دانش‌آموزان',
      desc: 'امکان اضافه یا کم کردن دانش‌آموز به مدرسه، انتقال بین کلاس‌ها و ایجاد کلاس جدید'
    },
    {
      key: 'canManageGradesAndDossiers' as const,
      title: 'مشاهده پرونده کامل، سوابق و کارنامه‌ها',
      desc: 'دسترسی به شناسنامه، کارنامه‌های تحصیلی، سوابق سال‌های گذشته و معدل‌های دانش‌آموز'
    },
    {
      key: 'canManageDiscipline' as const,
      title: 'ثبت موارد انضباطی، تشویقی و تقدیرنامه‌ها',
      desc: 'اجازه درج تشویقی‌های آموزشی، مسابقات علمی، تذکرات انضباطی و ثبت تاخیرها'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">کنترل دسترسی‌های معاون مدرسه</h3>
              <p className="text-xs text-slate-400">تنظیم اختیارات اجرایی، آموزشی و انضباطی توسط مدیر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 bg-slate-50 overflow-y-auto">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              هر تغییری در این بخش، بلافاصله در پنل معاونت آموزشی و اجرایی اعمال شده و دکمه‌ها و منوهای مربوطه فعال یا غیرفعال می‌گردند.
            </span>
          </div>

          <div className="space-y-2">
            {permissionItems.map((item) => {
              const isEnabled = vicePrincipalPermissions[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'bg-white border-teal-300 shadow-2xs'
                      : 'bg-slate-100/60 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isEnabled ? (
                        <Unlock className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-bold ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pr-6">
                      {item.desc}
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isEnabled ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {isEnabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
