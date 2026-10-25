# MEMORY.md — Agent Memory, Context Tracker & Decision Records

> وضعیت فعلی: مراحل اصلاح ۰ تا ۹ انجام شده‌اند. پروژه فرانت‌اند محلی است؛ ورود واقعی، همگام‌سازی ابری، ارسال پیام/پرداخت واقعی، PDF اختصاصی و آزمون آنلاین فعال نیستند. وضعیت دقیق و مانع‌ها در `REPAIR_PROGRESS.md` و `REPAIR_BLOCKERS.md` آمده‌اند.

### اصلاح مرحله ۵ — حضور و غیاب و موبایل

- منطق جلسه و آمار در `src/utils/attendance.ts` متمرکز است. تاریخ ثابت و `isCurrentPeriod` نمونه مرجع ثبت یا نمایش زنگ جاری نیستند؛ ساعت تهران و برنامه امروز مرجع‌اند.
- `submitAttendance(slotId, records, platform)` نتیجه ساختاریافته می‌دهد و snapshot همگام جلسه‌ها ثبت سریع تکراری را کنترل می‌کند. اعتبار مدرسه/دبیر/سال/زنگ و پوشش کامل کلاس پیش از تغییر بررسی می‌شود. غیبت/تأخیر و اصلاح آن‌ها اعلان خودکار دارند؛ امکان خاموش کردن آن از پنل حذف شد. ارسال واقعی وجود ندارد.
- جلسه اصلاح‌شده شناسه ثابت، revision و snapshot قبلی دارد. خلاصه قدیمی حفظ ولی با روزهای قابل استناد جمع نمی‌شود؛ چند زنگ در یک روز دوباره‌شماری ندارند و آینده منظور نمی‌شود. در rollover خلاصه قدیمی پیش از reset حفظ می‌شود؛ ارزیابی کامل rollover مرحله ۷ است.
- پنل بدون برنامه امروز همچنان ابزار نمره/تکلیف/بانک سؤال و برنامه هفتگی دارد. کنترل وضعیت و پرونده دو دکمه مستقل هستند. ناوبری پایین حداقل ارتفاع ۴۴ دارد؛ Toast با Motion بالای آن و با کنترل بستن ۴۴ پیکسل نمایش داده می‌شود. پیام خطای ثبت داخل فرم می‌ماند.
- بررسی محدود `scripts/check-attendance.ts` مرز روز تهران، تکرار، اصلاح، آمار روزانه، حفظ خلاصه قدیمی و فرمان‌های واقعی Context را پوشش می‌دهد. بررسی مدرسه و مالی نیز موفق بودند. محدودیت تأیید بصری در B-001 ثبت شد. اصلاح موبایل بخش‌های درگیر هر مرحله درخواست صریح کاربر است.

### اصلاح مرحله ۶ — دفتر نمره و کارنامه

- `parseGradeScore` ارقام فارسی/عربی/لاتین، نقطه و جداکننده اعشار عربی را می‌پذیرد. ورودی خالی یا ناقص به صفر تبدیل نمی‌شود. سقف و roster کامل دوباره در `addGradeItem` کنترل می‌شود؛ افزودن نمره فقط برای نقش دبیر و کلاس انتصابی مجاز است.
- فرم تازه خالی شروع می‌شود تا مقدار پیش‌فرض ۱۹ به تمام کلاس ثبت نشود. پرکردن سریع، ورودی دستی و steppers از همان parser استفاده می‌کنند؛ خطا inline است. تاریخ از ساعت تهران می‌آید.
- دفتر نمره و کارنامه رسمی جدا نمایش داده می‌شوند؛ snapshot کارنامه تغییری از ثبت formative نمی‌کند. فرمول معدل و سیاست نوبت‌ها تعریف نشده و در B-002 ثبت شده است.
- در پرونده، مدخل‌های دفتر نمره فعلی کارت موبایل و گزارش کارنامه ذخیره‌شده روی موبایل کارت درس دارند؛ جدول برای md به بالا می‌ماند. تابع format score اعشار دو رقمی را حفظ می‌کند.
- `node --import tsx scripts/check-grades.ts` parser و validator را روی ورودی واقعی مقایسه می‌کند؛ تأیید بصری همچنان B-001 است.

### اصلاح مرحله ۷ — سال‌بندی و ثبت‌نام

- `rolloverStudents` در `src/utils/academicYear.ts` فقط بر اساس کارنامه منتشرشده نوبت دوم با نمره‌های عددی معتبر و وضعیت قبول همه درس‌ها پیشروی می‌کند. معدل از دفتر نمره محاسبه نمی‌شود؛ مقدار ثبت‌شده کارنامه در خلاصه سابقه کپی می‌شود.
- خلاصه سابقه برای دانش‌آموز فاقد کارنامه ساخته نمی‌شود. کارنامه اول سال یا فاقد نتیجه «نتیجه ثبت نشده»، کارنامه دارای تجدید «دارای تجدید» و داده منتشرشده ناسازگار «نیازمند بررسی» است.
- ارتقا بدون کلاس مقصد، پایه جدید را ثبت می‌کند، `classGroupId` را خالی می‌گذارد و `pending_class_assignment` می‌سازد. پنجره مدیریت کلاس‌ها اقدام دستی انتخاب کلاس مقصد را نمایش می‌دهد. شمار کلاس‌ها از دانش‌آموز فعال محاسبه می‌شود.
- سال‌بندی فقط از سال جاری مدرسه، با عنوان پیوسته سال بعد و بدون عنوان تکراری مجاز است. تغییر مدرسه دیگر در rollover مجاز نیست. سال غیرجاری در Context فقط‌خواندنی است؛ نما همچنان داده جامع را براساس سال فیلتر نمی‌کند.
- گزارش کارنامه و جلسه حضور دارای شناسه سال‌اند؛ دفتر نمره، کلاس، تکلیف، انضباط و خلاصه مالی هنوز جداسازی سالی ندارند. آرشیو کامل، فیلتر واقعی هر بخش، و حساب مالی مستقل هر سال به B-003 ارجاع دارد.
- `node --import tsx scripts/check-academic-year.ts` شواهد کارنامه غایب/نوبت اول/تجدید/قبولی، ارقام فارسی/لاتین، داده عددی نامعتبر، کلاس مقصد یکتا/ناموجود، فارغ‌التحصیلی و منع تغییر در سال بایگانی را بررسی می‌کند.

### اصلاح مرحله ۸ — زمان‌بندی، شفافیت و پایداری

- `ScheduleSlot.teacherId` به پروفایل واقعی دبیر متصل است؛ Context مدرسه/انتصاب دبیر را بررسی و تداخل همان کلاس یا دبیر را در روز/زنگ یکسان رد می‌کند. داشبورد دبیر از ساعت تهران بازه جاری را تشخیص می‌دهد و انتخاب دستی کلاس/زنگ را نیز نشان می‌دهد.
- آزمون جدید با فهرست سؤال خالی ساخته می‌شود؛ شمارش از `questions.length` است و موتور پاسخ‌گویی فعال نیست. متن چاپ، پرداخت، اعلان، بانک سؤال و پنل مدیر منطقه، وضعیت محلی/آزمایشی را روشن می‌کند.
- خواندن JSON خراب localStorage به fallback محدود و هشدار می‌رسد؛ کلید خراب برای حفظ داده اصلی از overwrite محافظت می‌شود. خطای نوشتن و بازنشانی گزارش می‌شود. هر پیوست محلی حداکثر ۲ مگابایت است.
- مدال‌های اصلاح‌شده و Toast با `motion/react` ورود/خروج دارند و به `prefers-reduced-motion` احترام می‌گذارند. مسیر بصری موبایل همچنان به B-001 وابسته است.
- `node --import tsx scripts/check-schedule.ts` و `scripts/check-storage.ts` موفق‌اند. `npm run lint` و `npm run build` موفق؛ هشدار chunk بیش از ۵۰۰ kB باقی است.

> روند اصلاح مرحله‌ای: [REPAIR_PLAN.md](./REPAIR_PLAN.md). پیش از ادامه کار، [REPAIR_PROGRESS.md](./REPAIR_PROGRESS.md) و [REPAIR_BLOCKERS.md](./REPAIR_BLOCKERS.md) را بخوانید. مراحل ۰ تا ۹ پیاده‌سازی و بررسی محدود شده‌اند؛ سیاست جلوگیری از تست سنگین و ثبت موانع در برنامه آمده است.

This document preserves the institutional memory, technical decisions, component catalog, and known caveats of this repository. When an AI agent resumes work on this project, reading this file provides immediate situational awareness without having to scan the entire codebase.

---

## 1. Project Context & Milestones Achieved

- **Target Ecosystem:** High school cluster in an Iranian county (دبیرستان‌های قطب آموزشی شهرستان).
- **Current Milestone:** Complete interactive frontend prototype featuring all 6 roles, full mobile navigation, modal managers, Persian numeral normalization, and simulated multi-channel messaging.
- **Languages & Locales:** Persian (Farsi), Solar Hijri calendar (۱۴۰۴-۱۴۰۵), RTL layout.

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: Centralized Single-Context State (`AppContext.tsx`)
- **Decision:** Consolidate all domain state (students, classes, timetable, posts, questions, notifications) in `src/context/AppContext.tsx`.
- **Rationale:** Avoids state divergence when quickly switching between the 6 personas via `RoleQuickSwitch.tsx`. Changes made by the Principal immediately reflect when switching to the Teacher, Parent, or Student view.
- **Future Note:** When integrating Firestore or REST APIs, replace the in-memory state setters with API mutation hooks (React Query or SWR) while preserving the same hook interface `useApp()`.

### ADR-002: Decoupled Persian Numeral Formatter (`persianUtils.ts`)
- **Decision:** Numeric values in state are stored as standard numbers or ASCII strings (e.g. `19.5`, `'09121234567'`, `45`). All visual formatting is performed via `toPersianDigits()`.
- **Rationale:** Writing Persian numerals (e.g. `۴`, `۰`) directly in JavaScript number literals breaks the ESBuild / Vite parser (`Unexpected "۴"`). Decoupled formatting preserves calculation integrity and prevents bundler crashes.

### ADR-003: Granular Vice Principal Permission Flags
- **Decision:** Vice Principal capabilities are governed by a runtime boolean config (`VicePrincipalPermissions`) toggled exclusively by the Principal.
- **Rationale:** In real Iranian schools, some vice principals handle only discipline, while others manage scheduling or curriculum. This reflects real-world institutional flexibility.

### ADR-004: Simulated Notification Feedback (Toast + History Drawer)
- **Decision:** Local notification events trigger a temporary animated toast (`NotificationToast.tsx`) and a simulated entry in `Header.tsx`; no Bale/SMS network delivery occurs.
- **Rationale:** The prototype can preview notification workflows while clearly labeling delivery as simulated.

### ADR-005: Local Academic Year Rollover Preview (`AcademicYearManagerModal.tsx`)
- **Decision:** Model active, planned and prior school years in the browser and provide a guarded local rollover flow.
- **Rationale:** Only eligible students with a published valid final report card advance; actual report-card values are copied to history and missing class placement is explicit. This is not an atomic database operation or a complete archive of every module.

### ADR-006: Transactional Financial Ledger & Multi-Method Tuition Payments
- **Decision:** Implement a dual-level financial management system: an institutional ledger for the Principal/VP (`FinanceManagerModal.tsx`), integrated tab in the student dossier (`StudentFinancialTab.tsx`), and a dedicated 3-step payment flow for parents (`ParentPaymentModal.tsx`).
- **Rationale:** Tuition and services need installment and document records. Current models are `PaymentInstallment`, `StudentDiscountRecord` and `PaymentTransaction`. Parent online payment is a simulation; manual receipt references require school verification. Actual bank receipt file storage and bank gateway integration remain future work. Calculation rules were corrected in ADR-011.

### ADR-007: Mobile-First Responsive Adaptation for Dense Financial Data
- **Decision:** Replace dense desktop tables on selected mobile surfaces with card layouts. Changed high-use controls target a minimum 44px touch height.
- **Rationale:** Financial management modules inherently feature wide columns (installments, due dates, billing, tracking codes, payment actions). On mobile screens (360px–480px), wide tables cause horizontal overflow and clipped cards. Transforming data into native cards preserves 100% of administrative options while maintaining effortless single-handed touch usability.

### ADR-008: Landscape Orientation Fluidity & Mobile-First Grade Entry Refactor
- **Decision:** Optimize all modal overlays and mobile navigation for mobile landscape orientation (aspect ratios with height < 500px and width 640px–900px), and completely refactor `TeacherGradeEntryModal.tsx` to prioritize the student grading list.
- **Rationale:**
  1. **Landscape Phone Constraints:** When phones are rotated horizontally, screen height drops to 350px–420px while width triggers `sm:` breakpoints (≥640px). In traditional flex centering (`items-center`), modal headers and settings push the top and bottom of modals outside the viewport coordinates. Adding `items-start sm:items-center` on overlays with `my-auto` on dialog cards, along with compact horizontal role switchers and navigation, ensures modals remain fully visible and naturally scrollable.
  2. **Teacher Grading UX:** The previous grading modal had fixed multi-row dropdowns and inputs that consumed the entire vertical space on smartphones, pushing students off-screen. The refactored design renders a collapsible configuration bar, student search, score steppers, expandable parent notes, and sticky action buttons. Visual handset QA remains open under B-001.

---

### ADR-009: Strict contracts and shared permission checks (repair stages ۱–۲)

- `tsconfig.json` enables strict checking; React type packages are installed. Missing Lucide declarations were restored from the exact official package archive; clean installations should obtain them from the package itself.
- Context exposes `canManageSchool` and typed, simulated `sendNotification`. Mobile actions and root modal rendering use the same permissions; Context mutations check them as well. School/identity boundaries were added in ADR-010.
- `ClassManagerModal` uses `addClassGroup` / `deleteClassGroup`. Deleting a class with any linked student or schedule is blocked. Capacity enforcement is not implemented; its unused local state was removed.
- `StaffManagerModal` now exposes six permission switches including finances; absent finance permission means denied. Discipline uses `canLogDisciplinary`.
- Payment methods use the canonical union in `types.ts`, including distinct `card_to_card`. Known stored aliases are normalized without resetting existing financial summaries.
- Enrollment collects required identity fields instead of supplying fabricated names, phone numbers or birth dates in `StudentManagerModal`. Legacy combined student/class manager remains outside the main root flow.
- Strict lint/build and limited permission/payment-contract checks are recorded in REPAIR_PROGRESS.md; no full browser regression was performed. Financial correctness, live dossier refresh, attendance and rollover still require later phases.

### ADR-010: Scoped Context reads and explicit account links (repair stage ۳)

- Backing arrays remain complete for persistence; provider values are scoped to school and role using `accessScope.ts`. Regional platform reads and shared regional content remain available.
- `currentStudent` is resolved from `UserProfile.studentId` / `childStudentId`; no default first student is used by account dashboards or mobile dossier navigation. Missing data produces a clear empty state. Teacher views handle missing school schedules safely.
- Mutations validate the school of the target record and destination class. Parent contact/payment and student homework also validate the linked student. Annual rollover preserves other schools' students and years; fee assignment preserves their financial records. Full financial reconciliation remains stage ۴.
- Regional enrollment is an explicit exact-code lookup gated by student-management permission. It is the exception to school-local student reads and preserves the existing entity when transferring.
- New notifications carry school/student identifiers; ambiguous legacy recipient logs are hidden from parents. New academic years are school-owned. Only known initial demo years are migrated to school-1; custom legacy years without school attribution are preserved without guessing ownership and need provenance before activation.
- AppWorkspace remounts on school/role/deputy changes to clear stale local form state. Selected dossiers are resolved from the current student array by ID; this also implements the live-selection portion of stage ۶.
- `scripts/check-school-scope.ts` runs with `node --import tsx` using in-memory fixtures and a real server render of AppProvider. It checks read boundaries, account links, regional exceptions and legacy ambiguity; browser interactions and mutation execution are not covered by that script.

### ADR-011: Recompute financial balances from documents (repair stage ۴)

- `financialLedger.ts` is the shared calculation layer. Assignment originals/discounts and confirmed transactions are authoritative. Pending/rejected documents never add credit, repeated same-status approval is a no-op, and rejection reverses the credit by replaying remaining confirmed documents.
- Targeted documents cover their named fee first; general payments cover earliest due fees. Installments use due-date/ID order. Credits above the receivable or targeted fee balance are rejected. Pending documents do not reserve debt.
- Discounts require a positive integer amount and reason, cannot exceed unpaid fee balance, reduce latest unpaid installment amounts, and retain original installment amounts. Audits retain actor, date, references and previous cached totals. Existing documents are not deleted to reconcile balances.
- Existing valid source rows correct stale aggregate caches in the displayed view. Incomplete document sets or inconsistent installment schedules stop normal mutations and show a review message; preserve these records and escalate specific real cases instead of inventing opening balances or resetting them. New empty accounts have zero balance; only explicit mock fixtures contain sample charges/payments.
- The synchronous student snapshot serializes rapid commands within this browser instance; it is not a backend transaction. Notifications and errors are emitted after successful calculation, outside React state updaters. Financial forms consume `FinancialActionResult` and stay open on failure.
- Assigned fee definitions and students with financial history cannot be deleted. Fee targeting uses exact grade labels, not substring matching: یازدهم and دوازدهم both contain دهم. Selective assignment requires an explicitly selected class.
- New online documents are simulated; parent card/bank receipts are pending verification. UI amount units are تومان. Full annual/school-origin financial separation, manual historical reconciliation and multi-installment creation need later work.
- Reproduction: `node --import tsx scripts/check-financial-ledger.ts`. It covers pure transitions and actual Context commands captured through SSR with process-local fixtures; no browser storage, bank service, full browser test or load test is used.

## 3. Component & Modal Registry

| Component File | Type | Purpose | Key Triggers / Parents |
| :--- | :--- | :--- | :--- |
| `Header.tsx` | UI Header | Displays school info, notification drawer, active user badge | Root `App.tsx` |
| `RoleQuickSwitch.tsx` | Dev Utility | Allows instant switching between all 6 roles | Root `App.tsx` |
| `MobileBottomNav.tsx` | Mobile UX | Bottom floating navigation bar for small screens (<768px) | Root `App.tsx` |
| `NotificationToast.tsx` | Toast Alert | Floating animated notification simulating SMS & Bale delivery | Triggered by `sendNotification` in `AppContext` |
| `AcademicYearManagerModal.tsx` | Modal | Manage school years, switch terms, create new years, and run rollover | Triggered from PrincipalDashboard & Header |
| `FinanceManagerModal.tsx` | Modal | Comprehensive school finance, approved fee definitions, installment scheduling, revenue analytics, debtor reminders & mobile card views | Triggered from PrincipalDashboard & VicePrincipalDashboard |
| `StudentFinancialTab.tsx` | Component | Embedded financial dossier tab: student ledger, installments, payments log, discount grant, fully responsive with mobile cards | Sub-component inside `StudentDossierModal.tsx` |
| `ParentPaymentModal.tsx` | Modal | Dedicated 3-step parent payment gateway (Shaparak online simulation, card-to-card, bank deposit slip) with mobile-optimized touch flow | Triggered from `ParentDashboard.tsx` & `StudentFinancialTab.tsx` |
| `PlatformAdminDashboard.tsx` | Dashboard | Local sample aggregation, sponsor banners and school preview | `currentRole === 'platform_admin'` |
| `PrincipalDashboard.tsx` | Dashboard | School KPI overview, quick access to all school modals | `currentRole === 'principal'` |
| `VicePrincipalDashboard.tsx` | Dashboard | Fast daily attendance, discipline, permitted task links | `currentRole === 'vice_principal'` |
| `TeacherDashboard.tsx` | Dashboard | Live classroom attendance, fast grading, homework links | `currentRole === 'teacher'` |
| `StudentDashboard.tsx` | Dashboard | Daily timetable, active homework and local practice question | `currentRole === 'student'` |
| `ParentDashboard.tsx` | Dashboard | Linked child status, tuition summary, demo payment, local notification log | `currentRole === 'parent'` |
| `StudentDossierModal.tsx` | Modal | Available report-card snapshots, gradebook rows, discipline and finance views | Triggered from linked student records |
| `SchedulePlannerModal.tsx` | Modal | Weekly timetable schedule matrix (Saturday to Wednesday) | Triggered by Principal or permitted VP |
| `ClassAndStudentManagerModal.tsx` | Modal | Class cohorts definition, student enrollment & transfers | Triggered by Principal or permitted VP |
| `PostManagerModal.tsx` | Modal | Publish and filter announcements, news, and event reports | Triggered by Principal or permitted VP |
| `VicePrincipalPermissionsModal.tsx`| Modal | Permission toggles for Vice Principal delegation | Triggered by Principal |
| `TeacherGradeEntryModal.tsx` | Modal | Batch grade entry for continuous evaluation & exams | Triggered by Teacher |
| `TeacherHomeworkAndExamModal.tsx` | Modal | Assign homework and schedule exams; no online solver | Triggered by Teacher |
| `QuestionBankModal.tsx` | Modal | Same-browser local sample question list | Triggered by Principal, Teacher, Student |
| `AddQuestionModal.tsx` | Modal | Add test/descriptive questions to local sample data | Triggered from QuestionBankModal and TeacherDashboard |
| `StudentManagerModal.tsx` | Modal | Dedicated tabbed student manager (Active, Graduated, Transferred) | Triggered by Principal or permitted VP |
| `ClassManagerModal.tsx` | Modal | Add/remove and inspect class cohorts; capacity is not enforced | Triggered by Principal or permitted VP |
| `StaffManagerModal.tsx` | Modal | School personnel registry (teachers, deputies, counselors) | Triggered by Principal |
| `UserProfileModal.tsx` | Modal | Detailed user identity card and profile inspection | Triggered from Header user badge |
| `SystemDocsModal.tsx` | Modal | In-app prototype status, role-preview matrix, technical roadmap and hypotheses | Triggered from Header and Footer |
| `SponsorBannerCard.tsx` | Widget | Culturally appropriate educational sponsor banners | Embedded in Dashboards |

> **Product status and roadmap:** See [`docs/PRODUCT_FEATURES.md`](./PRODUCT_FEATURES.md). Its detailed legacy module catalog is marked as roadmap, not a claim that those integrations are active.

---

## 4. Known Pitfalls & Bug Prevention

1. **Vite / ESBuild Number Literal Crash:**
   - **Never:** `const [mins, setMins] = useState(۴۵);` or `count || ۰`
   - **Always:** `const [mins, setMins] = useState(45);` or `count ?? 0`
   - **Display:** `toPersianDigits(mins)`

2. **Mobile Bottom Nav Padding:**
   - Always keep `pb-24 md:pb-6` on the main container in `src/App.tsx`. Otherwise, the bottom navigation bar covers the lowest interactive buttons on mobile viewports.

3. **Dialog Stacking:**
   - Modal backdrops use `z-50` with `backdrop-blur-xs` and `overflow-y-auto`. Keep body scroll clean when opening modals.

4. **Port Binding Invariant:**
   - Container dev server must remain on port `3000` (`vite --port=3000 --host=0.0.0.0`). Do not modify the dev script port.

5. **Mobile Table Clipping Prevention:**
   - Always avoid wide unconstrained `<table>` elements without horizontal wrappers or mobile card alternatives. Complex tables must render responsive card stacks on small viewports (`hidden md:table` and `block md:hidden`).

6. **Mobile Landscape RTL Centering Invariant:**
   - In mobile landscape mode (`orientation: landscape`), horizontal overflows cause RTL containers to shift, creating blank margins on one side and inverted alignment on dialogs.
   - Use `overflow-x: clip` and `max-width: 100vw` on root elements to limit horizontal overflow without creating an ancestor scroll container that breaks sticky controls. Keep modal vertical scrolling explicit.
   - For all modal dialogs, use `w-full max-w-full overflow-y-auto` on the fixed backdrop overlay and `m-auto` on the modal dialog card to guarantee perfect bidirectional centering regardless of screen aspect ratio.

---

## 5. Next Iteration Backlog (Roadmap for Future Agents)

If asked by the user to implement further capabilities:
- [x] **Local finance prototype:** Fee tracking, installment calculations, transaction ledger, simulated reminders, student financial tab, and simulated parent payment (`ParentPaymentModal`). No bank or messaging connection is active.
- [ ] **Visual mobile QA for finance:** Responsive layouts and touch targets have been updated; handset rendering still needs review under B-001.
- [ ] **Real PDF Export:** Add printable PDF report card generation for student dossiers (using `html2canvas` / `jspdf` or server-side puppeteer).
- [ ] **Live Online Exam Solver:** Allow students to open a timed quiz modal and submit answers directly, auto-calculating score percentages.
- [ ] **Bale Messenger Webhook Bot:** Connect `sendNotification()` to a real Bale Bot Token via an Express server-side proxy (`/api/bale-send`).
- [ ] **Cloud Persistence:** Wire up Firebase Firestore using `firebase-integration` skill or Cloud SQL with Drizzle ORM.
