import axios from 'axios';

const ACCESS_TOKEN_KEY = 'naengpa.accessToken';
const REFRESH_TOKEN_KEY = 'naengpa.refreshToken';
const SESSION_EXPIRED_MESSAGE = '로그인 세션이 만료되었습니다. 다시 로그인 후 저장해주세요.';
const PUBLIC_ENDPOINTS = [
  { method: 'post', url: '/api/v1/auth/login' },
  { method: 'post', url: '/api/v1/auth/refresh' },
  { method: 'post', url: '/api/v1/members' },
  { method: 'get', url: '/api/v1/members/check-email' },
];

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

axiosClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  if (isPublicEndpoint(config)) {
    delete config.headers.Authorization;
    return config;
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    let fallbackMessage = '';

    if (error.response?.status === 401) {
      if (canRetryWithRefresh(originalRequest)) {
        try {
          const accessToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest._retry = true;
          return axiosClient(originalRequest);
        } catch {
          clearAccessToken();
        }
      }

      clearAccessToken();
      if (!originalRequest?.skipUnauthorizedRedirect) {
        dispatchAuthEvent('naengpa:unauthorized');
      } else {
        fallbackMessage = SESSION_EXPIRED_MESSAGE;
      }
    }

    if (error.response?.status === 403 && typeof window !== 'undefined') {
      dispatchAuthEvent('naengpa:forbidden');
    }

    const message = fallbackMessage || error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export function saveAccessToken(accessToken) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function saveRefreshToken(refreshToken) {
  if (typeof window === 'undefined' || !refreshToken) {
    return;
  }
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAccessToken() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function dispatchAuthEvent(name) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(name));
}

function isPublicEndpoint(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = normalizeUrl(config.url || '');

  return PUBLIC_ENDPOINTS.some((endpoint) =>
    endpoint.method === method && endpoint.url === url
  );
}

function canRetryWithRefresh(config) {
  return typeof window !== 'undefined'
    && config
    && !config._retry
    && !isPublicEndpoint(config);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    refreshPromise = axiosClient.post(
      '/api/v1/auth/refresh',
      refreshToken ? { refreshToken } : undefined
    )
      .then((response) => {
        const accessToken = response.data?.data?.accessToken;
        if (!accessToken) {
          throw new Error('accessToken이 없습니다.');
        }
        saveAccessToken(accessToken);
        saveRefreshToken(response.data?.data?.refreshToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function normalizeUrl(url) {
  const path = url.split('?')[0];

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return new URL(path).pathname;
  }

  return path;
}

export default axiosClient;
