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
  const { currentRole, canManageSchool, setActiveMobileTab } = useApp();

  const handleScrollTop = () => {
    if(currentRole==='student'||currentRole==='teacher')setActiveMobileTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onOpenHome) onOpenHome();
  };

  if(currentRole==='student')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار دانش‌آموز" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'خانه',icon:Home,onClick:handleScrollTop},{id:'dossier',label:'پرونده من',icon:GraduationCap,onClick:onOpenDossier},{id:'qbank',label:'بانک سؤال',icon:BookOpen,onClick:onOpenQuestionBank},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[10px] font-bold transition-colors ${id==='home'?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  if(currentRole==='teacher')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار دبیر" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'میز کار',icon:Home,onClick:handleScrollTop},{id:'grades',label:'نمرات',icon:ClipboardList,onClick:onOpenGrades},{id:'homework',label:'تکالیف',icon:BookOpen,onClick:onOpenHomework},{id:'qbank',label:'بانک سؤال',icon:Award,onClick:onOpenQuestionBank},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[9px] font-bold transition-colors ${id==='home'?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  const getNavItems = () => {
    switch (currentRole) {
      case 'principal':
      case 'vice_principal':
        return [
          { id: 'home', label: 'میز کار', icon: Home, onClick: handleScrollTop },
          ...(canManageSchool('canManageStudentsAndClasses') ? [
            { id: 'students', label: 'دانش‌آموزان', icon: Users, onClick: onOpenStudents },
            { id: 'classes', label: 'کلاس‌بندی', icon: Building2, onClick: onOpenClasses }
          ] : []),
          ...(canManageSchool('canManageSchedule') ? [{ id: 'schedule', label: 'برنامه هفتگی', icon: Calendar, onClick: onOpenSchedule }] : []),
          ...(canManageSchool('canManageAnnouncements') ? [{ id: 'posts', label: 'اخبار و رویداد', icon: Bell, onClick: onOpenPosts }] : []),
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-1.5 py-1 landscape:py-0.5 flex items-center justify-around select-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={item.onClick}
            type="button"
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-600 hover:text-teal-700 active:bg-teal-50/70 transition-all min-h-11"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-700 hover:text-teal-700 hover:bg-teal-100/50 transition-colors">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 whitespace-nowrap text-slate-700">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
