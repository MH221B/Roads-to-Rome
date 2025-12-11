import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiRefreshCw,
  FiTarget,
  FiTrash2,
  FiEdit,
} from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/services/axiosClient';
import HeaderComponent from './HeaderComponent';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

type CourseRow = {
  id: string;
  courseId?: string;
  title: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  students?: number;
  avgScore?: number;
  createdAt?: string;
};

type Overview = {
  totalCourses: number;
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  totalQuizzes?: number;
};

type InsightRow = {
  courseId: string;
  courseTitle: string;
  students: number;
  averageScore: number;
  completionRate: number;
};

type QuizInsightRow = {
  quizId: string;
  quizTitle: string;
  averageScore: number;
  participants?: number;
  totalQuestions?: number;
};

type FilterForm = {
  search: string;
  difficulty: string;
};

type QuizRow = {
  _id: string;
  id?: string; // business quiz id when returned by server
  title: string;
  courseTitle?: string;
  questions?: Array<any>;
  courseId?: string; // normalized course id (business id or _id string fallback)
  course_id?: string; // legacy shape
};

const difficultyOptions = [
  { label: 'All levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

async function fetchInstructorCourses(
  filters: FilterForm,
  instructorId: string
): Promise<CourseRow[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.difficulty && filters.difficulty !== 'all') params.difficulty = filters.difficulty;

  const res = await api.get(`/api/instructor/${instructorId}/courses`, { params });
  const payload = res.data;

  if (Array.isArray(payload)) return payload as CourseRow[];
  if (Array.isArray(payload?.data)) return payload.data as CourseRow[];
  return [];
}

async function fetchEnrollmentInsights(): Promise<{
  overview: Overview;
  insights: InsightRow[];
  quizInsights: QuizInsightRow[];
}> {
  const res = await api.get(`/api/instructor/insights`);
  const data = res.data ?? {};
  const sourceOverview = data.overview ?? data;
  const overview: Overview = {
    totalCourses: sourceOverview.totalCourses ?? sourceOverview.count ?? 0,
    totalStudents:
      sourceOverview.totalStudents ?? sourceOverview.totalEnrolled ?? sourceOverview.students ?? 0,
    averageScore: sourceOverview.averageScore ?? sourceOverview.avgScore ?? 0,
    completionRate: sourceOverview.completionRate ?? sourceOverview.avgCompletion ?? 0,
    totalQuizzes: sourceOverview.totalQuizzes ?? sourceOverview.quizCount ?? 0,
  };

  // Accept multiple server shapes: byCourse, CourseInsights, insights
  const rawCourseInsights =
    data.byCourse ??
    data.CourseInsights ??
    (Array.isArray(data.insights) ? data.insights : data.insights?.CourseInsights) ??
    [];
  const rawQuizInsights =
    data.QuizInsights ??
    data.quizInsights ??
    data.byQuiz ??
    (Array.isArray(data.insights?.QuizInsights)
      ? data.insights.QuizInsights
      : data.insights?.QuizInsights) ??
    [];

  const insights: InsightRow[] = Array.isArray(rawCourseInsights)
    ? rawCourseInsights.map((row: any) => ({
        courseId: String(row.courseId ?? row.id ?? ''),
        courseTitle: row.courseTitle ?? row.title ?? 'Untitled course',
        students: Number(row.students ?? row.enrollments ?? 0),
        averageScore: Number(row.averageScore ?? row.avgScore ?? 0),
        completionRate: Number(row.completionRate ?? row.completion ?? 0),
      }))
    : [];

  const quizInsights: QuizInsightRow[] = Array.isArray(rawQuizInsights)
    ? rawQuizInsights.map((q: any) => ({
        quizId: String(q.quizId ?? q.id ?? ''),
        quizTitle: q.quizTitle ?? q.title ?? 'Untitled quiz',
        totalQuestions: Number(q.totalQuestions ?? q.questions?.length ?? q.questionCount ?? 0),
        averageScore: Number(q.averageScore ?? q.avgScore ?? 0),
        participants: Number(q.participants ?? q.attempts ?? 0),
      }))
    : [];

  return { overview, insights, quizInsights };
}

async function fetchInstructorQuizzes(
  instructorId: string,
  instructorCourse: Array<CourseRow>
): Promise<QuizRow[]> {
  const res = await api.get(`/api/quiz/instructor/${instructorId}`);
  const payload = res.data;
  const attachCourseTitles = (list: any[]) => {
    list.forEach((quiz: any) => {
      const quizCourseId = quiz.courseId ?? quiz.course_id ?? quiz.course;
      // store a normalized courseId on the quiz row for navigation
      quiz.courseId = quizCourseId ?? quiz.courseId ?? quiz.course_id ?? quiz.course;
      const course = instructorCourse.find(
        (c) => c.id === quizCourseId || c.courseId === quizCourseId
      );
      if (course) {
        quiz.courseTitle = course.title;
        // prefer the `id` (which is the Mongo doc _id used by courses listing) as the path `course.id`
        quiz.courseId = quizCourseId ?? course.id ?? course.courseId;
      }
    });
  };

  if (Array.isArray(payload)) {
    attachCourseTitles(payload);
    return payload as QuizRow[];
  } else {
    if (Array.isArray(payload?.data)) {
      attachCourseTitles(payload.data);
      return payload.data as QuizRow[];
    }
  }
  return [];
}

async function deleteCourse(courseId: string): Promise<void> {
  await api.delete(`/api/courses/${courseId}`);
}

export default function InstructorDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterForm>({ search: '', difficulty: 'all' });
  const { accessToken } = useAuth();
  const instructorId = useMemo(() => {
    const payload = decodeJwtPayload(accessToken);
    const id = payload?.userId ?? '';
    return id ? String(id) : '';
  }, [accessToken]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: resetFilters,
  } = useForm<FilterForm>({
    defaultValues: filters,
  });

  const coursesQuery = useQuery({
    queryKey: ['instructor-courses', filters],
    queryFn: () => fetchInstructorCourses(filters, instructorId),
  });

  const insightQuery = useQuery({
    queryKey: ['instructor-insights'],
    queryFn: fetchEnrollmentInsights,
  });

  const quizzesQuery = useQuery({
    // Avoid passing the full courses array as a query key (it may be unstable).
    // Instead use a derived array of course ids to trigger refetch when courses change.
    queryKey: ['instructor-quizzes', instructorId, (coursesQuery.data ?? []).map((c) => c.id ?? c.courseId ?? '')],
    queryFn: () => fetchInstructorQuizzes(instructorId, coursesQuery.data ?? []),
    enabled: Boolean(instructorId) && Boolean(coursesQuery.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Course removed',
        timer: 1500,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-insights'] });
    },
    onError: (err: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err?.message ?? 'Unexpected error',
      });
    },
  });

  const onApplyFilters = (data: FilterForm) => {
    setFilters(data);
  };

  const confirmDelete = (courseId: string) => {
    Swal.fire({
      title: 'Delete course?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(courseId);
    });
  };

  const overview = useMemo(
    () => ({
      ...(insightQuery.data?.overview ?? {
        totalCourses: 0,
        totalStudents: 0,
        averageScore: 0,
        completionRate: 0,
        totalQuizzes: 0,
      }),
    }),
    [insightQuery.data?.overview]
  );

  const topCourses = useMemo(() => {
    if (!insightQuery.data?.insights?.length) return [];
    return [...insightQuery.data.insights].sort((a, b) => b.students - a.students).slice(0, 3);
  }, [insightQuery.data?.insights]);

  const avgQuizScore = useMemo(() => {
    const raw = Number(overview.averageScore);
    if (Number.isFinite(raw) && !Number.isNaN(raw)) return raw;
    const quizzes = insightQuery.data?.quizInsights ?? [];
    if (quizzes.length === 0) return 0;
    return quizzes.reduce((acc, q) => acc + Number(q.averageScore ?? 0), 0) / quizzes.length;
  }, [overview, insightQuery.data?.quizInsights]);

  return (
    <>
      <HeaderComponent />
      <div className="bg-muted/30 min-h-screen px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Track your courses, enrollment, and learner performance in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  coursesQuery.refetch();
                  insightQuery.refetch();
                  quizzesQuery.refetch();
                }}
                className="gap-2"
              >
                <FiRefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Created courses"
              value={overview.totalCourses ?? coursesQuery.data?.length ?? 0}
              icon={<FiBookOpen className="h-5 w-5" />}
            />
            <StatCard
              title="Enrolled students"
              value={
                overview.totalStudents ??
                coursesQuery.data?.reduce((acc, c) => acc + (c.students ?? 0), 0) ??
                0
              }
              icon={<FiUsers className="h-5 w-5" />}
            />
            <StatCard
              title="Quizzes created"
              value={overview.totalQuizzes ?? quizzesQuery.data?.length ?? 0}
              icon={<FiEdit className="h-5 w-5" />}
            />
            <StatCard
              title="Avg quiz score"
              value={`${(Number(overview.averageScore ?? NaN) || (insightQuery.data?.quizInsights?.length ? insightQuery.data!.quizInsights.reduce((a, b) => a + Number(b.averageScore ?? 0), 0) / insightQuery.data!.quizInsights.length : 0)).toFixed(1)}%`}
              icon={<FiTrendingUp className="h-5 w-5" />}
            />
            <StatCard
              title="Completion rate"
              value={`${overview.completionRate.toFixed(1)}%`}
              icon={<FiTarget className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle className="flex items-center gap-2 text-xl">Your courses</CardTitle>
                <CardDescription>
                  Filter courses you created and manage enrollments.
                </CardDescription>
                <div className="flex flex-wrap items-center gap-3">
                  <form
                    className="flex flex-wrap items-center gap-3"
                    onSubmit={handleSubmit(onApplyFilters)}
                  >
                    <Input
                      placeholder="Search by title or tag"
                      className="w-60"
                      {...register('search')}
                    />
                    <Select
                      value={watch('difficulty')}
                      onValueChange={(val) => setValue('difficulty', val)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button type="submit" className="gap-2">
                        <FiRefreshCw className="h-4 w-4" /> Apply
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          resetFilters({ search: '', difficulty: 'all' });
                          setFilters({ search: '', difficulty: 'all' });
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {coursesQuery.isLoading && (
                  <div className="flex min-h-40 items-center justify-center">
                    <Spinner className="h-8 w-8" />
                  </div>
                )}

                {coursesQuery.error && (
                  <div className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
                    Unable to load courses. Please retry.
                  </div>
                )}

                {!coursesQuery.isLoading && coursesQuery.data?.length === 0 && (
                  <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
                    No courses yet.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {coursesQuery.data?.map((course) => (
                    <Card
                      key={course.id}
                      className="border-muted/70 cursor-pointer"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <CardHeader className="gap-1 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <CardDescription>
                              {course.category || 'Uncategorized'} · {course.difficulty || 'Mixed'}
                            </CardDescription>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(course.id);
                            }}
                            disabled={deleteMutation.isPending}
                            aria-label="Delete course"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {course.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <FiUsers className="text-muted-foreground h-4 w-4" />
                            <span className="font-semibold">{course.students ?? 0}</span>
                            <span className="text-muted-foreground">enrolled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiTrendingUp className="text-muted-foreground h-4 w-4" />
                            <span className="font-semibold">
                              {(course.avgScore ?? 0).toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground">avg score</span>
                          </div>
                        </div>
                        <div>
                          <Progress value={Math.min(100, course.avgScore ?? 0)} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>Your Quizzes</CardTitle>
              <CardDescription>Manage the quizzes you have created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizzesQuery.isLoading && (
                <div className="flex min-h-40 items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              )}

              {quizzesQuery.error && (
                <div className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
                  Unable to load quizzes. Please retry.
                </div>
              )}

              {!quizzesQuery.isLoading && quizzesQuery.data?.length === 0 && (
                <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
                  No quizzes yet.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {quizzesQuery.data?.map((quiz) => {
                  const qId = quiz.id ?? quiz._id;
                  const cId = quiz.courseId ?? quiz.course_id ?? '';
                  return (
                    <Card
                      key={qId}
                      className="border-muted/70 cursor-pointer"
                      onClick={() => {
                        // navigate to the QuizPage route which expects /courses/:courseId/quiz/:quizId
                        if (cId) navigate(`/courses/${cId}/quiz/${qId}`);
                        else navigate(`/quizzes/${qId}`);
                      }}
                    >
                    <CardHeader className="gap-1 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <CardDescription>{quiz.courseTitle || 'No course'}</CardDescription>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            // preserve existing edit route (quizzes/:id/edit) when courseId not present
                            navigate(`/quizzes/${quiz.id ?? quiz._id}/edit`);
                          }}
                          aria-label="Edit quiz"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>Insights</CardTitle>
              <CardDescription>
                Course and quiz performance summaries for your content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insightQuery.isLoading && (
                <div className="flex min-h-[140px] items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              )}

              {insightQuery.error && (
                <div className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
                  Unable to load insights.
                </div>
              )}

              {!insightQuery.isLoading &&
                !insightQuery.data?.insights?.length &&
                !insightQuery.data?.quizInsights?.length && (
                  <div className="text-muted-foreground text-sm">No insights yet.</div>
                )}

              {/* Insights grid: Courses + Quizzes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Course insights column */}
                <div>
                  <Card className="border-muted/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Course Insights</CardTitle>
                      <CardDescription>Enrollment and performance by course</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {insightQuery.isLoading && (
                        <div className="flex min-h-[100px] items-center justify-center">
                          <Spinner className="h-8 w-8" />
                        </div>
                      )}

                      {insightQuery.isLoading === false &&
                        (insightQuery.data?.insights ?? []).length === 0 && (
                          <div className="text-muted-foreground text-sm">
                            No course insights yet.
                          </div>
                        )}

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {(insightQuery.data?.insights ?? []).map((insight) => (
                          <div key={insight.courseId} className="rounded-md border bg-white/60 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{insight.courseTitle}</div>
                              <div className="text-muted-foreground text-xs">
                                {insight.students} students
                              </div>
                            </div>
                            <div className="text-muted-foreground mt-2 text-xs">
                              Avg score{' '}
                              <span className="font-semibold">
                                {insight.averageScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={Math.min(100, insight.averageScore)}
                              className="mt-2"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quiz insights column */}
                <div>
                  <Card className="border-muted/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quiz Insights</CardTitle>
                      <CardDescription>
                        Average scores and participation for quizzes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {insightQuery.isLoading && (
                        <div className="flex min-h-[100px] items-center justify-center">
                          <Spinner className="h-8 w-8" />
                        </div>
                      )}

                      {insightQuery.isLoading === false &&
                        (insightQuery.data?.quizInsights ?? []).length === 0 && (
                          <div className="text-muted-foreground text-sm">No quiz insights yet.</div>
                        )}

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-1">
                        {(insightQuery.data?.quizInsights ?? []).map((quiz: any) => {
                          const questionsCount = Number(
                            quiz.totalQuestions ??
                              quizzesQuery.data?.find((q) => q._id === quiz.quizId || q.id === quiz.quizId)?.questions
                                ?.length ??
                              0
                          );
                          const avgRaw = Number(quiz.averageScore ?? quiz.avgScore ?? 0);
                          const progressValue =
                            questionsCount > 0 ? Math.min(100, (avgRaw / questionsCount) * 100) : 0;
                          return (
                            <div key={quiz.quizId} className="rounded-md border bg-white/60 p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  {quiz.quizTitle || quiz.title || 'Untitled quiz'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Avg <span className="font-semibold">{avgRaw.toFixed(1)}</span>
                                  {questionsCount > 0 && (
                                    <span className="text-muted-foreground">/{questionsCount}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-muted-foreground mt-2 text-xs">
                                Participants{' '}
                                <span className="font-semibold">
                                  {Number(quiz.participants ?? quiz.attempts ?? 0)}
                                </span>
                              </div>
                              {questionsCount > 0 && (
                                <Progress value={progressValue} className="mt-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {topCourses.length > 0 && (
            <Card>
              <CardHeader className="gap-1">
                <CardTitle>Top performers</CardTitle>
                <CardDescription>Courses with the highest enrollment.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {topCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="rounded-lg border bg-white/40 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground text-sm">Enrollment</div>
                        <div className="text-xl font-semibold">{course.students}</div>
                      </div>
                      <Badge variant="secondary">{course.averageScore.toFixed(1)}%</Badge>
                    </div>
                    <div className="mt-2 text-sm font-medium">{course.courseTitle}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-muted/70">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}