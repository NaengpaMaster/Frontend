import axiosClient from './axiosClient';
import { toFrontendUser } from './authApi';

function unwrap(response) {
  return response.data?.data;
}

function unwrapPage(response) {
  return unwrap(response)?.content || [];
}

export const adminApi = {
  async getMembers({ role, status, search }) {
    const members = unwrapPage(await axiosClient.get('/api/v1/admin/members', {
      params: {
        role,
        status,
        search: search || undefined,
        size: 100,
      },
    }));
    return members.map(toFrontendUser);
  },

  async getMemberOverview(search) {
    const [activeUsers, inactiveUsers, admins] = await Promise.all([
      this.getMembers({ role: 'USER', status: 'ACTIVE', search }),
      this.getMembers({ role: 'USER', status: 'INACTIVE', search }),
      this.getMembers({ role: 'ADMIN', status: 'ACTIVE', search }),
    ]);

    return [...activeUsers, ...inactiveUsers, ...admins];
  },

  async updateMemberStatus(memberId, status) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/status`, { status });
  },

  async updateMemberRole(memberId, role) {
    await axiosClient.patch(`/api/v1/admin/members/${memberId}/role`, { role });
  },
};
