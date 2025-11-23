import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

type Props = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return null;

  if (isAuthenticated) return children;

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
export { RequireAuth };
