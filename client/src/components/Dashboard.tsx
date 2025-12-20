import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiRefreshCw,
  FiTrendingUp,
} from 'react-icons/fi';

import HeaderComponent from './HeaderComponent';
import CourseCard from './CourseCard';
import { useAuth } from '@/contexts/AuthProvider';
import { api } from '@/services/axiosClient';
import { decodeJwtPayload } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

import type { Course, UserCourseProgress, FilterState, EnrichedCourse } from '@/types/dashboard';

function normalizeCourse(raw: any): Course {
  const id = raw?.id || raw?._id || raw?.courseId || raw?.course_id || Math.random().toString(36).slice(2);
  return {
    id: String(id),
    title: raw?.title || raw?.name || 'Untitled course',
    thumbnail: raw?.thumbnail || `https://picsum.photos/seed/${id}/640/360`,
    category: raw?.category || raw?.topic || 'General',
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    instructor:
      typeof raw?.instructor === 'string'
        ? raw.instructor
        : raw?.instructor?.name || raw?.instructor?.email || 'Unknown instructor',
    shortDescription: raw?.shortDescription || raw?.description || 'No description yet.',
    difficulty: raw?.difficulty || raw?.level || null,
    rating:
      typeof raw?.rating === 'number'
        ? Number(raw.rating)
        : typeof raw?.avgRating === 'number'
        ? Number(raw.avgRating)
        : null,
    ratingCount:
      typeof raw?.ratingCount === 'number'
        ? raw.ratingCount
        : typeof raw?.ratingsCount === 'number'
        ? raw.ratingsCount
        : null,
  };
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-white text-slate-900 shadow-md ring-1 ring-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="text-slate-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold leading-tight">{value}</div>
        {hint ? <p className="text-slate-500 text-xs mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated, initialized } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    progress: 'all',
    sort: 'recent',
  });

  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );
  const displayName = payload?.name || payload?.email || 'Learner';
  const isStudent = roles.includes('STUDENT');
  const isAdmin = roles.includes('ADMIN');

  // Guard: only students may access; guests -> login, admins -> admin dashboard
  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isStudent) {
      navigate(isAdmin ? '/admin-dashboard' : '/', { replace: true });
    }
  }, [initialized, isAuthenticated, isStudent, isAdmin, navigate]);

  // helper to create stable pseudo progress/rating for demo purposes
  const stableFromId = useCallback((id: string): Partial<UserCourseProgress> => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
    const progress = Math.abs(h) % 101; // 0-100
    const completed = progress === 100;
    return {
      id,
      progress,
      rating: null,
      completed,
      last_lesson_id: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }, []);

  // Fetch enrollments for the logged-in user
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const resp = await api.get('/api/enrollments');
      return resp.data as any[];
    },
    enabled: isStudent && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch a handful of courses for recommendations
  const recommendedQuery = useQuery({
    queryKey: ['recommended-courses'],
    queryFn: async () => {
      const resp = await api.get('/api/courses', { params: { limit: 9 } });
      const payload = Array.isArray(resp.data?.data) ? resp.data.data : resp.data;
      return (Array.isArray(payload) ? payload : []).map(normalizeCourse);
    },
    enabled: isStudent && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const markComplete = useMutation({
    mutationFn: async ({ enrollmentId }: { enrollmentId: string }) => {
      await api.patch(`/api/enrollments/${enrollmentId}`, { progress: 100, completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const courses: EnrichedCourse[] = useMemo(() => {
    if (!isStudent || !isAuthenticated) return [];

    return (enrollmentsQuery.data ?? []).map((item: any) => {
      const isEnrollment = !!item.course || !!item.course_id;
      const baseCourse = isEnrollment ? item.course || {} : item;
      const course = normalizeCourse(baseCourse);

      const fallback = stableFromId(course.id);
      const progress = isEnrollment ? item.progress ?? fallback.progress ?? null : fallback.progress ?? null;
      const rating =
        typeof (course as any)?.rating === 'number'
          ? Number((course as any).rating)
          : typeof (baseCourse as any)?.avgRating === 'number'
          ? Number((baseCourse as any).avgRating)
          : null;

      return {
        course,
        enrollmentId: isEnrollment ? String(item.id || item._id) : null,
        progress: typeof progress === 'number' ? Math.min(Math.max(progress, 0), 100) : null,
        rating: typeof rating === 'number' ? Number(rating.toFixed(1)) : null,
        completed: Boolean(isEnrollment ? item.completed : fallback.completed),
        updatedAt: item.updated_at || item.updatedAt || fallback.updated_at || null,
        createdAt: item.created_at || item.createdAt || fallback.created_at || null,
      } as EnrichedCourse;
    });
  }, [enrollmentsQuery.data, isAuthenticated, isStudent, stableFromId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.course.category) set.add(c.course.category);
    });
    return Array.from(set);
  }, [courses]);

  const stats = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => c.completed || (c.progress ?? 0) >= 100).length;
    const inProgress = courses.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;
    const avgProgress = total
      ? courses.reduce((acc, c) => acc + (c.progress ?? 0), 0) / total
      : 0;
    const rated = courses.filter((c) => typeof c.rating === 'number');
    const avgRating = rated.length
      ? rated.reduce((acc, c) => acc + Number(c.rating ?? 0), 0) / rated.length
      : 0;

    return {
      total,
      completed,
      inProgress,
      avgProgress: Number(avgProgress.toFixed(1)),
      avgRating: Number(avgRating.toFixed(1)),
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let list = [...courses];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      list = list.filter((c) =>
        [c.course.title, c.course.shortDescription, c.course.tags.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    if (filters.category !== 'all') {
      list = list.filter((c) => (c.course.category || '').toLowerCase() === filters.category);
    }

    if (filters.progress === 'completed') {
      list = list.filter((c) => c.completed || (c.progress ?? 0) >= 100);
    } else if (filters.progress === 'in-progress') {
      list = list.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
    } else if (filters.progress === 'not-started') {
      list = list.filter((c) => !c.progress || c.progress === 0);
    }

    list.sort((a, b) => {
      if (filters.sort === 'title-asc') return a.course.title.localeCompare(b.course.title);
      if (filters.sort === 'title-desc') return b.course.title.localeCompare(a.course.title);
      if (filters.sort === 'progress') return (b.progress ?? 0) - (a.progress ?? 0);

      const aDate = new Date(a.updatedAt || a.createdAt || '').getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || '').getTime();
      return bDate - aDate;
    });

    return list;
  }, [courses, filters]);

  const continuing = useMemo(
    () => filteredCourses.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).slice(0, 3),
    [filteredCourses]
  );

  const completed = useMemo(
    () => filteredCourses.filter((c) => c.completed || (c.progress ?? 0) >= 100).slice(0, 3),
    [filteredCourses]
  );

  const recommended = useMemo(() => {
    const enrolledIds = new Set(courses.map((c) => c.course.id));
    return (recommendedQuery.data ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, 6);
  }, [courses, recommendedQuery.data]);

  const handleMarkComplete = (enrollmentId: string | null) => {
    if (!enrollmentId) return;
    markComplete.mutate({ enrollmentId });
  };

  const loading = enrollmentsQuery.isLoading;

  if (!initialized || !isAuthenticated || !isStudent) return null;

  return (
    <div className="bg-white min-h-screen text-slate-900">
      <HeaderComponent showAdmin={roles.includes('ADMIN')} />

      <main className="bg-gradient-to-b from-white via-white to-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Welcome back</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{displayName}'s Dashboard</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Track your learning progress, resume courses, and discover new content tailored for you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => enrollmentsQuery.refetch()}
              >
                <FiRefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => navigate('/courses')}
              >
                <FiCompass className="mr-2 h-4 w-4" /> Browse courses
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Enrolled" value={stats.total} hint="Total courses you're in" icon={<FiBookOpen className="h-5 w-5" />} />
            <StatCard title="In progress" value={stats.inProgress} hint="Currently learning" icon={<FiClock className="h-5 w-5" />} />
            <StatCard title="Completed" value={stats.completed} hint="Finished courses" icon={<FiCheckCircle className="h-5 w-5" />} />
            <StatCard title="Avg progress" value={`${stats.avgProgress}%`} hint={`Avg rating ${stats.avgRating || 0}/5`} icon={<FiTrendingUp className="h-5 w-5" />} />
          </div>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-md">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">My Courses</CardTitle>
              <CardDescription className="text-slate-600">
                Filter, sort and manage your enrolled courses.
              </CardDescription>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search title or tag"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="w-56 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                  <Select
                    value={filters.category}
                    onValueChange={(val) => setFilters((f) => ({ ...f, category: val }))}
                  >
                    <SelectTrigger className="w-40 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900">
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.toLowerCase()} value={c.toLowerCase()}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.progress}
                    onValueChange={(val: FilterState['progress']) => setFilters((f) => ({ ...f, progress: val }))}
                  >
                    <SelectTrigger className="w-40 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="Progress" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900">
                      <SelectItem value="all">All progress</SelectItem>
                      <SelectItem value="not-started">Not started</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sort}
                    onValueChange={(val: FilterState['sort']) => setFilters((f) => ({ ...f, sort: val }))}
                  >
                    <SelectTrigger className="w-40 border-slate-200 bg-white text-slate-900">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900">
                      <SelectItem value="recent">Recently updated</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="title-asc">Title A-Z</SelectItem>
                      <SelectItem value="title-desc">Title Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setFilters({ search: '', category: 'all', progress: 'all', sort: 'recent' })
                    }
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-slate-500">Loading your courses...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  No courses match these filters yet. Try clearing the filters or enroll in a course.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((item) => (
                    <div key={item.course.id} className="flex flex-col gap-3">
                      <CourseCard
                        course={item.course}
                        showProgress
                        progress={item.progress ?? 0}
                        rating={item.rating ?? 0}
                      />
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-700">{item.course.category}</Badge>
                          <span>{item.progress ?? 0}% complete</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-slate-100"
                            onClick={() => navigate(`/courses/${item.course.id}`)}
                          >
                            Resume
                          </Button>
                          {!item.completed && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-slate-100"
                              onClick={() => handleMarkComplete(item.enrollmentId)}
                            >
                              Mark done
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-slate-200 bg-white text-slate-900 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Continue learning</CardTitle>
                <CardDescription className="text-slate-600">
                  Jump back into courses you're actively working on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {continuing.length === 0 ? (
                  <div className="text-slate-600">No courses in progress yet.</div>
                ) : (
                  continuing.map((c) => (
                    <div
                      key={c.course.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-500">{c.course.category}</div>
                          <div className="text-lg font-semibold text-slate-900">{c.course.title}</div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                          onClick={() => navigate(`/courses/${c.course.id}`)}
                        >
                          Resume
                        </Button>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Progress</span>
                          <span>{c.progress ?? 0}%</span>
                        </div>
                        <Progress value={c.progress ?? 0} className="h-2" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white text-slate-900 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Completed</CardTitle>
                <CardDescription className="text-slate-600">
                  Recently finished courses you can review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completed.length === 0 ? (
                  <div className="text-slate-600">Complete a course to see it here.</div>
                ) : (
                  completed.map((c) => (
                    <div
                      key={c.course.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-500">{c.course.category}</div>
                          <div className="text-lg font-semibold text-slate-900">{c.course.title}</div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700">Completed</Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">Rating: {c.rating ?? 'Not yet'}</div>
                      {c.enrollmentId && (
                        <div className="mt-2 flex gap-2 text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-slate-900 hover:bg-slate-100"
                            onClick={() => navigate(`/courses/${c.course.id}`)}
                          >
                            Review course
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Recommended for you</CardTitle>
              <CardDescription className="text-slate-600">
                New courses picked to broaden your learning path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedQuery.isLoading ? (
                <div className="text-slate-600">Loading recommendations...</div>
              ) : recommended.length === 0 ? (
                <div className="text-slate-600">You're up to date with your library.</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((course) => (
                    <CourseCard key={course.id} course={course} showProgress={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
