import api from "./axiosClient";

export const registerUser = async (email: string, password: string) => {
  const response = await api.post(`/api/auth/register`, { email, password });
  return response.data;
};