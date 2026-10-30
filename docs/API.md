# راهنمای قرارداد API

تطبیق با کد: **2026-10-30**، migrationهای 001 تا 013. همه مسیرهای جدول‌ها نسبت به `/api/v1` هستند. JSON با UTF-8 و مبدأ واحد رابط استفاده می‌شود. `GET /openapi.json` نشست می‌خواهد؛ schemaهای عمومی جای Zod و کنترل‌های دامنه در کد نیستند.

## نشست، scope و هم‌زمانی

| ورودی | کاربرد |
| --- | --- |
| کوکی نشست | هویت سمت سرور؛ HttpOnly و Secure در تولید |
| `X-Membership-Id` | انتخاب عضویت واقعی؛ نقش و مدرسه را سرور اعتبارسنجی می‌کند |
| `X-Academic-Year-Id` | سال متعلق به مدرسه؛ برای نوشتن مدرسه باید جاری و فعال باشد |
| `X-CSRF-Token` | عملیات تغییردهنده حساب/داده؛ از نشست معتبر دریافت می‌شود |
| `Idempotency-Key` | عملیات محافظت‌شده منابع، commands، accounts، teacher، support، messages، inbox و platform؛ طول ۱۶ تا ۱۰۰ |
| `version` | نسخه فعلی رکورد برای ویرایش‌های مربوط؛ تعارض 409 |

GET مدرسه با scope مجاز اجرا می‌شود. auth شخصی، telemetry و uploadها قرارداد یکسان با منابع JSON ندارند: telemetry از event_id/window، آپلود تیکت از upload key و digest محتوا و auth از قواعد خود استفاده می‌کند. روی همه POSTها فرض idempotency عمومی نکنید.

کلید یک عملیات حساس باید پس از خطای شبکه با همان بدنه حفظ شود؛ استفاده مجدد با بدنه متفاوت پذیرفته نیست. DELETE منابع مربوط از `If-Match` نسخه استفاده می‌کند. URL نقش یا شناسه مقصد به‌تنهایی دسترسی نمی‌سازد.

فهرست منابع عمومی `limit` و `offset` دارند، نه page/pageSize: پیش‌فرض limit=25 و سقف 100. `search` و فیلترهای نوع‌محور مانند classId/date/includeFinance وجود دارند. پیام/تیکت/نظارت اغلب صفحات ثابت ۲۵تایی دارند؛ roster کلاس سقف ۲۰۰ دارد. نوع و مجوز را از ماژول مربوط بخوانید.

## هویت و حساب

| متد و مسیر | رفتار |
| --- | --- |
| POST `/auth/login` | username/password؛ نشست مستقیم، بدون کد دوم اجباری |
| POST `/auth/challenge` | username و purpose؛ ورود پیامکی یا فعال‌سازی/بازیابی |
| POST `/auth/verify` | کد یک‌بارمصرف؛ تغییر رمز در activate/recover حسب قرارداد |
| GET `/auth/me` | هویت، CSRF و عضویت‌های واقعی |
| POST `/auth/logout` | ابطال نشست جاری |
| POST `/auth/password` و `/auth/phone` | امنیت حساب؛ شماره تماس پرونده، شماره احراز هویت نیست |
| GET/POST `/accounts` | فهرست و ایجاد حساب در محدوده اختیار |
| POST `/accounts/:id/memberships` | افزودن عضویت مجاز |
| POST `/accounts/:id/disable` و `/enable` | تغییر وضعیت حساب با مجوز و ابطال نشست‌ها |

ثبت‌نام عمومی وجود ندارد. پیامک تولیدِ تنظیم‌نشده صریحاً ناموجود است؛ کد محلی از وب قابل دریافت نیست. کنترل Origin در development، IP واقعی شبکه میزبان روی پورت 3000 را نیز می‌پذیرد؛ تولید به APP_ORIGIN محدود است.

## مدرسه، آموزش و مالی

| مسیر | رفتار |
| --- | --- |
| GET `/workspace` و `/dashboard` | داده محدوده فعال و آمار تجمیعی نقش |
| GET/POST `/resources/:kind` | فهرست یا ساخت نوع مجاز در server/schema.ts |
| PATCH/DELETE `/resources/:kind/:id` | ویرایش/حذفِ مجاز و نسخه‌دار؛ همه انواع قابل حذف نیستند |
| GET `/students/:id` | پرونده کاملِ مجاز؛ برای دبیر عمومی بسته است |
| GET `/students/:id/records/:kind` | grades یا attendanceSessions، صفحه‌بندی و GradeView برای نمره |
| GET `/classes/:id/roster` | roster محدود کلاس |
| GET `/attendance/session` | جلسه برنامه انتخابی |
| GET `/attendance/daily-absences` | غیبت روز برای نقش مدیریتی مجاز |
| POST `/commands/:action` | عملیات حضور، مالی، کارنامه و چرخه سال؛ schema هر action در commands.ts |

مبلغ تومان صحیح، زمان رخداد UTC و تاریخ روز معتبر با نمایش شمسی/تهران است. داده سال دیگر، مدرسه دیگر و فرمول معدل حدسی نیست. رسید دستی pending_verification تا تأیید مدرسه وصول محسوب نمی‌شود.

دبیر از GET `/teacher/classes`، `/teacher/classroom`، `/teacher/records` و `/teacher/student/:id` با classId/subject استفاده می‌کند. PATCH `/teacher/sessions/:id` و `/teacher/grades/:id` نسخه/علت و مالکیت را کنترل می‌کنند. POST/PATCH `/teacher/events` مشارکت همان درس را مدیریت می‌کنند؛ مجوز از دو آرایه مستقل کلاس و درس ساخته نمی‌شود.

## سیاست مدرسه و نظارت

| مسیر | رفتار |
| --- | --- |
| GET `/school-access` | وضعیت مؤثر عضویت فعلی؛ active/read_only/suspended |
| GET/PATCH `/platform/schools/:id/access` | فقط پلتفرم؛ علت، پایان اختیاری، version و تاریخچه |
| GET `/platform/schools/:schoolId/inspection` | metadata مدرسه، مدیران و سال‌ها |
| GET `.../inspection/years/:yearId/summary` | آمار واقعی همان مدرسه/سال |
| GET `.../inspection/years/:yearId/list/:kind` | students/classes/staff؛ جستجو و فیلتر کلاس |
| GET `.../inspection/years/:yearId/students/:studentId` | پرونده خواندنی و ممیزی‌شده |
| GET `.../students/:studentId/records/:kind` | نمره/حضور با حذف ردیف افراد دیگر |
| GET `.../students/:studentId/files/:fileId` | رسید متصل به همان پرونده و metadata همان مدرسه/سال |

سه ردیف آخر نیز زیر همان مسیر inspection/years هستند. نظارت فقط خواندنی است؛ مسیر نوشتن نظارتی یا ورود به‌جای مدیر مدرسه وجود ندارد. تعلیق مدرسه مجوز نظارتی واقعی پلتفرم را حذف نمی‌کند.

## اطلاعیه و پیام

- منابع announcements مدرسه/منطقه مخاطب، سنجاق، pinExpiresAt و isArchived دارند. ویرایش منطقه فقط برای پلتفرم است. ترتیب سنجاق پیش از LIMIT اجرا می‌شود.
- `notifyInbox:true` فقط انتشار جدید را به job زنگوله وصل می‌کند؛ ویرایش و retry همان عملیات ارسال گروهی تازه ندارند. تحویل با worker است.
- GET `/messages/options` وضعیت تنظیم کانال‌ها را می‌دهد؛ GET `/messages/recipients` مخاطب مجاز و فیلتر مدرسه/نقش/نام را می‌گیرد.
- POST `/messages`: title، body، recipientIds حداکثر ۵۰ عضویت، sms/bale اختیاری. دبیر باید classId/subject معتبر و هدر سال جاری فعال نیز بدهد؛ گیرنده فقط دانش‌آموز/ولی همان کلاس است.
- GET `/inbox/summary` شمار ناخوانده و latestId؛ GET `/inbox` صفحه ۲۵تایی با offset/unread؛ POST `/inbox/:id/read` ثبت خواندن همان عضویت.

read_at، sms_status و bale_status مستقل‌اند. queued موفقیت تحویل نیست؛ sent به معنای پذیرش ارائه‌دهنده است. اطلاعات تماس و chat خصوصی در فهرست گیرندگان برنمی‌گردند. پیام‌های دریافت‌شده قبلی با بایگانی اطلاعیه حذف نمی‌شوند.

## پشتیبانی و فایل

GET/POST `/support/tickets`، GET `/support/tickets/:id`، POST `/support/tickets/:id/replies` و PATCH `/support/tickets/:id` برای گفت‌وگو هستند. عضو فقط تیکت خود در مدرسه منتخب و پلتفرم تیکت‌های مجاز منطقه را می‌بیند. تغییر وضعیت یا assignedTo با version فقط برای پلتفرم است؛ مسئول باید platform_admin فعال باشد. GET `/support/agents` فهرست مسئولان را به پلتفرم می‌دهد.

POST `/support/tickets/:id/files` از multipart تک‌فایل و Idempotency-Key استفاده می‌کند؛ تکرار همان محتوا پاسخ قبلی و محتوای متفاوت با همان کلید تعارض دارد. GET همان مسیر با `/:fileId` دانلود مجاز است. سقف ده فایل در تیکت و هر فایل دو مگابایت است. این فایل‌ها به سال فعال مدرسه وابسته نیستند و در تعلیق قابل استفاده‌اند.

فایل مدرسه از POST `/files` و GET `/files/:id` با purpose، scope سال و مجوز نوع فایل استفاده می‌کند؛ URL امضاشده آن با پیوست تیکت یا دانلود نظارتی قابل تعویض نیست. PDF/تصویر معتبر/DOCX مجاز و HTML/SVG/اجرایی نامجازند.

## بله و آمار

GET `/auth/bale` وضعیت اتصال شخصی؛ POST `/auth/bale/pair` کد ده‌دقیقه‌ای؛ POST `/auth/bale/unlink` قطع اتصال است. POST `/integrations/bale/webhook` مسیر نشست کاربری نیست و secret اپراتور را لازم دارد. فقط پیام خصوصی /start معتبر اتصال می‌سازد؛ جزئیات تنظیم در [OPERATIONS_SETUP](OPERATIONS_SETUP.md) است.

POST `/analytics/events` بسته حداکثر ۲۰ رویداد activity/banner_impression/banner_click/dana_plus_open با event_id می‌گیرد. هویت، scope، زمان و روز تهران در سرور تعیین و تکرار مهار می‌شوند؛ این endpoint اختیار ثبت امور مدرسه نمی‌دهد.

GET `/platform/analytics` بازه days=1..90، schoolId، bannerOffset و schoolOffset دارد و فقط آمار تجمیعی می‌دهد. GET/PATCH `/platform/analytics/retention` سیاست days=90..730، enabled و version است؛ پاک‌سازی با worker، پیش‌فرض فعال ۱۸۰ روز است.

## خطا و پایش

خطا به شکل `{error:{code,message,requestId}}` و در اعتبارسنجی حسب مسیر fields است. HTTPهای 401، 403، 404، 409، 413، 422، 429 و 503 به‌ترتیب هویت، مجوز، نبود منبع، تعارض، اندازه فایل، ورودی، محدودیت درخواست و عدم دسترس‌پذیری‌اند. کدهای SCHOOL_READ_ONLY/SCHOOL_SUSPENDED از خطای مجوز عادی جدا هستند.

GET `/health` زنده‌بودن، `/ready` آمادگی DB/schema/RLS-role و Redis را بررسی می‌کنند؛ ready گواه تحویل پیام یا سلامت همه گردش‌کارها نیست. `/metrics` با Bearer METRICS_TOKEN محافظت می‌شود و بدون تنظیم آن ناموجود است. همه پاسخ‌های API no-store هستند.

## صدای مدرسه (/api/v1/community) — migration 014

همه مسیرها نشست/عضویت مجاز می‌خواهند. نوشتن CSRF و Idempotency-Key و محدودیت مدرسه دارد. خطاها قرارداد عمومی و 409 برای تعارض نسخه/پاسخ تکراری دارند. فهرست‌ها offset و صفحه ثابت ۲۵تایی دارند.

| مسیر | رفتار |
| --- | --- |
| GET/POST /community/feedback | فهرست مجاز یا ثبت title/body/anonymous توسط دانش‌آموز/ولی؛ مدیر/معاون canManageFeedback و پلتفرم رسیدگی دارند |
| PATCH /community/feedback/:id | version و reply؛ ثبت نتیجه بررسی |
| POST /community/feedback/:id/identity | فقط پلتفرم؛ reason حداقل ده و حداکثر هزار حرف؛ ثبت audit و بازگرداندن نام/شناسه ورود |
| GET /community/classes | کلاس‌های سال برای سازنده مجاز؛ search و offset |
| GET/POST /community/surveys | فهرست نقش/مخاطب یا ساخت توسط مدیر/معاون canManageSurveys؛ title/description/questions/audience/classIds |
| GET /community/surveys/:id | نظرسنجی مخاطب همان عضویت و سال؛ ورود از زنگوله |
| PATCH /community/surveys/:id | version/status و draft اختیاری هنگام انتشار؛ draft→published→closed |
| POST /community/surveys/:id/responses | answers با کلید UUID سؤال و مقدار متن/گزینه/عدد یک تا پنج؛ هر عضویت یک پاسخ نهایی |
| GET /community/surveys/:id/results | فقط مسئول نظرسنجی/پلتفرم؛ تجمیع، تعداد مشارکت و پاسخ فردی صفحه‌بندی‌شده |

پرسش حداکثر ۳۰، گزینه ۲ تا ۱۰ متفاوت، متن پاسخ حداکثر دوهزار حرف و مخاطب student/parent/teacher است. کلاس فقط برای دانش‌آموز/ولی؛ دبیران مخاطب کل مدرسه‌اند. انتشار فهرست مخاطبان فعال را ثابت می‌کند؛ ثبت‌نام‌های بعدی خودکار به نظرسنجی قبلی افزوده نمی‌شوند.

GET /community/surveys اکنون pending=true/false (پیش‌فرض false) می‌پذیرد. true فقط published و بدون پاسخ عضویت فعلی را قبل از LIMIT/OFFSET انتخاب می‌کند؛ مجوز مدرسه/سال/مخاطب قبلی حفظ است. برای نمایش کارت‌های موقع نیاز زیر تبلیغ استفاده می‌شود و migration جدید ندارد.

## ارزشیابی دبیران — migration 015

بدنه پیش‌نویس kind=standard (پیش‌فرض) یا evaluation می‌پذیرد. evaluation فقط audience=['student'] دارد؛ classIds اختیاری است. انتشار بر اساس assignedClassIds دبیران فعالِ همان مدرسه/سال، آیتم evaluation_item برای هر دبیر/کلاس و مخاطبان فعال می‌سازد. ساخت دستی آیتم مجاز نیست. فهرست surveys فقط ریشه‌ها را برمی‌گرداند؛ answered و pending برای دوره از پاسخ همه آیتم‌های مجاز محاسبه می‌شوند. POST responses روی ریشه evaluation رد می‌شود.

GET /community/surveys/:id/targets برای ریشه دوره: items,total,answeredTotal با offset و search نام دبیر/کلاس، صفحه ۲۵تایی؛ مسئول مجاز همه آیتم‌های مدرسه و پاسخ‌دهنده فقط آیتم‌های مخاطب خودش را می‌بیند. آیتم‌ها شامل شناسه/نام دبیر و کلاس و وضعیت پاسخ‌اند.

GET /community/surveys/:id/results فیلترهای اختیاری teacherId و classId می‌پذیرد. در ریشه ارزشیابی، آیتم‌ها تجمیع می‌شوند؛ پاسخ‌ها با teacherName/className همراه‌اند. شمار total/responseTotal در این گزارش، تعداد ارزیابیِ دبیر/عضویت است. بستن ریشه همه آیتم‌ها را تراکنشی می‌بندد؛ تغییر مستقیم وضعیت آیتم رد می‌شود.

## اصلاح قرارداد رسیدگی و پیش‌نویس — migration 016

GET /community/feedback دارای search (حداکثر ۱۰۰ حرف)، status=all/new/reviewed و offset است. برای پلتفرم schoolId اجباری است. GET /community/feedback/:id نیز فقط برای مالک/مسئول مجاز و برای پلتفرم با schoolId همان پیام است؛ projection ناشناس فاقد شناسه مالک است.

PATCH /community/feedback/:id: version اجباری؛ reply اختیاری با طول ۳ تا ۴۰۰۰ حرف و status اختیاری new/reviewed؛ حداقل یک تغییر باید مشخص باشد. reply بدون status، وضعیت را reviewed می‌کند. تغییر متن پاسخ، یک پیام inbox kind=feedback با referenceId پیام اصلی می‌سازد؛ متن یکسان/صرف تغییر وضعیت پیام تازه نمی‌سازد. reply پیام رسمی فعلی را جایگزین می‌کند و تاریخچه گفت‌وگو ندارد.

GET /community/surveys برای پلتفرم schoolId اجباری و yearId اختیاری دارد. PATCH نظرسنجی status=draft را برای ذخیره مستقل پیش‌نویس نیز می‌پذیرد؛ draft→draft/published و published→closed مجازند. انتشار بدون مخاطب فعال رد و تراکنش rollback می‌شود. قرارداد آماری unchanged است؛ رابط فقط درصدِ سؤال choice و میانگینِ rating را معیار اصلی قرار می‌دهد.
