import axiosClient from './axiosClient';
import { toFrontendUser } from './authApi';

function unwrap(response) {
  return response.data?.data;
}

export const adminApi = {
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

  async updateMemberStatus(memberId, status) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/status`, { status });
  },

  async updateMemberRole(memberId, role) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/role`, { role });
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
};
