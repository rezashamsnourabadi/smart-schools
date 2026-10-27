# قرارداد API

هم‌مبدأ با رابط، پیشوند /api/v1، JSON UTF-8. OpenAPI از /api/v1/openapi.json دریافت می‌شود؛ schemaهای عمومی آن جای جزئیات اعتبارسنجی ماژول‌ها نیستند.

## هویت

POST /auth/login با username/password مستقیماً نشست می‌سازد و کد دوم درخواست نمی‌کند. POST /auth/challenge با username و purpose=login برای ورود پیامکی بدون رمز و purpose=activate/recover برای فعال‌سازی/بازیابی است؛ POST /auth/verify برای تأیید کد یک‌بارمصرف و ساخت نشست در روش پیامکی، GET /auth/me برای حساب/CSRF/عضویت، POST /auth/logout برای خروج، /auth/password و /auth/phone برای تغییر رمز و شماره بازیابی‌اند. schema دقیق در server/auth.ts است.

نشست کوکی HttpOnly دارد. نوشتن نیازمند X-CSRF-Token و Origin معتبر است. منابع مدرسه از X-Membership-Id و X-Academic-Year-Id استفاده می‌کنند؛ این هدرها مجوز ایجاد نمی‌کنند. مدیر پلتفرم به پرونده مدارس دسترسی خودکار ندارد.

## مسیرهای دامنه

- /workspace و /dashboard: خلاصه محدوده و آمار تجمیعی.
- /resources/:kind: GET صفحه‌بندی و POST؛ /resources/:kind/:id برای PATCH/DELETE مجاز. نوع‌ها در server/schema.ts هستند.
- /students/:id: پرونده مجاز؛ /students/:id/records/:kind: سابقه صفحه‌بندی.
- /classes/:id/roster، /attendance/session و /attendance/daily-absences: کلاس، جلسه و رخداد.
- POST /commands/:action: حضور، مالی، کارنامه و سال؛ actionها و schema در server/commands.ts هستند.
- /accounts: حساب‌ها؛ /files: بارگذاری multipart و دانلود دارای مجوز.

page/pageSize پیش‌فرض 25 و سقف 100 دارند. جستجو و فیلتر به منبع وابسته‌اند. شناسه سمت سرور، مبلغ تومان صحیح، روز معتبر و زمان رخداد UTC است.

نوشتن حساس Idempotency-Key می‌خواهد؛ تکرار همان بدنه/کلید پاسخ قبلی را برمی‌گرداند. بدنه متفاوت با کلید قبلی پذیرفته نیست. پس از خطای شبکه کلید عملیات را حفظ کنید. ویرایش version فعلی می‌خواهد؛ تعارض 409 است و نباید موفق نشان داده شود.

خطا {error:{code,message,requestId}} است. 401/403/404/409/422/429/503 به‌ترتیب احراز هویت، مجوز، نبود منبع، تعارض، ورودی، محدودیت و سرویس ناموجودند. اعلان در outbox همان تراکنش ثبت و worker جدا آن را ارسال می‌کند.


تبلیغ فیلد اختیاری linkUrl دارد؛ در POST/PATCH فقط HTTP و HTTPS بدون username/password پذیرفته است. PATCH /resources/banners/:id مختص platform_admin و دارای version است؛ تعارض ویرایش 409 برمی‌گرداند. شماره 008 migration پیش از اجرای سرور جدید اعمال شود.
