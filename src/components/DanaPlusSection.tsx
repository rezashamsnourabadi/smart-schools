import {useAnalytics} from '../analytics/AnalyticsProvider';
import {BookOpen, ChevronDown, GraduationCap, Sparkles, Sprout} from 'lucide-react';

export function DanaPlusSection() {
  const track=useAnalytics();
  return <section id="student-dana-plus" aria-labelledby="dana-plus-title" className="rounded-3xl border border-[#e5e0d8] bg-[#faf8f4] px-4 sm:px-6">
    <details className="group" onToggle={event=>{if(event.currentTarget.open)track('dana_plus_open');}}>
      <summary className="flex min-h-24 cursor-pointer list-none items-center gap-3 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#ece8f4] text-[#88729d]"><Sparkles className="size-5" strokeWidth={1.5} aria-hidden="true"/></span>
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span id="dana-plus-title" className="text-sm font-bold text-[#594b65]">دانا پلاس</span><span className="rounded-full bg-white px-2 py-1 text-[9px] text-[#8c7f97]">به‌زودی</span></span><span className="mt-1.5 block text-[11px] leading-6 text-[#8b8291]">برای علاقه‌های تو، فراتر از مدرسه</span></span>
        <ChevronDown className="size-4 shrink-0 text-[#a59aaa] transition-transform group-open:rotate-180" aria-hidden="true"/>
      </summary>
      <div className="border-t border-[#e9e3ec] pb-5 pt-4">
        <p className="max-w-xl text-xs leading-8 text-[#807488]">اینجا قرار است مسیر تازه‌ای برای یادگیری داشته باشی؛ دوره‌ها و کلاس‌هایی که مستقل از مدرسه، با توجه به علاقه‌هایت انتخاب می‌کنی.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">{[{title:'دوره‌های آموزشی',icon:BookOpen},{title:'کلاس‌های ویژه',icon:GraduationCap},{title:'توسعه مهارت',icon:Sprout}].map(({title,icon:Icon})=><div key={title} className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-[11px] text-[#82718e]"><Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true"/>{title}</div>)}</div>
        <p className="mt-4 text-[10px] leading-6 text-[#9a8fa0]">این بخش فعلاً معرفی امکانات آینده است؛ ثبت‌نام دوره‌ها هنوز فعال نیست.</p>
      </div>
    </details>
  </section>;
}
