import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FaUserCircle } from "react-icons/fa";
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

  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map((r) => String(r).toUpperCase());

  const isAdmin = roles.includes('ADMIN');

  return (
    <nav className="w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity">
            R2R
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-white/80 transition-colors">
              Home
            </Link>
            {isAuthenticated && roles.includes('STUDENT') && (
              <Link to="/enrolment" className="text-sm font-medium hover:text-white/80 transition-colors">
                My Enrollments
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          {showAdmin && isAdmin && (
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary-foreground/10 p-0">
                  <span className="h-9 w-9 rounded-full bg-white text-primary flex items-center justify-center shadow-sm ring-2 ring-white/20 overflow-hidden">
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
                <DropdownMenuItem onSelect={() => { handleLogout(); }} className="cursor-pointer text-red-600 focus:text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
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
