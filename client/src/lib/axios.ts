import axios from 'axios';

const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = browserHost === 'localhost' || browserHost === '127.0.0.1';
const tokenStorageKey = 'homiebites_token';

// In deployed environments, always use same-origin API to keep cookie auth reliable.
const resolvedBaseUrl = !isLocalHost ? '/api' : (envBaseUrl || '/api');

const api = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && config.headers) {
    const token = window.localStorage.getItem(tokenStorageKey);
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    delete (config.headers as any)['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = String(err.config?.url || '');
    const isAuthEndpoint = /\/auth\/(login|signup|provider-signup|forgot-password|reset-password)/.test(requestUrl);

    if (status === 401 && !isAuthEndpoint) {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
export { tokenStorageKey };
