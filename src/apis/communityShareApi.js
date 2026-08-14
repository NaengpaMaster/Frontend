import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const communityShareApi = {
  getOpen: ({ latitude, longitude, radiusKm, page = 0 } = {}) =>
    axiosClient.get('/api/v1/community-shares', {
      params: {
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        radiusKm: radiusKm ?? undefined,
        page,
      },
    }).then(unwrap),

  getMine: (page = 0) =>
    axiosClient.get('/api/v1/community-shares/me', { params: { page } }).then(unwrap),

  getJoined: (page = 0) =>
    axiosClient.get('/api/v1/community-shares/me/joined', { params: { page } }).then(unwrap),

  create: (data) =>
    axiosClient.post('/api/v1/community-shares', data).then(unwrap),

  join: (communitySharePostId) =>
    axiosClient.post(`/api/v1/community-shares/${communitySharePostId}/join`).then(unwrap),

  cancelJoin: (communitySharePostId) =>
    axiosClient.patch(`/api/v1/community-shares/${communitySharePostId}/cancel-join`).then(unwrap),

  close: (communitySharePostId) =>
    axiosClient.patch(`/api/v1/community-shares/${communitySharePostId}/close`).then(unwrap),

  cancel: (communitySharePostId) =>
    axiosClient.patch(`/api/v1/community-shares/${communitySharePostId}/cancel`).then(unwrap),
};
