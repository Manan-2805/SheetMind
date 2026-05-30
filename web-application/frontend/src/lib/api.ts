import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/auth/callback') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 503 && error.response?.data?.error?.code === 'MAINTENANCE') {
      window.location.href = '/maintenance';
    }

    return Promise.reject(error);
  }
);

export default api;
