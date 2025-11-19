import api from "./axiosClient";

export const registerUser = async (email: string, password: string) => {
  const response = await api.post(`/user/register`, { email, password });
  return response.data;
};