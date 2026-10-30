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
  const { currentRole, canManageSchool, activeMobileTab, setActiveMobileTab } = useApp();

  const handleScrollTop = () => {
    if(currentRole==='student'||currentRole==='teacher'||currentRole==='principal'||currentRole==='vice_principal'||currentRole==='parent'||currentRole==='platform_admin')setActiveMobileTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onOpenHome) onOpenHome();
  };

  if(currentRole==='student')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار دانش‌آموز" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'خانه',icon:Home,onClick:handleScrollTop},{id:'dossier',label:'پرونده من',icon:GraduationCap,onClick:onOpenDossier},{id:'qbank',label:'بانک سؤال',icon:BookOpen,onClick:onOpenQuestionBank},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[10px] font-bold transition-colors ${id==='home'?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  if(currentRole==='parent')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار اولیا" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'خانه',icon:Home,onClick:handleScrollTop},{id:'learning',label:'آموزش',icon:BookOpen,onClick:()=>setActiveMobileTab('parent-learning')},{id:'messages',label:'پیام‌ها',icon:Bell,onClick:()=>setActiveMobileTab('parent-messages')},{id:'finances',label:'امور مالی',icon:FileText,onClick:()=>setActiveMobileTab('parent-finances')},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} aria-current={(id==='home'?activeMobileTab==='dashboard':activeMobileTab===`parent-${id}`)?'page':undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[9px] font-bold transition-colors ${(id==='home'?activeMobileTab==='dashboard':activeMobileTab===`parent-${id}`)?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  if(currentRole==='teacher')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار دبیر" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'میز کار',icon:Home,onClick:handleScrollTop},{id:'grades',label:'نمرات',icon:ClipboardList,onClick:onOpenGrades},{id:'homework',label:'تکالیف',icon:BookOpen,onClick:onOpenHomework},{id:'qbank',label:'بانک سؤال',icon:Award,onClick:onOpenQuestionBank},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[9px] font-bold transition-colors ${id==='home'?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  if(currentRole==='principal'||currentRole==='vice_principal')return <nav id="mobile-bottom-nav" aria-label={currentRole==='principal'?'نوار ابزار مدیر مدرسه':'نوار ابزار معاون مدرسه'} className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-flow-col auto-cols-fr gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'میز کار',icon:Home,onClick:handleScrollTop},...(currentRole==='principal'?[{id:'students',label:'دانش‌آموزان',icon:Users,onClick:onOpenStudents},{id:'classes',label:'کلاس‌ها',icon:Building2,onClick:onOpenClasses},{id:'schedule',label:'برنامه',icon:Calendar,onClick:onOpenSchedule}]:[...(canManageSchool('canManageStudentsAndClasses')?[{id:'students',label:'دانش‌آموزان',icon:Users,onClick:onOpenStudents}]:[]),...(canManageSchool('canManageSchedule')?[{id:'schedule',label:'برنامه',icon:Calendar,onClick:onOpenSchedule}]:[]),...(canManageSchool('canManageAnnouncements')?[{id:'posts',label:'اطلاعیه‌ها',icon:Bell,onClick:onOpenPosts}]:[]),...(canManageSchool('canManageStudentsAndClasses')?[{id:'classes',label:'کلاس‌ها',icon:Building2,onClick:onOpenClasses}]:[]),{id:'qbank',label:'بانک سؤال',icon:BookOpen,onClick:onOpenQuestionBank}].slice(0,3)),{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[9px] font-bold transition-colors ${id==='home'?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;

  if(currentRole==='platform_admin')return <nav id="mobile-bottom-nav" aria-label="نوار ابزار مدیر پلتفرم" className="student-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"><div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[22px] border border-[#e0e7d7] bg-white p-1.5 shadow-[0_8px_32px_-12px_rgba(31,65,45,0.25)]">{[{id:'home',label:'مدارس',icon:Building2,onClick:handleScrollTop},{id:'banners',label:'تبلیغات',icon:Award,onClick:()=>setActiveMobileTab('platform-banners')},{id:'announcements',label:'بخشنامه',icon:Bell,onClick:()=>setActiveMobileTab('platform-announcements')},{id:'qbank',label:'بانک سؤال',icon:BookOpen,onClick:onOpenQuestionBank},{id:'profile',label:'حساب من',icon:UserCheck,onClick:onOpenProfile}].map(({id,label,icon:Icon,onClick})=><button key={id} id={`nav-item-${id}`} type="button" onClick={onClick} aria-current={(id==='home'?activeMobileTab==='dashboard':activeMobileTab===`platform-${id}`)?'page':undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[9px] font-bold transition-colors ${(id==='home'?activeMobileTab==='dashboard':activeMobileTab===`platform-${id}`)?'bg-[#edf3e5] text-[#557a42]':'text-[#a0ac94] hover:bg-[#f5f8f0] hover:text-[#65864f]'}`}><Icon className="size-[19px]" strokeWidth={1.7} aria-hidden="true"/><span>{label}</span></button>)}</div></nav>;
  return null;
};
