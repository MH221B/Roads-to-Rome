import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { FiBookOpen, FiUsers, FiTrendingUp, FiRefreshCw, FiTarget, FiTrash2 } from 'react-icons/fi';

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

type CourseRow = {
  id: string;
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
};

type InsightRow = {
  courseId: string;
  courseTitle: string;
  students: number;
  averageScore: number;
  completionRate: number;
};

type FilterForm = {
  search: string;
  difficulty: string;
};

const difficultyOptions = [
  { label: 'All levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

async function fetchInstructorCourses(filters: FilterForm): Promise<CourseRow[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.difficulty && filters.difficulty !== 'all') params.difficulty = filters.difficulty;

  const res = await api.get('/api/instructor/courses', { params });
  const payload = res.data;

  if (Array.isArray(payload)) return payload as CourseRow[];
  if (Array.isArray(payload?.data)) return payload.data as CourseRow[];
  return [];
}

async function fetchEnrollmentInsights(): Promise<{ overview: Overview; insights: InsightRow[] }> {
  const res = await api.get('/api/instructor/enrollments/overview');
  const data = res.data ?? {};
  const overview: Overview = {
    totalCourses: data.totalCourses ?? 0,
    totalStudents: data.totalStudents ?? data.totalEnrolled ?? 0,
    averageScore: data.averageScore ?? data.avgScore ?? 0,
    completionRate: data.completionRate ?? data.avgCompletion ?? 0,
  };

  const insights: InsightRow[] = Array.isArray(data.byCourse)
    ? data.byCourse.map((row: any) => ({
        courseId: String(row.courseId ?? row.id ?? ''),
        courseTitle: row.courseTitle ?? row.title ?? 'Untitled course',
        students: Number(row.students ?? row.enrollments ?? 0),
        averageScore: Number(row.averageScore ?? row.avgScore ?? 0),
        completionRate: Number(row.completionRate ?? row.completion ?? 0),
      }))
    : [];

  return { overview, insights };
}

async function deleteCourse(courseId: string): Promise<void> {
  await api.delete(`/api/instructor/courses/${courseId}`);
}

export default function InstructorDashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterForm>({ search: '', difficulty: 'all' });

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
    queryFn: () => fetchInstructorCourses(filters),
  });

  const insightQuery = useQuery({
    queryKey: ['instructor-insights'],
    queryFn: fetchEnrollmentInsights,
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

  const overview = insightQuery.data?.overview ?? {
    totalCourses: coursesQuery.data?.length ?? 0,
    totalStudents: 0,
    averageScore: 0,
    completionRate: 0,
  };

  const topCourses = useMemo(() => {
    if (!insightQuery.data?.insights?.length) return [];
    return [...insightQuery.data.insights].sort((a, b) => b.students - a.students).slice(0, 3);
  }, [insightQuery.data?.insights]);

  return (
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
              }}
              className="gap-2"
            >
              <FiRefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Created courses"
            value={overview.totalCourses}
            icon={<FiBookOpen className="h-5 w-5" />}
          />
          <StatCard
            title="Enrolled students"
            value={overview.totalStudents}
            icon={<FiUsers className="h-5 w-5" />}
          />
          <StatCard
            title="Avg quiz score"
            value={`${overview.averageScore.toFixed(1)}%`}
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
              <CardDescription>Filter courses you created and manage enrollments.</CardDescription>
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
                  <Card key={course.id} className="border-muted/70">
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
                          onClick={() => confirmDelete(course.id)}
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
            <CardTitle>Enrollment & score by course</CardTitle>
            <CardDescription>Shows enrollment counts and average quiz scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insightQuery.isLoading && (
              <div className="flex min-h-[140px] items-center justify-center">
                <Spinner className="h-8 w-8" />
              </div>
            )}

            {insightQuery.error && (
              <div className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
                Unable to load enrollment stats.
              </div>
            )}

            {!insightQuery.isLoading && insightQuery.data?.insights?.length === 0 && (
              <div className="text-muted-foreground text-sm">No enrollments yet.</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insightQuery.data?.insights?.map((insight) => (
                <Card key={insight.courseId} className="border-muted/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{insight.courseTitle}</CardTitle>
                    <CardDescription>{insight.students} students</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg quiz score</span>
                      <span className="font-semibold">{insight.averageScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, insight.averageScore)} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion rate</span>
                      <span className="font-semibold">{insight.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min(100, insight.completionRate)}
                      className="bg-emerald-200/50"
                    />
                  </CardContent>
                </Card>
              ))}
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
                <div key={course.courseId} className="rounded-lg border bg-white/40 p-4 shadow-sm">
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
