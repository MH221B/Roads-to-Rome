import * as React from 'react';
import HeaderComponent from '@/components/HeaderComponent';
import AdminUserList from '@/components/AdminUserList';
import AdminStats from '@/components/AdminStats';
import AdminCourseList from '@/components/AdminCourseList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthProvider';
import { useSearchParams } from 'react-router-dom';
import adminService from '@/services/adminService';
import type { User } from '@/types/user';

const AdminPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState(searchParams.get('tab') || 'users');

  // Get initial tab from URL query params, default to "users"
  // keep tab in URL so back/forward preserves current tab
  React.useEffect(() => {
    const next = searchParams.get('tab') || 'users';
    setActiveTab(next);
  }, [searchParams]);

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

          <div className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set('tab', val);
                  return next;
                });
              }}
            >
              <TabsList>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="courses">Course Review</TabsTrigger>
                <TabsTrigger value="stats">System Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <AdminUserList />
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="pending">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="published">Published</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        <TabsTrigger value="hidden">Hidden</TabsTrigger>
                      </TabsList>

                      <TabsContent value="pending" className="mt-4">
                        <AdminCourseList status="pending" />
                      </TabsContent>

                      <TabsContent value="published" className="mt-4">
                        <AdminCourseList status="published" />
                      </TabsContent>

                      <TabsContent value="rejected" className="mt-4">
                        <AdminCourseList status="rejected" />
                      </TabsContent>

                      <TabsContent value="hidden" className="mt-4">
                        <AdminCourseList status="hidden" />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <AdminStats />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
