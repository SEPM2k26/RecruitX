# RecruitX Backend

Express 5 API. Student registration, login, sessions, and password recovery use Supabase Auth. Student business data uses direct PostgreSQL queries through `pg` (there is no ORM). Admin auth and admin controllers remain on their existing implementation and are outside Person 1's scope.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Auth token verification, `DATABASE_URL` for the Supabase PostgreSQL connection, and `SUPABASE_SERVICE_ROLE_KEY` plus `SUPABASE_RESUME_BUCKET` for server-side resume uploads. The service role key must stay in the backend environment and must never be exposed to the browser. Create a **private** Storage bucket named `student-resumes` (or set the bucket name in the backend environment). The Express API authorizes a student's resume and transfers it through the service role; no public file URL is generated.

Use the Supabase Dashboard's **Connect** panel to copy the database connection string. For a hosted long-running backend, use the Session Pooler where direct IPv6 connectivity is unavailable. Keep `sslmode=require` in the connection URL. `GET /api/health` reports `dataMode`; it will be `database-not-configured` until `DATABASE_URL` is set.

## Student API routes

All routes are mounted below `/api`.

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/auth/student/me` | Supabase Auth access token; returns the linked student profile |
| `GET`, `PUT` | `/students/me/profile` | Student access token; own profile |
| `GET`, `PUT` | `/students/me/skills` | Student access token; own skills |
| `POST` | `/students/me/resume` | Student access token; multipart field `resume`, PDF/DOC/DOCX up to 5 MB |
| `GET` | `/students/me/resume/file` | Student access token; streams the signed-in student's private resume |
| `DELETE` | `/students/me/resume` | Student access token; deletes own resume |
| `GET` | `/trainings`, `/trainings/:id` | Public read |
| `GET` | `/trainings/student` | Student access token; own enrollments |
| `POST` | `/trainings/:id/enroll` | Student access token; enrollment is serialized to protect capacity |
| `GET` | `/drives`, `/drives/:id` | Public read |
| `GET` | `/drives/:id/eligibility` | Student access token; checks the linked profile |
| `POST` | `/drives/:id/apply` | Student access token; checks active drive, deadline, eligibility, and duplicate applications |
| `GET` | `/applications/student`, `/interviews/student` | Student access token; own records |
| `GET` | `/notifications/me` | Student access token; own notifications |
| `PATCH` | `/notifications/:id/read` | Student access token; updates only the signed-in student's notification |

## Supabase database handoff

The direct SQL migration is [`supabase-auth-students.sql`](./supabase-auth-students.sql). Apply the full script in Supabase SQL Editor after schema review. It links `students.auth_user_id` to `auth.users`, makes the legacy password nullable, links existing accounts by matching email, and adds `applications.resume_url` for the uploaded resume object-key snapshot. On new student signup, its trigger links a roster row by Auth ID, email, or registration number; if no row matches, it creates a student profile. The trigger expects signup metadata keys `name` and `registration_number`; registration number may be blank during signup if no roster match is required.

The API expects the supplied schema's existing column names. `students.id` and the business-table IDs remain strings, while `auth_user_id` is UUID. Configure the Auth site URL and redirect allow list to include the student portal's local and deployed URLs. Apply the migration before signing up or using student APIs. The backend uses the PostgreSQL role from `DATABASE_URL`; Auth-linked profile RLS policies still protect direct browser access.

## Environment values

See [`.env.example`](./.env.example). Keep database passwords and the Supabase service role key out of Git and out of all `VITE_` frontend variables. The student frontend only needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and the API base URL.
