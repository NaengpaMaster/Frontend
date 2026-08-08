import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const notificationApi = {
  getUnread: () =>
    axiosClient.get('/api/v1/notifications').then(unwrap),

  markAsRead: (notificationId) =>
    axiosClient.patch(`/api/v1/notifications/${notificationId}/read`).then(unwrap),

  markAllAsRead: () =>
    axiosClient.patch('/api/v1/notifications/read-all').then(unwrap),
};
