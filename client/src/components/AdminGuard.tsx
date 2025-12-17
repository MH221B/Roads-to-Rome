import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

type Props = {
  children: React.ReactElement;
};

const AdminGuard: React.FC<Props> = ({ children }) => {
  const { accessToken, isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const payload = decodeJwtPayload(accessToken);
  const rawRoles = payload?.roles ?? payload?.role;
  const userRoles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [])
    .map((r) => String(r).toUpperCase());

  const isAdmin = userRoles.includes('ADMIN');

  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default AdminGuard;
export { AdminGuard };
