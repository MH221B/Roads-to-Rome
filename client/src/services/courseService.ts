import api from './axiosClient';

export type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: { id: string | null; name: string };
  shortDescription: string;
  difficulty?: string | null;
};

export async function getCourses(
  page = 1,
  limit = 6,
  params?: { category?: string | null; tags?: string[]; search?: string }
): Promise<Course[]> {
  const query: Record<string, any> = { page, limit };

  if (params?.category) query.category = params.category;
  if (params?.tags && params.tags.length) query.tags = params.tags.join(',');
  if (params?.search) query.search = params.search;

  const resp = await api.get('/api/courses', { params: query });
  const payload = resp.data;

  if (Array.isArray(payload)) {
    return payload as Course[];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data as Course[];
  }

  return [];
}

export default { getCourses };
