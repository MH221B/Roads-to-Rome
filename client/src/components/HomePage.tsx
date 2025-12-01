import * as React from 'react';

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  /** e.g. 'Beginner' | 'Intermediate' | 'Advanced' */
  difficulty?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Modern React Patterns',
    thumbnail: 'https://picsum.photos/seed/modern-react-patterns/640/360',
    category: 'Web Development',
    difficulty: 'Intermediate',
    tags: ['react', 'components', 'performance'],
    instructor: 'Aisha Khan',
    shortDescription:
      'Explore advanced React patterns and hooks to build scalable, maintainable applications.',
  },
  {
    id: 'course-2',
    title: 'TypeScript Deep Dive',
    thumbnail: 'https://picsum.photos/seed/typescript-deep-dive/640/360',
    category: 'Programming',
    difficulty: 'Advanced',
    tags: ['typescript', 'nodejs'],
    instructor: 'Marcus Lee',
    shortDescription: 'Master TypeScript features and typing strategies for real-world codebases.',
  },
  {
    id: 'course-3',
    title: 'Design Systems in Practice',
    thumbnail: 'https://picsum.photos/seed/design-systems/640/360',
    category: 'UI/UX',
    difficulty: 'Intermediate',
    tags: ['design', 'components'],
    instructor: 'Clara Romano',
    shortDescription:
      'Learn how to create and maintain a robust design system that teams can trust.',
  },
  {
    id: 'course-4',
    title: 'Backend APIs with Node.js',
    thumbnail: 'https://picsum.photos/seed/nodejs-apis/640/360',
    category: 'Backend',
    difficulty: 'Intermediate',
    tags: ['nodejs', 'api'],
    instructor: 'Daniel Osei',
    shortDescription:
      'Build reliable, documented REST APIs using Node.js and best practices for testing and security.',
  },
  {
    id: 'course-5',
    title: 'Practical GraphQL',
    thumbnail: 'https://picsum.photos/seed/practical-graphql/640/360',
    category: 'APIs',
    difficulty: 'Intermediate',
    tags: ['graphql', 'api'],
    instructor: 'Sofia Martínez',
    shortDescription:
      'Design efficient GraphQL schemas and resolvers for modern client-server workflows.',
  },
  {
    id: 'course-6',
    title: 'CI/CD Essentials',
    thumbnail: 'https://picsum.photos/seed/ci-cd-essentials/640/360',
    category: 'DevOps',
    difficulty: 'Beginner',
    tags: ['ci', 'cloud', 'deployment'],
    instructor: "Liam O'Connor",
    shortDescription: 'Set up continuous integration and delivery pipelines to speed safe deploys.',
  },
];

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
import CourseCard from '@/components/CourseCard';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthProvider';

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

const HomePage: React.FC = () => {
  const { accessToken } = useAuth();
  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const showAdmin = roles.includes('ADMIN');

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderComponent showAdmin={showAdmin} />
      <main className="flex-1">
        {
          <div className="mx-auto w-full max-w-7xl px-4 py-10">
            <section className="mt-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Latest Courses</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {mockCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
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
        }
      </main>
    </div>
  );
};

export default HomePage;
