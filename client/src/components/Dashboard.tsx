import * as React from 'react';
import HeaderComponent from './HeaderComponent';
import CourseFilterBar from './CourseFilterBar';
import CourseCard from './CourseCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useCallback } from 'react';
import { useMemo } from 'react';

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Modern React Patterns',
    thumbnail: 'https://picsum.photos/seed/modern-react-patterns/640/360',
    category: 'Web Development',
    tags: ['react', 'components', 'performance'],
    instructor: 'Aisha Khan',
    shortDescription: 'Explore advanced React patterns and hooks to build scalable, maintainable applications.',
  },
  {
    id: 'course-2',
    title: 'TypeScript Deep Dive',
    thumbnail: 'https://picsum.photos/seed/typescript-deep-dive/640/360',
    category: 'Programming',
    tags: ['typescript', 'nodejs'],
    instructor: 'Marcus Lee',
    shortDescription: 'Master TypeScript features and typing strategies for real-world codebases.',
  },
  {
    id: 'course-3',
    title: 'Design Systems in Practice',
    thumbnail: 'https://picsum.photos/seed/design-systems/640/360',
    category: 'UI/UX',
    tags: ['design', 'components'],
    instructor: 'Clara Romano',
    shortDescription: 'Learn how to create and maintain a robust design system that teams can trust.',
  },
];

const Dashboard: React.FC = () => {
  const { accessToken, isAuthenticated } = useAuth();

  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map((r) => String(r).toUpperCase());

  const isStudent = roles.includes('STUDENT');

  // helper to create stable pseudo progress/rating for demo purposes
  const stableFromId = useCallback((id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
    const progress = Math.abs(h) % 101; // 0-100
    const rating = ((Math.abs(h) % 50) / 10) % 5; // 0-5 (one decimal)
    return { progress, rating: Number(rating.toFixed(1)) };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeaderComponent showAdmin={roles.includes('ADMIN')} />
      <main>
        <CourseFilterBar />

        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCourses.map((course) => {
              const extra = isStudent && isAuthenticated ? stableFromId(course.id) : { progress: null, rating: null };
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
