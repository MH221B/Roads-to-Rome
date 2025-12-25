# Roads to Rome

Roads to Rome is a full-stack project with a TypeScript/Node backend and a Vite + React frontend. This README explains how to run the app locally (Node or Docker), how CI/CD is configured, how authentication and authorization work, what environment variables are required, and the main architectural decisions.

---

## User Guide

This section is for people using the deployed app (students, instructors, admins). It maps directly to the routed pages and behaviors defined in `client/src/App.tsx` and the backend routes listed below.

### Access & URLs
- Frontend: deployed URL (or `http://localhost:5173` locally). Backend must be reachable at `http://localhost:3000` (or your deployed API base).
- All primary pages are routable: `/` home, `/courses` catalog, `/courses/:id` detail, `/dashboard`, `/enrolment`, `/courses/:courseId/lessons/:lessonId`, quiz paths, and role-specific pages listed below.

### Accounts & Authentication
- Sign up: `/signup` (email/password). Login: `/login`. GitHub OAuth is also supported.
- Forgot/reset password: `/forgot-password` to request a link; `/reset-password/:token` to set a new password.
- Tokens: access token in memory; refresh token is an HttpOnly cookie. If you hit auth issues, log out and back in to refresh.

### Navigation Basics (Header)
- Home and Courses are always available. When authenticated: `Dashboard` appears in the profile menu. Students see `My Enrollments`. Instructors see `AI Quiz`.
- Logout via the avatar dropdown; you will be redirected to `/login`.

### Roles and Capabilities
- **Student**: browse and search courses, view course details, enroll, watch lessons, mark lessons complete, take quizzes, leave feedback/comments, track progress on `/dashboard` and `/enrolment`.
- **Instructor**: all student abilities plus create/edit courses and lessons, manage pricing/premium flags during creation, create quizzes (`/quizzes/new`), edit quizzes (`/quizzes/:id/edit`), and generate AI quizzes (`/ai-quiz`).
- **Admin**: full access. Review and moderate courses at `/course` (list) and `/course/:id` (review), manage users/roles/locks/budgets, adjust pricing, and view stats on `/admin`.

### Course Catalog and Enrollment
- Browse catalog: `/courses` supports search/filter UI (front-end) backed by `/api/courses`.
- Course detail: `/courses/:id` shows description, lessons, instructor info, comments, and pricing/premium state.
- Enroll: click *Enroll* to create an enrollment. If a course has a price, the amount is deducted from your budget; if budget is insufficient, enrollment is blocked.
- Enrollments and progress are visible at `/enrolment` and `/dashboard`.

### Lessons and Learning Flow
- Lesson viewer: `/courses/:courseId/lessons/:lessonId` (auth required) streams lesson content/video and attachments.
- Mark complete to update progress for the course; completion state feeds dashboards and recommendations.

### Quizzes
- Take quizzes from course/lesson context: `/courses/:courseId/quiz/:quizId` (auth required). Attempt history is available via the backend `/api/quiz/:quizId/history`.
- Instructors create quizzes at `/quizzes/new`, edit at `/quizzes/:id/edit`, and can auto-generate quiz questions using `/ai-quiz`.

### Instructor Course & Lesson Workflow
- Create course: `/courses/create` (INSTRUCTOR). Provide title, category, tags, short description, price/premium flag, thumbnail.
- Edit course: `/courses/:id/edit` (INSTRUCTOR). Update metadata or pricing.
- Manage lessons: `/courses/:courseId/lessons/create` to add lessons; `/courses/:courseId/lessons/:lessonId/edit` to update content, video, attachments, and ordering.

### Admin Workflow
- Course review: `/course` lists pending/filtered courses; `/course/:id` opens review detail to approve/reject/hide and set price/premium.
- User management and stats: `/admin` gives access to admin dashboard data (users, roles, locks, budgets, stats).

### Payments (Development vs Production)
- Development: budget top-ups use the mock endpoint `/api/payments/mock` (surfaced via the top-up dialog in the student dashboard). No real charges occur.
- Enrollment: deducts from the user budget when price > 0; it fails with an insufficient-budget message if funds are low.
- Production: wire a real payment provider for top-ups and align the enrollment flow with that provider’s status and errors.

### Troubleshooting
- Auth issues (401/403): log out/in to refresh tokens; confirm your role matches the required page (e.g., INSTRUCTOR for creation paths, ADMIN for review paths).
- Missing data: check that the backend is running and environment variables are set; `/api/health` should return OK.
- Upload/thumbnail/video problems: verify backend `POST /api/uploads` is reachable and that CORS settings permit your frontend origin.
- Quiz not loading: ensure you are logged in and the quiz URL includes both `courseId` and `quizId`.

## CI / CD Workflow

The GitHub Actions workflow (`.github/workflows/ci-cd.yaml`) runs on every `push` or `pull_request` targeting `main` or `dev`.

- **`server-lint` job:**
  - Checks out repo
  - Sets up Node.js 20
  - Runs `npm ci` in `server/`
  - Installs ESLint + TypeScript plugins (not in lockfile)
  - Runs `npx eslint src --ext .ts || true` (lints but never fails CI)

- **`server-deploy` job:**
  - Runs after `server-lint` and `server-test`
  - Calls the Render deploy hook stored in `RENDER_DEPLOY_HOOK`
  - If the secret is missing, exits with an error
  - `curl` is allowed to fail without failing CI

- **`client-deploy` job:**
  - Also waits for `server-lint`
  - Installs dependencies in `client/`
  - Builds Vite with `npm run build`
  - Deploys to Vercel via `npx vercel --prod --token "$VERCEL_TOKEN"`
  - Requires `VERCEL_TOKEN` GitHub secret

- **Optional (commented out):**
  Client lint/testing, server unit tests — enable these when stable.

---

## Render Deployment Configuration

- **Deploy hook:**
  Create a deploy hook under Render → _Manual Deploy → Deploy Hooks_ and store the URL in the `RENDER_DEPLOY_HOOK` GitHub secret. CI simply POSTs to it.

- **Environment variables:**
  Configure all vars used in `server/.env` (DB URL, JWT secrets, mail creds, OAuth keys). Exact names must match.

- **Monitoring deployments:**
  Verify successful builds via service logs and test the generated public URL.

---

## Running the Server Locally (Docker or Node)

### **Node (recommended for development)**

```powershell
cd server
npm install
npm run dev
```

Production build:

```powershell
cd server
npm install --production
npm run build
npm start
```

### **Client**

```powershell
cd client
npm install
npm run dev
```

Production build:

```powershell
cd client
npm run build
npm run preview
```

**Default URLs**

- Frontend → `http://localhost:5173`
- Backend → `http://localhost:3000`

---

## Running the Server in Docker

Before running, ensure `server/.env` exists with required variables.

### **Production-like container**

```powershell
cd server
docker compose -f docker-compose.yml up --build
```

### **Development container (with hot reload)**

```powershell
cd server
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

Stop containers:

```
docker compose down
```

View logs:

```
docker compose logs -f server
```

---

## Environment Variables

Create `server/.env` with at least:

- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `RESET_PASSWORD_SECRET`
- `CLIENT_URL`
- `SESSION_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `PISTON_URL`
- `GEMINI_API_KEY` (and optional `GEMINI_MODEL_NAME`)
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`

**Email:**
Development uses Ethereal automatically (no setup).
Production requires a real SMTP provider (SendGrid, Mailgun, SES, Gmail SMTP, etc.).

---

## Authentication Overview

- **Access Token**
  - Short-lived JWT (~1h)
  - Signed with `ACCESS_TOKEN_SECRET`
  - Returned to the client in JSON
  - Should be stored in memory, not localStorage

- **Refresh Token**
  - Long-lived JWT (~7 days)
  - Signed with `REFRESH_TOKEN_SECRET`
  - Stored in an `HttpOnly`, `SameSite=strict`, `secure` cookie
  - Not accessible to JavaScript

- **Refresh flow**
  - Client calls refresh endpoint
  - Server reads refresh cookie
  - Server returns a new access token

- **Authorization**
  - Roles defined in `Role` enum
  - Middleware:
    - `authenticateToken`
    - `authorizeRoles([...])`

- **OAuth (GitHub)**
  - Implemented
  - Creates new users with `Role.STUDENT` by default
  - Generates and emails a fallback password

Key files:

- `server/src/middlewares/auth.middleware.ts`
- `server/src/services/auth.service.ts`
- `server/src/enums/user.enum.ts`

---

## Backend / External Setup

- Register GitHub OAuth app
  - Local callback: `http://localhost:3000/api/auth/github/callback`
  - Production callback: your deployed backend URL

- Add client ID/secret to environment variables
- For additional providers (Google/Facebook), repeat the same setup
- Email dev = Ethereal; prod = real SMTP

---

## API Reference

A concise list of the HTTP API endpoints exposed by the backend. For each endpoint we show the method, path, authentication/authorization requirements, a short description, and key request fields.

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/health` | Public | Health check | — |
| POST | `/api/uploads` | Public | Upload a single file (returns public URL) | multipart/form-data: `file` |

### Authentication

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| POST | `/api/auth/login` | Public | Login with email & password; returns `accessToken` and sets `refreshToken` cookie | JSON: `{ email, password }` |
| GET | `/api/auth/github` | Public | Redirect to GitHub OAuth | — |
| GET | `/api/auth/github/callback` | Public | GitHub OAuth callback (query `code`) | query: `code` |
| POST | `/api/auth/logout` | Public | Clear `refreshToken` cookie | — |
| POST | `/api/auth/register` | Public | Register new user | JSON: `{ email, password, role, username, fullName }` |
| POST | `/api/auth/refresh-token` | Public (reads cookie) | Refresh access token using `refreshToken` cookie | — |
| POST | `/api/auth/forgot-password` | Public | Trigger password-reset email | JSON: `{ email }` |
| POST | `/api/auth/change-password` | Public | Reset password with token | JSON: `{ token, newPassword }` |
| GET | `/api/auth/me` | Auth required | Get current user's profile | — |

### Courses

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/courses` | Public | List courses (supports pagination & filters via query params) | query: `page`, `limit`, `q`, `status` |
| GET | `/api/courses/suggestions` | Auth required | Get personalized course suggestions for the logged-in user | query: optional filters |
| GET | `/api/courses/:id` | Public | Get course by id | — |
| POST | `/api/courses` | Auth + Instructor/Admin | Create a course (supports thumbnail upload) | multipart/form-data: course fields + `thumbnail` file |
| PATCH | `/api/courses/:id` | Auth + Instructor/Admin | Update a course (supports thumbnail upload) | multipart/form-data: fields + optional `thumbnail` |
| DELETE | `/api/courses/:id` | Auth + Instructor/Admin | Delete a course | — |
| POST | `/api/courses/:courseId/comments` | Auth required | Post a comment on a course | JSON: `{ text }` |

### Lessons

Note: lesson routes are exposed nested under a course (`/api/courses/:courseId/lessons`). Direct `/api/lessons` mounts exist but the handlers currently require `courseId`, so they return 400 without it.

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| POST | `/api/courses/:courseId/lessons` | Auth + Instructor/Admin | Create a lesson (supports `video` and `attachments` file fields) | multipart/form-data: lesson fields, `video`, `attachments[]` |
| PATCH | `/api/courses/:courseId/lessons/:lessonId` | Auth + Instructor/Admin | Partially update a lesson | multipart/form-data: fields + files |
| PUT | `/api/courses/:courseId/lessons/:lessonId` | Auth + Instructor/Admin | Replace/update a lesson | multipart/form-data: fields + files |
| POST | `/api/courses/:courseId/lessons/:lessonId/complete` | Auth + Student/Admin | Mark lesson as complete for the current student | — |
| DELETE | `/api/courses/:courseId/lessons/:lessonId` | Auth + Instructor/Admin | Delete a lesson | — |
| GET | `/api/courses/:courseId/lessons/:lessonId` | Public | Get a single lesson by id | — |
| GET | `/api/courses/:courseId/lessons` | Public | List lessons for a course | query: pagination |
| GET | `/api/lessons/:lessonId` | Public | Mounted but currently expects `courseId`; use nested route instead | — |
| GET | `/api/lessons` | Public | Mounted but currently expects `courseId`; use nested route instead | query params |

### Enrollments

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/enrollments` | Auth required | List enrollments for the logged-in user | query: optional filters |
| POST | `/api/enrollments` | Auth required | Enroll current user in a course | JSON: `{ course_id, payment? }` |
| PATCH | `/api/enrollments/:id` | Auth required | Update enrollment (e.g., progress) | JSON: fields to update |
| DELETE | `/api/enrollments/:id` | Auth required | Delete/cancel enrollment | — |

### Instructor

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/instructor/insights` | Auth + Instructor | Get instructor insights (analytics) | query: optional params |
| GET | `/api/instructors/:id/courses` | Public | List courses for a specific instructor (supports pagination) | query: `page`, `limit` |
| POST | `/api/instructor/ai-quiz` | Auth + Instructor | Generate an AI-generated quiz for content | JSON: quiz seed data |

### Quiz

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/quiz/:quizId` | Auth + Admin/Instructor/Student | Get quiz by id | — |
| GET | `/api/quiz/:quizId/history` | Auth + Admin/Instructor/Student | Get quiz attempt history | query: pagination |
| POST | `/api/quiz/:quizId` | Auth + Admin/Instructor/Student | Submit answers for a quiz attempt | JSON: answers payload |
| GET | `/api/quiz` | Auth + Admin/Instructor | List all quizzes | query: `page`, `limit` |
| GET | `/api/quiz/instructor/:instructorId` | Auth + Admin/Instructor | List quizzes for an instructor | query params |
| POST | `/api/quiz` | Auth + Admin/Instructor | Create a quiz | JSON: quiz payload |
| PUT | `/api/quiz/:id` | Auth + Admin/Instructor | Update a quiz | JSON: updated quiz payload |
| DELETE | `/api/quiz/:id` | Auth + Admin/Instructor | Delete a quiz | — |

### Payments

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| POST | `/api/payments/mock` | Auth + Student/Instructor/Admin | Confirm a mock payment (development) | JSON: payment details |

### Code Execution

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| POST | `/api/code/runCodeSandbox` | Public | Run code in a sandboxed environment and return output | JSON: `{ code, language, stdin? }` |

### Admin

All admin endpoints require authentication and the `ADMIN` role.

| Method | Path | Auth | Description | Request |
|---|---:|---|---|---|
| GET | `/api/admin/admin-data` | Auth + Admin | Admin dashboard data | query params |
| GET | `/api/admin/current-user` | Auth + Admin | Get current user info (admin context) | — |
| GET | `/api/admin/users` | Auth + Admin | List all users | query: pagination, filters |
| GET | `/api/admin/users/role/:role` | Auth + Admin | List users filtered by role | path param `role` |
| GET | `/api/admin/users/search` | Auth + Admin | Search users (query) | query: `q` |
| PATCH | `/api/admin/users/:userId/role` | Auth + Admin | Update a user's role | JSON: `{ role }` |
| PATCH | `/api/admin/users/:userId/budget` | Auth + Admin | Update user budget | JSON: `{ budget }` |
| PATCH | `/api/admin/users/:userId/lock` | Auth + Admin | Toggle user locked state | JSON: `{ locked: boolean }` |
| GET | `/api/admin/courses` | Auth + Admin | Get courses by status (default: pending) | query: `status` |
| PATCH | `/api/admin/courses/:id/status` | Auth + Admin | Update course status (approve/reject/hide) | JSON: `{ status }` |
| PATCH | `/api/admin/courses/:id/price` | Auth + Admin | Update course price and premium flag | JSON: `{ price, premium }` |
| GET | `/api/admin/stats` | Auth + Admin | System statistics and metrics | — |

---

## Database Design 🔧

This project uses MongoDB (via Mongoose). Below is a concise summary of the main collections, key fields, relationships, indexes, and cascade behaviors found in `server/src/models`.

### Collections & Schemas

- **Users (`users`)**
  - Key fields: `username` (string, unique, sparse), `fullName`, `email` (unique), `password` (hashed), `role` (enum), `interests` (string[]), `budget` (number), `locked` (boolean)
  - Indexes: **text** index on `username`, `email`, `fullName` for search; unique indexes on `email` and sparse `username`.
  - Notes: Uses `mongoose-paginate-v2` for paging.

- **Courses (`courses`)**
  - Key fields: `courseId` (string, unique), `title`, `thumbnail`, `category`, `tags` (string[]), `instructor` (ObjectId → `User`), `shortDescription`, `is_premium`, `price`, `status`, `reviewNote`, `reviewedBy` (ObjectId), `reviewedAt`.
  - Indexes: **text** index on `title`, `shortDescription`, `tags`.
  - Cascade: Deleting a course cascades to related `Lesson`, `Comment`, `Enrollment`, and `Quiz` documents.
  - Notes: Uses `mongoose-paginate-v2` for paging.

- **Lessons (`lessons`)**
  - Key fields: `id` (string, unique), `course_id` (string — references `Course.courseId`), `title`, `content` (HTML), `video` (URL), `duration`, `order`, `attachments` (string[]), timestamps.
  - Notes: Routes available both nested under `/api/courses/:courseId/lessons` and `/api/lessons` where applicable.

- **Enrollments (`enrollments`)**
  - Key fields: `studentId` (ObjectId → `User`), `courseId` (string → `Course.courseId`), `status`, `progress`, `lastLessonId`, `completed`, `completedLessons`.
  - Notes: Stores student reference as ObjectId and course reference as string (matching `Course.courseId`).

- **Comments (`comments`)**
  - Key fields: `courseId` (string → `Course.courseId`), `userId` (ObjectId → `User`), `userName`, `rating`, `content`, timestamps.

- **Quizzes (`quizzes`)**
  - Key fields: `id` (string, unique), `lesson_id` (string, optional), `course_id` (string → `Course.courseId`), `title`, `description`, `timelimit`, `questions` (array of question objects), `order`, timestamps.
  - Cascade: Deleting a quiz cascades to `SubmitQuiz` records.

- **SubmitQuizzes (`submitquizzes`)**
  - Key fields: `quizId` (string), `userId` (string), `answers` (array), `score`, `duration`, `submittedAt`.

### Relationships
- `Course.instructor` → `User._id` (ObjectId)
- `Lesson.course_id` → `Course.courseId` (string)
- `Enrollment.studentId` → `User._id`; `Enrollment.courseId` → `Course.courseId` (string)
- `Comment.userId` → `User._id`; `Comment.courseId` → `Course.courseId`
- `Quiz.course_id` → `Course.courseId`; `Quiz.lesson_id` → `Lesson.id` (optional)

### Indexes & Performance
- Text search on `User` and `Course` as noted above.
- Pagination is implemented with `mongoose-paginate-v2` on `User` and `Course`.
- Frequently-filtered fields like `status`, `courseId`, and role fields should be considered for additional indexes as usage grows.

### Operational notes
- Deleting a `Course` triggers cascade deletes for related `Lesson`, `Comment`, `Enrollment`, and `Quiz` documents (handled in model hooks).
- Deleting a `Quiz` removes related `SubmitQuiz` documents.
- `courseId`, `id`, and `quiz.id` are used as human-friendly string identifiers (instead of ObjectIds) to simplify client-side lookups.
- For production readiness, consider adding explicit migration tooling (e.g., `migrate-mongo`) and monitoring for large delete operations.

---
## Architecture Design
![Architecture Design](./Roads%20to%20Rome%20Learning%20Architecture%20Design.png)

---

## Decisions & Tradeoffs

- **HttpOnly refresh cookie + short-lived access token**
  - Better XSS protection
  - Simplifies client-side token handling
  - Requires CSRF considerations (mitigated with `SameSite=strict`)

- **Stateless JWTs**
  - No session store required
  - Easy to scale horizontally
  - Harder to force immediate revocation

- **No refresh token rotation**
  - Simpler
  - Less secure if refresh token is leaked

- **OAuth user creation**
  - Auto-creating accounts makes onboarding straightforward
  - Could be surprising; alternative is requiring explicit setup

- **Email handling**
  - Ethereal for dev to prevent real email sends
  - Real SMTP required for production

---
