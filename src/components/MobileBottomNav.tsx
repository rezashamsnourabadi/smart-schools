import React from 'react';
import {
  Home,
  Users,
  Building2,
  Calendar,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Award,
  UserCheck,
  Shield,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface MobileBottomNavActionProps {
  onOpenHome?: () => void;
  onOpenStudents?: () => void;
  onOpenClasses?: () => void;
  onOpenSchedule?: () => void;
  onOpenPosts?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenGrades?: () => void;
  onOpenHomework?: () => void;
  onOpenProfile?: () => void;
  onOpenDossier?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavActionProps> = ({
  onOpenHome,
  onOpenStudents,
  onOpenClasses,
  onOpenSchedule,
  onOpenPosts,
  onOpenQuestionBank,
  onOpenGrades,
  onOpenHomework,
  onOpenProfile,
  onOpenDossier
}) => {
  const { currentRole } = useApp();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onOpenHome) onOpenHome();
  };

  const getNavItems = () => {
    switch (currentRole) {
      case 'principal':
      case 'vice_principal':
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          { id: 'students', label: 'دانش‌آموزان', icon: Users, onClick: onOpenStudents },
          { id: 'classes', label: 'کلاس‌بندی', icon: Building2, onClick: onOpenClasses },
          { id: 'schedule', label: 'برنامه هفتگی', icon: Calendar, onClick: onOpenSchedule },
          { id: 'posts', label: 'اخبار و رویداد', icon: Bell, onClick: onOpenPosts },
          { id: 'profile', label: 'پروفایل', icon: UserCheck, onClick: onOpenProfile }
        ];
      case 'teacher':
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          { id: 'grades', label: 'ثبت نمره', icon: ClipboardList, onClick: onOpenGrades },
          { id: 'homework', label: 'تکالیف', icon: BookOpen, onClick: onOpenHomework },
          { id: 'qbank', label: 'بانک سوال', icon: Award, onClick: onOpenQuestionBank },
          { id: 'profile', label: 'پروفایل', icon: UserCheck, onClick: onOpenProfile }
        ];
      case 'student':
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          { id: 'dossier', label: 'پرونده و نمرات', icon: GraduationCap, onClick: onOpenDossier },
          { id: 'qbank', label: 'بانک تست', icon: Award, onClick: onOpenQuestionBank },
          { id: 'profile', label: 'پروفایل', icon: UserCheck, onClick: onOpenProfile }
        ];
      case 'parent':
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          { id: 'dossier', label: 'کارنامه و انضباط', icon: GraduationCap, onClick: onOpenDossier },
          { id: 'profile', label: 'ارتباط و بله', icon: UserCheck, onClick: onOpenProfile }
        ];
      default:
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          { id: 'qbank', label: 'بانک سوالات', icon: Award, onClick: onOpenQuestionBank },
          { id: 'posts', label: 'اطلاعیه‌ها', icon: Bell, onClick: onOpenPosts },
          { id: 'profile', label: 'پروفایل', icon: UserCheck, onClick: onOpenProfile }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="نوار ابزار ناوبری موبایل"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-1.5 py-1 flex items-center justify-around select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={item.onClick}
            type="button"
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-600 hover:text-teal-700 active:bg-teal-50/70 transition-all min-h-[46px]"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-700 hover:text-teal-700 hover:bg-teal-100/50 transition-colors">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 whitespace-nowrap text-slate-700">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
