import * as React from 'react';
import HeaderComponent from './HeaderComponent';
import CourseFilterBar from './CourseFilterBar';
import CourseCard from './CourseCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/axiosClient';
import { decodeJwtPayload } from '@/lib/utils';

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

export type UserCourseProgress = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number | null; // 0-100, allow null for not-enrolled/not-available
  last_lesson_id?: string | null;
  completed: boolean;
  rating?: number | null; // decimal like 4.5
  updated_at?: string | null;
};

const Dashboard: React.FC = () => {
  const { accessToken, isAuthenticated } = useAuth();

  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const isStudent = roles.includes('STUDENT');

  // helper to create stable pseudo progress/rating for demo purposes
  const stableFromId = useCallback((id: string): Partial<UserCourseProgress> => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
    const progress = Math.abs(h) % 101; // 0-100
    const rating = ((Math.abs(h) % 50) / 10) % 5; // 0-5 (one decimal)
    const completed = progress === 100;
    return {
      id,
      progress,
      rating: Number(rating.toFixed(1)),
      completed,
      last_lesson_id: null,
      updated_at: new Date().toISOString(),
    };
  }, []);

  // Fetch enrollments for the logged-in user
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const resp = await api.get('/api/enrollments');
      return resp.data as any[];
    },
    enabled: isStudent && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });

  return (
    <div className="bg-background min-h-screen">
      <HeaderComponent showAdmin={roles.includes('ADMIN')} />
      <main>
        <CourseFilterBar />

        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <h2 className="mb-4 text-2xl font-semibold">My Courses</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {(isStudent && isAuthenticated && enrollments ? enrollments : []).map((item: any) => {
              // item might be an enrollment object with `course` and progress fields, or a plain course
              const isEnrollment = !!item.course;
              const course = isEnrollment
                ? ({
                    id: item.course.id || item.course._id,
                    title: item.course.title || item.course.name || 'Untitled',
                    thumbnail:
                      item.course.thumbnail ||
                      `https://picsum.photos/seed/${item.course.id || 'course'}/640/360`,
                    category: item.course.category,
                    tags: item.course.tags || [],
                    instructor:
                      typeof item.course.instructor === 'string'
                        ? item.course.instructor
                        : item.course.instructor?.name ||
                          item.course.instructor?.email ||
                          'Unknown',
                    shortDescription: item.course.shortDescription || item.course.description || '',
                  } as Course)
                : item;

              const extra: Partial<UserCourseProgress> = isEnrollment
                ? { progress: item.progress, rating: item.rating }
                : isStudent && isAuthenticated
                  ? stableFromId(course.id)
                  : { progress: null, rating: null };

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  showProgress={isStudent && isAuthenticated}
                  progress={extra.progress}
                  rating={extra.rating}
                  onRate={(r) => console.log(`Rated ${course.id}:`, r)}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
