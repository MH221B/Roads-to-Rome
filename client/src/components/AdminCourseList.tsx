import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Switch } from './ui/switch';
import { FaCheck } from 'react-icons/fa';
import {
  getCoursesByStatus,
  updateCourseStatus,
  updateCoursePrice,
  updateCoursePremium,
  type AdminCourse,
} from '@/services/adminService';

interface AdminCourseListProps {
  status: 'pending' | 'published' | 'rejected' | 'hidden';
  onRefresh?: () => void;
}

const AdminCourseList: React.FC<AdminCourseListProps> = ({ status, onRefresh }) => {
  const [courses, setCourses] = React.useState<AdminCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [priceSavingId, setPriceSavingId] = React.useState<string | null>(null);
  const [premiumSavingId, setPremiumSavingId] = React.useState<string | null>(null);
  const [priceEdits, setPriceEdits] = React.useState<Record<string, string>>({});
  const [premiumEdits, setPremiumEdits] = React.useState<Record<string, boolean>>({});
  const [successCourseId, setSuccessCourseId] = React.useState<string | null>(null);

  const loadCourses = React.useCallback(async () => {
    let active = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getCoursesByStatus(status, 1, 50);
      if (!active) return;
      setCourses(res.data || []);
      const nextPrices: Record<string, string> = {};
      const nextPremium: Record<string, boolean> = {};
      (res.data || []).forEach((c) => {
        nextPrices[c.id] = String(c.price ?? 0);
        nextPremium[c.id] = Boolean(c.is_premium);
      });
      setPriceEdits(nextPrices);
      setPremiumEdits(nextPremium);
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

  const handleSavePrice = async (course: AdminCourse) => {
    const raw = priceEdits[course.id];
    const parsed = Number(raw ?? '');
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    setPriceSavingId(course.id);
    setError(null);
    try {
      const updatedPrice = await updateCoursePrice(course.id, parsed);
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updatedPrice } : c))
      );
      setSuccessCourseId(course.id);
    } catch (e) {
      setError('Failed to update price');
    } finally {
      setPriceSavingId(null);
      setTimeout(() => setSuccessCourseId((prev) => (prev === course.id ? null : prev)), 1500);
    }
  };

  const handlePremiumToggle = async (course: AdminCourse, checked: boolean) => {
    setPremiumSavingId(course.id);
    setError(null);
    try {
      const updated = await updateCoursePremium(course.id, checked);
      setPremiumEdits((prev) => ({ ...prev, [course.id]: checked }));
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c))
      );
      setSuccessCourseId(course.id);
    } catch (e) {
      setError('Failed to update premium');
    } finally {
      setPremiumSavingId(null);
      setTimeout(() => setSuccessCourseId((prev) => (prev === course.id ? null : prev)), 1500);
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
            <th className="px-4 py-3 text-left font-semibold">Price</th>
            <th className="px-4 py-3 text-left font-semibold">Premium</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
            {(status === 'pending' || status === 'published') && (
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            ) }
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-border hover:bg-muted/50 border-b transition-colors">
              <td className="px-4 py-3 font-medium">{course.title}</td>
              <td className="px-4 py-3">{course.instructor || 'Unknown'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={priceEdits[course.id] ?? String(course.price ?? 0)}
                    onChange={(e) =>
                      setPriceEdits((prev) => ({ ...prev, [course.id]: e.target.value }))
                    }
                    className="max-w-[120px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={priceSavingId === course.id}
                    onClick={() => handleSavePrice(course)}
                  >
                    {priceSavingId === course.id ? <Spinner className="h-4 w-4" /> : 'Save'}
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={premiumEdits[course.id] ?? Boolean(course.is_premium)}
                    disabled={premiumSavingId === course.id}
                    onCheckedChange={(checked) => handlePremiumToggle(course, checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {premiumEdits[course.id] ?? course.is_premium ? 'Premium' : 'Free'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(course.createdAt)}</td>
              {(status === 'pending' || status === 'published') && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {renderActions(course)}
                    {successCourseId === course.id && (
                      <FaCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>
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
