import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthProvider';

type Props = {
  showAdmin?: boolean;
};

const HeaderComponent: React.FC<Props> = ({ showAdmin }) => {
  const { accessToken, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const isAdmin = roles.includes('ADMIN');

  const isActive = (path: string) => {
    if (!location) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-primary text-primary-foreground w-full border-b">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-semibold">
            R2R
          </Link>
          <Link
            to="/"
            className={`text-sm font-medium ${isActive('/') ? '' : 'text-muted-foreground'}`}
            aria-current={isActive('/') ? 'page' : undefined}
          >
            Home
          </Link>
          <Link
            to="/courses"
            className={`text-sm font-medium ${isActive('/courses') ? '' : 'text-muted-foreground'}`}
            aria-current={isActive('/courses') ? 'page' : undefined}
          >
            Courses
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showAdmin && isAdmin && (
            <Button asChild variant="ghost">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent px-2 py-1 hover:opacity-90"
                  aria-label="Profile"
                >
                  <span className="bg-primary-foreground text-primary flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
                    <FaUserCircle size={18} aria-hidden />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="block w-full">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleLogout();
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline">
              <Link to="/login" className="text-primary">
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default HeaderComponent;
