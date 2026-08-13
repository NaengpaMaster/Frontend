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

  async getProducts({ search, page = 0, size = 10 } = {}) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/products', {
      params: { search: search || undefined, page, size },
    }));
    return {
      content: data?.content ?? [],
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
      totalProductCount: data?.totalProductCount ?? 0,
      activeProductCount: data?.activeProductCount ?? 0,
    };
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

  async getCommunityShareSummary() {
    return unwrap(await axiosClient.get('/api/v1/admin/community-shares/summary'));
  },

  async getCommunitySharePosts({ status, page = 0, size = 10 } = {}) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/community-shares', {
      params: { status: status === 'ALL' ? undefined : status, page, size },
    }));
    return {
      content: data?.content ?? [],
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
    };
  },

  async cancelCommunitySharePost(communitySharePostId) {
    return unwrap(await axiosClient.patch(`/api/v1/admin/community-shares/${communitySharePostId}/cancel`));
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

  async getLlmUsageLogs({ featureType, page = 0, size = 10 } = {}) {
    const data = unwrap(await axiosClient.get('/api/v1/admin/ai/usage-logs', {
      params: { featureType: featureType === 'ALL' ? undefined : featureType, page, size },
    }));
    return {
      content: data?.content ?? [],
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
      successCount: data?.successCount ?? 0,
      failedCount: data?.failedCount ?? 0,
      totalTokens: data?.totalTokens ?? 0,
      totalEstimatedCost: data?.totalEstimatedCost ?? 0,
    };
  },

  async sendWeeklyFridgeReports({ force = false } = {}) {
    return unwrap(await axiosClient.post('/api/v1/admin/weekly-fridge-reports/send', null, {
      params: { force },
    }));
  },
};
