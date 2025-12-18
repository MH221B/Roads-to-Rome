import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import adminService, { type SystemStats } from '@/services/adminService';
import { Users, BookOpen, UserCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminStats: React.FC = () => {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSystemStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch system stats:', err);
        setError('Failed to load system statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const roleData = React.useMemo(() => {
    if (!stats?.usersByRole) return [];
    return Object.entries(stats.usersByRole).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count,
    }));
  }, [stats]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses ?? 0}
          icon={<BookOpen className="h-5 w-5 text-white" />}
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          title="Total Enrollments"
          value={stats?.totalEnrollments ?? 0}
          icon={<UserCheck className="h-5 w-5 text-white" />}
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="Avg Enrollments/Course"
          value={stats?.totalCourses ? Math.round((stats.totalEnrollments / stats.totalCourses) * 10) / 10 : 0}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      {!loading && stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Users by Role - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roleData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Users" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Users by Role - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Stats Table */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {roleData.map((role, index) => (
                  <div
                    key={role.name}
                    className="flex items-center justify-between rounded-lg border p-4"
                    style={{ borderLeft: `4px solid ${COLORS[index % COLORS.length]}` }}
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">{role.name}</p>
                      <p className="text-2xl font-bold">{role.value}</p>
                    </div>
                    <div
                      className="rounded-full p-3"
                      style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                    >
                      <Users className="h-6 w-6" style={{ color: COLORS[index % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State for Charts */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminStats;
