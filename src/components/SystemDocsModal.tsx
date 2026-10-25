import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  X,
  BookOpen,
  Search,
  CheckCircle2,
  Shield,
  Users,
  Calendar,
  Code2,
  TrendingUp,
  Layers,
  MessageSquare,
  Sparkles,
  Printer,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  Award,
  Clock,
  Send,
  Database,
  Smartphone,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

interface SystemDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'features' | 'rbac' | 'developers' | 'investors';

interface FeatureItem {
  id: string;
  category: 'مدیریتی' | 'آموزشی' | 'مالی و اداری' | 'ارتباطی' | 'زیرساخت';
  title: string;
  badge: string;
  description: string;
  details: string[];
  userRoles: string[];
  icon: React.ReactNode;
}

export const SystemDocsModal: React.FC<SystemDocsModalProps> = ({ isOpen, onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [copied, setCopied] = useState(false);

  const featuresList: FeatureItem[] = [
    {
      id: 'school-finances',
      category: 'مالی و اداری',
      title: 'مدیریت مالی، شهریه، اقساط، سرفصل‌های مصوب و صندوق آموزشگاه',
      badge: 'جدید و جامع',
      description: 'نمونه فرانت‌اند برای تعرفه، ثبت فیش، محاسبه مانده و ثبت اعلان آزمایشی؛ اتصال بانکی و پیام واقعی فعال نیست.',
      details: [
        'تعریف نامحدود سرفصل‌های درآمدی با قابلیت اجباری/اختیاری بودن و تخصیص به پایه‌ها',
        'جدول هوشمند اقساط و موعد سررسید با نشانگر وضعیت بدهکار، معوقه و تسویه‌شده',
        'ثبت محلی رسیدهای نمونه با شماره پیگیری و کنترل مانده',
        'سامانه تخفیفات و بورسیه (فرزند فرهنگیان، سادات، حافظان قرآن، تخفیف پرداخت نقدی)',
        'ثبت محلی یادآوری؛ ارسال پیامک یا بله انجام نمی‌شود',
        'تب اختصاصی در پرونده جامع دانش‌آموز (Dossier) و کارت هوشمند در پنل اولیا'
      ],
      userRoles: ['مدیر آموزشگاه', 'معاون (مشروط)', 'اولیا'],
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 'academic-year',
      category: 'مدیریتی',
      title: 'مدیریت سال و تقویم تحصیلی و ویزارد ارتقا (Academic Rollover)',
      badge: 'جدید و بومی',
      description: 'مدیریت محلی سال تحصیلی؛ تغییر سال فقط برای پرونده‌های واجد شرایط و پس از تأیید اجرا می‌شود.',
      details: [
        'پیشنهاد ارتقا فقط بر اساس کارنامه نوبت دوم معتبر و منتشرشده',
        'پیشنهاد فارغ‌التحصیلی فقط برای دانش‌آموز واجد شرایط پایه دوازدهم',
        'کپی مقادیر واقعی کارنامه منتشرشده به سوابق؛ آرشیو همه ماژول‌ها فراهم نیست',
        'پاک‌سازی حضور سال قبل فقط با انتخاب صریح گزینه پایان سال',
        'نمای تقویمی سال‌های غیرجاری به‌صورت فقط‌خواندنی؛ آرشیو واقعی همه ماژول‌ها هنوز پیاده‌سازی نشده است'
      ],
      userRoles: ['مدیر آموزشگاه'],
      icon: <Calendar className="w-5 h-5 text-teal-600" />
    },
    {
      id: 'attendance-bale',
      category: 'ارتباطی',
      title: 'حضور و غیاب کلاسی و پیش‌نویس اعلان',
      badge: 'محلی و آزمایشی',
      description: 'ثبت محلی وضعیت زنگ و ساخت سابقه اعلان برای نمایش؛ اتصال بله و پیامک واقعی فعال نیست.',
      details: [
        'تشخیص هوشمند زنگ جاری و نمایش لیست دانش‌آموزان کلاس فعال',
        'دکمه تک‌لمسی «همه حاضرند» برای صرفه‌جویی زمان آغاز کلاس',
        'تولید متن اعلان آزمایشی با زمان و نام مدرسه',
        'سنجش هزینه پیام‌رسانی نیازمند اتصال و داده واقعی است',
        'صندوق سابقه اعلان‌ها در هدر با نشانگر پیام‌های خوانده‌نشده'
      ],
      userRoles: ['معلم', 'معاون مدرسه', 'مدیر آموزشگاه', 'اولیا'],
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 'student-dossier',
      category: 'آموزشی',
      title: 'نمای پرونده تحصیلی دانش‌آموز',
      badge: 'نمونه محلی',
      description: 'نمایش داده‌های پرونده موجود در نمونه فرانت‌اند؛ داده‌ها در مرورگر ذخیره می‌شوند و همگام‌سازی منطقه‌ای فعال نیست.',
      details: [
        'نمایش دفتر نمرات و کارنامه منتشرشده موجود؛ معدل رسمی از دفتر نمرات ساخته نمی‌شود',
        'دفترچه انضباطی با تفکیک موارد تشویقی، تذکرات شفاهی و کتبی',
        'سوابق تحصیلی سنوات گذشته در مقاطع قبلی (Past Years History)',
        'چاپ صفحه از مرورگر؛ PDF اختصاصی کارنامه و پرونده در دسترس نیست',
        'امکان به‌روزرسانی شماره تماس و آدرس توسط ولی دانش‌آموز'
      ],
      userRoles: ['مدیر آموزشگاه', 'معاون', 'معلم', 'دانش‌آموز', 'اولیا'],
      icon: <Award className="w-5 h-5 text-indigo-600" />
    },
    {
      id: 'question-bank',
      category: 'آموزشی',
      title: 'بانک سوالات نمونه در مرورگر',
      badge: 'نمونه محلی',
      description: 'مدیریت پرسش‌های نمونه در همین نسخه فرانت‌اند؛ اشتراک‌گذاری میان دستگاه‌ها و مدرسه‌ها فعال نیست.',
      details: [
        'فرم استاندارد افزودن سوال با تعیین گزینه‌ها، کلید پاسخ و راه‌حل تشریحی',
        'فیلترهای پیشرفته بر اساس درس، پایه تحصیلی و درجه سختی (آسان، متوسط، سخت)',
        'نمایش تمرین از بانک محلی موجود؛ این بخش موتور آزمون یا ذخیره پاسخ ندارد',
        'نشان تایید و اصالت طراح سوال به همراه نام مدرسه مبدا'
      ],
      userRoles: ['معلم', 'مدیر آموزشگاه', 'دانش‌آموز', 'مدیر پلتفرم'],
      icon: <BookOpen className="w-5 h-5 text-amber-600" />
    },
    {
      id: 'class-student-management',
      category: 'مدیریتی',
      title: 'کلاس‌بندی، ظرفیت‌ها، ثبت‌نام و مدیریت انتقال دانش‌آموز',
      badge: 'هسته‌ای',
      description: 'ساماندهی اتاق‌های کلاس، انتصاب دبیران راهنما و ثبت‌نام دانش‌آموزان در ۳ وضعیت فعال، فارغ‌التحصیل و انتقالی.',
      details: [
        'ثبت کلاس و نمایش ظرفیت/رشته؛ کنترل پرشدن ظرفیت پیاده‌سازی نشده است',
        'تب‌های تفکیک‌شده: دانش‌آموزان جاری، فارغ‌التحصیلان (با رتبه کنکور و دانشگاه) و انتقالی',
        'ثبت‌نام سریع با کد ملی و شماره تلفن سرپرست',
        'مدیریت انتقال دانش‌آموز به مدارس دیگر شهرستان با حفظ پیوستگی سوابق'
      ],
      userRoles: ['مدیر آموزشگاه', 'معاون (مشروط)'],
      icon: <Building2 className="w-5 h-5 text-cyan-600" />
    },
    {
      id: 'schedule-planner',
      category: 'مدیریتی',
      title: 'برنامه هفتگی دروس',
      badge: 'بررسی تداخل پایه',
      description: 'ماتریس محلی برنامه هفتگی؛ ثبت تداخل کلاس و دبیر در روز و زنگ یکسان مسدود می‌شود.',
      details: [
        'بررسی تداخل دبیر و کلاس در روز و زنگ یکسان هنگام ثبت برنامه',
        'نمایش سریع برنامه روزانه در داشبورد معلم و دانش‌آموز',
        'انتصاب آسان درس، دبیر و زمان شروع و پایان هر زنگ'
      ],
      userRoles: ['مدیر آموزشگاه', 'معاون (مشروط)', 'معلم', 'دانش‌آموز'],
      icon: <Clock className="w-5 h-5 text-blue-600" />
    },
    {
      id: 'grading-homework-exam',
      category: 'آموزشی',
      title: 'دفتر نمرات مستمر، تکالیف و آزمون‌های آنلاین کلاسی',
      badge: 'ابزار معلم',
      description: 'ثبت ارزشیابی و تکلیف؛ آزمون فقط در تقویم برنامه‌ریزی می‌شود و موتور سؤال/شرکت آنلاین فعال نیست.',
      details: [
        'ورود دسته‌جمعی نمرات با تبدیل خودکار به فرمت استاندارد فارسی',
        'تعریف تکالیف درسی با سرفصل آموزشی و تاریخ مهلت تحویل',
        'زمان‌بندی آزمون بدون سؤال و بدون تصحیح خودکار'
      ],
      userRoles: ['معلم', 'دانش‌آموز', 'اولیا'],
      icon: <FileSpreadsheet className="w-5 h-5 text-teal-600" />
    },
    {
      id: 'vp-permissions',
      category: 'مدیریتی',
      title: 'تفویض هوشمند و گرانولار اختیارات به معاونان (RBAC Delegation)',
      badge: 'انعطاف‌پذیری سازمانی',
      description: 'کنترل چند مجوز در رابط برای پیش‌نمایش نقش معاون؛ جایگزین احراز هویت و مجوز سمت سرور نیست.',
      details: [
        'مجوز مدیریت کلاس‌ها و ثبت‌نام دانش‌آموزان',
        'مجوز چیدمان و اصلاح برنامه هفتگی دروس',
        'مجوز ثبت و دسترسی به سوابق انضباطی',
        'مجوز انتشار اخبار، رویدادها و اطلاعیه‌های مدرسه',
        'مجوز دسترسی به دفتر نمرات و کارنامه‌ها'
      ],
      userRoles: ['مدیر آموزشگاه'],
      icon: <Shield className="w-5 h-5 text-indigo-600" />
    },
    {
      id: 'posts-events',
      category: 'ارتباطی',
      title: 'مدیریت رویدادها، اخبار و اطلاعیه‌های رسمی مدرسه',
      badge: 'ذخیره محلی',
      description: 'ثبت اطلاعیه در نمونه محلی و نمایش آن در داشبورد؛ ارسال پیام یا اعلان بیرونی انجام نمی‌شود.',
      details: [
        'فیلتر بر اساس فوریت (فوری، عادی، رویداد فرهنگی)',
        'پیوست محلی در مرورگر با محدودیت اندازه هر فایل',
        'نمایش لحظه‌ای در بورد اخبار داشبورد مدیر، اولیا و دانش‌آموز'
      ],
      userRoles: ['مدیر آموزشگاه', 'معاون (مشروط)', 'عموم کاربران'],
      icon: <Send className="w-5 h-5 text-amber-600" />
    },
    {
      id: 'regional-kpis-sponsors',
      category: 'زیرساخت',
      title: 'داشبورد نظارت کلان شهرستان و مدیریت حامیان مالی (Edu-Ads)',
      badge: 'نمونه محلی',
      description: 'نمایش نمونه‌ای شاخص‌های منطقه و بنر حامیان؛ آمار و درآمد واقعیِ متصل به مدارس وجود ندارد.',
      details: [
        'شاخص‌ها از داده‌های نمونه همین مرورگر محاسبه می‌شوند',
        'هزینه پیامک و بله سنجیده یا گزارش نمی‌شود',
        'بنر حامی در رابط قابل نمایش است؛ هدف‌گیری تبلیغاتی یا فروش فعال نیست'
      ],
      userRoles: ['مدیر ارشد پلتفرم شهرستان'],
      icon: <TrendingUp className="w-5 h-5 text-rose-600" />
    },
    {
      id: 'role-quick-switch',
      category: 'زیرساخت',
      title: 'ابزار پیش‌نمایش شش نقش نمونه',
      badge: 'ویژه توسعه و تست',
      description: 'ابزار توسعه برای پیش‌نمایش نقش‌ها در همین نشست مرورگر؛ ورود واقعی یا ارزیابی کامل سیستم نیست.',
      details: [
        'نقش‌ها از داده‌های مشترک داخل همین نشست برنامه استفاده می‌کنند',
        'تغییرات محلی ممکن است در نقش‌های نمونه همین مرورگر دیده شوند؛ دستگاه دیگری همگام نیست',
        'نوار دسترسی سریع پایین صفحه بهینه‌شده برای گوشی‌های هوشمند'
      ],
      userRoles: ['تمام کاربران و ارزیابان سیستم'],
      icon: <Users className="w-5 h-5 text-purple-600" />
    }
  ];

  const filteredFeatures = featuresList.filter((item) => {
    const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleCopySummary = () => {
    const summaryText = `نمونه فرانت‌اند مدیریت مدرسه:
- ثبت محلی داده‌های نمونه
- سابقه اعلان آزمایشی؛ ارسال واقعی فعال نیست
- بانک سوال محلی؛ موتور شرکت آنلاین در آزمون فعال نیست
- پرداخت، پیام‌رسان، پیامک و همگام‌سازی ابری واقعی فعال نیست
- مجوزهای رابط جایگزین کنترل امنیتی سمت سرور نیست`;
    void navigator.clipboard?.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => setCopied(false));
  };

  return (
    <AnimatePresence>
    {isOpen && <motion.div
      key="system-docs-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto w-full max-w-full"
      id="system-docs-modal"
    >
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 6, scale: shouldReduceMotion ? 1 : 0.99 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] m-auto"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-teal-200 border border-white/15">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  مستندات جامع، کاتالوگ فیچرها و مشخصات فنی سامانه
                </h3>
                <span className="text-[10px] bg-teal-500/30 text-teal-100 px-2 py-0.5 rounded-full border border-teal-400/30 font-bold hidden sm:inline-block">
                  نسخه {toPersianDigits('2.4')}
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                ویژه توسعه‌دهندگان، سرمایه‌گذاران، کارشناسان فناوری و مدیران آموزش و پرورش
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="کپی خلاصه متنی فیچرها"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'کپی شد!' : 'کپی خلاصه'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white text-xs font-bold transition-all hidden md:flex items-center gap-1.5"
              title="چاپ این صفحه با مرورگر"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ صفحه</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div role="note" className="mx-3 mt-3 sm:mx-5 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs leading-relaxed">
          این نسخه، نمونه فرانت‌اند است. داده‌ها محلی‌اند؛ ورود امن، پایگاه داده ابری، ارسال واقعی پیام، درگاه پرداخت و اشتراک‌گذاری میان دستگاه‌ها فعال نیست. جدول دسترسی زیر رفتار رابط را نشان می‌دهد و کنترل امنیتی سمت سرور نیست.
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center space-x-reverse space-x-2">
            <button
              id="docs-tab-features"
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'features'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-600" />
              <span>کاتالوگ کامل فیچرها ({toPersianDigits(featuresList.length)})</span>
            </button>

            <button
              id="docs-tab-rbac"
              onClick={() => setActiveTab('rbac')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'rbac'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>ماتریس دسترسی نقش‌ها (RBAC)</span>
            </button>

            <button
              id="docs-tab-developers"
              onClick={() => setActiveTab('developers')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'developers'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4 text-cyan-600" />
              <span>معماری فنی و پایگاه‌داده</span>
            </button>

            <button
              id="docs-tab-investors"
              onClick={() => setActiveTab('investors')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'investors'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>ارزش تجاری و سرمایه‌گذاران</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: Complete Feature Catalog with Live Search & Filter */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="جستجو در نام ویژگی، کارکرد یا کلمات کلیدی..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {(['همه', 'مدیریتی', 'آموزشی', 'مالی و اداری', 'ارتباطی', 'زیرساخت'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">ماژول‌های فعال سامانه</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {toPersianDigits(featuresList.length)} ماژول جامع
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">نقش‌های کاربری تفکیک‌شده</span>
                  <span className="text-lg font-black text-teal-800 font-mono">
                    {toPersianDigits(6)} پرسونای مجزا
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">کانال‌های ارتباطی</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    پیام‌رسان بله + پیامک کشوری
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">تقویم و ارقام بومی</span>
                  <span className="text-lg font-black text-indigo-800 font-mono">
                    ۱۰۰٪ هجری خورشیدی
                  </span>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            {feat.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">
                              دسته‌بندی: {feat.category}
                            </span>
                            <h4 className="font-black text-slate-900 text-sm">{feat.title}</h4>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200 shrink-0">
                          {feat.badge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>

                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        {feat.details.map((det, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{det}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">نقش‌های ذینفع:</span>
                      <div className="flex flex-wrap gap-1">
                        {feat.userRoles.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Role-Based Access Control (RBAC) Matrix */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <h4 className="font-black text-slate-900 text-base mb-1">
                  ماتریس دسترسی نقش‌ها (Role-Based Access Control)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  بررسی سطح دسترسی هر پرسونای کاربری در بخش‌های مختلف سامانه بر اساس اصول امنیتی کمترین سطح دسترسی (Principle of Least Privilege).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                        <th className="p-3 font-bold">بخش / ماژول</th>
                        <th className="p-3 font-bold text-center">مدیر منطقه</th>
                        <th className="p-3 font-bold text-center">مدیر مدرسه</th>
                        <th className="p-3 font-bold text-center">معاون مدرسه</th>
                        <th className="p-3 font-bold text-center">دبیر / معلم</th>
                        <th className="p-3 font-bold text-center">دانش‌آموز</th>
                        <th className="p-3 font-bold text-center">ولی دانش‌آموز</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-3 font-bold text-slate-900">مدیریت سال و تقویم تحصیلی و ارتقا</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ کامل</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">حضور و غیاب کلاسی و هشدار بله/SMS</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ پایش کل</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ ثبت و پایش</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ کلاس خود</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ دریافت هشدار</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">پرونده ۳۶۰ درجه و کارنامه رسمی</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ کامل</td>
                        <td className="p-3 text-center text-amber-700 font-bold">🔑 مشروط</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ مشاهده</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ پرونده خود</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ پرونده فرزند</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">بانک سوالات محلی نمونه</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ نظارت کلان</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ مشاهده</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ مشاهده</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ افزودن به نمونه</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ تمرین روز</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">دفتر نمرات، تکالیف و آزمون آنلاین</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ مشاهده</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ مشاهده</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ دروس خود</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ ارسال تکلیف</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ نظارت</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">چیدمان برنامه هفتگی دروس</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ کامل</td>
                        <td className="p-3 text-center text-amber-700 font-bold">🔑 مشروط</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ برنامه خود</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ برنامه کلاس</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-emerald-50/30">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>امور مالی، شهریه، اقساط و ثبت اسناد</span>
                        </td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ کامل (تعریف و تسویه)</td>
                        <td className="p-3 text-center text-amber-700 font-bold">🔑 مشروط (تفویض مدیر)</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-teal-700 font-bold">👁️ واریز و پیگیری فرزند</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">شاخص‌های کلان شهرستان و تبلیغات حامیان</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">✅ انحصاری</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                        <td className="p-3 text-center text-slate-400">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>راهنمای نماد «🔑 مشروط»:</strong> اختیارات معاون آموزشگاه به صورت مستقیم و مستقل توسط مدیر آموزشگاه از طریق مدال «تنظیم دسترسی معاونت» تعیین و فعال می‌گردد.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Developer & Technical Architecture */}
          {activeTab === 'developers' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    مشخصات فنی و معماری پلتفرم (Technical Architecture)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    طراحی‌شده بر پایه اصول مهندسی نرم‌افزار، تایپ‌استریکت دقیق و پشته مدرن جاوااسکریپت.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Code2 className="w-4 h-4 text-teal-700" />
                      <span>پشته نرم‌افزاری و کتابخانه‌ها</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      <li><strong>React 19 + TypeScript:</strong> تایپ‌سیف کامل برای تمام موجودیت‌های آموزشی.</li>
                      <li><strong>Vite 6 + ESBuild:</strong> باندل سریع با زمان بارگذاری بهینه.</li>
                      <li><strong>Tailwind CSS v4:</strong> طراحی راست‌به‌چپ (RTL Native) بدون اضافه بار زمان اجرا.</li>
                      <li><strong>Lucide React:</strong> آیکون‌های متوازن و یکپارچه در تمام صفحات.</li>
                      <li><strong>Motion:</strong> ترنزیشن‌ها و انیمیشن‌های ورود و خروج نرم.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Database className="w-4 h-4 text-cyan-700" />
                      <span>معماری مدیریت وضعیت و داده‌ها</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      <li><strong>Single Source of Truth:</strong> استفاده از Context API یکپارچه در `AppContext.tsx`.</li>
                      <li><strong>Strict Persian Digits:</strong> ذخیره مقادیر محاسباتی به صورت ASCII و رندرینگ مجزا با `toPersianDigits`.</li>
                      <li><strong>Non-Destructive Rollover:</strong> موتور تحویل سال با انجماد در `pastYearHistory`.</li>
                      <li><strong>دفتر کل مالی و حسابداری (Financial Ledger):</strong> اسناد مالی، اقساط، تخفیف‌ها و فیش‌های پرداختی در ساختار تراکنشی با کد پیگیری یکتا.</li>
                      <li><strong>Local Persistence:</strong> ذخیره‌سازی محلی با نسخه ۲ کلید کشوری.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-teal-900">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span>نقشه راه اتصال به دیتابیس ابری (Cloud Backend Roadmap)</span>
                  </div>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    این پروژه در وضعیت فعلی یک فرانت‌اند با داده محلی مرورگر است و backend یا قرارداد ذخیره‌سازی پایدار ندارد. پیش از انتخاب Firestore یا PostgreSQL باید مدل‌های دامنه، احراز هویت، جداسازی مدرسه و مهاجرت داده جداگانه طراحی شوند؛ typeهای فعلی تضمین‌کننده نگاشت یک‌به‌یک به پایگاه داده نیستند.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Investor & Stakeholder Deck */}
          {activeTab === 'investors' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    فرضیه‌های محصول برای ارزیابی آینده
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    این نمونه شواهدی درباره درآمد، صرفه‌جویی یا برتری بازار ارائه نمی‌کند؛ موارد زیر فقط پرسش‌هایی برای اعتبارسنجی با مدرسه‌ها هستند.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-emerald-800 block">۱. هزینه اطلاع‌رسانی</span>
                    <h5 className="font-bold text-xs text-slate-900">نیازمند اتصال و سنجش واقعی</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ارسال پیامک و بله در این نمونه فعال نیست؛ هیچ کاهش هزینه‌ای اندازه‌گیری نشده است.
                    </p>
                  </div>

                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-teal-800 block">۲. مدل درآمدی</span>
                    <h5 className="font-bold text-xs text-slate-900">قیمت‌گذاری هنوز اعتبارسنجی نشده</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      اشتراک مدارس یا قرارداد منطقه‌ای در محصول پیاده‌سازی یا آزمایش نشده است.
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-indigo-800 block">۳. حامیان آموزشی</span>
                    <h5 className="font-bold text-xs text-slate-900">نیازمند سیاست و آزمون محصول</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      نمایش نمونه حامی در رابط وجود دارد؛ فروش تبلیغ، هدف‌گیری مخاطب و درآمد واقعی فعال نیست.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-purple-800 block">۴. فرایند مالی</span>
                    <h5 className="font-bold text-xs text-slate-900">ثبت محلی و پرداخت نمایشی</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      درگاه بانکی یا پیام‌رسان متصل نیست و داده‌ای برای ادعای کاهش تأخیر وجود ندارد.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>موارد قابل ارزیابی در نمونه رابط:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>رابط RTL و نوار ناوبری موبایل</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>بانک سوال نمونه در مرورگر</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>پیش‌نمایش شش نقش نمونه</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>روند تغییر سال با کنترل‌های محدود نمونه</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-right">
            پلتفرم هوشمند مدیریت قطب مدارس شهرستان • تمامی مستندات در فایل‌های <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">docs/PRODUCT_FEATURES.md</code> و <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">docs/ARCHITECTURE.md</code> نیز در دسترس است.
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            بستن راهنما
          </button>
        </div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>
  );
};
