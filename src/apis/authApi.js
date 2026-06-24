import axiosClient from './axiosClient';

export const authApi = {
  login: (email, password) =>
    axiosClient.post('/api/auth/login', { email, password }),
  logout: () =>
    axiosClient.post('/api/auth/logout'),
  register: (data) =>
    axiosClient.post('/api/auth/register', data),
  getMe: () =>
    axiosClient.get('/api/auth/me'),
  updateProfile: (id, data) =>
    axiosClient.put(`/api/users/${id}`, data),
  deleteAccount: (id) =>
    axiosClient.delete(`/api/users/${id}`),
};
