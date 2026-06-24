import axiosClient from './axiosClient';

export const recipesApi = {
  getAll: () =>
    axiosClient.get('/api/recipes'),
  getById: (id) =>
    axiosClient.get(`/api/recipes/${id}`),
  create: (data) =>
    axiosClient.post('/api/recipes', data),
  update: (id, data) =>
    axiosClient.put(`/api/recipes/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/recipes/${id}`),
  toggleFavorite: (id) =>
    axiosClient.post(`/api/recipes/${id}/favorite`),
  getComments: (recipeId) =>
    axiosClient.get(`/api/recipes/${recipeId}/comments`),
  addComment: (recipeId, data) =>
    axiosClient.post(`/api/recipes/${recipeId}/comments`, data),
};
