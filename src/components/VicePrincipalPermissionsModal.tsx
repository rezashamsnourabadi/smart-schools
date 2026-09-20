import React, { useState } from 'react';
import {
  X,
  Shield,
  Check,
  Lock,
  Unlock,
  AlertCircle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VicePrincipalPermissions } from '../types';

interface VicePrincipalPermissionsModalProps {
  onClose: () => void;
}

export const VicePrincipalPermissionsModal: React.FC<VicePrincipalPermissionsModalProps> = ({
  onClose
}) => {
  const {
    vicePrincipals,
    currentSchoolId,
    updateVicePrincipalProfilePermissions,
    activeVicePrincipalId,
    setActiveVicePrincipalId
  } = useApp();

  const schoolVPs = vicePrincipals.filter((vp) => vp.schoolId === currentSchoolId || !vp.schoolId);
  const [selectedVPId, setSelectedVPId] = useState<string>(
    schoolVPs[0]?.id || activeVicePrincipalId || 'vp-1'
  );

  const selectedVP = vicePrincipals.find((vp) => vp.id === selectedVPId) || vicePrincipals[0];

  const handleToggle = (key: keyof VicePrincipalPermissions) => {
    if (!selectedVP) return;
    const currentVal = selectedVP.permissions[key];
    updateVicePrincipalProfilePermissions(selectedVP.id, {
      [key]: !currentVal
    });
  };

  const permissionItems: { key: keyof VicePrincipalPermissions; title: string; desc: string }[] = [
    {
      key: 'canManageAnnouncements',
      title: 'انتشار و مدیریت اطلاعیه‌ها، اخبار و رویدادها',
      desc: 'امکان ثبت اخبار مدرسه، گزارش تصویری رویدادها و ارسال اعلانات عمومی به اولیا و دانش‌آموزان'
    },
    {
      key: 'canManageSchedule',
      title: 'چیدمان و تغییر برنامه هفتگی',
      desc: 'امکان جابجایی ساعات کلاسی، تخصیص دروس، دبیران و ویرایش برنامه آموزشی پایه‌ها'
    },
    {
      key: 'canManageStudentsAndClasses',
      title: 'کلاس‌بندی، ثبت نام و مدیریت دانش‌آموزان',
      desc: 'امکان اضافه کردن دانش‌آموز (با اتصال خودکار پرونده)، انتقال بین کلاس‌ها، فارغ‌التحصیلی و انتقالی'
    },
    {
      key: 'canViewFullDossier',
      title: 'مشاهده پرونده جامع، سوابق تحصیلی و کارنامه‌ها',
      desc: 'دسترسی به شناسنامه سلامت، کارنامه‌های تحصیلی، معدل‌ها و سوابق سال‌های گذشته دانش‌آموزان'
    },
    {
      key: 'canLogDisciplinary',
      title: 'ثبت موارد انضباطی، تشویقی و غیبت‌ها',
      desc: 'امکان درج تشویقی‌های علمی، مسابقات، تذکرات انضباطی و ارسال خودکار پیامک و پیام بله به ولی'
    },
    {
      key: 'canManageFinances',
      title: 'امور مالی، شهریه و حسابداری آموزشگاه',
      desc: 'امکان مشاهده وضعیت بدهکاران، ثبت فیش و واریزی، اعمال تخفیف و ارسال پیامک یادآوری تسویه'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">تفکیک دسترسی معاونین مدرسه</h3>
              <p className="text-xs text-slate-400">تعیین اختیارات مجزا و مستقل برای هر معاون به تفکیک عنوان سازمانی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VP Selector Tabs */}
        <div className="p-3 sm:p-4 bg-slate-100 border-b border-slate-200 shrink-0">
          <p className="text-xs font-semibold text-slate-600 mb-2">معاون مورد نظر را جهت تعیین دسترسی انتخاب فرمایید:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {schoolVPs.map((vp) => {
              const isSelected = vp.id === selectedVPId;
              return (
                <button
                  key={vp.id}
                  onClick={() => {
                    setSelectedVPId(vp.id);
                    setActiveVicePrincipalId(vp.id);
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-white border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                      : 'bg-white/70 hover:bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${vp.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                    {vp.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate text-slate-900">{vp.name}</div>
                    <div className="text-[10px] text-teal-700 font-medium truncate flex items-center gap-1">
                      <Briefcase className="w-2.5 h-2.5" />
                      {vp.roleTitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 bg-slate-50 overflow-y-auto flex-1">
          {selectedVP && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  در حال تنظیم دسترسی‌های اختصاصی: <strong>{selectedVP.name}</strong> ({selectedVP.roleTitle})
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-teal-600 text-white rounded-full font-bold">
                فعال در سیستم
              </span>
            </div>
          )}

          <div className="space-y-2">
            {permissionItems.map((item) => {
              const isEnabled = selectedVP?.permissions?.[item.key] ?? false;
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'bg-white border-teal-300 shadow-2xs'
                      : 'bg-slate-100/70 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isEnabled ? (
                        <Unlock className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-bold ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
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
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            تغییرات به صورت آنی برای معاون انتخاب شده اعمال می‌گردد.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            تایید و ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};

