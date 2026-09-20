# ARCHITECTURE.md — System Architecture & Data Design

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

### 3. `ClassGroup` & `ScheduleItem`
Represents physical cohorts and weekly timetable:
- `ClassGroup`: `id`, `name`, `grade`, `field` (ریاضی، تجربی، انسانی), `roomNumber`, `capacity`, `studentCount`
- `ScheduleItem`: `id`, `classId`, `dayOfWeek` (شنبه تا چهارشنبه), `periodNumber` (۱ تا ۴), `subject`, `teacherName`, `startTime`, `endTime`

### 4. `QuestionItem` (Regional Question Bank)
County-wide crowdsourced test and exam question bank:
- `id: string`
- `schoolId: string`, `authorName: string`
- `subject: string`, `grade: string`, `topic: string`
- `difficulty: 'آسان' | 'متوسط' | 'دشوار'`
- `type: 'تستی' | 'تشریحی'`
- `title: string`, `content: string`, `options?: string[]`, `correctAnswer?: string`

### 5. `PostItem` (Announcements & Events)
School publication engine:
- `type: 'announcement' | 'news' | 'event' | 'event_report'`
- `priority: 'normal' | 'important' | 'urgent'`
- `targetAudience: 'all' | 'parents' | 'teachers' | 'students'`

### 6. `Notification` (Bale / SMS Engine)
Outbound message log:
- `platform: 'bale' | 'sms'`
- `recipientName: string`, `recipientPhone: string`, `studentName: string`
- `message: string`, `timestamp: string`, `status: 'delivered' | 'pending'`

### 7. `SchoolFeeItem`, `StudentFinancialSummary` & `PaymentTransaction`
Tuition, service, extracurricular fees, and installment accounting engine:
- `SchoolFeeItem`: `id`, `schoolId`, `title`, `category` (`tuition` | `bus` | `extracurricular` | `insurance` | `books` | `other`), `grade`, `amount`, `isMandatory`, `installmentsCount`, `academicYear`
- `InstallmentItem`: `id`, `feeId`, `title`, `amount`, `dueDate`, `paidAmount`, `status` (`paid` | `pending` | `overdue` | `partially_paid`), `trackingCode`
- `PaymentTransaction`: `id`, `studentId`, `studentName`, `schoolId`, `amount`, `date`, `trackingCode`, `method` (`online_gateway` | `card_to_card` | `pos_machine` | `cash_deposit` | `cheque`), `status` (`confirmed` | `pending_verification` | `rejected`), `recordedBy`
- `DiscountItem`: `id`, `title`, `percentage`, `fixedAmount`, `reason`, `approvedBy`
- `StudentFinancialSummary`: `studentId`, `totalBilled`, `totalDiscount`, `totalPaid`, `remainingDebt`, `status` (`settled` | `has_debt` | `overdue`), `installments`, `transactions`, `discounts`

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

