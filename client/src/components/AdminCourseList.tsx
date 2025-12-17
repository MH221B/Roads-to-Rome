import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getCoursesByStatus, updateCourseStatus, type AdminCourse } from '@/services/adminService';

interface AdminCourseListProps {
  status: 'pending' | 'published' | 'rejected' | 'hidden';
  onRefresh?: () => void;
}

const AdminCourseList: React.FC<AdminCourseListProps> = ({ status, onRefresh }) => {
  const [courses, setCourses] = React.useState<AdminCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const loadCourses = React.useCallback(async () => {
    let active = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getCoursesByStatus(status, 1, 50);
      if (!active) return;
      setCourses(res.data || []);
    } catch (e) {
      if (!active) return;
      setError(`Failed to load ${status} courses`);
    } finally {
      if (active) setLoading(false);
    }
  }, [status]);

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

  const renderActions = (course: AdminCourse) => {
    if (status === 'pending') {
      return (
        <Button asChild size="sm">
          <Link to={`/course/${course.id}`}>Review</Link>
        </Button>
      );
    }
    if (status === 'published') {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled={actionLoading === course.id}
          onClick={() => handleHideCourse(course.id)}
        >
          {actionLoading === course.id ? <Spinner /> : 'Hide'}
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return <div className="text-muted-foreground py-4 text-center">No courses found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-semibold">Title</th>
            <th className="px-4 py-3 text-left font-semibold">Instructor</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
            {(status === 'pending' || status === 'published') && (
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-border hover:bg-muted/50 border-b transition-colors">
              <td className="px-4 py-3 font-medium">{course.title}</td>
              <td className="px-4 py-3">{course.instructor || 'Unknown'}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(course.createdAt)}</td>
              {(status === 'pending' || status === 'published') && (
                <td className="px-4 py-3">{renderActions(course)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCourseList;
export { AdminCourseList };
