import * as React from "react";

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Modern React Patterns",
    thumbnail: "https://picsum.photos/seed/modern-react-patterns/640/360",
    category: "Web Development",
    tags: ["react", "components", "performance"],
    instructor: "Aisha Khan",
    shortDescription: "Explore advanced React patterns and hooks to build scalable, maintainable applications.",
  },
  {
    id: "course-2",
    title: "TypeScript Deep Dive",
    thumbnail: "https://picsum.photos/seed/typescript-deep-dive/640/360",
    category: "Programming",
    tags: ["typescript", "nodejs"],
    instructor: "Marcus Lee",
    shortDescription: "Master TypeScript features and typing strategies for real-world codebases.",
  },
  {
    id: "course-3",
    title: "Design Systems in Practice",
    thumbnail: "https://picsum.photos/seed/design-systems/640/360",
    category: "UI/UX",
    tags: ["design", "components"],
    instructor: "Clara Romano",
    shortDescription: "Learn how to create and maintain a robust design system that teams can trust.",
  },
  {
    id: "course-4",
    title: "Backend APIs with Node.js",
    thumbnail: "https://picsum.photos/seed/nodejs-apis/640/360",
    category: "Backend",
    tags: ["nodejs", "api"],
    instructor: "Daniel Osei",
    shortDescription: "Build reliable, documented REST APIs using Node.js and best practices for testing and security.",
  },
  {
    id: "course-5",
    title: "Practical GraphQL",
    thumbnail: "https://picsum.photos/seed/practical-graphql/640/360",
    category: "APIs",
    tags: ["graphql", "api"],
    instructor: "Sofia Martínez",
    shortDescription: "Design efficient GraphQL schemas and resolvers for modern client-server workflows.",
  },
  {
    id: "course-6",
    title: "CI/CD Essentials",
    thumbnail: "https://picsum.photos/seed/ci-cd-essentials/640/360",
    category: "DevOps",
    tags: ["ci", "cloud", "deployment"],
    instructor: "Liam O'Connor",
    shortDescription: "Set up continuous integration and delivery pipelines to speed safe deploys.",
  },
  {
    id: "course-7",
    title: "Progressive Web Apps",
    thumbnail: "https://picsum.photos/seed/progressive-web-apps/640/360",
    category: "Web Development",
    tags: ["pwa", "performance"],
    instructor: "Nina Patel",
    shortDescription: "Create fast, offline-capable web apps with service workers and modern caching strategies.",
  },
  {
    id: "course-8",
    title: "Data Visualization with D3",
    thumbnail: "https://picsum.photos/seed/d3-visualization/640/360",
    category: "Data",
    tags: ["d3", "performance"],
    instructor: "Oliver Braun",
    shortDescription: "Turn complex datasets into clear, interactive visualizations using D3.js.",
  },
  {
    id: "course-9",
    title: "Cloud Foundations",
    thumbnail: "https://picsum.photos/seed/cloud-foundations/640/360",
    category: "Cloud",
    tags: ["cloud", "deployment"],
    instructor: "Emily Chen",
    shortDescription: "Understand core cloud concepts and services to design cost-effective infrastructure.",
  },
];

const mockCategories: string[] = [
  "Web Development",
  "Programming",
  "UI/UX",
  "Backend",
  "APIs",
  "DevOps",
  "Data",
  "Cloud",
];

const mockTags: string[] = [
  "react",
  "typescript",
  "design",
  "components",
  "nodejs",
  "api",
  "graphql",
  "ci",
  "pwa",
  "performance",
  "d3",
  "cloud",
  "ml",
  "deployment",
];
import HeaderComponent from "@/components/HeaderComponent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useAuth } from "@/contexts/AuthProvider";

function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const HomePage: React.FC = () => {
  const { accessToken } = useAuth();
  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const roles: string[] = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.roles
    ? [payload.roles]
    : [];

  const showAdmin = roles.includes("ADMIN");

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderComponent showAdmin={showAdmin} />
      <main className="flex-1">
        {(
          <div className="mx-auto w-full max-w-7xl px-4 py-10">
            <section className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Latest Courses</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden p-0 h-auto flex flex-col gap-2">
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>

                    <CardHeader className="p-0 pt-2 pb-1 px-3">
                      <div>
                        <CardTitle className="leading-tight">{course.title}</CardTitle>
                        <CardDescription className="mt-0 text-sm text-muted-foreground">
                          {course.instructor}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 py-0 px-3">
                      <div className="text-sm text-muted-foreground">
                        {course.shortDescription}
                      </div>
                    </CardContent>

                    <CardFooter className="p-0 pt-2 pb-5 px-3 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag) => (
                          <Badge key={tag}>#{tag}</Badge>
                        ))}
                      </div>
                    </CardFooter>

                  </Card>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Categories</h4>
                  <div className="flex flex-wrap gap-3">
                    {mockCategories.map((c) => (
                      <Badge key={c} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Popular Tags</h4>
                  <div className="flex flex-wrap gap-3">
                    {mockTags.map((t) => (
                      <Badge key={t} variant="secondary">#{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
