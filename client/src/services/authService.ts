import api from './axiosClient';
import type { User } from '@/types/user';

export const registerUser = async (
  email: string,
  password: string,
  role?: string,
  username?: string,
  fullName?: string
) => {
  const payload: {
    email: string;
    password: string;
    role?: string;
    username?: string;
    fullName?: string;
  } = { email, password };
  if (role) payload.role = role;
  if (username) payload.username = username;
  if (fullName) payload.fullName = fullName;
  const response = await api.post(`/api/auth/register`, payload);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/api/auth/me');
  return response.data;
};
