# MEMORY.md — Agent Memory, Context Tracker & Decision Records

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

### ADR-004: Dual-Channel Notification Feedback (Toast + History Drawer)
- **Decision:** Outbound Bale/SMS messages trigger both a temporary floating animated notification (`NotificationToast.tsx`) and an append-only log in `Header.tsx`.
- **Rationale:** Gives instant visual confirmation to staff that parents were alerted, while allowing parents and auditors to review past logs.

### ADR-005: Academic Year Lifecycle & Rollover Engine (`AcademicYearManagerModal.tsx`)
- **Decision:** Model the school year as a multi-term lifecycle (`active`, `planned`, `archived`) with an interactive rollover wizard.
- **Rationale:** Schools operate on discrete calendar years. Transitioning to a new year involves atomic operations: advancing 10th & 11th graders to the next grade, graduating 12th graders, freezing prior report cards into `student.pastYearHistory`, and zeroing out current attendance counters. The system also supports safe, read-only viewing of archived years with an immediate return banner.

### ADR-006: Transactional Financial Ledger & Multi-Method Tuition Payments
- **Decision:** Implement a dual-level financial management system: an institutional ledger for the Principal/VP (`FinanceManagerModal.tsx`), integrated tab in the student dossier (`StudentFinancialTab.tsx`), and a dedicated 3-step payment flow for parents (`ParentPaymentModal.tsx`).
- **Rationale:** Tuition, bus service, extracurriculars, insurance, and books represent critical cash-flow operations for Iranian schools. Storing granular installments (`InstallmentItem`), discounts/scholarships (`DiscountItem`), and transactional receipts (`PaymentTransaction`) provides complete auditability with tracking codes, while the parent modal supports simulated Shaparak online gateway, card-to-card, and bank slip uploads.

---

## 3. Component & Modal Registry

| Component File | Type | Purpose | Key Triggers / Parents |
| :--- | :--- | :--- | :--- |
| `Header.tsx` | UI Header | Displays school info, notification drawer, active user badge | Root `App.tsx` |
| `RoleQuickSwitch.tsx` | Dev Utility | Allows instant switching between all 6 roles | Root `App.tsx` |
| `MobileBottomNav.tsx` | Mobile UX | Bottom floating navigation bar for small screens (<768px) | Root `App.tsx` |
| `NotificationToast.tsx` | Toast Alert | Floating animated notification simulating SMS & Bale delivery | Triggered by `sendNotification` in `AppContext` |
| `AcademicYearManagerModal.tsx` | Modal | Manage school years, switch terms, create new years, and run rollover | Triggered from PrincipalDashboard & Header |
| `FinanceManagerModal.tsx` | Modal | Comprehensive school finance, approved fee definitions, installment scheduling, revenue analytics & debtor reminders | Triggered from PrincipalDashboard & VicePrincipalDashboard |
| `StudentFinancialTab.tsx` | Component | Embedded financial dossier tab: student ledger, installments, payments log, discount grant | Sub-component inside `StudentDossierModal.tsx` |
| `ParentPaymentModal.tsx` | Modal | Dedicated 3-step parent payment gateway (Shaparak online simulation, card-to-card, bank deposit slip) | Triggered from `ParentDashboard.tsx` & `StudentFinancialTab.tsx` |
| `PlatformAdminDashboard.tsx` | Dashboard | County-wide analytics, sponsor ads manager, schools overview | `currentRole === 'platform_admin'` |
| `PrincipalDashboard.tsx` | Dashboard | School KPI overview, quick access to all school modals | `currentRole === 'principal'` |
| `VicePrincipalDashboard.tsx` | Dashboard | Fast daily attendance, discipline, permitted task links | `currentRole === 'vice_principal'` |
| `TeacherDashboard.tsx` | Dashboard | Live classroom attendance, fast grading, homework links | `currentRole === 'teacher'` |
| `StudentDashboard.tsx` | Dashboard | Daily timetable, active homework, daily test question | `currentRole === 'student'` |
| `ParentDashboard.tsx` | Dashboard | Child attendance status, tuition summary, direct pay modal, Bale message log | `currentRole === 'parent'` |
| `StudentDossierModal.tsx` | Modal | Comprehensive academic record, discipline logs, past GPAs | Triggered from student lists across dashboards |
| `SchedulePlannerModal.tsx` | Modal | Weekly timetable schedule matrix (Saturday to Wednesday) | Triggered by Principal or permitted VP |
| `ClassAndStudentManagerModal.tsx` | Modal | Class cohorts definition, student enrollment & transfers | Triggered by Principal or permitted VP |
| `PostManagerModal.tsx` | Modal | Publish and filter announcements, news, and event reports | Triggered by Principal or permitted VP |
| `VicePrincipalPermissionsModal.tsx`| Modal | Permission toggles for Vice Principal delegation | Triggered by Principal |
| `TeacherGradeEntryModal.tsx` | Modal | Batch grade entry for continuous evaluation & exams | Triggered by Teacher |
| `TeacherHomeworkAndExamModal.tsx` | Modal | Assign homework and schedule online timed quizzes | Triggered by Teacher |
| `QuestionBankModal.tsx` | Modal | County-wide test question sharing repository | Triggered by Principal, Teacher, Student |
| `AddQuestionModal.tsx` | Modal | Unified standardized modal for designing test/descriptive questions | Triggered from QuestionBankModal and TeacherDashboard |
| `StudentManagerModal.tsx` | Modal | Dedicated tabbed student manager (Active, Graduated, Transferred) | Triggered by Principal or permitted VP |
| `ClassManagerModal.tsx` | Modal | Add/remove and inspect class cohorts & capacities | Triggered by Principal or permitted VP |
| `StaffManagerModal.tsx` | Modal | School personnel registry (teachers, deputies, counselors) | Triggered by Principal |
| `UserProfileModal.tsx` | Modal | Detailed user identity card and profile inspection | Triggered from Header user badge |
| `SystemDocsModal.tsx` | Modal | In-app interactive feature catalog, RBAC matrix, tech architecture & investor pitch | Triggered from Header and Footer |
| `SponsorBannerCard.tsx` | Widget | Culturally appropriate educational sponsor banners | Embedded in Dashboards |

> **Comprehensive Feature Catalog:** See [`docs/PRODUCT_FEATURES.md`](./PRODUCT_FEATURES.md) for the complete, structured inventory of all capabilities, workflows, and monetization models for stakeholders and investors.

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

---

## 5. Next Iteration Backlog (Roadmap for Future Agents)

If asked by the user to implement further capabilities:
- [x] **Tuition & Finance Module (COMPLETED):** School fee tracking, installment schedules, transactions ledger, debtor reminders via Bale/SMS, student financial dossier tab (`StudentFinancialTab`), and dedicated parent online payment gateway (`ParentPaymentModal`).
- [ ] **Real PDF Export:** Add printable PDF report card generation for student dossiers (using `html2canvas` / `jspdf` or server-side puppeteer).
- [ ] **Live Online Exam Solver:** Allow students to open a timed quiz modal and submit answers directly, auto-calculating score percentages.
- [ ] **Bale Messenger Webhook Bot:** Connect `sendNotification()` to a real Bale Bot Token via an Express server-side proxy (`/api/bale-send`).
- [ ] **Cloud Persistence:** Wire up Firebase Firestore using `firebase-integration` skill or Cloud SQL with Drizzle ORM.
