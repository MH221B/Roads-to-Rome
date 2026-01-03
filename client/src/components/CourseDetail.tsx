import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/services/axiosClient';
import { getProfile } from '@/services/authService';
import { updateCourseStatus } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Textarea } from '@/components/ui/textarea';
import {
  FaSpinner,
  FaStar,
  FaBookOpen,
  FaUsers,
  FaPlayCircle,
  FaLock,
  FaUnlock,
  FaWallet,
  FaMoneyBillWave,
} from 'react-icons/fa';

import ReviewForm from './ReviewForm';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import HeaderComponent from './HeaderComponent';
import LessonListDraggable from './LessonListDraggable';
import { decodeJwtPayload } from '@/lib/utils';
import Swal from 'sweetalert2';

// Types based on the provided database design
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video?: string;
  content: string;
  order?: number;
}

interface Comment {
  id: string;
  course_id: string;
  user: User;
  rating: number;
  content: string;
}

interface Course {
  id: string;
  instructor_id: string;
  instructor: User; // Joined data
  title: string;
  description: string;
  level: string;
  is_premium: boolean;
  status: string;
  price?: number;
  lessons: Lesson[]; // Joined data
  comments: Comment[]; // Joined data
  image?: string;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
}

interface CommentFormData {
  rating: number;
  content: string;
}

const fetchCourse = async (courseId: string) => {
  try {
    const { data } = await api.get<Course>(`/api/courses/${courseId}`);

    // Normalize lesson and comment shapes expected by this component
    const lessons = (data.lessons || []).map((l: any) => ({
      id: l.id || l._id || String(l.id || l._id),
      course_id: l.course_id || l.courseId || String((data as any).id || (data as any)._id),
      title: l.title,
      video: l.video,
      content: l.content,
      order: l.order ?? 0,
    }));

    const comments = (data.comments || []).map((c: any) => ({
      id: c.id || c._id,
      course_id: c.course_id || c.courseId || String((data as any).id || (data as any)._id),
      user:
        c.user ||
        (c.userId
          ? {
              id: c.userId._id || c.userId,
              name: c.userId.name || c.userId.email || c.userName || 'Anonymous',
              email: c.userId.email || null,
              role: 'student',
            }
          : { id: null, name: c.userName || 'Anonymous', email: null, role: 'student' }),
      rating: c.rating,
      content: c.content,
    }));

    const instructor = data.instructor || {
      id: data.instructor_id || null,
      name: (data as any).instructor?.name || (data as any).instructor || 'Unknown Instructor',
      email: (data as any).instructor?.email || null,
    };

    // Map backend fields to frontend-friendly names
    const normalized = {
      ...data,
      id: (data as any).id || (data as any)._id || undefined,
      title: data.title || (data as any).name || '',
      description: (data as any).description ?? (data as any).shortDescription ?? '',
      level: (data as any).level ?? (data as any).difficulty ?? 'Beginner',
      is_premium:
        (data as any).is_premium ?? (data as any).isPremium ?? (data as any).premium ?? false,
      status: (data as any).status ?? (data as any).state ?? 'published',
      price: (() => {
        const raw = (data as any).price;
        const num = typeof raw === 'number' ? raw : Number(raw ?? 0);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      })(),
      // Try a few common image field names coming from different backends
      image: (data as any).thumbnail || null,
      lessons,
      comments,
      instructor,
    } as Course;
    console.log('Fetched course data:', normalized);
    return normalized;
  } catch (err) {
    console.error('Error fetching course data:', err);
    throw err;
  }
};

const postComment = async ({ courseId, data }: { courseId: string; data: CommentFormData }) => {
  const response = await api.post(`/api/courses/${courseId}/comments`, data);
  return response.data;
};

const enrollCourse = async (courseId: string) => {
  const response = await api.post(`/api/enrollments`, { course_id: courseId });
  return response.data;
};

export default function CourseDetail({
  adminReviewMode = false,
}: { adminReviewMode?: boolean } = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const resp = await api.get('/api/enrollments');
      return resp.data as any[];
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);
  const payload = useMemo(() => {
    return decodeJwtPayload(accessToken);
  }, [accessToken]);

  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );
  const isAdmin = roles.includes('ADMIN');
  const reviewMode = Boolean(adminReviewMode && isAdmin);

  const [reviewNote, setReviewNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentUserId =
    payload?.sub ?? payload?.id ?? payload?.userId ?? (payload?.user && payload.user.id) ?? null;

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const isInstructorOwner = Boolean(
    roles.includes('INSTRUCTOR') &&
      currentUserId &&
      // course may provide joined instructor object or instructor_id field
      course &&
      String(currentUserId) === String(course.instructor?.id ?? (course as any).instructor_id)
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>();

  const commentMutation = useMutation({
    mutationFn: (data: CommentFormData) => postComment({ courseId: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      reset();
    },
  });

  const onSubmitComment = (data: CommentFormData) => {
    commentMutation.mutate(data);
  };

  const showAuthAlert = () => {
    Swal.fire({
      title: 'Authentication Required',
      html: 'You need to <strong>login</strong> or <strong>register</strong> to access this feature.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Login',
      cancelButtonText: 'Register',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/login');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        navigate('/register');
      }
    });
  };

  const handleEnroll = async () => {
    if (reviewMode) return;
    // Check if user is authenticated
    if (!accessToken) {
      showAuthAlert();
      return;
    }

    if (!course) return;
    const price = typeof course.price === 'number' ? course.price : 0;
    const hasBudget = budget >= price;
    if (price > 0 && profileQuery.isFetched && !hasBudget) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient budget',
        text: `Course price is ${formatMoney(price)} but your budget is ${formatMoney(budget)}.`,
      });
      return;
    }
    setIsEnrollLoading(true);
    try {
      await enrollCourse(course.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      Swal.fire({
        icon: 'success',
        title: 'Enrollment successful',
        text: price > 0 ? `Paid ${formatMoney(price)} from your budget` : 'You are now enrolled',
        timer: 1500,
        showConfirmButton: false,
      });
      // Navigate to dashboard or show success
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Enrollment failed';
      Swal.fire({
        icon: 'error',
        title: 'Enrollment failed',
        text: message,
      });
    } finally {
      setIsEnrollLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    if (!accessToken && !reviewMode) {
      showAuthAlert();
      return;
    }
    navigate(`/courses/${course?.id}/lessons/${lessonId}`);
  };

  const handleReviewAction = async (nextStatus: string) => {
    if (!id || !course || !reviewMode) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);
    try {
      await updateCourseStatus(id, nextStatus, reviewNote || undefined);
      await queryClient.invalidateQueries({ queryKey: ['course', id] });
      setActionSuccess(nextStatus === 'published' ? 'Course approved' : 'Course rejected');
      // Return to the previous page (admin review list)
      setTimeout(() => navigate('/admin?tab=courses'), 300);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to update course status';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const isEnrolled = useMemo(() => {
    if (!course?.id || !enrollmentsQuery.data) return false;
    return enrollmentsQuery.data.some((e: any) => {
      const cid = e?.course?.id || e?.course_id || e?.courseId;
      return String(cid) === String(course.id);
    });
  }, [course?.id, enrollmentsQuery.data]);

  const hasUserReviewed = useMemo(() => {
    if (!currentUserId || !course?.comments) return false;
    return course.comments.some((comment) => String(comment.user?.id) === String(currentUserId));
  }, [currentUserId, course?.comments]);

  const firstLessonId = useMemo(() => {
    return course?.lessons && course.lessons.length > 0 ? course.lessons[0].id : null;
  }, [course?.lessons]);

  const budget = useMemo(() => {
    const raw = profileQuery.data?.budget;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  }, [profileQuery.data]);

  const formatMoney = (value: number | undefined) => {
    const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FaSpinner className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-destructive text-2xl font-bold">Error loading course</h2>
        <p className="text-muted-foreground">Could not find the requested course.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  // Calculate average rating
  const comments = course.comments || [];
  const averageRating =
    comments.length > 0
      ? comments.reduce((acc, curr) => acc + curr.rating, 0) / comments.length
      : 0;

  // Instructor initials for the avatar
  const instructorInitials = (() => {
    const name = course.instructor?.name || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'IN';
    return parts
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  })();

  return (
    <div className="bg-background min-h-screen pb-10">
      <HeaderComponent />
      {/* Header / Hero Section */}
      <div className="bg-slate-900 py-10 text-white">
        <div className="container mx-auto flex flex-col gap-8 px-4 lg:flex-row lg:px-8">
          <div className="space-y-4 lg:w-2/3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Badge variant="secondary" className="text-xs uppercase">
                {course.level}
              </Badge>
              {course.is_premium ? (
                <Badge variant="default" className="bg-yellow-600 text-white">
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Free
                </Badge>
              )}
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                {course.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold lg:text-4xl">{course.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1 text-yellow-400">
                <span className="font-bold">{averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(averageRating) ? 'fill-current' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 underline">({comments.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <FaBookOpen className="h-4 w-4" />
                <span>{course.lessons?.length || 0} lessons</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <span className="text-slate-300">Created by</span>
              <span className="text-primary-foreground font-medium">
                {course.instructor?.name || 'Unknown Instructor'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-8 px-4 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <div className="space-y-8 lg:w-2/3">
            {/* Admin Review Note for Rejected Courses */}
            {isInstructorOwner && course.status === 'rejected' && (
              <div className="rounded-md border border-red-200 bg-red-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-red-900">Rejection Notice</h3>
                <p className="mb-4 text-sm text-red-800">
                  Your course has been rejected. Please review the admin's feedback below:
                </p>
                <div className="rounded bg-white p-4 text-sm text-red-900">
                  {course.reviewNote ? (
                    <p className="whitespace-pre-line">{course.reviewNote}</p>
                  ) : (
                    <p className="text-red-600 italic">No feedback provided by admin</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Description</h2>
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="text-muted-foreground max-w-none text-base leading-relaxed whitespace-pre-line">
                    {course.description}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Content / Lessons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Course Content</h2>
                {/** allow owners, editors or admins to create lessons */}
                {(isInstructorOwner || roles.includes('EDITOR') || roles.includes('ADMIN')) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/courses/${id}/lessons/create`)}
                  >
                    Create Lesson
                  </Button>
                )}
              </div>

              <div className="text-muted-foreground mb-4 text-sm">
                {course.lessons?.length || 0} lessons
                {isInstructorOwner && <span className="ml-2">(drag to reorder)</span>}
              </div>
              <Card>
                {course.lessons && course.lessons.length > 0 ? (
                  <LessonListDraggable
                    lessons={course.lessons}
                    isInstructor={isInstructorOwner}
                    courseId={id!}
                    onOrderChange={() => {
                      // Optionally refetch the course data to ensure sync
                      queryClient.invalidateQueries({ queryKey: ['course', id] });
                    }}
                  />
                ) : (
                  <div className="p-4 text-center text-gray-500">No lessons yet</div>
                )}
              </Card>
            </div>

            {/* Instructor */}
            <div id="instructor" className="space-y-4">
              <h2 className="text-2xl font-bold">Instructor</h2>
              <Card>
                <CardHeader className="flex items-center gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-700">
                    {instructorInitials}
                  </div>
                  <div>
                    <CardTitle className="text-primary text-lg">
                      {course.instructor?.name || 'Unknown Instructor'}
                    </CardTitle>
                    <CardDescription>
                      {course.instructor?.email || 'No email provided'}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Reviews / Comments Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Reviews</h2>

              {reviewMode ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Admin review mode: course feedback is read-only.
                </div>
              ) : (
                <ReviewForm
                  onSubmit={onSubmitComment}
                  submitting={
                    isSubmitting ||
                    (commentMutation.status as string) === 'pending' ||
                    (commentMutation.status as string) === 'loading'
                  }
                  readOnly={isInstructorOwner || hasUserReviewed}
                  alreadyReviewed={hasUserReviewed}
                  accessToken={accessToken}
                />
              )}

              {/* Reviews List */}
              <div className="mt-6 space-y-4">
                {course.comments?.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-semibold">{comment.user.name}</div>
                      </div>
                      <div className="mb-2 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`h-3 w-3 ${i < comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground text-sm">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="relative lg:w-1/3">
            <div className="sticky top-4 space-y-4">
              <Card className="overflow-hidden border-slate-200 p-0 shadow-lg">
                <AspectRatio
                  ratio={16 / 9}
                  className="flex items-center justify-center overflow-hidden bg-transparent"
                >
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="block h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaBookOpen className="h-20 w-20 text-slate-300" />
                  )}
                </AspectRatio>
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center gap-3">
                    {course.is_premium || (course.price ?? 0) > 0 ? (
                      <>
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900 ring-1 ring-amber-100">
                          <FaLock className="h-4 w-4" />
                          <span className="text-sm font-semibold">Premium course</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatMoney(course.price)}{' '}
                          <FaMoneyBillWave className="inline h-6 w-6 text-emerald-600" />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-800 ring-1 ring-green-100">
                        <FaUnlock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Free access</span>
                      </div>
                    )}
                  </div>
                  {profileQuery.data && (course.is_premium || (course.price ?? 0) > 0) && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <FaWallet className="h-4 w-4 text-emerald-600" />
                      <span>
                        Your budget:&nbsp;
                        <span className="font-semibold text-slate-900">
                          {formatMoney(budget)}{' '}
                          <FaMoneyBillWave className="inline h-6 w-6 text-emerald-600" />
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {reviewMode ? (
                      <Button
                        className="h-12 w-full text-lg font-bold"
                        variant="outline"
                        onClick={() => firstLessonId && handleLessonClick(firstLessonId)}
                        disabled={!firstLessonId}
                      >
                        Preview lessons
                      </Button>
                    ) : isEnrolled ? (
                      <Button
                        className="h-12 w-full text-lg font-bold"
                        variant="default"
                        onClick={() => firstLessonId && handleLessonClick(firstLessonId)}
                        disabled={!firstLessonId}
                      >
                        Continue learning
                      </Button>
                    ) : (
                      <Button
                        className="h-12 w-full text-lg font-bold"
                        onClick={handleEnroll}
                        disabled={isEnrollLoading || isInstructorOwner}
                      >
                        {isInstructorOwner ? (
                          'Owner — View Only'
                        ) : isEnrollLoading ? (
                          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-bold">This course includes:</h4>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <FaPlayCircle className="h-4 w-4" />
                        <span>{course.lessons?.length || 0} lessons</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {course.is_premium ? (
                          <FaLock className="h-4 w-4" />
                        ) : (
                          <FaUnlock className="h-4 w-4" />
                        )}
                        <span>{course.is_premium ? 'Premium Access' : 'Open Access'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FaUsers className="h-4 w-4" />
                        <span>Instructor Support</span>
                      </li>
                    </ul>
                  </div>

                  {reviewMode && (
                    <div className="space-y-3 border-t pt-4">
                      <h4 className="text-sm font-bold">Admin review</h4>
                      <Textarea
                        placeholder="Leave a note for the instructor (optional)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        disabled={actionLoading}
                        className="resize-none"
                      />
                      {actionError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                          {actionError}
                        </div>
                      )}
                      {actionSuccess && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                          {actionSuccess}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          disabled={actionLoading}
                          onClick={() => handleReviewAction('published')}
                        >
                          {actionLoading ? 'Working…' : 'Approve'}
                        </Button>
                        <Button
                          className="flex-1"
                          variant="destructive"
                          disabled={actionLoading}
                          onClick={() => handleReviewAction('rejected')}
                        >
                          {actionLoading ? 'Working…' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
