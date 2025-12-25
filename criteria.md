# Final project Self-assessment report

Team: 22127095-22127123-22127131

GitHub repo URL: [Roads-to-Rome](https://github.com/MH221B/Roads-to-Rome)

# **TEAM INFORMATION**

| Student ID     | Full name              | Git account       | Contribution                        | Contribution percentage (100% total) | Expected total points | Final total points |
| :------------- | :--------------------- | :---------------- | :---------------------------------- | :----------------------------------- | :-------------------- | :----------------- |
|    22127095    |      Do Dinh Hai       |   Seapeas290904   | Implemented lesson UI and quiz creation/editing, built the instructor dashboard, integrated the Piston/Monaco code editor and AI quiz generator, implemented password reset and backend authentication/authorization, and set up testing/CI.  | 33%                               |          10           |                    |
|    22127123    | Tran Nguyen Minh Hoang |      MH221B       | Implemented core course & lesson management (create/edit/list/pagination), course-related integrations and admin utilities, and key UI/UX improvements. | 34%                                  |          10           |                    |
|    22127131    |    Le Ho Phi Hoang     |     HoangRory     | Implemented enrollment & budget features, quiz UI and flows, admin dashboard enhancements, and search/commenting/recommendation features. | 33%                                  |          10           |                    |

# **FEATURE LIST**

**Project:** Learnix - Online Learning Platform

Students must input minus points to every uncompleted feature in the SE column.

\*SE: Self-evaluation

\*TR: Teacher review

| ID    | Features                                          | Grade     |          |          | Notes                                                                                                                                                                   |
| ----- | :------------------------------------------------ | --------- | :------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       |                                                   | **Point** | **SE\*** | **TR\*** |                                                                                                                                                                         |
| **1** | **Overall requirements**                          |           |          |          |                                                                                                                                                                         |
|       | User-centered design                              | \-5       |    \-0   |          | Built with user experience in mind. Focus on solving real learning problems: intuitive course browsing, interactive lessons, progress tracking, and seamless enrollment |
|       | Database design                                   | \-1       |  \-0     |          | Database with tables: `users`, `courses`, `lessons`, `enrollments`, `quizzes`, `questions`, `progress`, `submissions`, `reviews`                                        |
|       | Database mock data                                | \-1       |  \-0     |          | Sample courses, lessons, categories, users, quizzes, and test enrollments                                                                                               |
|       | Website layout                                    | \-2       |  \-0     |          | AppShell with header, sidebar, content area. Role-based layouts for Guest, Student, Instructor, Admin                                                                   |
|       | Website architect                                 | \-3       |  \-0     |          | Based on MVC architecture. Clear separation of concerns with controllers, services, repositories. Client-side validation, Input validation, Business rule validation    |
|       | Website stability and compatibility               | \-4       |  \-0     |          | Responsive design, tested on Chrome, Safari, Firefox, and Edge                                                                                                          |
|       | Document                                          | \-2       |  \-0     |          | Clear documentation for developers and users: setup guide, API endpoints, database design, system architecture, user guide                                              |
|       | Demo video                                        | \-5       |  \-0     |          | Video demonstrating all features: auth, guest browse/search, student enroll/lessons/quiz, instructor create course/lesson/quiz, admin approve/reject                    |
|       | Publish to public hosts                           | \-1       |  \-0     |          | Deployed FE/BE to a public hosting service with accessible URL                                                                                                          |
|       | Development progress is recorded in Github        | \-7       |  \-0     |          | Git history with meaningful commits, branches for features, pull requests                                                                                               |
| **2** | **Guest features (Public Browsing)**              |           |          |          |                                                                                                                                                                         |
|       | Homepage (Public)                                 | \-0.25    |  \-0     |          | Display latest courses, categories, and trending tags - MH221B                                                                                                          |
|       | Public Navigation                                 | \-0.25    |\-0       |          | Navbar with Home, Courses, Login/Signup links - MH221B                                                                                                                  |
|       | View list of courses                              | \-0.25    | \-0      |          | Display course cards with title, instructor, difficulty level - MH221B                                                                                                  |
|       | Filter courses by                                 |           |          |          | A combination of the criteria                                                                                                                                           |
|       | › Category                                        | \-0.25    | \-0      |          | Filter by course categories - MH221B                                                                                                                                    |
|       | › Tag                                             | \-0.25    | \-0      |          | Filter by course tags - HoangRory                                                                                                                                       |
|       | Sort courses                                      | \-0.25    | \-0      |          | Sort available courses by various criteria - MH221B                                                                                                                     |
|       | Course paging                                     | \-0.75    | \-0      |          | Pagination or infinite scroll. URL updated on search/filter/paging - MH221B                                                                                             |
|       | View course details                               | \-0.25    | \-0      |          | Course overview, tags, instructor info, student count - MH221B                                                                                                          |
|       | Lock lessons for guests                           | \-0.25    | \-0      |          | Display popup requesting account subscription for locked content - MH221B                                                                                               |
|       | Fulltext search                                   | \-0.25    | \-0      |          | Full-text search across title, summary, and tags - HoangRory                                                                                                            |
|       | Theme System                                      | \-0.25    | \-0      |          | Global theme with colors, typography, spacing. Reusable components (Button, Card, FormField) - MH221B                                                                   |
|       | Responsive design                                 | \-0.25    | \-0      |          | Responsive screens, loading/empty states, error messages - MH221B                                                                                                       |
| **3** | **Authentication and authorization**              |           |          |          |                                                                                                                                                                         |
|       | Use a popular authentication library              | \-1       | \-0      |          | JWT/Session-based authentication - Seapeas                                                                                                                              |
|       | Registration (Sign Up)                            | \-0.5     | \-0      |          | User registration with email/password - Seapeas                                                                                                                         |
|       | Verify user input: password complexity, full name | \-0.25    | \-0      |          | Password rules, required fields validation - Seapeas                                                                                                                    |
|       | Login to the website (Sign In)                    | \-0.25    | \-0      |          | Email/password authentication with token/session handling - Seapeas                                                                                                     |
|       | GitHub OAuth                                      | \-0.25    | \-0      |          | GitHub login flow, map GitHub account to Learnix user - Seapeas                                                                                                         |
|       | Authorize website features (Role-based)           | \-0.25    | \-0      |          | Roles: guest, student, instructor, admin. Route guards & protected routes - Seapeas                                                                                     |
|       | Hide/show UI elements based on permissions        | \-0.25    | \-0      |          | Restricted UI elements depending on user role - Seapeas                                                                                                                 |
|       | Forgot password by email                          | \-0.25    | \-0      |          | Password reset via email link - Seapeas                                                                                                                                 |
| **4** | **Features for Students**                         |           |          |          |                                                                                                                                                                         |
|       | Student Dashboard                                 | \-0.5     | \-0      |          | List enrolled courses, course status (in-progress/completed), completion percentage - HoangRory                                                                         |
|       | Dashboard widgets                                 | \-0.25    | \-0      |          | Summary cards, progress overview, activity list - HoangRory                                                                                                             |
|       | Suggested courses                                 | \-0.25    | \-0      |          | Course recommendations based on previous courses and interests - HoangRory                                                                                              |
|       | Enrollment                                        |           |          |          |                                                                                                                                                                         |
|       | › Enroll in courses                               | \-0.25    | \-0      |          | Allow enrollment based on student's budget - HoangRory                                                                                                                  |
|       | › Unenroll from courses                           | \-0.25    | \-0      |          | Unenroll from "My Courses" - HoangRory                                                                                                                                  |
|       | Learning Experience                               |           |          |          |                                                                                                                                                                         |
|       | › View lesson list                                | \-0.25    | \-0      |          | Show lesson list after enrollment - MH221B                                                                                                                              |
|       | › Lesson Viewer (text)                            | \-0.25    | \-0      |          | Render text lessons, paper material, PDF slides - MH221B                                                                                                                |
|       | › Lesson Viewer (video)                           | \-0.25    | \-0      |          | Embedded video lessons - MH221B                                                                                                                                         |
|       | › Track learning progress                         | \-0.25    | \-0      |          | Completion % = completed lessons / total lessons - HoangRory                                                                                                            |
|       | Quizzes                                           |           |          |          |                                                                                                                                                                         |
|       | › Take quiz                                       | \-0.25    | \-0      |          | Answer MCQ questions (A/B/C/D) - HoangRory                                                                                                                              |
|       | › Instant scoring                                 | \-0.25    | \-0      |          | Submit answers → auto-grade → view score - HoangRory                                                                                                                    |
|       | › View quiz results                               | \-0.25    | \-0      |          | Score display with correct/incorrect answers - HoangRory                                                                                                                |
| **5** | **Features for Instructors**                      |           |          |          |                                                                                                                                                                         |
|       | Instructor Dashboard                              | \-0.5     | \-0      |          | Show created courses, student enrollment count, average quiz scores - MH221B                                                                                            |
|       | Course Management                                 |           |          |          |                                                                                                                                                                         |
|       | › Create course                                   | \-0.25    | \-0      |          | Add course with title, summary, tags, category, level, thumbnail - MH221B                                                                                               |
|       | › Edit/Update course                              | \-0.25    | \-0      |          | Edit existing course information - MH221B                                                                                                                               |
|       | › Delete course                                   | \-0.25    | \-0      |          | Remove course - MH221B                                                                                                                                                  |
|       | › Publish/Unpublish course                        | \-0.25    | \-0      |          | Toggle between draft and published status - MH221B                                                                                                                      |
|       | Lesson Management                                 |           |          |          |                                                                                                                                                                         |
|       | › Add lessons                                     | \-0.25    | \-0      |          | Create lessons with text content - MH221B                                                                                                                               |
|       | › Edit lessons                                    | \-0.25    | \-0      |          | Update existing lesson content - MH221B                                                                                                                                 |
|       | › Attach video                                    | \-0.25    | \-0      |          | Attach video link/file to lessons - MH221B                                                                                                                              |
|       | Quiz Management (Manual)                          |           |          |          |                                                                                                                                                                         |
|       | › Create quiz                                     | \-0.25    | \-0      |          | Create quiz per course or lesson - Seapeas                                                                                                                              |
|       | › Add MCQ questions                               | \-0.25    | \-0      |          | Add multiple choice questions (A/B/C/D + correct answer) - Seapeas                                                                                                      |
|       | › Edit/Delete questions                           | \-0.25    | \-0      |          | Manage quiz questions - Seapeas                                                                                                                                         |
|       | AI Quiz Generator                                 |           |          |          |                                                                                                                                                                         |
|       | › Generate MCQ from lesson text                   | \-0.5     | \-0      |          | Input lesson text/summary → Output 5-10 draft MCQs using AI - Seapeas                                                                                                   |
|       | › Review & edit AI questions                      | \-0.25    | \-0      |          | Preview AI questions, edit answers, remove bad items - Seapeas                                                                                                          |
|       | › Approve and save quiz                           | \-0.25    | \-0      |          | Approve AI-generated quiz → save to database - Seapeas                                                                                                                  |
| **6** | **Administration features (Admin)**               |           |          |          |                                                                                                                                                                         |
|       | Admin Dashboard                                   | \-0.5     | \-0      |          | System statistics: total users, courses, enrollments - HoangRory                                                                                                        |
|       | User Management                                   |           |          |          |                                                                                                                                                                         |
|       | › View all users                                  | \-0.25    | \-0      |          | List all users with filters and search - MH221B                                                                                                                         |
|       | › Assign roles                                    | \-0.25    | \-0      |          | Change user roles (student, instructor, admin) - MH221B                                                                                                                 |
|       | › Lock/Unlock accounts                            | \-0.25    | \-0      |          | Suspend or reactivate user accounts - MH221B                                                                                                                            |
|       | Course Moderation                                 |           |          |          |                                                                                                                                                                         |
|       | › Review submitted courses                        | \-0.25    | \-0      |          | View courses pending approval - HoangRory                                                                                                                               |
|       | › Approve/Reject courses                          | \-0.25    | \-0      |          | Course states: draft → pending → approved/published → rejected/hidden - HoangRory                                                                                       |
|       | › Show interactive charts                         | \-0.25    | \-0      |          | Charts for system statistics (users, courses, enrollments) - HoangRory                                                                                                  |
| **7** | **Advanced features**                             |           |          |          |                                                                                                                                                                         |
|       | Embedded IDE                                      |           |          |          |                                                                                                                                                                         |
|       | › IDE UI integration                              | 0.25      |   0.25   |          | Code editor, Run button, Output console attached to lesson - Seapeas                                                                                                    |
|       | › Multi-language runtime                          | 0.25      |   0.25   |          | Support ≥2 languages (Python + JavaScript) - Seapeas                                                                                                                    |
|       | Dockerize your project                            | 0.25      |   0.25   |          | Docker containers for backend, frontend, database Seapeas/MH221B                                                                                                                       |
|       | CI/CD                                             | 0.25      |   0.25   |          | Automated testing and deployment pipeline (GitHub Actions, GitLab CI, Jenkins, etc.) - MH221B                                                                                   |
|       | Test coverage                                     | 0.25      |   0.25   |          | Testing core flows: auth, browse/search (MH221B), enroll, lessons, quiz, admin (HoangRory)                                                                              |

# **GIT HISTORY**

## **Contributors**

| Avatar | Username           | Commits | Additions | Deletions |
| :----- | :----------------- | :------ | :-------- | :-------- |
|        |      MH221B        |    139  |   29,327  |   9,526   |
|        |      Seapeas290904 |    34   |   20,884  |   1,638   |
|        |      HoangRory     |    26   |   7566    |   1536    |

## **Commits**

_List significant commits here with format:_

| Date       | Author        | Commit Message  | Files Changed |
| :--------- | :------------ | :---------------------------------------------------------------------------------------------------------------- | :------------ |
| 2025-12-25 | MH221B | feat: enhance course management with visibility toggle and review notes | 7 |
| 2025-12-23 | MH221B | feat: add support course status display and submission for review | 5 |
| 2025-12-23 | Seapeas | feat: integrate Piston API for code execution with support for Python and C++ | 10 |
| 2025-12-22 | HoangRory | feat: implement budget top-up feature with mock payment processing | 8 |
| 2025-12-21 | HoangRory | feat: implement enrollment based on user budget and course pricing | 9 |
| 2025-12-21 | HoangRory | feat: implement user profile retrieval and budget display in dashboard | 5 |
| 2025-12-21 | HoangRory | feat: add budget management and course pricing features in admin panel | 13 |
| 2025-12-21 | HoangRory | feat: implement course suggestion feature based on user interests and history | 8 |
| 2025-12-21 | MH221B | feat: refactor lesson and course models to support video content and handle deletions | 18 |
| 2025-12-21 | MH221B | feat: enhance lesson management with video and attachment uploads | 9 |
| 2025-12-20 | MH221B | feat: add course status filtering for published courses based on user roles | 5 |
| 2025-12-20 | HoangRory | feat: add course and user course progress types, enhance enrollment functionality | 15 |
| 2025-12-18 | HoangRory | feat: Add quizzes to lesson details in LessonService | 6 |
| 2025-12-18 | HoangRory | feat: Enhance Admin Dashboard with Tabs and Statistics | 9 |
| 2025-12-17 | HoangRory | feat: add course management features for admin | 18 |
| 2025-12-16 | Seapeas | feat: add AI quiz generation feature | 11 |
| 2025-12-10 | MH221B | feat: add EditLesson component and integrate lesson editing functionality | 6 |
| 2025-12-10 | MH221B | feat: implement draggable lesson list for reordering in CourseDetail | 5 |
| 2025-12-09 | MH221B | feat: enhance lesson management with new features and improvements | 9 |
| 2025-12-07 | HoangRory | feat: update UI quiz | 11 |
| 2025-12-07 | MH221B | feat: add lesson creation functionality with video and attachment uploads | 13 |
| 2025-12-07 | HoangRory | feat(quiz): implement full quiz UI components, services, models & API (fetch quizzes, submit answers, disabled states) fix(course/enrollment): standardize courseId as string across models, services, and seed data | 27 |
| 2025-12-07 | Seapeas | feat: enhance instructor insights and course management | 17 |
| 2025-12-07 | MH221B | feat: add course editing functionality with CourseForm component and update API integration | 7 |
| 2025-12-07 | Seapeas | feat: implement quiz editing functionality and instructor course retrieval | 10 |
| 2025-12-07 | Seapeas | feat: add quiz functionality with creation, submission, and grading features | 13 |
| 2025-12-07 | MH221B | feat: implement CourseCardCompact component; add delete course functionality | 7 |
| 2025-12-06 | MH221B | feat: update instructor field to support object structure and enhance course handling | 8 |
| 2025-12-06 | MH221B | feat: extend user registration to include username and full name fields | 5 |
| 2025-12-06 | HoangRory | feat: highlight selected question button, add headerComponent, set TimeRamaining | 5 |
| 2025-12-06 | HoangRory | feat: Core Quiz Rendering QuizPage with QuestionList, QuestionCard, AnswerOption | 7 |
| 2025-12-06 | MH221B | feat: implement course creation with thumbnail upload and Supabase integration | 8 |
| 2025-12-05 | MH221B | feat: add CreateCourse component and update routing | 6 |
| 2025-12-02 | HoangRory | feat: add enrollment update functionality with progress and rating tracking | 5 |
| 2025-12-02 | HoangRory | feat: implement course fetching and commenting functionality with user authentication | 8 |
| 2025-12-02 | Seapeas | feat: enhance ESLint configuration and add course router with health check endpoint | 7 |
| 2025-12-01 | Seapeas | feat: implement lesson management with CRUD operations and API integration | 14 |
| 2025-12-01 | HoangRory | feat: add enrollment management with CRUD operations and seeding script | 7 |
| 2025-12-01 | HoangRory | feat: implement course list endpoint (controller, service, repo) and seed script for Course List | 11 |
| 2025-12-01 | Seapeas | feat(client): Add CourseDetail, Enrolment, and LessonViewer components with API integration and UI enhancements | 7 |
| 2025-11-24 | MH221B | feat: add progress bar component and integrate into CourseCard and Dashboard | 9 |
| 2025-11-23 | MH221B | feat: add Dashboard component with CourseFilterBar and implement RequireAuth for protected routes | 6 |
| 2025-11-21 | MH221B | feat: add forgot and reset password functionality with routing | 5 |
| 2025-11-21 | MH221B | feat: add role selection to registration and update auth handling | 8 |
| 2025-11-21 | Seapeas | feat: add testing framework and MongoDB memory server for tests | 7 |
| 2025-11-21 | Seapeas | feat: initialize server with authentication and user management | 8 |
| 2025-11-21 | Seapeas | feat: initialize server with authentication system | 15 |
| 2025-11-19 | MH221B | feat: add Radix UI aspect ratio and badge components; update HomePage with mock data and layout improvements | 6 |
| 2025-11-19 | MH221B | feat: add authentication context and user management components | 26 |
| 2025-11-17 | MH221B | feat(client): initialize React application with Vite, Tailwind CSS and shadcn | 15 |

---

# **PROJECT SUMMARY**

## System Overview

**Learnix** is an online learning platform that enables:

- **Guests** to browse courses, search by title/summary/tags, view course details
- **Students** to enroll in courses, view lessons (text + video), track progress, take quizzes with instant scoring
- **Instructors** to create/manage courses and lessons, create quizzes manually or using AI quiz generator
- **Admins** to manage users, assign roles, moderate courses (approve/reject), view system statistics

## Technology Stack

- **Architecture:** Single Page Application (SPA) with separate FE/BE repos
- **Frontend:** React/Vue/Angular
- **Backend:** NodeJS with Express/NestJS
- **Database:** PostgreSQL / MongoDB
- **Authentication:** JWT/Session + Google OAuth
- **AI Integration:** OpenAI API for quiz generation
- **Infrastructure:** Docker, CI/CD pipeline
- **Hosting:** Cloud deployment (AWS/GCP/Vercel)

## Database Entities

| Entity        | Description                                                        |
| :------------ | :----------------------------------------------------------------- |
| `users`       | User accounts with roles (guest, student, instructor, admin)       |
| `courses`     | Course information (title, summary, tags, category, level, status) |
| `lessons`     | Lesson content (text, video links)                                 |
| `enrollments` | Student-course enrollment records                                  |
| `quizzes`     | Quiz metadata per course/lesson                                    |
| `questions`   | MCQ questions (A/B/C/D + correct answer)                           |
| `progress`    | Student learning progress tracking                                 |
| `submissions` | Quiz submission records with scores                                |
| `reviews`     | Course reviews and ratings                                         |

## Key User Flows

1. **Guest Browsing:** Homepage → Browse Courses → Filter/Search → View Course Details → Prompted to Sign Up
2. **Student Learning:** Sign Up/Login → Dashboard → Enroll in Course → View Lessons → Take Quiz → View Score
3. **Instructor Workflow:** Login → Dashboard → Create Course → Add Lessons → Create Quiz (Manual/AI) → Publish
4. **Admin Moderation:** Login → Dashboard → View Users → Manage Roles → Review Courses → Approve/Reject

## Development Timeline

| Week   | Focus                                             | Key Deliverables                                                                         |
| :----- | :------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| Week 1 | Authentication, Authorization, Layout & Dashboard | Auth (email + Google OAuth), role-based access, AppShell, dashboard prototype            |
| Week 2 | Guest Browsing + Student Learning MVP             | Homepage, course list/details, search, enroll/unenroll, lesson viewer, student dashboard |
| Week 3 | Instructor + Manual Quiz                          | Course/lesson management, instructor dashboard, manual quiz creation, quiz taking        |
| Week 4 | Admin Module + AI Quiz Generator MVP              | User management, course moderation, system stats, AI quiz generator                      |
| Week 5 | Embedded IDE + Testing + Final Release            | IDE integration (optional), UI/UX polish, testing, deployment, demo                      |