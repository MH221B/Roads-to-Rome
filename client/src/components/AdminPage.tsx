import * as React from 'react';
import HeaderComponent from '@/components/HeaderComponent';
import AdminUserList from '@/components/AdminUserList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthProvider';
import adminService from '@/services/adminService';
import type { User } from '@/types/user';

const AdminPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;

    const fetchCurrentUser = async () => {
      try {
        const user = await adminService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [accessToken]);

  const email = currentUser?.email || 'Unknown user';
  const fullName = currentUser?.fullName || 'Unknown';
  const role = currentUser?.role || 'Unknown';

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderComponent />

      <main className="mx-auto w-full flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

          <section className="mb-8">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Account</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground text-sm">Full Name</div>
                      <div className="font-medium">{fullName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Email</div>
                      <div className="font-medium">{email}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Role</div>
                      <div className="font-medium">{role.toUpperCase()}</div>
                    </div>
                    {currentUser?.username && (
                      <div>
                        <div className="text-muted-foreground text-sm">Username</div>
                        <div className="font-medium">{currentUser.username}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">User Management</h2>
            <AdminUserList />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
