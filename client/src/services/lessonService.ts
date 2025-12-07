import { api } from './axiosClient';

export type LessonSummary = {
  id: string;
  course_id?: string;
  title: string;
  order?: number;
  quizzes?: Array<{ id: string; title?: string; order?: number }>;
};

export async function getLessonsByCourse(courseId: string): Promise<LessonSummary[]> {
  const resp = await api.get(`/api/lessons/course/${courseId}`);
  // server returns full lesson objects; map to a lightweight summary
  const payload = resp.data ?? [];
  return payload.map((l: any) => ({
    id: l.id,
    course_id: l.course_id ?? l.courseId,
    title: l.title ?? l.name ?? `Lesson ${l.id}`,
    order: l.order,
    quizzes: Array.isArray(l.quizzes)
      ? l.quizzes.map((q: any) => ({ id: q.id, title: q.title ?? q.id, order: q.order }))
      : [],
  }));
}

export default { getLessonsByCourse };
