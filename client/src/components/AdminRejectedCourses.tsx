import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getCoursesByStatus, type AdminCourse } from '@/services/adminService';

const AdminRejectedCourses: React.FC = () => {
  const [courses, setCourses] = React.useState<AdminCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCoursesByStatus('rejected', 1, 20);
        if (!active) return;
        setCourses(res.data || []);
      } catch (e) {
        if (!active) return;
        setError('Failed to load rejected courses');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejected Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center">No rejected courses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Instructor</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-border hover:bg-muted/50 border-b transition-colors">
                    <td className="px-4 py-3 font-medium">{course.title}</td>
                    <td className="px-4 py-3">{course.instructor || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(course.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRejectedCourses;
export { AdminRejectedCourses };
