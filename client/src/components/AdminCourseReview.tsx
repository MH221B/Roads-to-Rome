import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/axiosClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { updateCourseStatus } from '@/services/adminService';
import HeaderComponent from '@/components/HeaderComponent';

type ReviewableCourse = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  thumbnail?: string | null;
  image?: string | null;
  instructor?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

const AdminCourseReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = React.useState<ReviewableCourse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewNote, setReviewNote] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/courses/${id}`);
        if (!active) return;
        const normalized: ReviewableCourse = {
          id: data.id || data._id || id,
          title: data.title ?? data.name ?? '',
          description: data.description ?? data.shortDescription ?? '',
          status: (data.status ?? data.state ?? '').toString(),
          thumbnail: data.thumbnail ?? data.image ?? null,
          image: data.image ?? data.thumbnail ?? null,
          instructor: data.instructor
            ? {
                id: data.instructor.id ?? data.instructor._id ?? null,
                name: data.instructor.name ?? data.instructor.fullName ?? data.instructor.email ?? null,
                email: data.instructor.email ?? null,
              }
            : null,
        };
        setCourse(normalized);
      } catch (e) {
        if (!active) return;
        setError('Failed to load course');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const status = (course?.status || '').toLowerCase();

  const handleUpdate = async (nextStatus: string) => {
    if (!id || !course) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateCourseStatus(id, nextStatus, reviewNote || undefined);
      navigate('/admin-dashboard?tab=courses');
    } catch (e) {
      setError('Failed to update course status');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActions = () => {
    if (status === 'pending') {
      return (
        <div className="flex flex-wrap gap-3">
          <Button disabled={actionLoading} onClick={() => handleUpdate('published')}>
            {actionLoading ? <Spinner /> : 'Approve'}
          </Button>
          <Button variant="destructive" disabled={actionLoading} onClick={() => handleUpdate('rejected')}>
            {actionLoading ? <Spinner /> : 'Reject'}
          </Button>
        </div>
      );
    }
    if (status === 'published') {
      return (
        <div className="flex gap-3">
          <Button variant="outline" disabled={actionLoading} onClick={() => handleUpdate('hidden')}>
            {actionLoading ? <Spinner /> : 'Hide'}
          </Button>
        </div>
      );
    }
    return <div className="text-muted-foreground text-sm">No actions available for this status.</div>;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderComponent />
      <main className="mx-auto w-full flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Course Review</h1>
            <Button variant="ghost" onClick={() => navigate('/admin-dashboard?tab=courses')}>
              Back to Admin Dashboard
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : !course ? (
            <div className="text-muted-foreground">Course not found.</div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(course.thumbnail || course.image) && (
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md border">
                      <img
                        src={course.thumbnail || course.image || ''}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </AspectRatio>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{status || 'unknown'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Instructor</div>
                    <div className="font-medium">
                      {course.instructor?.name || course.instructor?.email || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {course.description || 'No description provided.'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review Note (optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add a note for the instructor..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    disabled={actionLoading || status === 'rejected' || status === 'hidden'}
                  />
                  {renderActions()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCourseReview;
export { AdminCourseReview };
