import { api } from './axiosClient';

export type LessonSummary = {
  id: string;
  course_id?: string;
  title: string;
  order?: number;
  quizzes?: Array<{ id: string; title?: string; order?: number }>;
};

export type Lesson = {
  id: string;
  course_id?: string;
  courseId?: string;
  title: string;
  lessonType?: 'theory' | 'practical' | 'lab';
  order?: number;
  content?: string;
  video?: string;
  attachments?: Array<{ name: string; url: string }>;
  quizzes?: Array<{ id: string; title?: string; order?: number }>;
};

export type CreateLessonPayload = {
  title: string;
  lessonType: 'theory' | 'practical' | 'lab';
  order: number;
  content: string;
  video?: string;
  attachments?: string[];
};

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

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

export async function getLesson(courseId: string, lessonId: string): Promise<Lesson> {
  const resp = await api.get(`/api/courses/${courseId}/lessons/${lessonId}`);
  return resp.data;
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

export async function updateLesson(
  courseId: string,
  lessonId: string,
  payload: UpdateLessonPayload
): Promise<any> {
  const resp = await api.patch(`/api/courses/${courseId}/lessons/${lessonId}`, payload);
  return resp.data;
}

export default {
  getLessonsByCourse,
  getLesson,
  uploadFile,
  createLesson,
  updateLesson,
};
