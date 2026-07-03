import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const memberStatsApi = {
  getTopIngredients: (days) =>
    axiosClient.get('/api/v1/member-stats/top-ingredients', { params: { days } }).then(unwrap),

  getExpiredCategories: (days) =>
    axiosClient.get('/api/v1/member-stats/expired-categories', { params: { days } }).then(unwrap),

  getExpiredRecords: (days) =>
    axiosClient.get('/api/v1/member-stats/expired-records', { params: { days } }).then(unwrap),
};
