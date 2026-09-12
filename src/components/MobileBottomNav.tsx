import React from 'react';
import {
  Home,
  Users,
  Calendar,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Award,
  Layers,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/persianUtils';

interface MobileBottomNavProps {
  onOpenQuickSwitch: () => void;
  onOpenQuestionBank?: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenQuickSwitch,
  onOpenQuestionBank,
  activeView,
  setActiveView
}) => {
  const { currentRole, notifications } = useApp();

  const getNavItems = () => {
    switch (currentRole) {
      case 'principal':
      case 'vice_principal':
        return [
          { id: 'overview', label: 'میز کار', icon: Home },
          { id: 'students', label: 'دانش‌آموزان', icon: Users },
          { id: 'schedule', label: 'برنامه هفتگی', icon: Calendar },
          { id: 'announcements', label: 'رویداد و خبر', icon: Bell },
          { id: 'roleswitch', label: 'تغییر نقش', icon: Layers, isAction: true }
        ];
      case 'teacher':
        return [
          { id: 'attendance', label: 'کلاس و حضور', icon: Home },
          { id: 'homework', label: 'تکالیف', icon: BookOpen },
          { id: 'grades', label: 'ثبت نمرات', icon: ClipboardList },
          { id: 'qbank', label: 'بانک سوال', icon: Award, isAction: true },
          { id: 'roleswitch', label: 'تغییر نقش', icon: Layers, isAction: true }
        ];
      case 'student':
        return [
          { id: 'schedule', label: 'برنامه امروز', icon: Calendar },
          { id: 'homework', label: 'تکالیف من', icon: BookOpen },
          { id: 'reportCard', label: 'کارنامه', icon: GraduationCap },
          { id: 'profile', label: 'پرونده من', icon: Users },
          { id: 'roleswitch', label: 'تغییر نقش', icon: Layers, isAction: true }
        ];
      case 'parent':
        return [
          { id: 'childOverview', label: 'وضعیت فرزند', icon: Home },
          { id: 'attendanceLogs', label: 'حضور و غیاب', icon: ClipboardList },
          { id: 'reportCard', label: 'کارنامه', icon: GraduationCap },
          { id: 'editContact', label: 'مشخصات تماس', icon: Users },
          { id: 'roleswitch', label: 'تغییر نقش', icon: Layers, isAction: true }
        ];
      default:
        return [
          { id: 'schools', label: 'مدارس منطقه', icon: Home },
          { id: 'sponsors', label: 'حامیان و بنر', icon: BookOpen },
          { id: 'qbank', label: 'بانک سوال', icon: Award, isAction: true },
          { id: 'roleswitch', label: 'تغییر نقش', icon: Layers, isAction: true }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav 
      aria-label="ناوبری اصلی تلفن همراه"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        const handleClick = () => {
          if (item.id === 'roleswitch') {
            onOpenQuickSwitch();
          } else if (item.id === 'qbank' && onOpenQuestionBank) {
            onOpenQuestionBank();
          } else {
            setActiveView(item.id);
          }
        };

        return (
          <button
            key={item.id}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-colors ${
              isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
