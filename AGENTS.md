# AGENTS.md — AI Agent Guidelines & Engineering Specifications

This document serves as the persistent system instructions and engineering manual for any AI Coding Agent (e.g., Gemini Antigravity, Claude Code, Cursor, Copilot, Windsurf) working on this codebase. Read and adhere strictly to the rules below.

---

## 1. Project Mission & Context

This project is a comprehensive **Iranian County School Cluster & Smart School Management Web Application** (سامانه هوشمند قطب مدارس شهرستان).
It is tailored to the operational realities of Iranian schools, featuring:
- Right-to-Left (RTL) Persian interface with solar Hijri dates (۱۴۰۴-۱۴۰۵).
- 6 distinct roles: Platform Admin (`platform_admin`), School Principal (`principal`), Vice Principal (`vice_principal`), Teacher (`teacher`), Student (`student`), and Parent (`parent`).
- Automated Parent Notifications simulating national SMS & **Bale Messenger** (پیام‌رسان بله) delivery.
- Comprehensive student academic dossiers, regional question banks, interactive schedule planners, and cultural sponsor management.

---

## 2. Technical Stack & Invariants

| Layer | Technology | Rules / Constraints |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript | Functional components, custom hooks, strictly typed. |
| **Bundler** | Vite 6 + ESBuild | Build must always pass `npm run build` and `npm run lint`. |
| **Network & Port** | Port `3000`, Host `0.0.0.0` | **NEVER** change port 3000. Required by container proxy. |
| **Styling** | Tailwind CSS v4 | `@import "tailwindcss";` in `src/index.css`. No inline style tags. No CSS-in-JS. |
| **Icons** | `lucide-react` | **NEVER** create custom SVG icons. Always import from `lucide-react`. |
| **Animations** | `motion/react` | Use Motion for entering/exiting toasts and modal transitions. |
| **Directionality** | RTL (`dir="rtl"`) | Root HTML and layout are RTL. Use logical padding/margins (`pe-`, `ps-`, `text-right`). |

---

## 3. Strict Persian Digit Rule (CRITICAL)

> [!CAUTION]
> **NEVER USE RAW PERSIAN NUMERALS AS JAVASCRIPT NUMBER LITERALS.**
> Writing `const val = ۴۵;` or `total: ۰` inside `.ts` or `.tsx` files causes `esbuild` to crash with:
> `ERROR: Unexpected "۴"` or `ERROR: Unexpected "۰"`.

### The Rule:
1. **In TypeScript logic, state, and calculations**: Always use standard ASCII digits:
   ```typescript
   // ✅ Correct
   const [duration, setDuration] = useState<number>(45);
   const absentCount = 0;
   ```
2. **In user-facing UI rendering**: Always wrap numbers, dates, phone numbers, and codes with `toPersianDigits()`:
   ```tsx
   // ✅ Correct
   import { toPersianDigits } from '../utils/persianUtils';

   <span>{toPersianDigits(duration)} دقیقه</span>
   <span className="font-mono">{toPersianDigits(student.parentPhone)}</span>
   ```

---

## 4. Architecture & State Management

The application uses React Context (`AppContext.tsx`) to manage shared reactive state across all 6 roles.

### Core State Fields in `useApp()`:
- `currentSchool`: Currently active school profile.
- `currentUser`: Authenticated user entity.
- `currentRole`: Active role (`'platform_admin' | 'principal' | 'vice_principal' | 'teacher' | 'student' | 'parent'`).
- `schools`: Array of regional schools.
- `students`: Array of student records with attendance, grades, report cards, and discipline.
- `classes`: Registered class groups.
- `schedule`: Weekly timetable items.
- `posts`: Announcements, news, and school event reports.
- `questionBank`: Regional shared exam questions.
- `notifications`: Outbound SMS / Bale notification history.
- `vicePrincipalPermissions`: Granular permissions toggled by the Principal.
- `selectedStudentForDossier`: Student currently opened in the detailed dossier modal.

### State Mutation Guidelines:
- Keep mutations immutable (e.g., `setStudents(prev => [...prev, newStudent])`).
- When student attendance is marked as absent or late, always call `sendNotification()` to alert the parent via Bale/SMS.

---

## 5. Mobile-First & Responsive UX Standards

1. **Touch Targets**:
   All clickable elements (buttons, list rows, tabs, toggles) must have a minimum interactive touch target of **44×44px** on mobile.
2. **Bottom Navigation**:
   Mobile devices display `MobileBottomNav.tsx` at screen bottom (`fixed bottom-0`). The main container in `App.tsx` has `pb-24 md:pb-6` to avoid content occlusion.
3. **Modal Dialogs**:
   Modals must be responsive (`max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6`). On mobile, enable full-height or touch scroll.
4. **HTML `id` Attributes**:
   Meaningful actionable cards, modals, and buttons should include a unique `id` attribute (e.g., `id="student-dashboard-view"`, `id="btn-add-question"`) for testing and agent target selectors.

---

## 6. How to Extend the Application

### Adding a New Modal:
1. Create `src/components/MyNewModal.tsx`.
2. Accept `isOpen: boolean` or mount conditionally, and `onClose: () => void`.
3. Add modal state in `src/App.tsx`: `const [isMyModalOpen, setIsMyModalOpen] = useState(false);`.
4. Connect trigger buttons in the relevant Role Dashboard(s) and mobile nav.

### Adding a New Notification Trigger:
1. In the event handler, call `sendNotification({ recipientName, recipientPhone, studentName, message, type, platform: 'bale' | 'sms' })`.
2. This automatically dispatches a floating animated toast (`NotificationToast.tsx`) and appends to the notification history drawer in `Header.tsx`.

### Extending User Roles:
If adding role-specific capabilities, check `types.ts` (`UserRole`) and update:
- `RoleQuickSwitch.tsx` (to allow instantaneous preview switching during development).
- `renderDashboardByRole()` in `App.tsx`.

---

## 7. Quality Assurance & Verification

Before concluding any work, the agent MUST run:
1. `lint_applet`: Ensures no TypeScript compiler errors or unresolved imports.
2. `compile_applet`: Ensures the Vite production bundle compiles cleanly with no esbuild syntax violations.

DO NOT output self-praising or marketing buzzwords. Summarize technical and design outcomes concisely and professionally.
