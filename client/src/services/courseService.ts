import api from './axiosClient';

export type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
  difficulty?: string | null;
};

export async function getCourses(): Promise<Course[]> {
  const resp = await api.get('/api/courses');
  // assume backend returns { data: Course[] } or Course[] directly
  const payload = resp.data;
  if (Array.isArray(payload)) return payload as Course[];
  if (Array.isArray(payload?.data)) return payload.data as Course[];
  return [];
}

export default { getCourses };
