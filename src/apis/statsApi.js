import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const statsApi = {
    getTopExpiredIngredients: (days = 7) =>
        axiosClient.get('/api/v1/member-stats/top-ingredients', {params: {days}}).then(unwrap),

    getExpiredCategories: (days = 7) =>
        axiosClient.get('/api/v1/member-stats/expired-categories', { params: { days } }).then(unwrap),

    getExpiredRecords: (days = 7) =>
        axiosClient.get('/api/v1/member-stats/expired-records', { params: { days } }).then(unwrap)
};

