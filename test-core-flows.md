# Test Scenarios – Core Flows

## 1) Enroll

- **Scenario:** Student enrolls in a course
- **Precondition:** Student account has sufficient balance
- **Steps:**
  1. Login as student
  2. Open course detail
  3. Click "Enroll"
- **Expected:** Enrollment record created; balance deducted (if applicable); course appears in My Courses; repeat enroll blocked.
- **Status:** Passed (Manual test)

## 2) Lesson Access & Progress

- **Scenario:** Enrolled student consumes lessons and progress persists
- **Precondition:** Student is enrolled in the course
- **Steps:**
  1. Open course; view lesson list (order + lock states)
  2. Open text lesson (markdown/PDF)
  3. Open video lesson (player loads)
  4. Complete lesson / click Next
  5. Refresh page or re-login
- **Expected:** Content renders correctly; progress increments after completion; progress persists after refresh and across sessions.
- **Status:** Passed (Manual test)

## 3) Quiz

- **Scenario:** Student takes quiz and receives instant grading
- **Precondition:** Student enrolled in course with an available quiz
- **Steps:**
  1. Launch quiz from course
  2. Answer MCQs (A-D)
  3. Submit quiz
- **Expected:** Server auto-grades and returns score; results show correct/incorrect per question; attempt history stored; retake rules enforced.
- **Status:** Passed (Manual test)

## 4) Admin Moderation

- **Scenario:** Admin reviews and updates course/user states
- **Precondition:** Admin account exists; there are pending courses and active users
- **Steps:**
  1. Login as admin and open Admin Dashboard
  2. View stats widgets/charts load
  3. Open Pending Courses → approve one, reject one
  4. Open User Management → filter users → change role → lock/unlock
  5. Student tries to login again after lock/unlock
- **Expected:** Dashboard data loads; course status updates with audit; user role/lock state persisted; locked account blocked, unlocked account allowed.
- **Status:** Passed (Manual test)
