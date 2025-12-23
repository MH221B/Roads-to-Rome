import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';
import AdminPage from './AdminPage';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

/**
 * Dashboard Router Component
 * Routes to appropriate dashboard based on user role:
 * - STUDENT -> StudentDashboard
 * - INSTRUCTOR -> InstructorDashboard
 * - ADMIN -> AdminPage
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, initialized } = useAuth();

  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const isStudent = roles.includes('STUDENT');
  const isInstructor = roles.includes('INSTRUCTOR');
  const isAdmin = roles.includes('ADMIN');

  // Guard: redirect unauthenticated users to login
  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  // Render the appropriate dashboard based on role priority
  if (!initialized) return null;

  if (!isAuthenticated) return null;

  if (isAdmin) {
    return <AdminPage />;
  }

  if (isInstructor) {
    return <InstructorDashboard />;
  }

  if (isStudent) {
    return <StudentDashboard />;
  }

  return null;
};

export default Dashboard;
