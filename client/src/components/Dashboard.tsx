import * as React from 'react';
import HeaderComponent from './HeaderComponent';
import CourseFilterBar from './CourseFilterBar';
// import { useAuth } from '@/contexts/AuthProvider';

const Dashboard: React.FC = () => {
//   const { accessToken, isAuthenticated } = useAuth();

//   const payload = React.useMemo(() => {
//     if (!accessToken) return null;
//     try {
//       const parts = accessToken.split('.');
//       if (parts.length < 2) return null;
//       const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
//       return JSON.parse(json);
//     } catch (e) {
//       return null;
//     }
//   }, [accessToken]);

//   const roles: string[] = Array.isArray(payload?.roles)
//     ? payload.roles
//     : payload?.roles
//     ? [payload.roles]
//     : [];

//   const isAdmin = roles.includes('ADMIN');

  return (
    <div className="min-h-screen bg-background">
      <HeaderComponent showAdmin />
      <main>
        <CourseFilterBar />
      </main>
    </div>
  );
};

export default Dashboard;
