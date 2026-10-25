# ARCHITECTURE.md — System Architecture & Data Design

> وضعیت فعلی پروژه: فرانت‌اند نمونه با داده محلی مرورگر است. احراز هویت امن، پایگاه داده/همگام‌سازی ابری، ارسال واقعی پیامک یا بله، درگاه بانکی، Object Storage، خروجی PDF اختصاصی و موتور شرکت در آزمون وجود ندارد. نقش‌ها و مجوزها در مرورگر برای پیش‌نمایش و کنترل جریان رابط‌اند و مرز امنیتی تولیدی نیستند. جزئیات backend در این سند، نقشه‌راه است.

### حضور و غیاب و ساعت مدرسه — مرحله ۵

- `getSchoolClock` تاریخ شمسی، روز هفته و ساعت تهران را می‌دهد؛ Context هر ۳۰ ثانیه ساعت را تازه می‌کند و هنگام ثبت دوباره ساعت واقعی را می‌خواند. ثبت از شناسه برنامه امروز، کلاس همان مدرسه و فهرست کامل دانش‌آموزان فعال مشتق می‌شود؛ زنگ آینده و سال غیرفعال پذیرفته نمی‌شوند.
- `src/utils/attendance.ts` کلید یکتای مدرسه/کلاس/تاریخ/زنگ را می‌سازد. ثبت همان وضعیت اعلان ندارد؛ اصلاح جلسه شناسه را حفظ و نسخه قبلی را در `previousVersions` نگه می‌دارد. خروجی عمومی Context نسخه‌های تاریخی داخلی را ارائه نمی‌کند. تغییر به غایب/تأخیر و اصلاح آن‌ها اعلان آزمایشی با شناسه جلسه و revision می‌سازد؛ بله در نبود شناسه ولی به پیامک برمی‌گردد.
- آمار از جلسه‌های یکتا و روزهای ثبت‌شده تا امروز مشتق می‌شود. هر روز فقط یک بار با ترتیب شدت غایب، تأخیر، موجه، حاضر شمرده می‌شود. خلاصه قبلی در `legacyAttendanceStats` جدا نگهداری می‌شود. `attendanceAcademicYearId` پس از بازنشانی سال محدوده آمار را مشخص می‌کند؛ چرخه کامل سال در مرحله ۷ باقی است.
- نرخ امروز فقط دانش‌آموزان دارای ثبت را در مخرج دارد و تعداد ثبت‌شده نمایش داده می‌شود. نبود ثبت «ثبت نشده» یا خط تیره است. پرونده ردیف‌های واقعی تاریخ/زنگ را نشان می‌دهد.
- پنل دبیر پیش‌نویس مستقل هر جلسه، جستجوی بدون حذف ردیف‌ها از ثبت و نوار ثبت بالای ناوبری موبایل دارد. تأیید بصری موبایل به علت محدودیت اتصال مرورگر باز است؛ B-001.

### دفتر نمره و کارنامه — مرحله ۶

- `src/utils/gradeUtils.ts` ورودی نمره را پیش از تبدیل از ارقام فارسی/عربی/لاتین یکسان می‌کند. مقدار خالی، نامعتبر، خارج سقف، roster ناقص یا تکراری رد می‌شود؛ صفر یک نمره معتبر صریح است. `addGradeItem` در Context همان قاعده سقف و کلاس/مدرسه/نقش را نیز بررسی می‌کند.
- ارزشیابی‌های `GradeItem` در دفتر نمره باقی می‌مانند. پنجره پرونده آن‌ها را جدا از snapshotهای `ReportCard` نمایش می‌دهد. هیچ محاسبه معدل رسمی از category یا maxScore استنتاج نشده؛ B-002 تعیین سیاست آموزشی را ثبت می‌کند.
- `formatPersianScore` ارقام ورودی را هم فارسی‌سازی و تا دو رقم اعشار نگهداری می‌کند. کارنامه در موبایل کارت درس دارد و در صفحه بزرگ جدول نمایش داده می‌شود.

### چرخه سال تحصیلی — مرحله ۷

- `src/utils/academicYear.ts` تنها کارنامه نوبت دومِ منتشرشده با نمره‌های معتبر و وضعیت قبول در همه درس‌ها را برای ارتقا/فراغت می‌پذیرد. معدل تازه محاسبه نمی‌شود؛ خلاصه سابقه فقط مقادیر موجود در کارنامه را کپی می‌کند. کارنامه ناقص، نامعتبر یا فاقد نتیجه با برچسب مناسب می‌ماند.
- `rolloverAcademicYear` فقط از سال فعال مدرسه اجرا می‌شود، عنوان سال پیوسته و تکراری نبودن آن را بررسی می‌کند و سال‌های مدرسه‌های دیگر را دست نمی‌زند. دانش‌آموز ارتقایافته به کلاس یکتا با پایه/رشته سازگار می‌رود؛ نبود مقصد به `pending_class_assignment` و تعیین کلاس دستی می‌انجامد.
- شمار `ClassGroup.studentCount` در داده قابل مشاهده از دانش‌آموزان فعال همان مدرسه و کلاس محاسبه می‌شود؛ شمارنده‌های ذخیره‌شده قدیمی منبع حقیقت نیستند.
- تمام عملیات اجرایی دانش‌آموز، حضور، برنامه، انضباط، ارزشیابی، تکلیف، آزمون و امور مالی در سال غیرجاری مسدودند. `Header` و داشبورد محدودیت را اعلام می‌کنند. داده‌های غیرجاری در این نسخه snapshot جامع ندارند و نما آن‌ها را به سال انتخابی فیلتر نمی‌کند؛ بنابراین این رفتار آرشیو واقعی نیست و B-003 باز می‌ماند.
- `ReportCard` و `AttendanceSession` سال دارند، ولی `GradeItem`, `HomeworkItem`, `DisciplinaryRecord`, `ClassGroup` و `StudentFinancialSummary` تفکیک سالی کامل ندارند. تغییر `Student.grade` نیز تنها وضعیت فعلی را نگه می‌دارد.

> وضعیت اصلاح‌شده و محدودیت‌های باز: [REPAIR_PROGRESS.md](./REPAIR_PROGRESS.md) و [REPAIR_BLOCKERS.md](./REPAIR_BLOCKERS.md). طراحی‌های آتی backend و آرشیو سالانه در بخش‌های بعد نقشه‌راه‌اند، نه قابلیت فعال.

### زمان‌بندی، ذخیره محلی و نمایش آزمایشی — مرحله ۸

- برنامه به دبیر واقعی همان مدرسه/کلاس وصل است. `scheduleConflict` تداخل همان کلاس یا همان دبیر را در مدرسه، روز و زنگ یکسان کنترل می‌کند؛ تشخیص زنگ جاری از ساعت تهران است.
- آزمون جدید بدون سؤال آغاز می‌شود و count از `questions.length` می‌آید. مدل فعلی زمان‌بندی آزمون را نگه می‌دارد؛ موتور شرکت/تصحیح آنلاین ندارد.
- `readStoredValue` در برابر JSON/ساختار خراب fallback می‌دهد و کلید آسیب‌دیده را از overwrite حفظ می‌کند. خطای خواندن، نوشتن و بازنشانی با پیام رابط گزارش می‌شود.
- پیوست‌های محلی با Data URL در localStorage نگهداری می‌شوند و سقف هر فایل ۲ MiB است؛ این روش Object Storage نیست و ممکن است به سقف کلی storage برسد.
- مدال‌های اصلاح‌شده و Toast با Motion و احترام به کاهش حرکت transition دارند. Toast در موبایل بالای ناوبری پایین و محدوده امن صفحه قرار می‌گیرد.

### وضعیت اصلاح مرحله‌های ۱ و ۲

- TypeScript با `strict: true` و تعریف تایپ رسمی React/React DOM بررسی می‌شود. تایپ Lucide از خود بسته رسمی تأمین می‌شود.
- `canManageSchoolAction` در `src/utils/permissions.ts` سیاست نقش/مجوز را تعیین می‌کند؛ `canManageSchool` در Context، ناوبری موبایل و ریشه مدال‌ها از آن استفاده می‌کنند. عملیات تغییردهنده Context نیز نقش یا مجوز را بررسی می‌کنند. این کنترل‌های مرورگر جای احراز هویت و مجوز سمت سرور نیستند.
- `sendNotification(NotificationInput)` ثبت آزمایشی اعلان و Toast را متمرکز می‌کند؛ هیچ پیام واقعی ارسال نمی‌شود.
- کلاس با `addClassGroup` ساخته و با `deleteClassGroup` حذف می‌شود. کلاس دارای دانش‌آموز یا برنامه حذف نمی‌شود. محدودیت ظرفیت کلاس هنوز مدل‌سازی نشده است.
- تکلیف با `teacherId`, `assignedDate`, `status` ذخیره می‌شود. سؤال آزمون از `question`, `correctAnswer`, `score` استفاده می‌کند؛ تعداد نمایشی از `questions.length` است. آزمون‌ساز فعلی همچنان نمونه است.

### محدوده داده و هویت — مرحله ۳

- آرایه‌های داخلی Context مجموعه کامل داده‌ها را برای ذخیره‌سازی حفظ می‌کنند؛ مقادیر عمومی `useApp()` با مدرسه و نقش فیلتر می‌شوند. مدیر پلتفرم برای داده‌های منطقه‌ای دید سراسری دارد. دبیر تنها کلاس‌های انتصابی و برنامه و تکالیف خودش را می‌بیند؛ والد و دانش‌آموز تنها پرونده مرتبط با حساب و داده‌های کلاس همان پرونده را دریافت می‌کنند.
- `UserProfile.studentId` و `childStudentId` به `Student.id` متصل‌اند. `currentStudent` از این پیوند به دست می‌آید. نبود پیوند یا انتخاب مدرسه متفاوت، حالت خالی ایجاد می‌کند؛ اولین دانش‌آموز جایگزین نمی‌شود. حساب‌های فعلی همچنان حساب نمایشی‌اند؛ مدیر در پیش‌نمایش مدرسه از مشخصات همان مدرسه استفاده می‌کند.
- `src/utils/accessScope.ts` قواعد خواندن پرونده، اطلاعیه، سؤال و اعلان را نگه می‌دارد. اطلاعیه `schoolId='all'` و سؤال اشتراکی منطقه‌ای استثنای مجازند. سؤال خصوصی قدیمی بدون schoolId فقط با نام یکتای مدرسه قابل انتساب است.
- اعلان‌های جدید `schoolId` و در صورت مخاطب دانش‌آموزی `studentId` دارند. سابقه قدیمی والد تنها با تطبیق یکتای مدرسه، نام دقیق دانش‌آموز و شماره ولی نمایش داده می‌شود؛ سوابق مبهم حذف نمی‌شوند و به والد نسبت داده نمی‌شوند.
- عملیات Context مالک مدرسه، کلاس مقصد و در عملیات والد/دانش‌آموز، مالک پرونده را بررسی می‌کنند. تعرفه و rollover فقط ردیف‌های مدرسه جاری را تغییر می‌دهند. پین اطلاعیه نیز مدرسه‌های دیگر را تغییر نمی‌دهد. بازنشانی کامل نمونه فقط برای مدیر پلتفرم در دسترس است.
- انتقال بین مدارس از `findStudentForEnrollment` با کد ملی کامل ده‌رقمی و مجوز ثبت‌نام آغاز می‌شود و `addStudent` هویت و سابقه موجود را حفظ می‌کند. فهرست عادی دانش‌آموزان امکان مرور پرونده سایر مدارس را نمی‌دهد.
- `AcademicYear.schoolId` برای سال‌های جدید ثبت می‌شود. تنها سال‌های قدیمی با شناسه شناخته‌شده داده نمونه به school-1 منتسب می‌شوند. سال سفارشی قدیمی بدون مدرسه محفوظ می‌ماند ولی در نمای عادی مدرسه نمایش داده نمی‌شود؛ تعیین مالک آن نیاز به اطلاعات منشأ دارد. مدل‌سازی کامل آرشیو سالانه همچنان مرحله ۷ است.
- تغییر مدرسه/نقش/معاون، انتخاب پرونده و فرم‌های باز را پاک می‌کند. پرونده انتخابی با شناسه از آرایه جاری مشتق می‌شود؛ snapshot قدیمی پرونده نگهداری نمی‌شود.

### یکپارچگی مالی — مرحله ۴

- `src/utils/financialLedger.ts` منطق محاسبه و تغییر وضعیت را به صورت توابع بدون اثر جانبی پیاده می‌کند. مبالغ، عدد صحیح امن بر حسب تومان‌اند. صورتحساب از `originalAmount` تعرفه‌های تخصیص‌یافته، تخفیف از همان ردیف‌ها و پرداختی فقط از اسناد `confirmed` محاسبه می‌شود. جمع پرداخت ریز تعرفه‌ها و اقساط با مجموع وصولی برابر است.
- اسناد دارای `feeItemId` ابتدا به همان تعرفه تخصیص می‌یابند؛ پرداخت عمومی سپس به ترتیب سررسید تعرفه و شناسه تخصیص می‌یابد. اقساط به ترتیب سررسید و شناسه تسویه می‌شوند. تاریخ/شناسه سند، ترتیب بازپخش اسناد تأییدشده را ثابت می‌کند.
- `pending_verification` و `rejected` سند باقی می‌مانند و اعتبار ایجاد نمی‌کنند. تأیید مجدد هم‌وضعیت بدون اثر است. لغو تأیید، مانده و اقساط را از اسناد باقی‌مانده دوباره محاسبه می‌کند. رسیدهای در انتظار، ظرفیت بدهی را رزرو نمی‌کنند؛ تأیید هر سند دوباره محدودیت مانده را بررسی می‌کند.
- شماره پیگیری پس از تبدیل ارقام، همراه روش پرداخت برای تشخیص ثبت تکراری استفاده می‌شود. مبالغ نامعتبر، اضافه‌پرداخت و تخفیف بیش از مانده تعرفه رد می‌شوند؛ بستانکاری یا بازپرداخت خودکار پیاده‌سازی نشده است.
- تخفیف مبلغ ثابت با علت، ثبت‌کننده و تاریخ در `StudentDiscountRecord` ذخیره می‌شود. مبلغ اقساط پرداخت‌نشده از آخرین سررسید کاهش می‌یابد و `PaymentInstallment.originalAmount` مقدار اولیه را حفظ می‌کند. `FinancialAuditEntry` عملیات، مرجع، ثبت‌کننده و جمع‌های قبلی را نگه می‌دارد.
- خلاصه‌های قابل محاسبه در رابط از اسناد مشتق می‌شوند؛ بارگذاری، سوابق موجود را با داده نمونه جایگزین نمی‌کند. حساب جدید بدون سوابق، صفر است. اگر ریز اسناد ناقص، مبلغ نامعتبر یا جمع اقساط ناسازگار باشد، داده اصلی حفظ و خطای قابل بررسی نمایش داده می‌شود. این حساب‌ها از جمع آمار معتبر کنار گذاشته می‌شوند و عملیات عادی آن‌ها متوقف می‌شود؛ ابزار تطبیق دستی حساب تاریخی هنوز ساخته نشده است.
- همه تغییرات دانش‌آموز از snapshot همگام محلی عبور می‌کنند تا ثبت‌های سریع متوالی بر آخرین وضعیت اعتبارسنجی شوند. اعلان و خطای فرم خارج از تابع تغییر حالت React تولید می‌شوند. `FinancialActionResult` موفقیت/خطا را به فرم برمی‌گرداند. این سازوکار، تراکنش پایگاه داده یا تضمین هم‌زمانی چند مرورگر نیست.
- رسید دستی والد همیشه در انتظار تأیید مدرسه است. پرداخت آنلاین نسخه فعلی تأیید آزمایشی با `isSimulated` است و در محاسبات نمونه شرکت می‌کند؛ اتصال بانکی و OTP واقعی وجود ندارد. اعلان‌ها نیز همچنان محلی و آزمایشی‌اند.
- ویرایش/حذف تعرفه تخصیص‌یافته و حذف دانش‌آموز دارای سابقه مالی ممنوع است. هر تخصیص جدید یک سررسید با تاریخ تعرفه ایجاد می‌کند؛ بدون تاریخ، سررسید نامشخص می‌ماند. ساخت برنامه چندقسطی از `defaultInstallmentsCount` و تفکیک کامل حساب سالانه هنوز پیاده‌سازی نشده‌اند.

This document details the architectural blueprint, data flow, entity relationships, and cloud integration roadmap for the **Smart School Cluster Management System** (سامانه هوشمند قطب مدارس شهرستان).

> 📌 **Looking for the complete Feature Catalog & Investor Deck?**
> Refer to [`docs/PRODUCT_FEATURES.md`](./PRODUCT_FEATURES.md) for the structured breakdown of all system capabilities, workflows, and business models.

---

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|  +-----------------------------------------------------------------------------+  |
|  |             Header & RoleQuickSwitch (Instant Multi-Persona Switching)       |  |
|  +-----------------------------------------------------------------------------+  |
|  |                                                                             |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  | Platform Admin    |  | Principal & VP     |  | Teacher Dashboard      |  |  |
|  |  | (County-wide KPI, |  | (Class grouping,   |  | (Attendance, Grading,  |  |  |
|  |  |  Sponsor Ads,     |  |  Schedule Planner, |  |  Online Exams,         |  |  |
|  |  |  Schools overview)|  |  Permissions)      |  |  Question sharing)     |  |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  +----------------------------------------+  +---------------------------+  |  |
|  |  | Student Dashboard                      |  | Parent Dashboard          |  |  |
|  |  | (Timetable, Homework, Daily Question)  |  | (Bale/SMS Alerts, Dossier)|  |  |
|  |  +----------------------------------------+  +---------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|  |               MobileBottomNav (Thumb-friendly mobile navigation)             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        APPLICATION REACTIVE STATE (AppContext)                    |
|  - Students State        - Classes & Schedule      - Question Bank Repository     |
|  - Attendance Engine     - Announcements & Posts   - Outbound Bale/SMS Dispatcher |
|  - VP Permissions State  - Active School Profile   - Sponsor Advertisement Engine |
|  - Financial Ledger      - Installment Schedules   - Multi-Gateway Payment Engine |
+-----------------------------------------------------------------------------------+
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
+------------------------------------+       +------------------------------------+
|  LOCAL IN-MEMORY MOCK DATA ENGINE  |       |  FUTURE CLOUD BACKEND (ROADMAP)    |
|  - High-fidelity Persian datasets  |       |  - Google Cloud Firestore / Auth   |
|  - Synchronous immediate updates   |       |  - Real National SMS Webhooks      |
|  - Browser session persistence     |       |  - Bale Messenger Bot API (Webhook)|
+------------------------------------+       +------------------------------------+
```

---

## 2. Core Domain Models & Entity Relationships

The domain entities are strictly typed in `src/types.ts`:

### 1. `School`
Represents an educational facility within the county:
- `id: string`
- `name: string` (e.g. دبیرستان شهدای فرهنگی)
- `code: string` (National school code)
- `principalName: string`
- `type: 'public' | 'private' | 'talented'` (دولتی، غیردولتی، تیزهوشان، نمونه دولتی)
- `totalStudents: number`, `totalTeachers: number`
- `address: string`, `phone: string`

### 2. `Student` & Academic Dossier
Comprehensive record of each learner:
- Identifiers: `id`, `name`, `nationalCode`, `studentId`, `grade`, `classId`
- Guardian contact: `fatherName`, `parentPhone`, `parentBaleAccount`
- Attendance statistics: `presentDays`, `absentDays`, `lateDays`, `excusedDays`
- Official report cards: `ReportCard[]` (Term 1 & Term 2, subject grades, credits, GPA)
- Discipline history: `DisciplineRecord[]` (Demerits, awards, notes, date, loggedBy)
- Historical academic trends: `academicHistory[]` (GPA of Grades 7, 8, 9)

### 3. `ClassGroup` & `ScheduleSlot`
Represents physical cohorts and weekly timetable:
- `ClassGroup`: `id`, `schoolId`, `name`, `grade`, `major?`, `room`, `studentCount`. ظرفیت در مدل فعلی وجود ندارد.
- `ScheduleSlot`: `id`, `schoolId`, `classGroupId`, `dayOfWeek` (شنبه تا چهارشنبه), `period` (۱ تا ۴), `subject`, `teacherId`, `teacherName`, `startTime`, `endTime`

### 4. `QuestionBankItem` (Regional Question Bank)
County-wide crowdsourced test and exam question bank:
- `id: string`
- `schoolId: string`, `authorName: string`
- `subject: string`, `grade: string`, `topic: string`
- `difficulty: 'آسان' | 'متوسط' | 'دشوار'`
- `type: 'تستی' | 'تشریحی'`
- `title: string`, `content: string`, `options?: string[]`, `correctAnswer?: string`

### 5. `Announcement` (Announcements & Events)
School publication engine:
- `type: 'announcement' | 'news' | 'event' | 'event_report'`
- `priority: 'normal' | 'important' | 'urgent'`
- `target: 'all' | 'parents' | 'teachers' | 'students'`; sender fields: `senderName`, `senderRole`.

### 6. `NotificationLog` & `NotificationInput` (Bale / SMS Simulation)
Outbound message log:
- Input platform: `'bale' | 'sms'`; stored/displayed platform: `'بله' | 'ایتا' | 'پیامک'` (ایتا فقط در قرارداد سابقه وجود دارد).
- `recipientName: string`, `recipientPhone: string`, `studentName: string`
- `message: string`, `timestamp: string`, `status: 'delivered' | 'sent'`; optional `type` categorizes general, attendance and financial notifications.

### 7. `SchoolFeeItem`, `StudentFinancialSummary` & `PaymentTransaction`
Tuition, service, extracurricular fees, and installment accounting engine:
- `SchoolFeeItem`: `id`, `schoolId`, `academicYearId`, `title`, `category`, `amount`, `isMandatory`, `targetScope`, `defaultInstallmentsCount?`, `dueDate?`, `createdAt`.
- `FeeCategory`: `tuition`, `registration_insurance`, `extracurricular`, `transportation`, `catering`, `uniform_supplies`, `camp_event`, `custom`.
- `PaymentInstallment`: `id`, `title`, `amount`, `originalAmount?`, `dueDate`, `paidAmount`, `status` (`paid` | `pending` | `overdue` | `partially_paid`), `trackingCode?`.
- `PaymentTransaction`: `id`, `studentId`, `studentName`, `schoolId`, `amount`, `date`, `trackingCode`, `method` (`online` | `card_to_card` | `pos` | `bank_receipt` | `cheque` | `cash`), `status` (`confirmed` | `pending_verification` | `rejected`), `recordedBy`.
- `StudentFeeAssignment` stores per-fee original/discount/final/paid amounts. `StudentDiscountRecord` stores granted amount, reason, actor and date; a standalone configurable `DiscountItem` entity is not implemented.
- `StudentFinancialSummary`: `totalBilled`, `totalDiscount`, `totalPaid`, `remainingDebt`, `status`, `assignedFees`, `installments`, `transactions`, optional `discounts` and `audit`. It is nested in `Student`.
- Known legacy methods `online_gateway` and `cash_deposit` are normalized on student-data loading. Online simulation is marked with `PaymentTransaction.isSimulated`.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Module / Feature | Platform Admin | Principal | Vice Principal | Teacher | Student | Parent |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Regional Schools Analytics | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Regional Sponsors | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| VP Permission Delegation | ❌ | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| School Finances, Fees & Ledger | ❌ | ✅ Full | 🔑 Permitted | ❌ | 👁️ Summary | ✅ Pay & Slips |
| Class Grouping & Student Reg. | ❌ | ✅ Full | 🔑 Permitted | ❌ | ❌ | ❌ |
| Weekly Timetable Editing | ❌ | ✅ Full | 🔑 Permitted | ❌ | ❌ | ❌ |
| School News & Announcements | ❌ | ✅ Full | 🔑 Permitted | ❌ | ❌ | ❌ |
| Student Dossier (Academic/Discipline)| ❌ | ✅ Full | 🔑 Permitted | 👁️ View Only | 👁️ Own Only | 👁️ Child Only |
| Edit Parent Contact Info | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ Child Only |
| Class Attendance Recording | ❌ | ✅ | ✅ | ✅ Assigned | ❌ | ❌ |
| Gradebook & Exam Entry | ❌ | 👁️ View | 👁️ View | ✅ Assigned | ❌ | ❌ |
| Practice Question Bank | ✅ Admin | 👁️ View | 👁️ View | ✅ Contribute | 👁️ Practice | ❌ |

*(🔑 Permitted = Subject to checkboxes set in `VicePrincipalPermissionsModal` by the Principal)*

---

## 4. Bale Messenger & SMS Gateway Pipeline

In Iranian educational ecosystems, parental engagement relies heavily on instant SMS and the domestic **Bale Messenger (پیام‌رسان بله)**.

### Dispatch Flow:
1. **Trigger Event:** Teacher/VP marks a student as `غایب` (Absent) or `با تاخیر` (Late) in attendance.
2. **Notification Synthesizer:** `sendNotification()` in `AppContext.tsx` generates an authoritative Persian message citing student name, school name, exact time, and next recommended action.
3. **Dispatch Channel:** The notification engine routes the payload to the student's registered Bale ID (if present) and fallback GSM SMS number.
4. **Real-Time Delivery Notification:**
   - A floating animated toast (`NotificationToast.tsx`) displays live delivery status.
   - The message is stored in the persistent drawer in `Header.tsx` for auditing.

---

## 5. Roadmap to Cloud Backend (Firestore / Cloud SQL Migration)

When migrating from in-memory state to a production database:

### Collection Mapping for Firestore:
- `/schools/{schoolId}`
- `/schools/{schoolId}/fees/{feeId}`
- `/schools/{schoolId}/transactions/{transactionId}`
- `/schools/{schoolId}/classes/{classId}`
- `/schools/{schoolId}/students/{studentId}`
  - Sub-collection: `reportCards/{termId}`
  - Sub-collection: `disciplineLogs/{logId}`
  - Sub-collection: `financialDossier/summary` (with `installments` and `transactions`)
- `/schools/{schoolId}/schedule/{scheduleId}`
- `/schools/{schoolId}/posts/{postId}`
- `/questionBank/{questionId}` (shared across all schools in county)
- `/notifications/{notificationId}`
- `/sponsors/{sponsorId}`

### Security Rule Principles:
- Platform Admin has global read/write.
- Principals and Teachers read/write within their respective `schoolId`.
- Parents and Students authenticate with their national code and phone number, with strictly constrained read access to their own sub-records.

---

## 6. Student Lifecycle & Regional Sync Architecture

The system models the complete lifecycle of learners across schools in the county:

```
                  ┌──────────────────────────────┐
                  │      جدیدالورود (New)        │
                  └──────────────┬───────────────┘
                                 │ ثبت‌نام / ثبت کد ملی
                                 ▼
+─────────────────────────────────────────────────────────────────+
│                    دانش‌آموز فعال (Active)                      │
│ - کلاسبندی و انتصاب به گروه درسی                                  │
│ - حضور و غیاب روزانه و ارسال هشدار بله/پیامک                     │
│ - نمرات مستمر، تکالیف و کارنامه‌های رسمی نوبت اول و دوم           │
│ - سوابق انضباطی (تشویقی و تذکرات)                               │
+─────────────────┬─────────────────────────────┬─────────────────+
                  │ فارغ‌التحصیلی                │ انتقال به مدرسه دیگر
                  ▼                             ▼
┌─────────────────────────────────┐ ┌─────────────────────────────┐
│    فارغ‌التحصیل (Graduated)      │ │     منتقل‌شده (Transferred)   │
│ - سال فراغت از تحصیل             │ │ - نام مدرسه مقصد             │
│ - قبولی کنکور و نام دانشگاه     │ │ - تاریخ انتقال رسمی          │
│ - رشته قبولی و رتبه منطقه       │ │ - علت جابجایی                │
│ - شبکه ارتباطی نخبگان شهرستان   │ │ - سوابق درسی دست‌نخورده       │
└─────────────────────────────────┘ └──────────────┬──────────────┘
                                                   │
                                                   ▼
                                    ┌─────────────────────────────┐
                                    │    Smart Matching منطقه‌ای  │
                                    │ با ثبت کد ملی در مدرسه جدید  │
                                    │ کل پرونده سوابق متصل می‌شود  │
                                    └─────────────────────────────┘
```

---

## 7. Production Backend Architecture & Database Blueprint

### Current Architecture vs. Production Deployment:

| مؤلفه (Layer) | وضعیت فعلی پروژه (Current Prototype) | معماری پیشنهادی محیط عملیاتی (Production Roadmap) |
| :--- | :--- | :--- |
| **API & Server** | In-Memory React State (`AppContext.tsx`) | Node.js (Express/Fastify) یا Python (FastAPI) یا Go (Fiber) |
| **Primary Database** | State + LocalStorage | **PostgreSQL** با Prisma/Drizzle یا **Google Cloud Firestore** |
| **Cache & Realtime** | React Context Dispatchers | **Redis / Dragonfly** برای کش جلسات، توکن‌ها و صف پیام‌ها |
| **Messaging Gateway**| شبیه‌ساز انیمیشنی (Animated Simulation) | اتصال به وب‌سرویس Kavenegar/Ghasedak + ربات رسمی بله (Bale Bot API) |
| **File / Media Storage**| URL و آیکون‌های محلی | **S3-compatible Object Storage** (MinIO یا ArvanCloud Object Storage) |
| **Auth & Sessions** | Role Quick Switcher (پیش‌نمایش سریع) | JWT HttpOnly Cookies + اعتبارسنجی دو مرحله‌ای پیامکی (OTP) |

---

## 8. Frontend Scalability & High-Concurrency Assessment

### بررسی آمادگی فرانت‌اند برای تعداد کاربر بالا و سرعت روان (High-Load Frontend Readiness):

1. **معماری تک‌صفحه‌ای با کامپوننت‌های ایزوله (Decoupled SPA):**
   - به دلیل تفکیک کامل داشبوردها (`PlatformAdmin`, `Principal`, `Teacher`, `Student`, `Parent`)، هر کاربر فقط کدهای مربوط به پرسونای خود را بارگذاری و اجرا می‌کند.
   - با فعال‌سازی `React.lazy` و Dynamic Imports در روتر، حجم باندل اولیه زیر **120 کیلوبایت** فشرده (Gzip/Brotli) باقی می‌ماند.

2. **بهینه‌سازی رندر و DOM مجازی (Virtual DOM & Virtualization):**
   - برای لیست‌های بیش از ۵۰۰ دانش‌آموز در سطح شهرستان، استفاده از Virtual Scrolling (`@tanstack/react-virtual`) توصیه می‌شود تا تنها المان‌های قابل مشاهده در صفحه رندر شوند و حافظه مرورگر مصرف نشود.

3. **حذف رندرهای اضافه (Zero CSS-Runtime with Tailwind v4):**
   - استفاده از Tailwind CSS v4 کامپایل‌شده در زمان بیلد، هزینه محاسبات استایل در زمان اجرا (Runtime CSS-in-JS) را به صفر رسانده است که روان‌ترین تجربه اسکرول و تعامل لمسی را روی گوشی‌های ضعیف تضمین می‌کند.

4. **پیش‌بینی قابلیت آفلاین و PWA (Service Worker Ready):**
   - فرانت‌اند به راحتی قابلیت تبدیل به PWA را دارد تا دبیران در نقاطی با اینترنت ضعیف (کلاس‌های زیرزمین یا مدارس روستایی)، حضور و غیاب را به صورت آفلاین ثبت کرده و پس از اتصال، با بکند همگام‌سازی (Background Sync) کنند.

5. **الگوی انطباق دوگانه جداول پیچیده در موبایل (Dual-View Responsive Table Pattern):**
   - برای ماژول‌های پرتراکم اداری و مالی (مانند اقساط، بدهکاران، دفتر کل اسناد و لیست دانش‌آموزان)، از ساختار ترکیبی `hidden md:table` و `block md:hidden` استفاده می‌شود.
   - در صفحات موبایل (۳۶۰ الی ۴۸۰ پیکسل)، جداول به کارت‌های چندلایه عمودی با فیلدهای دارای برچسب و دکمه‌های کنترلی با ارتفاع استاندارد لمسی (۴۴ پیکسل) تبدیل می‌شوند تا بدون هیچ‌گونه اسکرول افقی ناخواسته یا بریدگی اطلاعات، ۱۰۰٪ کارایی در اختیار کاربر قرار گیرد.

