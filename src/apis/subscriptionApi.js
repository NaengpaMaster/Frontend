import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const subscriptionApi = {
  getMySubscription: () =>
    axiosClient.get('/api/v1/subscriptions/me').then(unwrap),
};
