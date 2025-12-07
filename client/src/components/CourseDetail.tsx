import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/services/axiosClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FaSpinner,
  FaStar,
  FaBookOpen,
  FaUsers,
  FaPlayCircle,
  FaLock,
  FaUnlock,
} from 'react-icons/fa';
import ReviewForm from './ReviewForm';
import { useState } from 'react';
import HeaderComponent from './HeaderComponent';

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
  content_type: string;
  content: string;
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
  lessons: Lesson[]; // Joined data
  comments: Comment[]; // Joined data
  image?: string;
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
      content_type:
        l.content_type || l.contentType || (l.content_type ? l.content_type : undefined),
      content: l.content,
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

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

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

  const handleEnroll = async () => {
    if (!course) return;
    setIsEnrollLoading(true);
    try {
      await enrollCourse(course.id);
      // Navigate to dashboard or show success
      navigate('/dashboard');
    } catch (err) {
      console.error('Enrollment failed', err);
    } finally {
      setIsEnrollLoading(false);
    }
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
                <Badge variant="default" className="bg-yellow-600 text-white hover:bg-yellow-700">
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700">
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
              <h2 className="text-2xl font-bold">Course Content</h2>
              <div className="text-muted-foreground mb-4 text-sm">
                {course.lessons?.length || 0} lessons
              </div>
              <Card>
                <div className="divide-y">
                  {course.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50"
                      onClick={() => navigate(`/courses/${id}/lessons/${lesson.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FaPlayCircle className="h-5 w-5 text-slate-400" />
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground rounded border px-2 py-0.5 text-xs uppercase">
                          {lesson.content_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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

              <ReviewForm
                onSubmit={onSubmitComment}
                submitting={
                  isSubmitting ||
                  (commentMutation.status as string) === 'pending' ||
                  (commentMutation.status as string) === 'loading'
                }
              />

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
                  <div className="flex items-center gap-2">
                    {course.is_premium ? (
                      <span className="text-3xl font-bold">Premium</span>
                    ) : (
                      <span className="text-3xl font-bold text-green-600">Free</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="h-12 w-full text-lg font-bold"
                      onClick={handleEnroll}
                      disabled={isEnrollLoading}
                    >
                      {isEnrollLoading ? (
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
