import axiosClient from './axiosClient';

export const shoppingApi = {
  getAll: () =>
    axiosClient.get('/api/shopping'),
  create: (data) =>
    axiosClient.post('/api/shopping', data),
  toggle: (id) =>
    axiosClient.patch(`/api/shopping/${id}/toggle`),
  delete: (id) =>
    axiosClient.delete(`/api/shopping/${id}`),
  clearChecked: () =>
    axiosClient.delete('/api/shopping/checked'),
  moveToFridge: (ids) =>
    axiosClient.post('/api/shopping/move-to-fridge', { ids }),
};
