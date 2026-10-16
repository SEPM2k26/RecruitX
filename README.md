# RecruitX — Training & Placement Management System

A multi-portal Training & Placement Management System built for students, administrators (TPO), and recruiters.

---

## 🏗️ Architecture Overview

```text
Training & Placement Management System
│
├── Frontend
│   ├── Student Portal         (Person 1)
│   ├── Admin/TPO Portal       (Person 2 — ✅ Implemented)
│   └── Recruiter Portal       (Person 3)
│
├── Backend
│   ├── Authentication         (Admin: ✅ Implemented)
│   ├── Student APIs           (Admin-side: ✅ Implemented / Student-side: Person 1)
│   ├── Admin APIs             (Person 2 — ✅ Implemented)
│   ├── Recruiter APIs         (Person 3)
│   ├── Placement APIs         (Person 2 — ✅ Implemented)
│   └── Training APIs          (Person 2 — ✅ Implemented)
│
└── Database (Person 3)
    ├── Users / Admins / Students
    ├── Companies
    ├── Trainings & Enrollments
    ├── Placement Drives & Eligibility
    ├── Applications
    ├── Interviews
    └── Notifications
```

---

## 👤 Person 2 Deliverables Summary (Admin/TPO + Core Backend)

### 1. Core Backend Infrastructure (`/backend`)
- **Express 5 Server**: Helmet security headers, Morgan request logging, CORS preconfigured for local dev ports (`5173`, `5174`, `5175`).
- **Authentication & Security**: JWT signing & verification middleware (`auth.middleware.js`), bcrypt password hashing, role-based authorization guards (`authorize('admin')`).
- **Validation & Error Handling**: `express-validator` middleware rules and centralized error handling middleware.
- **In-Memory Store & Seed Data** (`src/config/db.js`): Full mock repository with seed data (admins, students, companies, trainings, placement drives, applications, interviews) ready for Person 3 to seamlessly connect to PostgreSQL/MongoDB.

### 2. Admin & Shared REST APIs
| Route Prefix | Method / Endpoint | Description |
|---|---|---|
| `/api/auth/admin` | `POST /login`, `POST /register`, `GET /me` | Admin authentication with JWT |
| `/api/admin/students` | `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id/toggle-status`, `DELETE /:id` | Student directory, filter by CGPA/branch/backlogs, profile edit, deactivate |
| `/api/admin/companies` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` | Company profiles, partner directory, search |
| `/api/admin/trainings` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`, `GET /:id/students` | Training programs, enrollment tracking, status management |
| `/api/admin/drives` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` | Placement drives with eligibility rules (CGPA, backlogs, branches, package) |
| `/api/admin/applications` | `GET /`, `PATCH /:id/stage`, `PATCH /:id/shortlist`, `PATCH /:id/reject` | Application tracking, stage advancing (`Applied` → `Shortlisted` → `Aptitude` → `Technical Interview` → `HR Interview` → `Selected`) |
| `/api/admin/interviews` | `GET /`, `POST /`, `PATCH /:id/result` | Schedule interview rounds, meeting links, update pass/fail/pending results |
| `/api/admin/results` | `GET /`, `PATCH /:applicationId`, `GET /summary` | Final selection decisions (`Selected`, `Waitlisted`, `Rejected`) and analytics breakdown |
| `/api/admin/notifications` | `GET /`, `POST /`, `POST /broadcast`, `PATCH /:id/read` | Targeted student notifications and branch/batch announcements |
| `/api` (Shared) | `GET /drives`, `GET /drives/:id`, `GET /trainings`, `GET /companies` | Public endpoints for Student (Person 1) and Recruiter (Person 3) portals |

### 3. Admin / TPO Portal Frontend (`/admin-portal`)
- **Technology**: React 19, Vite 8, React Router v7, Recharts, Lucide React, Modern CSS Design System.
- **Pages**:
  - **Login**: Auth state with JWT persistence and auto-logout on token expiration.
  - **Dashboard**: KPI stat cards, placement pipeline stages, application status distribution charts, branch breakdown.
  - **Students**: Filterable student table, search, status toggling, and comprehensive student profile view.
  - **Companies**: Partner company cards, add/edit modal, contact info and hiring history.
  - **Trainings**: Card grid with real-time enrollment progress bar, mode badges, create/edit modal.
  - **Placement Drives & Drive Detail**: Active drive cards, create drive modal with branch eligibility selector, pipeline applicant view, inline shortlisting, interview scheduling, and selection.
  - **Applications**: Global application pipeline tracker with stage advancement.
  - **Interviews**: Round filtering, meeting links quick-launch, schedule modal, and result submission.
  - **Results & Analytics**: Visual charts (Bar & Pie) displaying branch-wise selection and conversion rates.
  - **Notifications**: Announcement center with per-student messaging and branch broadcast modals.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
# Server runs on: http://localhost:5000
```

### 2. Start Admin Portal Frontend
```bash
cd admin-portal
npm install
npm run dev
# Portal runs on: http://localhost:5174
```

### 3. Start Student Portal Frontend
```bash
cd student-portal
npm install
Copy-Item .env.example .env.local
npm run dev
# Portal runs on: http://localhost:5173
```

The Student Portal includes the Person 1 UI for authentication, dashboard, profile, resume, training, placement drives, applications, interviews, and notifications. Its API contract and the student endpoints still needed in the backend are documented in `student-portal/README.md`.

### 4. Default Demo Credentials
- **Admin Email**: `admin@recruitx.com`
- **Password**: `password`
