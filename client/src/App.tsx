import LoginCard from '@/components/LoginCard';
import RegisterCard from '@/components/RegisterCard';
import HomePage from '@/components/HomePage';
import AdminPage from '@/components/AdminPage';
import RequireRole from '@/components/RequireRole';
import AdminGuard from '@/components/AdminGuard';
import Forbidden from '@/components/Forbidden';
import AdminCoursesPage from '@/components/AdminCoursesPage';
import AdminCourseReview from '@/components/AdminCourseReview';
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
import InstructorDashboard from './components/InstructorDashboard';
import AIQuizCreator from './components/AIQuizCreator';
import { decodeJwtPayload } from './lib/utils';
import { useAuth } from './contexts/AuthProvider';
import { useState, useMemo, useEffect } from 'react';

const AdminCourseLegacyRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/course/${id}` : '/course'} replace />;
};

function App() {
  const { accessToken } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  useEffect(() => {
    const rawRoles = payload?.roles ?? payload?.role;
    const userRoles: string[] = (
      Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []
    ).map((r) => String(r).toUpperCase());
    setIsInstructor(userRoles.includes('INSTRUCTOR'));
    setIsAdmin(userRoles.includes('ADMIN'));
    setRoles(userRoles);
  }, [payload, setIsInstructor, setIsAdmin, setRoles]);
  return (
    <Router>
      <div className="flex grow flex-col">
        <Routes>
          <Route path="/" element={isAdmin ? <AdminPage /> : <HomePage />} />
          <Route
            path="/users"
            element={
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            }
          />
          <Route
            path="/course"
            element={
              <AdminGuard>
                <AdminCoursesPage />
              </AdminGuard>
            }
          />
          <Route
            path="/course/:id"
            element={
              <AdminGuard>
                <AdminCourseReview />
              </AdminGuard>
            }
          />
          <Route path="/admin/courses" element={<Navigate to="/course" replace />} />
          <Route path="/admin/courses/:id" element={<AdminCourseLegacyRedirect />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/signup" element={<RegisterCard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {isInstructor ? (
            <Route
              path="/dashboard"
              element={
                <RequireRole roles="INSTRUCTOR">
                  <InstructorDashboard />
                </RequireRole>
              }
            />
          ) : (
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
          )}
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/create" element={<CreateCourse />} />
          <Route path="/courses/:id/edit" element={<EditCourse />} />
          <Route path="/enrolment" element={<Enrolment />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:courseId/lessons/create" element={<CreateLesson />} />
          <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<EditLesson />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            }
          />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/courses/:courseId/quiz/:quizId" element={<QuizPage />} />
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
