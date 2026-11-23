import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
let baseURL = rawApiUrl;

if (baseURL) {
  if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
    baseURL = `https://${baseURL}`;
  }
  // If Render or config passed a bare service name like 'ofos-backend' without domain extension
  try {
    const parsed = new URL(baseURL);
    if (!parsed.hostname.includes('.')) {
      baseURL = `https://${parsed.hostname}.onrender.com`;
    }
  } catch {
    if (!baseURL.includes('.')) {
      baseURL = `${baseURL}.onrender.com`;
    }
  }
} else if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
  baseURL = 'https://ofos-backend.onrender.com';
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token from localStorage if present (for cross-domain deployments)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ofos_access_token');
    if (token) {
      const headers = config.headers as any;
      if (headers && typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (headers) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Graceful handling of session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on a protected route and token was in storage, clear stale token
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (isAuthCheck) {
        localStorage.removeItem('ofos_access_token');
      }
    }
    return Promise.reject(error);
  },
);
