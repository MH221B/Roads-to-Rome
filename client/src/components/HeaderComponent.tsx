import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FaUserCircle } from "react-icons/fa";
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
  const isInstructor = roles.includes('INSTRUCTOR');

  const isActive = (path: string) => {
    if (!location) return false;
    if (path === '/') {
      if (isAdmin) return location.pathname === '/' || location.pathname === '/users';
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-primary text-primary-foreground w-full border-b shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight transition-opacity hover:opacity-90"
          >
            R2R
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {isAdmin ? (
              <Link
                to="/users"
                className={`text-sm font-medium transition-colors hover:text-white/80 ${
                  isActive('/') ? '' : 'text-muted-foreground'
                }`}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                Users
              </Link>
            ) : (
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-white/80 ${
                  isActive('/') ? '' : 'text-muted-foreground'
                }`}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                Home
              </Link>
            )}

            <Link
              to="/courses"
              className={`text-sm font-medium transition-colors hover:text-white/80 ${
                isActive('/courses') ? '' : 'text-muted-foreground'
              }`}
              aria-current={isActive('/courses') ? 'page' : undefined}
            >
              Courses
            </Link>

            {isAuthenticated && roles.includes('STUDENT') && (
              <Link
                to="/enrolment"
                className={`text-sm font-medium transition-colors hover:text-white/80 ${
                  isActive('/enrolment') ? '' : 'text-muted-foreground'
                }`}
                aria-current={isActive('/enrolment') ? 'page' : undefined}
              >
                My Enrollments
              </Link>
            )}

            {isInstructor && (
              <Link
                to="/ai-quiz"
                className={`text-sm font-medium transition-colors hover:text-white/80 ${
                  isActive('/ai-quiz') ? '' : 'text-muted-foreground'
                }`}
                aria-current={isActive('/ai-quiz') ? 'page' : undefined}
              >
                AI Quiz
              </Link>
            )} 
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-primary-foreground/10 relative h-10 w-10 rounded-full p-0"
                >
                  <span className="text-primary flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-white/20">
                    <FaUserCircle className="h-full w-full" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                {roles.includes('STUDENT') && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/enrolment">My Enrollments</Link>
                  </DropdownMenuItem>
                )}
                {isInstructor && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/ai-quiz">AI Quiz</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => {
                    handleLogout();
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="secondary" className="font-semibold">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default HeaderComponent;
