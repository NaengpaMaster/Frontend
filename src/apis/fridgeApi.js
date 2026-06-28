import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const fridgeApi = {
  getItems: () =>
    axiosClient.get('/api/v1/fridge-items').then(unwrap),

  getExpiringSoonItems: () =>
    axiosClient.get('/api/v1/fridge-items/expiring-soon').then(unwrap),

  getExpiredItems: () =>
    axiosClient.get('/api/v1/fridge-items/expired').then(unwrap),

  createItem: (data) =>
    axiosClient.post('/api/v1/fridge-items', data).then(unwrap),

  updateItem: (fridgeItemId, data) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}`, data).then(unwrap),

  deleteItem: (fridgeItemId) =>
    axiosClient.delete(`/api/v1/fridge-items/${fridgeItemId}`),

  useAll: (fridgeItemId) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}/use-all`),

  usePartial: (fridgeItemId, quantity) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}/use-partial`, { quantity }).then(unwrap),

  searchProducts: (keyword) =>
    axiosClient.get('/api/v1/products/search', { params: { keyword } }).then(unwrap),

  getCategories: () =>
    axiosClient.get('/api/v1/categories').then(unwrap),
};
