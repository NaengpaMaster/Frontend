import axiosClient, { clearAccessToken, saveAccessToken } from './axiosClient';

const HOUSEHOLD_LABELS = {
  ONE_PERSON: '1인',
  TWO_PERSON: '2인',
  THREE_OR_MORE: '3인 이상',
  ETC: '기타',
};

const HOUSEHOLD_VALUES = {
  '1인': 'ONE_PERSON',
  '2인': 'TWO_PERSON',
  '3인 이상': 'THREE_OR_MORE',
  '기타': 'ETC',
};

function unwrap(response) {
  return response.data?.data;
}

export function toFrontendUser(member) {
  if (!member) {
    return null;
  }

  return {
    id: String(member.memberId),
    memberId: member.memberId,
    name: member.nickname,
    nickname: member.nickname,
    email: member.email,
    password: '',
    role: member.role === 'ADMIN' ? 'admin' : 'user',
    householdType: HOUSEHOLD_LABELS[member.householdType] || '기타',
    preferences: { favoriteFoods: [], allergies: [], avoidIngredients: [] },
    joinDate: member.createdAt ? member.createdAt.split('T')[0] : '',
    status: member.status === 'INACTIVE' || member.deletedAt ? 'inactive' : 'active',
  };
}

export const authApi = {
  async login(email, password) {
    const tokenResponse = unwrap(await axiosClient.post('/api/v1/auth/login', { email, password }));
    saveAccessToken(tokenResponse.accessToken);
    return tokenResponse;
  },

  async logout() {
    try {
      await axiosClient.post('/api/v1/auth/logout');
    } finally {
      clearAccessToken();
    }
  },

  async refresh() {
    const tokenResponse = unwrap(await axiosClient.post('/api/v1/auth/refresh'));
    saveAccessToken(tokenResponse.accessToken);
    return tokenResponse;
  },

  async register({ email, password, passwordConfirm, nickname, householdType }) {
    const member = unwrap(await axiosClient.post('/api/v1/members', {
      email,
      password,
      passwordConfirm,
      nickname: nickname || undefined,
      householdType: HOUSEHOLD_VALUES[householdType] || householdType || 'ETC',
    }));
    return toFrontendUser(member);
  },

  async checkEmail(email) {
    return unwrap(await axiosClient.get('/api/v1/members/check-email', { params: { email } }));
  },

  async getMe() {
    const member = unwrap(await axiosClient.get('/api/v1/members/me'));
    return toFrontendUser(member);
  },
};
