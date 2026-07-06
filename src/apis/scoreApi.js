import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const scoreApi = {
    getScore: () =>
        axiosClient.get('/api/v1/scores').then(unwrap),

    getScoreHistories: (size = 7) =>
        axiosClient.get('/api/v1/scores/histories', {params: {size}}).then(unwrap),

    postScheduler: () =>
        axiosClient.post('/api/v1/admin/scores/run-scheduler').then(unwrap)
};