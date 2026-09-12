import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  ShieldAlert,
  UserCog,
  FileCheck2,
  GraduationCap,
  Users2,
  Sparkles
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  hoverColor: string;
}

const ROLES_LIST: RoleOption[] = [
  {
    role: 'platform_admin',
    title: 'مدیر کل پلتفرم',
    subtitle: 'نظارت کلیه مدارس، تبلیغات و بانک سوالات',
    icon: ShieldAlert,
    badgeColor: 'bg-rose-600 text-white',
    hoverColor: 'hover:border-rose-300 hover:bg-rose-50/50'
  },
  {
    role: 'principal',
    title: 'مدیر مدرسه',
    subtitle: 'آمار زنده، کادر آموزشی، کلاس‌ها و بخشنامه‌ها',
    icon: UserCog,
    badgeColor: 'bg-indigo-600 text-white',
    hoverColor: 'hover:border-indigo-300 hover:bg-indigo-50/50'
  },
  {
    role: 'vice_principal',
    title: 'معاون مدرسه',
    subtitle: 'رادار انضباطی، پیگیری غایبان و پیام به اولیا',
    icon: FileCheck2,
    badgeColor: 'bg-teal-600 text-white',
    hoverColor: 'hover:border-teal-300 hover:bg-teal-50/50'
  },
  {
    role: 'teacher',
    title: 'معلم (تمرکز ویژه)',
    subtitle: 'حضور و غیاب فوری کلاس جاری با ۱ کلیک',
    icon: Users2,
    badgeColor: 'bg-blue-600 text-white',
    hoverColor: 'hover:border-blue-300 hover:bg-blue-50/50'
  },
  {
    role: 'student',
    title: 'دانش‌آموز',
    subtitle: 'برنامه هفتگی، تکالیف، نمرات و تمرین سوالات',
    icon: GraduationCap,
    badgeColor: 'bg-cyan-600 text-white',
    hoverColor: 'hover:border-cyan-300 hover:bg-cyan-50/50'
  },
  {
    role: 'parent',
    title: 'اولیا دانش‌آموز',
    subtitle: 'اطلاع فوری از وضعیت حضور، کارنامه و بنر مفید',
    icon: Sparkles,
    badgeColor: 'bg-purple-600 text-white',
    hoverColor: 'hover:border-purple-300 hover:bg-purple-50/50'
  }
];

export const RoleQuickSwitch: React.FC = () => {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <section className="bg-slate-900 text-white py-3 border-b border-slate-800" id="role-quick-switcher">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold">
              ★
            </span>
            <div>
              <span className="text-xs font-bold text-slate-200">سوئیچ سریع نقش کاربری (برای بررسی سناریوهای پلتفرم):</span>
              <p className="text-[11px] text-slate-400">
                هر نقش نمای اختصاصی خود را در هاب شهرستان تجربه می‌کند.
              </p>
            </div>
          </div>

          {/* Quick Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
            {ROLES_LIST.map((item) => {
              const Icon = item.icon;
              const isActive = currentRole === item.role;
              return (
                <button
                  key={item.role}
                  id={`role-switch-${item.role}`}
                  onClick={() => setCurrentRole(item.role)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-right transition-all text-xs font-medium border ${
                    isActive
                      ? `${item.badgeColor} border-transparent shadow-sm ring-2 ring-white/20 font-bold scale-[1.02]`
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <div className="truncate">{item.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
