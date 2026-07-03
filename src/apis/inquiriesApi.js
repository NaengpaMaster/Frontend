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

export const adminInquiriesApi = {
  getAll: (params) =>
    axiosClient.get('/api/v1/admin/inquiries', { params }).then(unwrap),

  getById: (id) =>
    axiosClient.get(`/api/v1/admin/inquiries/${id}`).then(unwrap),

  createAnswer: (inquiryId, content) =>
    axiosClient.post(`/api/v1/admin/inquiries/${inquiryId}/answers`, { content }).then(unwrap),

  updateAnswer: (inquiryId, answerId, content) =>
    axiosClient.patch(`/api/v1/admin/inquiries/${inquiryId}/answers/${answerId}`, { content }).then(unwrap),

  deleteAnswer: (inquiryId, answerId) =>
    axiosClient.delete(`/api/v1/admin/inquiries/${inquiryId}/answers/${answerId}`).then(unwrap),

  delete: (inquiryId) =>
    axiosClient.delete(`/api/v1/admin/inquiries/${inquiryId}`).then(unwrap),
};
