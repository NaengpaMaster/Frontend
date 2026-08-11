import axiosClient from './axiosClient';
import { toFrontendUser } from './authApi';

function unwrap(response) {
  return response.data?.data;
}

export const adminApi = {
  async getHome() {
    return unwrap(await axiosClient.get('/api/v1/admin/home'));
  },

  async getMembers({ role, status, search, page = 0, size = 10 }) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/members', {
      params: {
        role,
        status,
        search: search || undefined,
        page,
        size,
      },
    }));
    return {
      content: (data?.content ?? []).map(toFrontendUser),
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
    };
  },

  async getMemberDetail(memberId) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/members/' + memberId, { preserveSessionOnUnauthorized: true }));
    const member = toFrontendUser(data);
    return {
      ...member,
      naengpaScore: data?.naengpaScore ?? data?.score ?? data?.totalScore ?? null,
    };
  },

  async updateMemberStatus(memberId, status) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/status`, { status });
  },

  async updateMemberRole(memberId, role) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/role`, { role });
  },

  async getMemberStatusHistories({ startDate, endDate, page = 0, size = 10 }) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/member-status-histories', {
      params: { startDate, endDate, page, size },
      preserveSessionOnUnauthorized: true,
    }));
    return {
      content: data?.content ?? [],
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
    };
  },

  async getProducts() {
    return unwrap(await axiosClient.get('/api/v1/admin/products')) || [];
  },

  async createProduct(data) {
    return unwrap(await axiosClient.post('/api/v1/admin/products', data));
  },

  async updateProduct(productId, data) {
    return unwrap(await axiosClient.patch(`/api/v1/admin/products/${productId}`, data));
  },

  async setProductActive(productId, active) {
    return unwrap(await axiosClient.patch(`/api/v1/admin/products/${productId}/${active ? 'activate' : 'deactivate'}`));
  },


  async getFridges() {
    return unwrap(await axiosClient.get('/api/v1/admin/fridges')) || [];
  },

  async getFridge(fridgeId) {
    return unwrap(await axiosClient.get(`/api/v1/admin/fridges/${fridgeId}`));
  },


  async cancelFridgeInvite(fridgeId, inviteId) {
    await axiosClient.delete(`/api/v1/admin/fridges/${fridgeId}/invites/${inviteId}`);
  },

  async removeFridgeMember(fridgeId, memberId) {
    await axiosClient.delete(`/api/v1/admin/fridges/${fridgeId}/members/${memberId}`);
  },

  async getLlmUsageLogs() {
    return unwrap(await axiosClient.get('/api/v1/admin/ai/usage-logs')) || [];
  },
};
