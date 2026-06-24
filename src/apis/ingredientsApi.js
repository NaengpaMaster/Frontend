import axiosClient from './axiosClient';

export const ingredientsApi = {
  getAll: () =>
    axiosClient.get('/api/ingredients'),
  create: (data) =>
    axiosClient.post('/api/ingredients', data),
  update: (id, data) =>
    axiosClient.put(`/api/ingredients/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/ingredients/${id}`),
};
