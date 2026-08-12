import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const subscriptionApi = {
  getMySubscription: () =>
    axiosClient.get('/api/v1/subscriptions/me').then(unwrap),

  issueBillingKey: ({ authKey, customerKey }) =>
    axiosClient.post('/api/v1/billing-keys', { authKey, customerKey }).then(unwrap),

  approveSubscriptionPayment: (planType) =>
    axiosClient.post('/api/v1/subscriptions/payments', { planType }).then(unwrap),

  getMyBillingKey: () =>
    axiosClient.get('/api/v1/billing-keys/me').then(unwrap),

  getMyPayments: () =>
    axiosClient.get('/api/v1/subscriptions/payments').then(unwrap),

  cancelSubscription: () =>
    axiosClient.patch('/api/v1/subscriptions/cancel').then(unwrap),
};
