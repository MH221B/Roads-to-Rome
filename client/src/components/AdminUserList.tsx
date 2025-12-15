import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FaSearch, FaLock, FaLockOpen, FaTimes } from 'react-icons/fa';
import type { User, UserRole } from '@/types/user';
import { UserRoles } from '@/types/user';
import {
  getAllUsers,
  getUsersByRole,
  searchUsers,
  updateUserRole,
  toggleUserLocked,
} from '@/services/adminService';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const AdminUserList: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // 1. Define Fetcher
  const fetchUsers = React.useCallback(
    async (page: number) => {
      const limit = 10;

      if (searchQuery.trim()) {
        const response = await searchUsers(searchQuery, page, limit);
        return response.data;
      } else if (selectedRole) {
        const response = await getUsersByRole(selectedRole as UserRole, page, limit);
        return response.data;
      } else {
        const response = await getAllUsers(page, limit);
        return response.data;
      }
    },
    [searchQuery, selectedRole]
  );

  // 2. Use Hook
  const {
    data: users,
    setData: setUsers,
    loading,
    error,
    hasMore,
    bottomRef,
  } = useInfiniteScroll<User>({
    fetchData: fetchUsers,
    dependencies: [searchQuery, selectedRole],
    limit: 10,
  });

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle search with debouncing
  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set searching state if query is not empty
    if (query.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce delay
  }, []);

  // Handle role filter
  const handleRoleFilter = React.useCallback((role: string) => {
    const normalizedRole = role === 'all' ? null : role;
    setSelectedRole(normalizedRole);
  }, []);

  const resetFilters = React.useCallback(() => {
    setSearchQuery('');
    setSelectedRole(null);
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      const updatedUser = await updateUserRole(userId, newRole);

      // Optimistic/Local update
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (err) {
      // Handle error - data will be reset on next fetch
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle lock/unlock
  const handleToggleLock = async (userId: string, currentLocked: boolean) => {
    try {
      setUpdatingUserId(userId);
      const updatedUser = await toggleUserLocked(userId, !currentLocked);

      // Optimistic/Local update
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (err) {
      // Handle error - data will be reset on next fetch
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRoles.ADMIN:
        return 'role-badge-admin';
      case UserRoles.INSTRUCTOR:
        return 'role-badge-instructor';
      case UserRoles.STUDENT:
        return 'role-badge-student';
      default:
        return 'role-badge-default';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <FaSearch className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
                  <Input
                    placeholder="Search by email, username, or full name..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pr-10 pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      title="Clear search"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Select value={selectedRole || 'all'} onValueChange={handleRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value={UserRoles.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRoles.INSTRUCTOR}>Instructor</SelectItem>
                    <SelectItem value={UserRoles.STUDENT}>Student</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" onClick={resetFilters}>
                  Reset
                </Button>
              </div>

              {/* Search status indicator */}
              {isSearching && searchQuery.trim() && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Spinner />
                  Searching for "{searchQuery}"...
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            {/* User Count */}
            <div className="text-muted-foreground text-sm">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </div>

            {/* Users Table */}
            {loading && users.length === 0 ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : users.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="px-4 py-3 text-left font-semibold">Username</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Created</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-border hover:bg-muted/50 border-b transition-colors ${
                          user.locked ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-4 py-3">{user.username}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.fullName}</td>
                        <td className="px-4 py-3">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) =>
                              handleRoleChange(user.id, newRole as UserRole)
                            }
                            disabled={updatingUserId === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRoles.ADMIN}>Admin</SelectItem>
                              <SelectItem value={UserRoles.INSTRUCTOR}>Instructor</SelectItem>
                              <SelectItem value={UserRoles.STUDENT}>Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`${getRoleColor(user.role)} capitalize`}
                            variant="secondary"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleToggleLock(user.id, user.locked)}
                            disabled={updatingUserId === user.id}
                            title={user.locked ? 'Unlock account' : 'Lock account'}
                          >
                            {updatingUserId === user.id ? (
                              <Spinner />
                            ) : user.locked ? (
                              <FaLock className="h-4 w-4" />
                            ) : (
                              <FaLockOpen className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Loading indicator for infinite scroll */}
            {loading && users.length > 0 && (
              <div className="flex w-full items-center justify-center py-4">
                <Spinner />
              </div>
            )}

            {/* End of list message */}
            {!loading && !hasMore && users.length > 0 && (
              <div className="flex w-full items-center justify-center py-4 text-sm opacity-80">
                No more users available.
              </div>
            )}

            {/* Scroll Sentinel */}
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserList;
