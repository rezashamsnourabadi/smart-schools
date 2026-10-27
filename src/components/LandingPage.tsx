import {
  ArrowDown, ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Check,
  ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, LockKeyhole,
  MessageSquare, Plus, ShieldCheck, Users, Wallet,
} from 'lucide-react';
import {toPersianDigits} from '../utils/persianUtils';

const features = [
  {number: 1, icon: CalendarDays, title: 'روزهای مدرسه، مرتب‌تر', text: 'برنامه هفتگی، حضور و غیاب و تکلیف‌ها در یک فضای مشترک؛ تا پیگیری کارهای روزانه ساده‌تر باشد.', label: 'برنامه و آموزش'},
  {number: 2, icon: BookOpen, title: 'مسیر یادگیری، روشن‌تر', text: 'نمره‌ها، بازخورد دبیر و کارنامه در کنار هم؛ برای دنبال‌کردن مسیر تحصیلی هر دانش‌آموز.', label: 'پرونده تحصیلی'},
  {number: 3, icon: Wallet, title: 'حساب‌وکتاب، شفاف‌تر', text: 'تعرفه‌ها، رسیدها، تخفیف‌ها و مانده حساب؛ با امکان ثبت پرداخت و بررسی رسید توسط مدرسه.', label: 'امور مالی'},
];

const roles = [
  {name: 'مدیر و معاون', detail: 'دیدی روشن از کارهای مدرسه', icon: LayoutDashboard},
  {name: 'دبیر', detail: 'تمرکز بیشتر روی آموزش', icon: BookOpen},
  {name: 'دانش‌آموز', detail: 'مسیر مشخص برای پیگیری درس‌ها', icon: GraduationCap},
  {name: 'خانواده', detail: 'همراهی نزدیک‌تر با مدرسه', icon: Users},
];

const questions = [
  {question: 'چطور وارد سامانه شوم؟', answer: 'از دکمه «ورود به سامانه» استفاده کنید و با شناسه و رمز یا روش پیامکی وارد شوید. روش پیامکی به فعال‌بودن سرویس پیامک نیاز دارد. حساب‌ها توسط مسئول مجاز ساخته می‌شوند؛ برای دریافت دسترسی با مسئول مدرسه یا سامانه هماهنگ کنید.'},
  {question: 'اگر چند فرزند یا چند نقش داشته باشم چه می‌شود؟', answer: 'یک حساب می‌تواند چند دسترسی مجاز داشته باشد. پس از ورود، می‌توانید مدرسه، نقش یا فرزند متصل به حساب خود را انتخاب کنید.'},
  {question: 'روی موبایل هم می‌توانم از دانا استفاده کنم؟', answer: 'بله. محیط سامانه برای نمایش در موبایل و رایانه طراحی شده است و از طریق مرورگر باز می‌شود. برای دریافت و ثبت اطلاعات به اتصال اینترنت نیاز دارید.'},
  {question: 'اگر رمز عبورم را فراموش کردم چه کنم؟', answer: 'در صفحه ورود، گزینه «فراموشی رمز» را انتخاب کنید. بازیابی به شماره تأییدشده حساب و فعال‌بودن سرویس پیامکی وابسته است؛ در صورت نیاز با مسئول حساب هماهنگ کنید.'},
];

function Brand({light = false}: {light?: boolean}) {
  return <a href="/" aria-label="دانا، صفحه اصلی" className={`inline-flex min-h-11 items-center gap-2.5 ${light ? 'text-white' : 'text-[#153e37]'}`}>
    <span className={`flex size-10 items-center justify-center rounded-2xl ${light ? 'bg-white/10' : 'bg-[#153e37] text-white'}`}><GraduationCap className="size-6" aria-hidden="true"/></span>
    <span className="text-2xl font-bold tracking-tight">دانا<span className={`ms-2.5 hidden border-s pe-0 ps-2.5 text-[10px] font-normal sm:inline ${light ? 'border-white/20 text-white/65' : 'border-slate-300 text-slate-500'}`}>همراهِ مدرسه</span></span>
  </a>;
}

/** Static illustration: deliberately has no student data or live dashboard metrics. */
function WorkspacePreview() {
  return <div id="landing-workspace-preview" className="landing-preview relative mx-auto w-full max-w-[570px] pt-8 pb-9 lg:pt-5" aria-label="پیش‌نمایش نمایشی محیط سامانه">
    <div className="landing-preview-sheet absolute inset-x-5 top-12 bottom-10 rounded-[28px] border border-[#d3e0d5] bg-[#e7eee3]" aria-hidden="true"/>
    <div className="relative overflow-hidden rounded-[24px] border border-[#dce4df] bg-white shadow-[0_24px_65px_-35px_rgba(21,62,55,0.35)]">
      <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
        <span className="flex items-center gap-2 text-[11px] text-slate-500"><span className="size-2 rounded-full bg-[#6f9a82]"/>میز کار مدرسه</span>
        <span className="rounded-md bg-[#f4f6f2] px-2 py-1 text-[9px] text-slate-500">پیش‌نمایش</span>
      </div>
      <div className="flex min-h-[325px] sm:min-h-[360px]">
        <div className="flex w-12 shrink-0 flex-col items-center gap-5 border-e border-slate-100 bg-[#fafbf9] py-5 sm:w-16" aria-hidden="true">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#153e37] text-white"><GraduationCap className="size-5"/></span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#e7eee8] text-[#376b56]"><LayoutDashboard className="size-4"/></span>
          <CalendarDays className="size-4 text-slate-400"/><BookOpen className="size-4 text-slate-400"/><Users className="size-4 text-slate-400"/>
          <span className="mt-auto flex size-7 items-center justify-center rounded-full bg-[#e8e1d5] text-[10px] font-bold text-[#74634c]">د</span>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div><p className="mb-1.5 text-[10px] text-slate-400">یک شروع خوب برای روز مدرسه</p><p className="text-sm font-bold text-[#153e37] sm:text-base">همه‌چیز، سر جای خودش.</p></div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-100 text-slate-400" aria-hidden="true"><CalendarDays className="size-4"/></span>
          </div>
          <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[#f1f5ed] p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#61825d]"><ClipboardCheck className="size-4" aria-hidden="true"/></span>
            <div><p className="text-[11px] font-bold text-[#365943]">از برنامه تا پیگیری کلاس</p><p className="mt-1 text-[9px] text-[#6c7d66]">کارهای روزانه، در یک نگاه</p></div>
            <Check className="ms-auto size-4 shrink-0 text-[#6a8d67]" aria-hidden="true"/>
          </div>
          <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-slate-700">برنامه کلاس</p><span className="text-[9px] text-slate-400">نمای نمونه</span></div>
          <div className="space-y-2.5">
            {[{subject:'ریاضی',text:'یادگیری و تمرین',color:'bg-[#e9eee5] text-[#6c825c]'}, {subject:'ادبیات فارسی',text:'خواندن و گفت‌وگو',color:'bg-[#f4e9df] text-[#b08361]'}].map((item,index)=><div key={item.subject} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${item.color}`}>{toPersianDigits(index+1)}</span>
              <div className="min-w-0"><p className="text-[11px] font-bold text-slate-700">{item.subject}</p><p className="mt-1 text-[9px] text-slate-400">{item.text}</p></div>
              <ArrowLeft className="ms-auto size-3 text-slate-300" aria-hidden="true"/>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="absolute bottom-0 start-3 flex items-center gap-3 rounded-2xl border border-[#e6e9df] bg-[#fffef9] px-4 py-3 shadow-[0_12px_35px_-20px_rgba(21,62,55,0.35)] sm:start-7">
      <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf0e5] text-[#5a7b52]"><MessageSquare className="size-4" aria-hidden="true"/></span>
      <div><p className="text-[11px] font-bold text-[#344d3b]">یک خبر، یک قدم نزدیک‌تر</p><p className="mt-1 text-[9px] text-slate-500">اطلاعیه‌ها در دسترس خانواده و مدرسه</p></div>
    </div>
    <div className="absolute end-4 top-0 flex items-center gap-2 rounded-full border border-[#dce4d9] bg-[#f7faf2] px-3 py-2 text-[10px] text-[#5e7657] sm:end-8"><ShieldCheck className="size-3.5" aria-hidden="true"/>هر نقش، دسترسی خودش</div>
  </div>;
}

export function LandingPage() {
  return <div id="landing-page" dir="rtl" className="landing-page min-h-screen bg-[#fafbf7] text-[#203c34]">
    <a href="#landing-content" className="sr-only rounded-xl bg-[#153e37] p-3 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50">رفتن به محتوای اصلی</a>
    <header className="mx-auto flex min-h-24 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
      <Brand/>
      <nav aria-label="ناوبری اصلی" className="hidden items-center gap-7 text-[13px] text-slate-500 md:flex">
        <a href="#features" className="landing-link inline-flex min-h-11 items-center">امکانات دانا</a><a href="#for-everyone" className="landing-link inline-flex min-h-11 items-center">برای همه مدرسه</a><a href="#questions" className="landing-link inline-flex min-h-11 items-center">پرسش‌های متداول</a>
      </nav>
      <a id="landing-header-login" href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cdd9d0] px-4 text-xs font-bold text-[#244d3e] transition-colors hover:border-[#153e37] hover:bg-white sm:px-5">ورود به سامانه<ArrowUpLeft className="size-4" aria-hidden="true"/></a>
    </header>

    <main id="landing-content">
      <section aria-labelledby="landing-title" className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-10 pb-16 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-20 lg:pb-24">
        <div className="landing-hero-copy">
          <p className="mb-6 flex items-center gap-2 text-[11px] text-[#68816b] sm:text-xs"><span className="size-1.5 rounded-full bg-[#8da780]"/>فضایی مشترک برای خانواده و مدرسه</p>
          <h1 id="landing-title" className="text-[2.5rem] leading-[1.55] font-bold tracking-[-0.045em] text-[#203c34] sm:text-[3.6rem] lg:text-[3.75rem]">مدرسه،<br/><span className="text-[#6b8660]">یک قدم هماهنگ‌تر.</span></h1>
          <p className="mt-5 max-w-[400px] text-sm leading-8 text-[#738071] sm:text-[15px]">از برنامه کلاس و تکلیف‌ها تا کارنامه و ارتباط با خانواده؛ دانا کارهای مدرسه را کنار هم می‌آورد تا فرصت بیشتری برای آموزش بماند.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-5">
            <a id="landing-hero-login" href="/login" className="inline-flex min-h-12 items-center gap-5 rounded-full bg-[#153e37] px-6 text-sm font-bold text-white transition-colors hover:bg-[#285a49]">ورود به فضای مدرسه<ArrowLeft className="size-4" aria-hidden="true"/></a>
            <a href="#features" className="landing-link inline-flex min-h-12 items-center gap-2 px-2 text-xs text-[#667865]">با دانا آشنا شوید<ArrowDown className="size-3.5" aria-hidden="true"/></a>
          </div>
          <p className="mt-6 flex items-center gap-1.5 text-[10px] text-[#8b9587]"><LockKeyhole className="size-3" aria-hidden="true"/>ورود با حسابی که مسئول مجاز برای شما ساخته است</p>
        </div>
        <WorkspacePreview/>
      </section>

      <section aria-label="بخش‌های سامانه" className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 border-y border-[#e3e7dd] py-6 text-xs text-[#778570] sm:justify-between">
          <span className="text-[11px] text-[#9aa28f]">همراهِ روزهای مدرسه</span>
          {[{label:'برنامه و حضور',icon:CalendarDays},{label:'آموزش و تکلیف',icon:BookOpen},{label:'کارنامه و پرونده',icon:ClipboardCheck},{label:'امور مالی',icon:Wallet}].map(({label,icon:Icon})=><span key={label} className="inline-flex items-center gap-2"><Icon className="size-4" strokeWidth={1.5} aria-hidden="true"/>{label}</span>)}
        </div>
      </section>

      <section id="features" aria-labelledby="features-title" className="landing-section mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-3 text-xs text-[#829372]">ساده، منظم، در دسترس</p><h2 id="features-title" className="text-2xl leading-[1.7] font-bold tracking-tight sm:text-3xl">از اولین زنگ،<br/>تا آخرین خبرِ مدرسه.</h2></div>
          <p className="max-w-[310px] text-[13px] leading-7 text-[#7e8877]">کارهای پراکنده، یک جای مشخص دارند. هر بخش برای یک نیاز واقعی در زندگی روزانه مدرسه.</p>
        </div>
        <div className="grid gap-7 md:grid-cols-3 md:gap-9">
          {features.map(({number,icon:Icon,title,text,label})=><article key={number} id={`landing-feature-${number}`} className="border-t border-[#dce3d6] pt-6">
            <div className="mb-7 flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf1e7] text-[#67815c]"><Icon className="size-5" strokeWidth={1.5} aria-hidden="true"/></span><span className="text-[11px] text-[#a7af9e]">{toPersianDigits(String(number).padStart(2,'0'))}</span></div>
            <p className="mb-2 text-[10px] text-[#8b987e]">{label}</p><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 text-[13px] leading-7 text-[#7b8674]">{text}</p>
          </article>)}
        </div>
      </section>

      <section id="for-everyone" aria-labelledby="roles-title" className="landing-section mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid overflow-hidden rounded-[28px] bg-[#193f36] lg:grid-cols-2">
          <div className="p-7 sm:p-11 lg:p-14">
            <p className="mb-5 text-xs text-[#adc2a1]">هر نقش، فضای خودش را دارد</p><h2 id="roles-title" className="text-3xl leading-[1.8] font-bold text-[#f7f8ed] sm:text-4xl">یک مدرسه.<br/>یک مسیر روشن.</h2>
            <p className="mt-5 max-w-[340px] text-[13px] leading-8 text-[#afc2b6]">مدیر، دبیر، دانش‌آموز و خانواده، هرکدام نیازهای متفاوتی دارند. دانا اطلاعات مرتبط با هر نقش را در فضای اختصاصی او قرار می‌دهد.</p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] text-[#d6e2ce]"><ShieldCheck className="size-4" aria-hidden="true"/>دسترسی متناسب با نقش و مدرسه</div>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10 px-7 sm:px-11 lg:border-s lg:border-t-0 lg:px-10">
            {roles.map(({name,detail,icon:Icon})=><div key={name} className="flex items-center gap-4 py-6 sm:py-7"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[#b7c8a7]"><Icon className="size-5" strokeWidth={1.5} aria-hidden="true"/></span><div><h3 className="text-sm font-bold text-[#f1f4e9]">{name}</h3><p className="mt-1.5 text-xs text-[#a8bcae]">{detail}</p></div><ArrowUpLeft className="ms-auto size-4 text-[#698c79]" aria-hidden="true"/></div>)}
          </div>
        </div>
      </section>

      <section id="questions" aria-labelledby="questions-title" className="landing-section mx-auto grid max-w-[1200px] gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div><p className="mb-3 text-xs text-[#829372]">قبل از شروع</p><h2 id="questions-title" className="text-2xl leading-relaxed font-bold sm:text-3xl">شاید سؤال شما هم باشد.</h2><p className="mt-4 max-w-[260px] text-[13px] leading-7 text-[#7e8877]">چند پاسخ کوتاه برای آشنایی بیشتر با فضای دانا.</p></div>
        <div className="border-t border-[#dfe5d8]">{questions.map(({question,answer},index)=><details key={question} id={`landing-faq-${index+1}`} className="group border-b border-[#dfe5d8]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-[13px] font-bold"><span>{question}</span><Plus className="size-4 shrink-0 text-[#8a9a7a] transition-transform group-open:rotate-45" aria-hidden="true"/></summary>
          <p className="max-w-[560px] pb-5 pe-6 text-xs leading-8 text-[#798570]">{answer}</p>
        </details>)}</div>
      </section>

      <section aria-labelledby="start-title" className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-[#dce3d3] bg-[#edf1e5] p-7 sm:flex-row sm:items-center sm:p-10">
          <div><p className="mb-2 text-[11px] text-[#81906e]">وقتِ یک روز منظم‌تر است</p><h2 id="start-title" className="text-xl leading-relaxed font-bold sm:text-2xl">به فضای مدرسه‌تان خوش آمدید.</h2></div>
          <a id="landing-footer-login" href="/login" className="inline-flex min-h-12 shrink-0 items-center gap-7 rounded-full bg-[#153e37] px-6 text-sm font-bold text-white transition-colors hover:bg-[#285a49]">ورود به دانا<ArrowLeft className="size-4" aria-hidden="true"/></a>
        </div>
      </section>
    </main>

    <footer className="mx-auto max-w-[1200px] px-5 pb-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[#e3e7dd] pt-7"><Brand/><p className="text-[11px] text-[#8b9582]">برای روزهای بهترِ مدرسه.</p><a href="#landing-page" className="landing-link inline-flex min-h-11 items-center gap-2 text-[11px] text-[#7c8a70]">بازگشت به بالا<ChevronDown className="size-3.5 rotate-180" aria-hidden="true"/></a></div>
    </footer>
  </div>;
}
