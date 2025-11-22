import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

type Props = {
  children: React.ReactElement;
  roles: string | string[];
};

function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // atob is available in browser environments
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const RequireRole: React.FC<Props> = ({ children, roles }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  const payload = decodeJwtPayload(accessToken);
  const userRoles: string[] = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.roles
    ? [payload.roles]
    : [];

  const required = Array.isArray(roles) ? roles : [roles];

  const allowed = required.some((r) => userRoles.includes(r));

  if (!allowed) return <Navigate to="/" replace />;

  return children;
};

export default RequireRole;
export { RequireRole };
