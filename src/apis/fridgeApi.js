import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const fridgeApi = {
  getMyFridge: () =>
    axiosClient.get('/api/v1/fridges/me').then(unwrap),

  getAccessibleFridges: () =>
    axiosClient.get('/api/v1/fridges/accessible').then(unwrap),

  getMembers: () =>
    axiosClient.get('/api/v1/fridges/me/members').then(unwrap),

  inviteMember: (email) =>
    axiosClient.post('/api/v1/fridges/me/members', { email }).then(unwrap),

  getSentInvites: () =>
    axiosClient.get('/api/v1/fridges/me/invites').then(unwrap),

  getReceivedInvites: () =>
    axiosClient.get('/api/v1/fridges/invites/received').then(unwrap),

  acceptInvite: (inviteId) =>
    axiosClient.post(`/api/v1/fridges/invites/${inviteId}/accept`).then(unwrap),

  rejectInvite: (inviteId) =>
    axiosClient.post(`/api/v1/fridges/invites/${inviteId}/reject`).then(unwrap),

  removeMember: (memberId) =>
    axiosClient.delete(`/api/v1/fridges/me/members/${memberId}`).then(unwrap),

  getItems: (fridgeId) =>
    axiosClient.get('/api/v1/fridge-items', { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  getExpiringSoonItems: () =>
    axiosClient.get('/api/v1/fridge-items/expiring-soon').then(unwrap),

  getExpiredItems: () =>
    axiosClient.get('/api/v1/fridge-items/expired').then(unwrap),

  createItem: (data, fridgeId) =>
    axiosClient.post('/api/v1/fridge-items', data, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  updateItem: (fridgeItemId, data, fridgeId) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}`, data, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  deleteItem: (fridgeItemId, fridgeId) =>
    axiosClient.delete(`/api/v1/fridge-items/${fridgeItemId}`, { params: fridgeId ? { fridgeId } : {} }),

  useAll: (fridgeItemId, fridgeId) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}/use-all`, null, { params: fridgeId ? { fridgeId } : {} }),

  usePartial: (fridgeItemId, quantity, fridgeId) =>
    axiosClient.patch(`/api/v1/fridge-items/${fridgeItemId}/use-partial`, { quantity }, { params: fridgeId ? { fridgeId } : {} }).then(unwrap),

  transferItem: (fridgeItemId, data) =>
    axiosClient.post(`/api/v1/fridge-items/${fridgeItemId}/transfer`, data).then(unwrap),

  requestItem: (fridgeItemId, data) =>
    axiosClient.post(`/api/v1/fridge-items/${fridgeItemId}/request`, data).then(unwrap),

  acceptShareRequest: (shareRequestId, data) =>
    axiosClient.patch(`/api/v1/fridge-item-share-requests/${shareRequestId}/accept`, data).then(unwrap),

  rejectShareRequest: (shareRequestId) =>
    axiosClient.patch(`/api/v1/fridge-item-share-requests/${shareRequestId}/reject`).then(unwrap),

  searchProducts: (keyword) =>
    axiosClient.get('/api/v1/products/search', { params: { keyword } }).then(unwrap),

  getCategories: () =>
    axiosClient.get('/api/v1/categories').then(unwrap),
};
