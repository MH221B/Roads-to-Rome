import LoginCard from '@/components/LoginCard';
import RegisterCard from '@/components/RegisterCard';
import HomePage from '@/components/HomePage';
import AdminPage from '@/components/AdminPage';
import RequireRole from '@/components/RequireRole';
import RequireAuth from '@/components/RequireAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseDetail from '@/components/CourseDetail';
import Enrolment from '@/components/Enrolment';
import LessonViewer from '@/components/LessonViewer';
import CreateCourse from './components/CreateCourse';

function App() {
  return (
    <Router>
      <div className="flex grow flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
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
          <Route path="/courses/create" element={<CreateCourse />} />
          <Route path="/enrolment" element={<Enrolment />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
          <Route
            path="/admin"
            element={
              <RequireRole roles="ADMIN">
                <AdminPage />
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
