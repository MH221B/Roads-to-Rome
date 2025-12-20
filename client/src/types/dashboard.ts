export type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  difficulty?: string | null;
  instructor: string | { id: string | null; name: string };
  shortDescription: string;
  rating?: number | null;
  ratingCount?: number | null;
};

export type UserCourseProgress = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number | null;
  last_lesson_id?: string | null;
  completed: boolean;
  rating?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type FilterState = {
  search: string;
  category: string;
  progress: 'all' | 'not-started' | 'in-progress' | 'completed';
  sort: 'recent' | 'progress' | 'title-asc' | 'title-desc';
};

export type EnrichedCourse = {
  course: Course;
  enrollmentId: string | null;
  progress: number | null;
  rating: number | null;
  completed: boolean;
  updatedAt: string | null;
  createdAt: string | null;
};
