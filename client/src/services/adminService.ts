import { api } from './axiosClient';
import type { User, UserRole } from '@/types/user';

export interface AdminCourse {
  id: string;
  title: string;
  status: string;
  category?: string;
  instructor?: string | null;
  createdAt: string;
}

export interface PaginatedCoursesResponse {
  data: AdminCourse[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get('/api/admin/current-user');
  return response.data;
}

export async function getAllUsers(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedUsersResponse> {
  const response = await api.get('/api/admin/users', {
    params: { page, limit },
  });
  return response.data;
}

export async function getUsersByRole(
  role: UserRole,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedUsersResponse> {
  const response = await api.get(`/api/admin/users/role/${role}`, {
    params: { page, limit },
  });
  return response.data;
}

export async function searchUsers(
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedUsersResponse> {
  const response = await api.get('/api/admin/users/search', {
    params: { query, page, limit },
  });
  return response.data;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const response = await api.patch(`/api/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function toggleUserLocked(userId: string, locked: boolean): Promise<User> {
  const response = await api.patch(`/api/admin/users/${userId}/lock`, { locked });
  return response.data;
}

export async function getCoursesByStatus(
  status: string = 'pending',
  page: number = 1,
  limit: number = 20
): Promise<PaginatedCoursesResponse> {
  const response = await api.get('/api/admin/courses', {
    params: { status, page, limit },
  });
  return response.data;
}

export async function updateCourseStatus(
  courseId: string,
  status: string,
  reviewNote?: string | null
): Promise<AdminCourse> {
  const response = await api.patch(`/api/admin/courses/${courseId}/status`, {
    status,
    reviewNote,
  });
  return response.data;
}

export default {
  getCurrentUser,
  getAllUsers,
  getUsersByRole,
  searchUsers,
  updateUserRole,
  toggleUserLocked,
  getCoursesByStatus,
  updateCourseStatus,
};
