import api from './axiosClient';

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
