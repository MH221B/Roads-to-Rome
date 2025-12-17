import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getCoursesByStatus, updateCourseStatus, type AdminCourse } from '@/services/adminService';

const AdminPublishedCourses: React.FC = () => {
  const [courses, setCourses] = React.useState<AdminCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const loadCourses = React.useCallback(async () => {
    let active = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getCoursesByStatus('published', 1, 20);
      if (!active) return;
      setCourses(res.data || []);
    } catch (e) {
      if (!active) return;
      setError('Failed to load published courses');
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleHideCourse = async (courseId: string) => {
    setActionLoading(courseId);
    setError(null);
    try {
      await updateCourseStatus(courseId, 'hidden');
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (e) {
      setError('Failed to hide course');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Published Courses</CardTitle>
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
          <div className="text-muted-foreground py-4 text-center">No published courses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Instructor</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-border hover:bg-muted/50 border-b transition-colors">
                    <td className="px-4 py-3 font-medium">{course.title}</td>
                    <td className="px-4 py-3">{course.instructor || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(course.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === course.id}
                        onClick={() => handleHideCourse(course.id)}
                      >
                        {actionLoading === course.id ? <Spinner /> : 'Hide'}
                      </Button>
                    </td>
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

export default AdminPublishedCourses;
export { AdminPublishedCourses };
