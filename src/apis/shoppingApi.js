import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const shoppingApi = {
  getAll: () =>
    axiosClient.get('/api/v1/shopping-items').then(unwrap),

  create: (data) =>
    axiosClient.post('/api/v1/shopping-items', data).then(unwrap),

  toggle: (id, isPurchased) =>
    axiosClient.patch(`/api/v1/shopping-items/${id}/check`, { isPurchased }).then(unwrap),

  update: (id, data) =>
    axiosClient.patch(`/api/v1/shopping-items/${id}`, data).then(unwrap),

  delete: (id) =>
    axiosClient.delete(`/api/v1/shopping-items/${id}`),

  moveToFridge: (id, data) =>
    axiosClient.post(`/api/v1/shopping-items/${id}/fridge`, data).then(unwrap),
};
