import axiosClient, { clearAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken } from './axiosClient';

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

const toBackendHouseholdType = (householdType) => (
  HOUSEHOLD_VALUES[householdType] || householdType || undefined
);

const toAvoidIngredient = (item) => {
  if (typeof item === 'string') {
    return { productId: null, name: item, productCategoryId: null };
  }

  return {
    productId: item.productId,
    name: item.name,
    productCategoryId: item.productCategoryId ?? null,
  };
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
    preferences: {
      favoriteFoods: member.favoriteFoods || [],
      allergies: [],
      avoidIngredients: (member.avoidIngredients || []).map(toAvoidIngredient),
    },
    joinDate: member.createdAt ? member.createdAt.split('T')[0] : '',
    status: member.status === 'INACTIVE' || member.deletedAt ? 'inactive' : 'active',
  };
}

export const authApi = {
  hasStoredRefreshToken() {
    return Boolean(getRefreshToken());
  },

  async login(email, password) {
    const tokenResponse = unwrap(await axiosClient.post('/api/v1/auth/login', { email, password }));
    saveAccessToken(tokenResponse.accessToken);
    saveRefreshToken(tokenResponse.refreshToken);
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
    const refreshToken = getRefreshToken();
    const tokenResponse = unwrap(await axiosClient.post(
      '/api/v1/auth/refresh',
      refreshToken ? { refreshToken } : undefined
    ));
    saveAccessToken(tokenResponse.accessToken);
    saveRefreshToken(tokenResponse.refreshToken);
    return tokenResponse;
  },

  async register({ email, password, passwordConfirm, nickname, householdType }) {
    const member = unwrap(await axiosClient.post('/api/v1/members', {
      email,
      password,
      passwordConfirm,
      nickname: nickname || undefined,
      householdType: toBackendHouseholdType(householdType),
    }));
    return toFrontendUser(member);
  },

  async checkEmail(email) {
    return unwrap(await axiosClient.get('/api/v1/members/check-email', { params: { email } }));
  },

  async sendEmailVerification(email) {
    return unwrap(await axiosClient.post(
      '/api/v1/auth/email-verifications',
      { email },
      { skipUnauthorizedRedirect: true }
    ));
  },

  async confirmEmailVerification(email, code) {
    return unwrap(await axiosClient.post(
      '/api/v1/auth/email-verifications/confirm',
      { email, code },
      { skipUnauthorizedRedirect: true }
    ));
  },

  async getMe() {
    const member = unwrap(await axiosClient.get('/api/v1/members/me'));
    return toFrontendUser(member);
  },

  async getProfile() {
    const member = unwrap(await axiosClient.get('/api/v1/members/me/profile'));
    return toFrontendUser(member);
  },

  async updateProfile({ name, nickname, householdType, preferences }) {
    const member = unwrap(await axiosClient.patch('/api/v1/members/me/profile', {
      nickname: name || nickname,
      householdType: toBackendHouseholdType(householdType),
      favoriteFoods: preferences?.favoriteFoods || [],
      avoidProductIds: (preferences?.avoidIngredients || [])
        .map((item) => item.productId)
        .filter(Boolean),
    }, { skipUnauthorizedRedirect: true }));
    return toFrontendUser(member);
  },
};
