import type {VicePrincipalPermissions} from '../types';

export const vicePrincipalPermissionItems: { key: keyof VicePrincipalPermissions; title: string; desc: string }[] = [
    {
      key: 'canManageAnnouncements',
      title: 'انتشار و مدیریت اطلاعیه‌ها و اخبار',
      desc: 'ثبت اخبار آموزشگاه و ارسال اعلانات به اولیا و دانش‌آموزان'
    },
    {
      key: 'canManageSchedule',
      title: 'چیدمان و تغییر برنامه هفتگی دروس',
      desc: 'جابجایی ساعات، تخصیص دبیران و ویرایش برنامه کلاسی'
    },
    {
      key: 'canManageStudentsAndClasses',
      title: 'کلاس‌بندی، ثبت‌نام و مدیریت دانش‌آموزان',
      desc: 'افزودن دانش‌آموز، تغییر کلاس، فارغ‌التحصیلی و سوابق انتقالی'
    },
    {
      key: 'canViewFullDossier',
      title: 'مشاهده پرونده جامع و سوابق تحصیلی',
      desc: 'دسترسی کامل به نمرات، شناسنامه سلامت و سوابق سال‌های گذشته'
    },
    {
      key: 'canLogDisciplinary',
      title: 'ثبت موارد انضباطی و تشویقی‌ها',
      desc: 'ثبت تشویق و تذکر؛ تحویل اطلاع‌رسانی به تنظیم و وضعیت سرویس وابسته است.'
    },
    {key:'canManageFeedback',title:'رسیدگی به انتقادات و پیشنهادات',desc:'مشاهده و پاسخ به پیام‌های مدرسه؛ نام فرستنده ناشناس نمایش داده نمی‌شود.'},
    {key:'canManageSurveys',title:'مدیریت نظرسنجی و ارزشیابی دبیران',desc:'ساخت، انتشار و پایان دوره و مشاهده نتایج فردی و تجمیعی'},
    {
      key: 'canManageFinances',
      title: 'مدیریت امور مالی و شهریه',
      desc: 'تعرفه‌ها، اسناد پرداخت، تخفیف و یادآوری بدهی'
    }
  ];
