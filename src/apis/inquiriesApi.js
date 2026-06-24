import axiosClient from './axiosClient';

export const inquiriesApi = {
  getAll: () =>
    axiosClient.get('/api/inquiries'),
  getMyInquiries: (userId) =>
    axiosClient.get(`/api/inquiries?userId=${userId}`),
  create: (data) =>
    axiosClient.post('/api/inquiries', data),
  update: (id, data) =>
    axiosClient.put(`/api/inquiries/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/inquiries/${id}`),
  answer: (id, answer) =>
    axiosClient.post(`/api/inquiries/${id}/answer`, { answer }),
  deleteAnswer: (id) =>
    axiosClient.delete(`/api/inquiries/${id}/answer`),
};
