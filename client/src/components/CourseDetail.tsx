import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/services/axiosClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaSpinner, FaStar, FaBookOpen, FaUsers, FaPlayCircle, FaLock, FaUnlock } from "react-icons/fa";
import { useState } from "react";
import HeaderComponent from "./HeaderComponent";

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
      course_id: l.course_id || l.courseId || String(data.id),
      title: l.title,
      content_type: l.content_type || l.contentType || (l.content_type ? l.content_type : undefined),
      content: l.content,
    }));

    const comments = (data.comments || []).map((c: any) => ({
      id: c.id || c._id,
      course_id: c.course_id || c.courseId || String(data.id),
      user: c.user || (c.userId ? { id: c.userId._id || c.userId, name: c.userId.name || c.userId.email || c.userName || 'Anonymous', email: c.userId.email || null, role: 'student' } : { id: null, name: c.userName || 'Anonymous', email: null, role: 'student' }),
      rating: c.rating,
      content: c.content,
    }));

    const instructor = data.instructor || { id: data.instructor_id || null, name: (data as any).instructor?.name || (data as any).instructor || 'Unknown Instructor', email: (data as any).instructor?.email || null };

    return {
      ...data,
      lessons,
      comments,
      instructor,
    } as Course;
  } catch (err) {
    console.error('Error fetching course data:', err);
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

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CommentFormData>();

  const commentMutation = useMutation({
    mutationFn: (data: CommentFormData) => postComment({ courseId: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", id] });
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
      navigate("/dashboard");
    } catch (err) {
      console.error("Enrollment failed", err);
    } finally {
      setIsEnrollLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold text-destructive">Error loading course</h2>
        <p className="text-muted-foreground">Could not find the requested course.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  // Calculate average rating
  const comments = course.comments || [];
  const averageRating = comments.length > 0
    ? comments.reduce((acc, curr) => acc + curr.rating, 0) / comments.length
    : 0;

  return (
    <div className="min-h-screen bg-background pb-10">
      <HeaderComponent />
      {/* Header / Hero Section */}
      <div className="bg-slate-900 text-white py-10">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Badge variant="secondary" className="text-xs uppercase">
                {course.level}
              </Badge>
              {course.is_premium ? (
                <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white">Premium</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">Free</Badge>
              )}
              <Badge variant="outline" className="text-slate-300 border-slate-500">{course.status}</Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold">{course.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mt-4">
              <div className="flex items-center gap-1 text-yellow-400">
                <span className="font-bold">{averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-current" : "text-slate-600"}`}
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

            <div className="pt-4 flex items-center gap-2">
              <span className="text-slate-300">Created by</span>
              <span className="text-primary-foreground font-medium">
                {course.instructor?.name || 'Unknown Instructor'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-8">
            
            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Description</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none text-sm text-muted-foreground whitespace-pre-line">
                    {course.description}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Content / Lessons */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Course Content</h2>
              <div className="text-sm text-muted-foreground mb-4">
                {course.lessons?.length || 0} lessons
              </div>
              <Card>
                <div className="divide-y">
                  {course.lessons?.map((lesson) => (
                    <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/courses/${id}/lessons/${lesson.id}`)}>
                      <div className="flex items-center gap-3">
                        <FaPlayCircle className="h-5 w-5 text-slate-400" />
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground uppercase text-xs border px-2 py-0.5 rounded">
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
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{course.instructor?.name || 'Unknown Instructor'}</CardTitle>
                  <CardDescription>{course.instructor?.email || 'No email provided'}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                     <FaUsers className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Instructor for this course.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews / Comments Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Reviews</h2>
              
              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leave a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1-5"
                        {...register("rating", { required: "Rating is required", min: 1, max: 5, valueAsNumber: true })}
                        className="w-24"
                      />
                      {errors.rating && <p className="text-xs text-red-500">{errors.rating.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Comment</Label>
                      <Input
                        id="content"
                        placeholder="Share your thoughts..."
                        {...register("content", { required: "Comment is required" })}
                      />
                      {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSubmitting || commentMutation.isPending}>
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-4 mt-6">
                {course.comments?.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{comment.user.name}</div>
                      </div>
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`h-3 w-3 ${i < comment.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 relative">
            <div className="sticky top-4 space-y-4">
              <Card className="overflow-hidden border-slate-200 shadow-lg">
                <div className="p-1">
                  <AspectRatio ratio={16 / 9} className="bg-slate-100 rounded-t-md overflow-hidden flex items-center justify-center">
                    <FaBookOpen className="h-20 w-20 text-slate-300" />
                  </AspectRatio>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    {course.is_premium ? (
                        <span className="text-3xl font-bold">Premium</span>
                    ) : (
                        <span className="text-3xl font-bold text-green-600">Free</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full text-lg h-12 font-bold" onClick={handleEnroll} disabled={isEnrollLoading}>
                      {isEnrollLoading ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : "Enroll Now"}
                    </Button>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-bold text-sm">This course includes:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <FaPlayCircle className="h-4 w-4" />
                        <span>{course.lessons?.length || 0} lessons</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {course.is_premium ? <FaLock className="h-4 w-4" /> : <FaUnlock className="h-4 w-4" />}
                        <span>{course.is_premium ? "Premium Access" : "Open Access"}</span>
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
