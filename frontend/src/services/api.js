import axios from 'axios';

/**
 * Vite requires VITE_API_URL at build time.
 * Always normalize so it ends with /api (e.g. https://nexora-api.onrender.com/api)
 */
function resolveApiBaseUrl() {
  let base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    if (status === 401 && code !== 'INVALID_CREDENTIALS') {
      localStorage.removeItem('nexora_token');
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.error?.message;
  if (message) return message;
  if (error?.code === 'ERR_NETWORK') {
    return 'Unable to reach the NEXORA server. Check your connection and that the API is running.';
  }
  if (error?.response?.status === 404) {
    return 'API route not found. Check that VITE_API_URL points to your backend with /api (e.g. https://your-api.onrender.com/api).';
  }
  return fallback;
}

export default api;
