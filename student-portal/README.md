# RecruitX Student Portal

React + JavaScript + Vite + Tailwind student frontend. It runs separately from the Admin/TPO portal.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Vite serves the student portal at `http://localhost:5173`. The API defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `.env.local` if your backend is running elsewhere. Restart Vite after changing environment values.

## Included student pages

- Login, registration, and password recovery screens
- Dashboard with application, drive, interview, training, and profile readiness summaries
- Editable personal, academic, and skills profile
- Resume upload, view, replacement, and delete controls
- Searchable placement drives, eligibility checks, drive details, and apply action
- Application status tracking
- Training catalog, details, and enrollment
- Interview schedule and result view
- Student notifications with mark-as-read action

## Backend contract

The UI calls the following student endpoints under `/api`:

```text
POST   /auth/student/login
POST   /auth/student/register
GET    /auth/student/me
POST   /auth/student/forgot-password
GET    /students/me/profile
PUT    /students/me/profile
GET    /students/me/skills
PUT    /students/me/skills
POST   /students/me/resume
DELETE /students/me/resume
GET    /trainings
GET    /trainings/:id
GET    /trainings/student
POST   /trainings/:id/enroll
GET    /drives
GET    /drives/:id
GET    /drives/:id/eligibility
POST   /drives/:id/apply
GET    /applications/student
GET    /interviews/student
GET    /notifications/me
PATCH  /notifications/:id/read
```

The current backend already implements the shared training, drive, enrollment, eligibility, application, interview, and notification read routes using in-memory sample data. Student authentication, profile/skills/resume, password recovery, and “my trainings” routes still need backend implementation and shared Supabase/Prisma persistence before those screens can work end to end. The portal stores the JWT in local storage under `recruitx_student_token` and sends it as a bearer token. Resume upload uses a multipart `resume` field; the backend should store the file in Supabase Storage and return safe metadata or a signed URL.

## Security notes

- Do not put Supabase service-role keys or private storage credentials in this frontend.
- Student-owned data endpoints should use the authenticated user ID from the JWT, not a student ID supplied by the browser.
- Add `.env.local` for local configuration; it is ignored by Git. `.env.example` contains only a local API URL.
