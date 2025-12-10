import * as React from 'react';
import type { Course } from '@/services/courseService';
import { getCourses, getInstructorCourses } from '@/services/courseService';
import { decodeJwtPayload } from '@/lib/utils';

const mockCategories: string[] = [
  'Web Development',
  'Programming',
  'UI/UX',
  'Backend',
  'APIs',
  'DevOps',
  'Data',
  'Cloud',
];

const mockTags: string[] = [
  'react',
  'typescript',
  'design',
  'components',
  'nodejs',
  'api',
  'graphql',
  'ci',
  'pwa',
  'performance',
  'd3',
  'cloud',
  'ml',
  'deployment',
];
import HeaderComponent from '@/components/HeaderComponent';
import { useNavigate } from 'react-router-dom';
import CourseCard from '@/components/CourseCard';
import CourseCardCompact from '@/components/CourseCardCompact';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa6';
import { useAuth } from '@/contexts/AuthProvider';

// local UI-only state for courses loaded from the backend
// `Course` type is imported from the service and matches the API shape

const HomePage: React.FC = () => {
  const { accessToken } = useAuth();
  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const showAdmin = roles.includes('ADMIN');
  const showStudent = roles.includes('STUDENT');
  const showInstructor = roles.includes('INSTRUCTOR');
  const navigate = useNavigate();
  const isGuest = !accessToken || roles.length === 0;

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId =
          payload?.sub ??
          payload?.id ??
          payload?.userId ??
          (payload?.user && payload.user.id) ??
          null;

        if (showInstructor) {
          const instructorCourses = await getInstructorCourses(userId);
          if (!mounted) return;
          setCourses(instructorCourses);
        } else {
          const latest = await getCourses(1, 6);
          if (!mounted) return;
          setCourses(latest);
        }
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load courses');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [accessToken, showInstructor, showStudent, isGuest, payload]);

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderComponent showAdmin={showAdmin} />
      <main className="flex-1">
        {(showStudent || isGuest) && (
          <div className="mx-auto w-full max-w-7xl px-4 py-10">
            <section className="mt-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Latest Courses</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {loading && <div>Loading courses...</div>}
                {!loading && courses.length === 0 && <div>No courses found.</div>}
                {!loading &&
                  courses.map((course) => <CourseCard key={course.id} course={course} />)}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-lg font-semibold">Categories</h4>
                  <div className="flex flex-wrap gap-3">
                    {mockCategories.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-lg font-semibold">Popular Tags</h4>
                  <div className="flex flex-wrap gap-3">
                    {mockTags.map((t) => (
                      <Badge key={t} variant="secondary">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {showInstructor && (
          <div className="mx-auto w-full max-w-7xl px-4 py-10">
            <section className="mt-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Your Courses</h2>
                <div>
                  <Button
                    onClick={() => navigate('/courses/create')}
                    className="flex items-center gap-2"
                  >
                    <FaPlus />
                    Create Course
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {loading && <div>Loading your courses...</div>}
                {!loading && courses.length === 0 && <div>No courses found for your account.</div>}
                {!loading &&
                  courses.map((course) => (
                    <CourseCardCompact
                      key={course.id}
                      course={course}
                      onEdit={() => navigate(`/courses/${course.id}/edit`)}
                      onPreview={() => navigate(`/courses/${course.id}`)}
                      onDelete={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                    />
                  ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
