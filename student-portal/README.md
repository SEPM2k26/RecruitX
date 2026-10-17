# RecruitX Student Portal

React + JavaScript + Vite + Tailwind student frontend. It runs separately from the Admin/TPO portal.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` from your Supabase project. These are browser-safe project settings; never put a secret or service-role key in the portal. Vite serves the student portal at `http://localhost:5173`. The API defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `.env.local` if your backend is running elsewhere. Restart Vite after changing environment values.

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
GET    /auth/student/me
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

Student sign-up, login, session refresh, and password recovery use Supabase Auth. Authenticated API calls send the current Supabase access token as a bearer token. The backend verifies that token against Supabase Auth. Student profiles and the other student features still use in-memory sample data until Person 3 links `students` to `auth.users` and the backend data access is connected to Supabase. Resume upload uses a multipart `resume` field; the backend should store the file in a private Supabase Storage bucket and return safe metadata or a short-lived signed URL.

## Security notes

- Do not put Supabase service-role keys or private storage credentials in this frontend.
- Student-owned data endpoints should use the authenticated Supabase user ID, not a student ID supplied by the browser.
- Add `.env.local` for local configuration; it is ignored by Git. `.env.example` lists the required variable names with placeholders.
