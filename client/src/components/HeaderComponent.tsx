import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthProvider";

type Props = {
  showAdmin?: boolean;
};

const HeaderComponent: React.FC<Props> = ({ showAdmin }) => {
  const { accessToken, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const payload = React.useMemo(() => {
    if (!accessToken) return null;
    try {
      const parts = accessToken.split('.');
      if (parts.length < 2) return null;
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }, [accessToken]);

  const roles: string[] = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.roles
    ? [payload.roles]
    : [];

  const isAdmin = roles.includes('ADMIN');

  return (
    <nav className="w-full border-b bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-semibold">R2R</Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground">Home</Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showAdmin && isAdmin && (
            <Button asChild variant="ghost">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          {isAuthenticated ? (
            <Button onClick={handleLogout}>Logout</Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/login" className="text-primary">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default HeaderComponent;
