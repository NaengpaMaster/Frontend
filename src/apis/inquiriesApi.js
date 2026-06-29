import axiosClient from './axiosClient';

export const inquiriesApi = {
  getAll: () =>
    axiosClient.get('/api/v1/inquiries'),
  getMyInquiries: () =>
    axiosClient.get('/api/v1/inquiries'),
  create: (data) =>
    axiosClient.post('/api/v1/inquiries', data),
  update: (id, data) =>
    axiosClient.put(`/api/v1/inquiries/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/v1/inquiries/${id}`),
  answer: (id, answer) =>
    axiosClient.post(`/api/v1/inquiries/${id}/answer`, { answer }),
  deleteAnswer: (id) =>
    axiosClient.delete(`/api/v1/inquiries/${id}/answer`),
};
