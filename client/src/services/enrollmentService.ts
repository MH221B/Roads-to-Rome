import { api } from './axiosClient';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  is_premium: boolean;
  status: string;
  instructor:
    | string
    | {
        id?: string | null;
        name?: string | null;
        fullName?: string | null;
        username?: string | null;
        email?: string | null;
      }
    | null;
}

export interface Enrollment {
  id: string;
  student_id?: string;
  course_id?: string;
  course: Course;
  status: string;
  created_at?: string;
  progress?: number;
  completed?: boolean;
}

export async function getEnrollments(): Promise<Enrollment[]> {
  const response = await api.get<Enrollment[]>('/api/enrollments');
  return response.data;
}

export async function deleteEnrollment(enrollmentId: string): Promise<string> {
  await api.delete(`/api/enrollments/${enrollmentId}`);
  return enrollmentId;
}

export default { getEnrollments, deleteEnrollment };
