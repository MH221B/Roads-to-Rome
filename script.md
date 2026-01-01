# Roads to Rome - Demo Script

### Part 1: Introduction & Tech Stack Overview

**[Action: Start on the Landing Page / Login Screen]**

- "Good morning/afternoon. This is **Roads to Rome**, a full-stack Learning Management System designed to handle the complete lifecycle of online education—from course creation to code assessment."
- "Before I dive into the features, I want to highlight the architecture. I built this using a strictly typed **MERN stack**:
- **Frontend:** React with TypeScript, bundled via Vite.
- **Backend:** Node.js and Express, strictly typed.
- **Database:** MongoDB with Mongoose.
- **Styling:** Tailwind CSS and shadcn/ui components for a consistent design system."

---

### Part 2: Student Experience & Frontend Performance

**[Action: Log in as a Student and scroll through the Course Catalog]**

- "Starting with the student view. As I scroll through the course catalog, you'll notice the performance.
- I implemented **Infinite Scroll** using custom hooks to handle large datasets efficiently.
  - Uses an **IntersectionObserver** at the bottom of the list to detect when the user approaches the end.
  - Automatically fetches the next page of courses without requiring a "Load More" button.
  - Deduplicates results by ID to prevent showing the same course twice.
  - Tracks `hasMore` state to know when we've reached the end of all available courses.
- Data fetching is managed by **TanStack Query**. This handles caching and server-state synchronization, meaning if I navigate away and come back, the data is instantly available without a re-fetch."

- "The UI components are modular, built with **Radix UI** for accessibility and **Tailwind** for styling."

**[Action: Enter a Course and open a Lesson with Code]**

- "This is the core learning interface.
- On the left, we have the lesson content rendered via **Tiptap**, a headless rich-text editor.
- On the right, this isn't just a text area. I integrated the **Monaco Editor**—the same engine powering VS Code. This gives students syntax highlighting and IntelliSense right in the browser."

- "When I run this code, it hits a dedicated endpoint (`/api/code`). The backend creates a secure sandbox environment to evaluate the submission and returns the output in real-time."

---

### Part 3: The Instructor Flow & Complex Forms

**[Action: Switch accounts or navigate to the Instructor Dashboard]**

- "Let’s look at the Instructor capabilities. Building a course is complex, so handling state here was critical."

**[Action: Open the 'Create Course' or 'Edit Course' view]**

- "For these complex forms, I used **React Hook Form** combined with **Zod** validation. This prevents unnecessary re-renders that you often get with standard React state forms."
- "For media management, like course thumbnails and videos, I integrated **Supabase** storage. All uploads go through a `multer` middleware on my backend before being securely stored in the cloud."

**[Action: Show the Drag-and-Drop Lesson Organizer]**

- "Managing curriculum structure can be messy. To solve this, I implemented **@dnd-kit**.
- This allows instructors to drag and drop lessons to reorder them.
- On the backend, this updates the order index in the MongoDB `Lesson` schema automatically."

---

### Part 4: AI Integration & Backend Logic

**[Action: Go to the Quiz Creator or show a generated Quiz]**

- "One of the standout features is the AI integration.
- Writing quizzes is tedious. I integrated **Google’s GenAI API**.
- The system analyzes the lesson content (text and code) and automatically generates relevant multiple-choice questions."

- "When a student submits a quiz, the backend processes the grading logic and stores the result in a `SubmitQuiz` collection, linking it to their specific `Enrollment` record."

---

### Part 5: Architecture & Backend Deep Dive

**[Action: Briefly show the Admin Dashboard or simply stay on a static screen while talking]**

- "While the frontend is flashy, the heavy lifting happens in the backend. I utilized a **Service Layer Architecture**."
- "I didn't want my Controllers to contain business logic. Instead, I split the backend into clearly separated layers, each with its own responsibility:
  - **Route Layer** – Defines HTTP endpoints and applies middleware. It's just a map of what API calls go where.
  - **Controller Layer** – Extracts data from the request (params, body, user info) and delegates to services. It handles HTTP responses—nothing more.
  - **Service Layer** – Where the real business logic lives. For example, `authService` handles JWT generation, `courseService` validates course ownership before updates, and `quizService` calculates quiz scores.
  - **Model Layer** – MongoDB schemas and validation. Mongoose models query the database.
  - **Middleware Layer** – Intercepts requests before they reach controllers. This is where JWT authentication happens, role-based access control is enforced, and file uploads are processed via `multer`.

- "This separation means a quiz submission flows like this: Route → Middleware (validate user) → Controller (extract data) → Service (calculate score, store result) → Model (persist to DB).
- Each layer can be tested independently. Services don't know about HTTP; they just care about data and logic."

- "This separation makes the codebase testable. I wrote unit and integration tests using **Vitest** and **MongoMemoryServer** to ensure features work in isolation before hitting the production database."
- "Security-wise, everything is protected by **JWT authentication** with role-based middleware. An Admin can do things a Student cannot, and the API enforces this at the route level."

---

### Part 6: Conclusion

**[Action: Return to Home Screen]**

- "To wrap up, Roads to Rome is a production-ready educational platform.
- It handles real-time code execution, complex state management, and AI integration, all wrapped in a type-safe TypeScript environment."
- "Thank you for watching. I'm happy to walk through any specific part of the code you'd like to see."
