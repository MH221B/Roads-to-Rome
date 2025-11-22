import api from "./axiosClient";

export const registerUser = async (email: string, password: string, role?: string) => {
  const payload: { email: string; password: string; role?: string } = { email, password };
  if (role) payload.role = role;
  const response = await api.post(`/api/auth/register`, payload);
  return response.data;
};