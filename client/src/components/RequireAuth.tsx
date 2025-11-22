import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

type Props = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) return children;

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
export { RequireAuth };
