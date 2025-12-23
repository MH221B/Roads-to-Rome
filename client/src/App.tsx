import LoginCard from '@/components/LoginCard';
import RegisterCard from '@/components/RegisterCard';
import HomePage from '@/components/HomePage';
import AdminPage from '@/components/AdminPage';
import RequireRole from '@/components/RequireRole';
import Forbidden from '@/components/Forbidden';
import AdminCoursesPage from '@/components/AdminCoursesPage';
import RequireAuth from '@/components/RequireAuth';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseDetail from '@/components/CourseDetail';
import Enrolment from '@/components/Enrolment';
import LessonViewer from '@/components/LessonViewer';
import CreateLesson from '@/components/CreateLesson';
import EditLesson from '@/components/EditLesson';
import CreateCourse from './components/CreateCourse';
import EditCourse from './components/EditCourse';
import QuizPage from './components/QuizPage';
import QuizCreator from './components/QuizCreator';
import QuizEditor from './components/QuizEditor';
import AIQuizCreator from './components/AIQuizCreator';

const AdminCourseLegacyRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/course/${id}` : '/course'} replace />;
};

function App() {
  return (
    <Router>
      <div className="flex grow flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/course"
            element={
              <RequireRole roles="ADMIN">
                <AdminCoursesPage />
              </RequireRole>
            }
          />
          <Route
            path="/course/:id"
            element={
              <RequireRole roles="ADMIN">
                <CourseDetail adminReviewMode />
              </RequireRole>
            }
          />
          <Route path="/admin/courses" element={<Navigate to="/course" replace />} />
          <Route path="/admin/courses/:id" element={<AdminCourseLegacyRedirect />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/signup" element={<RegisterCard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="/courses" element={<CourseList />} />
          <Route
            path="/courses/create"
            element={
              <RequireRole roles="INSTRUCTOR">
                <CreateCourse />
              </RequireRole>
            }
          />
          <Route
            path="/courses/:id/edit"
            element={
              <RequireRole roles="INSTRUCTOR">
                <EditCourse />
              </RequireRole>
            }
          />
          <Route
            path="/enrolment"
            element={
              <RequireAuth>
                <Enrolment />
              </RequireAuth>
            }
          />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route
            path="/courses/:courseId/lessons/create"
            element={
              <RequireRole roles="INSTRUCTOR">
                <CreateLesson />
              </RequireRole>
            }
          />
          <Route
            path="/courses/:courseId/lessons/:lessonId/edit"
            element={
              <RequireRole roles="INSTRUCTOR">
                <EditLesson />
              </RequireRole>
            }
          />
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={
              <RequireAuth>
                <LessonViewer />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole roles="ADMIN">
                <AdminPage />
              </RequireRole>
            }
          />
          <Route path="/403" element={<Forbidden />} />
          <Route
            path="/courses/:courseId/quiz/:quizId"
            element={
              <RequireAuth>
                <QuizPage />
              </RequireAuth>
              // need authentication to access quiz
            }
          />
          <Route
            path="/quizzes/new"
            element={
              <RequireRole roles="INSTRUCTOR">
                <QuizCreator />
              </RequireRole>
            }
          />
          <Route
            path="/quizzes/:id/edit"
            element={
              <RequireRole roles="INSTRUCTOR">
                <QuizEditor />
              </RequireRole>
            }
          />
          <Route
            path="/ai-quiz"
            element={
              <RequireRole roles="INSTRUCTOR">
                <AIQuizCreator />
              </RequireRole>
            }
          />
          {/* // ex: /courses/123/lessons/456/quiz */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
