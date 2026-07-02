import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const inquiriesApi = {
  getAll: (params) =>
    axiosClient.get('/api/v1/inquiries', { params }).then(unwrap),

  getById: (id) =>
    axiosClient.get(`/api/v1/inquiries/${id}`).then(unwrap),

  create: (data) =>
    axiosClient.post('/api/v1/inquiries', data).then(unwrap),

  update: (id, data) =>
    axiosClient.patch(`/api/v1/inquiries/${id}`, data).then(unwrap),

  delete: (id) =>
    axiosClient.delete(`/api/v1/inquiries/${id}`).then(unwrap),
};
