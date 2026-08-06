import axiosClient from './axiosClient';

function unwrap(response) {
  return response.data?.data;
}

export const adminStatsApi = {
  async getSummary(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/summary', { params: { startDate, endDate } }));
  },

  async getMaterialStatistics(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/materials', { params: { startDate, endDate } }));
  },

  async getRecipeStatistics(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/recipes', { params: { startDate, endDate } }));
  },

  async getTopIngredients(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/top-ingredients', { params: { startDate, endDate } })) || [];
  },

  async getMemberStatistics(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/members', {
      params: { startDate, endDate },
      preserveSessionOnUnauthorized: true,
    }));
  },

  async getMemberUsageStatistics(startDate, endDate) {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/service-usage', {
      params: { startDate, endDate },
      preserveSessionOnUnauthorized: true,
    }));
  },
};
