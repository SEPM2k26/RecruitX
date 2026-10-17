# RecruitX Backend

Express 5 API using JavaScript, JWT, bcrypt, and request validation. The database is not configured yet. Until Supabase is ready, API records use the seeded in-memory store in `src/config/db.js`; changes to users, training enrollment, applications, and notifications reset when the backend restarts.

Resume files are temporarily written to `backend/uploads/resumes/`. The folder is ignored by Git. The API authorizes resume downloads and does not expose the folder as a public static directory. Move file storage to Supabase Storage when that service is configured.

## Run locally

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

The API listens on `http://localhost:5000`. `GET /api/health` returns service status and the current `dataMode`. For local development, the JWT secret has a development-only fallback. Set a strong `JWT_SECRET` before deployment; production startup fails without it.

## Student API routes

All routes are mounted below `/api`.

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/auth/student/register` | Public; creates a student and returns a JWT |
| `POST` | `/auth/student/login` | Public |
| `GET` | `/auth/student/me` | Student JWT |
| `POST` | `/auth/student/forgot-password` | Returns `501` until an email recovery provider is configured |
| `GET`, `PUT` | `/students/me/profile` | Student JWT; reads or updates the signed-in student's profile |
| `GET`, `PUT` | `/students/me/skills` | Student JWT |
| `POST` | `/students/me/resume` | Student JWT; multipart field `resume`, PDF/DOC/DOCX up to 5 MB |
| `GET` | `/students/me/resume/file` | Student JWT; downloads only the signed-in student's resume |
| `DELETE` | `/students/me/resume` | Student JWT |
| `GET` | `/trainings`, `/trainings/:id` | Public read; excludes the list of enrolled student IDs |
| `GET` | `/trainings/student` | Student JWT |
| `POST` | `/trainings/:id/enroll` | Student JWT |
| `GET` | `/drives`, `/drives/:id` | Public read |
| `GET` | `/drives/:id/eligibility` | Student JWT |
| `POST` | `/drives/:id/apply` | Student JWT; server checks eligibility, deadline, and duplicate applications |
| `GET` | `/applications/student`, `/interviews/student` | Student JWT |
| `GET` | `/notifications/me` | Student JWT |
| `PATCH` | `/notifications/:id/read` | Student JWT; updates only the signed-in student's notification |

Student-only routes derive the student ID from the verified JWT. Do not pass an ID from the browser as proof of ownership. Student registration requires `name`, `email`, `registrationNumber`, and a password of at least eight characters. Passwords are hashed with bcrypt.

## Supabase handoff

No database connection is made by this version. When Supabase is set up, replace the array-backed methods in `src/repositories/student.repository.js` and migrate controllers that still read the arrays in `src/config/db.js` to the agreed direct Supabase/PostgreSQL access method. Keep API response shapes stable so the student portal does not need to change with the storage implementation. Resume uploads should move to a private Supabase Storage bucket and continue to use an authenticated download or short-lived signed URL.

## Demo student accounts

The seed store contains `alice@example.com`, `bob@example.com`, and `carol@example.com`. Each has the development password `password`. These accounts and all seed data are for local demonstration only.
