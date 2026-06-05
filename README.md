# SkillBridge Attendance Manager

SkillBridge is a attendance tracking and management system designed for skilling programs. It provides specialized dashboards and tools for five distinct user roles: Students, Trainers, Institution Partners, Programme Managers, and Monitoring Officers.

---

## 🔗 Live URLs

* **Frontend & Backend Production Site**: [https://skillbridge-attendance-manager.vercel.app](https://skillbridge-attendance-manager.vercel.app)
* **Production API Base URL**: [https://skillbridge-attendance-manager.vercel.app/api](https://skillbridge-attendance-manager.vercel.app/api)

---

## 👥 Test Accounts (All 5 Roles)

All test users are registered with the standard mock password in the development environment: **`Tr9!vB$5#mK4@qP2`**

| Role | Email Address | Description |
|---|---|---|
| **Student** | `student@skillbridge.com` | Self-joins batches, checks in to sessions, and views self-records. |
| **Trainer** | `trainer@skillbridge.com` | Creates batches, schedules sessions, and reviews student attendance. |
| **Institution** | `institute@skillbridge.com` | Views analytics, lists trainers, and drills down into batch session logs. |
| **Programme Manager** | `programme-manager@skillbridge.com` | Oversees regional metrics, total institutions, and system-wide averages. |
| **Monitoring Officer** | `monitoring-officer@skillbridge.com` | Read-only access to oversee all sessions and attendance records. |

## To Check all the REST API Routes-

**For POST requests enter the given data in console of the required role**

**For GET requests login in the required role and paste the url in browser**

> [!TIP]
> **Admin Developer Switching**: Login from email `admin@skillbridge.com` with password `Tr9!vB$5#mK4@qP2` and select any **Tester Role Switcher** from the top navigation bar. This allows you to instantly switch between all five roles and you can test these API calls faster.

| Method | Path | Access | Data | Verification |
|---|---|---|---|---|
| **POST** | `/api/batches` | Trainer, Institution | [JSON](api-test/1.txt) | Reload the website and the batch will be under Your Batches |
| **POST** | `/api/batches/[id]/invite` | Trainer | [JSON](api-test/2.txt) | A Response with the link will appear in the console |
| **POST** | `/api/batches/[id]/join` | Student | Change the role to Student and paste the Link generated in previous request in the browser | The batch will be in Visible in Batches Section |
| **POST** | `/api/batches/sessions` | Trainer | [JSON](api-test/3.txt) | Refresh the page and the session will be under Scheduled Sessions |
| **POST** | `/api/attendance/mark` | Student | [JSON](api-test/4.txt) | The Session "This will be marked present" should be marked as PRESENT in attendance records |
| **GET** | `/sessions/:id/attendance` | Trainer | https://skillbridge-attendance-manager.vercel.app/api/sessions/cmq0k9z41000404jrozik898m/attendance | Views full attendance for a
session |
| **GET** | `/batches/:id/summary` | Institution | https://skillbridge-attendance-manager.vercel.app/api/batches/cmq09ndvt0004kyv9oq7ush9p/summary | Views full attendance for a
batch |
| **GET** | `/institutions/:id/summary ` | Programme Manager | https://skillbridge-attendance-manager.vercel.app/api/institutions/cmpzz9mxd0006cmv9jklrhqf6/summary | summary across all batches in an institution|
| **GET** | `/programme/summary` | Programme Manager / Monitoring Officer | https://skillbridge-attendance-manager.vercel.app/api/programme/summary | programme-wide
summary |

---

## 🛠️ Local Setup Instructions

Follow these steps to run the project locally on your machine:

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Clone and Install
```bash
git clone https://github.com/Karman-singh15/skillbridge.git
cd skillbridge

npm install
```

### 3. Environment Variables

**These Keys will be discarded after the interview**

Create a `.env` file in the root directory and configure the variables:

**The env file is in the google drive**

### 4. Database Setup
Ensure your local client is generated and in sync with the database:
```bash
# Generate the Prisma Client
npx prisma generate

# Sync the database schema (if needed)
npx prisma db push
```

### 5. Running the Project
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🗄️ Schema Decisions & Design Choices

The database schema is defined in [schema.prisma](prisma/schema.prisma) and uses PostgreSQL. Key design choices include:

* **Unified User Model**: We store all users in a single `User` model, mapping them to Clerk authentication via `clerkUserId`. Roles are managed using a strict enum (`STUDENT`, `TRAINER`, `INSTITUTION`, `PROGRAMME_MANAGER`, `MONITORING_OFFICER`). This simplifies session authorization checks and allows admins to switch roles smoothly.
* **Decoupled Batch & Enrollment**: Student enrollment is represented by a join table (`BatchStudent`), which decouples students from batches. This allows students to be in multiple batches over time while maintaining individual records.
* **Strict Session Enforcement**: The `Session` model holds date and time bounds (`startTime`/`endTime` as HH:MM strings) and an `isStrict` boolean. When `isStrict` is set to true, the self-marking logic checks that the current time has not passed `endTime` before allowing check-in, preventing late entries.
* **Attendance State tracking**: The `Attendance` table registers each student's attendance for a given session with an `AttendanceStatus` enum (`PRESENT`, `ABSENT`, `LATE`), linking to `Session` and `User` with a unique constraint on `(sessionId, studentId)` to prevent duplicate marking.

---

## 🥞 Stack Choices

* **Framework**: **Next.js 16 (App Router & React 19)** — Selected for server-side rendering, layout preservation, serverless API routes, and Server Actions that make database writes exceptionally clean and direct.
* **Database**: **Serverless PostgreSQL (Neon)** — AWS-hosted Postgres SQL cluster providing high availability, scaling, and branching.
* **ORM**: **Prisma** — Provides type-safe queries, automated schema generation, and clean model relationships.
* **Authentication**: **Clerk** — Provides robust, drop-in user sign-in/up sessions, and middleware route protection.
* **Validation**: **Prisma** — Enforces runtime validation schemas (such as ensuring session start time is strictly before end time) and returns clean, mapped field errors.

---

## 📊 Feature Status

### ✅ Fully Working
* **Onboarding & Role Customization**: New signups are redirected to onboarding to specify names and roles.
* **Role Switcher**: Admin test accounts can switch roles on the fly using the interactive header dropdown.
* **Adding Sessions**: Trainers can make sessions for different batches under them.
* **Student Self-Marking**: Students can self-mark their attendance window-adjusted to their local browser timezone offset.
* **Strict Sessions**: Trainers can check "Strict Mode" to enforce deadlines; student UI displays a red "Missed" button, and API/Server actions block late self-marking.
* **Expandable Institution View**: Institutions can click any batch to expand and view a table containing a detailed session summary (sorted alphabetically by title).
* **Live Audit Log**: Monitoring Officers can view all logged sessions system-wide, sorted alphabetically by title.

### 🟡 Partially Done
* *None* (all requested features and specifications have been implemented to completion).

### ❌ Skipped
* *None* (no features were omitted or skipped).

---

## ⏳ What I'd Do Differently With More Time
With more time, I would implement **real-time WebSockets/SSE (Server-Sent Events)** for the Monitoring Officer's Live Session Log. Currently, live sessions require a page refresh or polling to load new check-ins. Real-time connections would allow attendance rates to update live in front of the Monitoring Officer as students mark themselves present in classrooms. Also a reminder system which can be automatically be set off when a session is starting or a trainer can manually send reminders to students for marking their attendance.
