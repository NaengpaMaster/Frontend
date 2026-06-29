import axios from 'axios';

const ACCESS_TOKEN_KEY = 'naengpa.accessToken';
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
  (error) => {
    if (error.response?.status === 401) {
      clearAccessToken();
    }

    if (error.response?.status === 403 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('naengpa:forbidden'));
    }

    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export function saveAccessToken(accessToken) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearAccessToken() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function isPublicEndpoint(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = normalizeUrl(config.url || '');

  return PUBLIC_ENDPOINTS.some((endpoint) =>
    endpoint.method === method && endpoint.url === url
  );
}

function normalizeUrl(url) {
  const path = url.split('?')[0];

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return new URL(path).pathname;
  }

  return path;
}

export default axiosClient;
