import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const shoppingApi = {
  getAll: (fridgeId) =>
    axiosClient.get('/api/v1/shopping-items', { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  create: (data, fridgeId) =>
    axiosClient.post('/api/v1/shopping-items', data, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  toggle: (id, isPurchased, fridgeId) =>
    axiosClient.patch(`/api/v1/shopping-items/${id}/check`, { isPurchased }, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  update: (id, data, fridgeId) =>
    axiosClient.patch(`/api/v1/shopping-items/${id}`, data, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  delete: (id, fridgeId) =>
    axiosClient.delete(`/api/v1/shopping-items/${id}`, { params: fridgeId ? { fridgeId } : {} }),

  moveToFridge: (id, data, fridgeId) =>
    axiosClient.post(`/api/v1/shopping-items/${id}/fridge`, data, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  recommendWithAgent: (data) =>
    axiosClient.post('/api/v1/agent/shopping-recommendations', data).then(unwrap),

  addAgentRecommendation: (item) =>
    axiosClient.post('/api/v1/agent/tools/shopping-items', item).then(unwrap),
};
