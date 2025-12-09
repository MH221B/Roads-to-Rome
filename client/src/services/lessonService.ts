import { api } from './axiosClient';

export type LessonSummary = {
  id: string;
  course_id?: string;
  title: string;
  order?: number;
  quizzes?: Array<{ id: string; title?: string; order?: number }>;
};

export type CreateLessonPayload = {
  title: string;
  lessonType: 'theory' | 'practical' | 'lab';
  order: number;
  content_type: string;
  content: string;
  attachments?: string[];
};

export async function getLessonsByCourse(courseId: string): Promise<LessonSummary[]> {
  const resp = await api.get(`/api/courses/${courseId}/lessons`);
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

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await api.post('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resp.data;
}

export async function createLesson(courseId: string, payload: CreateLessonPayload): Promise<any> {
  const resp = await api.post(`/api/courses/${courseId}/lessons`, payload);
  return resp.data;
}

export default { getLessonsByCourse, uploadFile, createLesson };
