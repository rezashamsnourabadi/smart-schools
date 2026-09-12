# ARCHITECTURE.md — System Architecture & Data Design

This document details the architectural blueprint, data flow, entity relationships, and cloud integration roadmap for the **Smart School Cluster Management System** (سامانه هوشمند قطب مدارس شهرستان).

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

---

## 3. Role-Based Access Control (RBAC) Matrix

| Module / Feature | Platform Admin | Principal | Vice Principal | Teacher | Student | Parent |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Regional Schools Analytics | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Regional Sponsors | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| VP Permission Delegation | ❌ | ✅ Full | ❌ | ❌ | ❌ | ❌ |
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
- `/schools/{schoolId}/classes/{classId}`
- `/schools/{schoolId}/students/{studentId}`
  - Sub-collection: `reportCards/{termId}`
  - Sub-collection: `disciplineLogs/{logId}`
- `/schools/{schoolId}/schedule/{scheduleId}`
- `/schools/{schoolId}/posts/{postId}`
- `/questionBank/{questionId}` (shared across all schools in county)
- `/notifications/{notificationId}`
- `/sponsors/{sponsorId}`

### Security Rule Principles:
- Platform Admin has global read/write.
- Principals and Teachers read/write within their respective `schoolId`.
- Parents and Students authenticate with their national code and phone number, with strictly constrained read access to their own sub-records.
