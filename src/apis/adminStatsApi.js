import axiosClient from './axiosClient';

function unwrap(response) {
  return response.data?.data;
}

export const adminStatsApi = {
  async getScoreAverage() {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/score-average'));
  },

  async getExpiredCount() {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/expired-count'));
  },

  async getCategoryStats(period = 7) {
    const resolvedPeriod = period === 'all' ? 0 : period;
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/category', { params: { period: resolvedPeriod } })) || [];
  },

  async getTopIngredients() {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/top-ingredients')) || [];
  },

  async getWeeklyTrend() {
    return unwrap(await axiosClient.get('/api/v1/admin/statistics/weekly-trend'));
  },
};
