import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

type Props = {
  children: React.ReactElement;
  roles: string | string[];
};

const RequireRole: React.FC<Props> = ({ children, roles }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  const payload = decodeJwtPayload(accessToken);
  const rawRoles = payload?.roles ?? payload?.role;
  const userRoles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const required = Array.isArray(roles) ? roles : [roles];

  const allowed = required.some((r) => userRoles.includes(r));

  if (!allowed) return <Navigate to="/" replace />;

  return children;
};

export default RequireRole;
export { RequireRole };
