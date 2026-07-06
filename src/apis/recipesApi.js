import axiosClient from './axiosClient';

export const recipesApi = {
  getAll: ({ keyword, favorite = false, match80Only = false, page = 0, size = 10 } = {}) =>
    axiosClient.get('/api/v1/recipes/recommendations', {
      params: { keyword: keyword || undefined, favorite, match80Only, page, size },
    }),
  getById: (id) =>
    axiosClient.get(`/api/v1/recipes/${id}`),
  create: (data) =>
    axiosClient.post('/api/v1/recipes', data),
  update: (id, data) =>
    axiosClient.patch(`/api/v1/recipes/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/v1/recipes/${id}`),
  toggleFavorite: (id) =>
    axiosClient.post(`/api/v1/recipes/${id}/like`),
  getComments: (recipeId, page = 0, size = 50) =>
    axiosClient.get(`/api/v1/recipes/${recipeId}/comments`, { params: { page, size } }),
  addComment: (recipeId, data) =>
    axiosClient.post(`/api/v1/recipes/${recipeId}/comments`, data),
  updateComment: (commentId, data) =>
    axiosClient.patch(`/api/v1/comments/${commentId}`, data),
  deleteComment: (commentId) =>
    axiosClient.delete(`/api/v1/comments/${commentId}`),
  getRecipeCategories: () =>
    axiosClient.get('/api/v1/recipe-categories'),
  getFoodCategories: () =>
    axiosClient.get('/api/v1/food-categories'),
};

export const adminRecipesApi = {
  getAll: ({ search, page = 0, size = 20 } = {}) =>
    axiosClient.get('/api/v1/admin/recipes', { params: { search: search || undefined, page, size } }),
  getById: (id) =>
    axiosClient.get(`/api/v1/admin/recipes/${id}`),
  update: (id, data) =>
    axiosClient.patch(`/api/v1/recipes/${id}`, data),
  delete: (id) =>
    axiosClient.delete(`/api/v1/recipes/${id}`),
};
