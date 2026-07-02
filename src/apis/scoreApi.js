import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const scoreApi = {
  getScore: () =>
    axiosClient.get('/api/v1/scores').then(unwrap),

  getHistories: (params) =>
    axiosClient.get('/api/v1/scores/histories', { params }).then(unwrap),
};
