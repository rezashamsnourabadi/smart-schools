import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/AuthContext';
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
    title: 'مدیر پلتفرم',
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
    title: 'دبیر',
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
    title: 'ولی دانش‌آموز',
    subtitle: 'اطلاع فوری از وضعیت حضور، کارنامه و بنر مفید',
    icon: Sparkles,
    badgeColor: 'bg-purple-600 text-white',
    hoverColor: 'hover:border-purple-300 hover:bg-purple-50/50'
  }
];

export const RoleQuickSwitch: React.FC = () => {
  const { currentRole, setCurrentRole } = useApp();
  const auth = useAuth();

  return <section id="role-quick-switcher" className="shrink-0 border-b border-[#e6ecdd] bg-[#fafcf7] px-3 py-2 sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-1.5">{ROLES_LIST.filter(item=>auth.memberships.some(member=>member.role===item.role)).map(({role,title,icon:Icon})=><button key={role} id={`role-switch-${role}`} type="button" aria-pressed={currentRole===role} onClick={()=>setCurrentRole(role)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition-colors ${currentRole===role?'border-[#dce6ce] bg-[#edf4e3] text-[#708e57]':'border-transparent text-[#9aa88e] hover:bg-[#f0f5e9]'}`}><Icon className="size-4" strokeWidth={1.6} aria-hidden="true"/>{role==='teacher'?'دبیر':title}</button>)}</div>{auth.memberships.length>1?<select id="membership-selector" aria-label="انتخاب مدرسه، نقش یا فرزند" value={auth.member.id} onChange={event=>auth.select(event.target.value)} className="min-h-11 min-w-0 max-w-full rounded-xl border border-[#dfe8d2] bg-white px-3 text-xs text-[#7b9166]">{auth.memberships.map(member=><option key={member.id} value={member.id}>{member.school_name||'مدیریت منطقه'} · {ROLES_LIST.find(role=>role.role===member.role)?.title} {member.label||''}</option>)}</select>:<span className="text-[10px] text-[#9da990]">فضای اختصاصی شما</span>}</div></section>;
};
