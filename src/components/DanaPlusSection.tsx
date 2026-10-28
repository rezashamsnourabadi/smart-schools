import {BookOpen, ChevronDown, GraduationCap, Sparkles, Sprout} from 'lucide-react';

export function DanaPlusSection() {
  return <section id="student-dana-plus" aria-labelledby="dana-plus-title" className="scroll-mt-24 overflow-hidden rounded-[26px] border border-[#d7dfc4] bg-[#244737] text-white">
    <div className="p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl border border-[#819c5a]/30 bg-[#8ba95e]/15 text-[#cbd9a4]"><Sparkles className="size-5" strokeWidth={1.5} aria-hidden="true"/></span><span className="rounded-full border border-[#809666]/30 bg-[#a4b979]/10 px-3 py-1.5 text-[10px] font-bold text-[#d5dfbd]">به‌زودی در دانا</span></div>
      <h2 id="dana-plus-title" className="text-2xl font-bold tracking-tight text-[#f0f3df]">دانا پلاس<span className="ms-1 text-[#b4c77d]">+</span></h2>
      <p className="mt-2 text-sm font-bold leading-8 text-[#cbd8b3]">یادگیری، فراتر از مدرسه.</p>
      <p className="mt-3 max-w-xl text-xs leading-8 text-[#b0c1a5]">فضای ویژه دانا برای علاقه‌های تو؛ دوره‌های آموزشی و کلاس‌هایی که مستقل از برنامه مدرسه ارائه خواهند شد.</p>
      <details className="group mt-5 border-t border-white/10 pt-2"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-[#d8e1c7]">چه چیزهایی در راه است؟<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true"/></summary><div className="grid gap-3 pt-3 sm:grid-cols-3">{[{title:'دوره‌های آموزشی',text:'برای یادگرفتن موضوع‌های تازه',icon:BookOpen},{title:'کلاس‌های ویژه',text:'فرصتی برای عمیق‌تر یادگرفتن',icon:GraduationCap},{title:'توسعه مهارت',text:'یادگیری در مسیر علاقه‌های شخصی',icon:Sprout}].map(({title,text,icon:Icon})=><article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Icon className="mb-3 size-5 text-[#b8ca8d]" strokeWidth={1.5} aria-hidden="true"/><h3 className="text-xs font-bold text-[#e1e8d4]">{title}</h3><p className="mt-2 text-[11px] leading-7 text-[#acbda2]">{text}</p></article>)}</div></details>
      <p className="mt-4 text-[10px] leading-6 text-[#9eb08f]">دانا پلاس هنوز فعال نشده است؛ این بخش فعلاً معرفی امکانات آینده است.</p>
    </div>
  </section>;
}
