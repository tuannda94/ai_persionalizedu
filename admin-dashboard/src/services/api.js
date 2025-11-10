/**
 * API Client for Remote API Server
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors - auto refresh token or redirect to login
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Try to refresh token
          const response = await api.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Update original request header
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Process queued requests
          processQueue(null, access_token);
          isRefreshing = false;

          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout and redirect
          processQueue(refreshError, null);
          isRefreshing = false;

          // Clear auth data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          // Redirect to login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - logout immediately
        isRefreshing = false;

        // Clear auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    }

    // For other errors, show user-friendly message
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.message;

      // Log error with context
      console.error(`API Error [${status}]:`, {
        url: originalRequest?.url,
        method: originalRequest?.method,
        detail: detail,
        fullError: error
      });
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
  refresh: (refreshToken) => api.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
  me: () => api.get('/api/v1/auth/me')
};

// Users API
export const usersAPI = {
  list: () => api.get('/api/v1/users'),
  get: (id) => api.get(`/api/v1/users/${id}`),
  create: (data) => api.post('/api/v1/users', data),
  update: (id, data) => api.put(`/api/v1/users/${id}`, data),
  delete: (id) => api.delete(`/api/v1/users/${id}`)
};

// Versions API
export const versionsAPI = {
  list: (platform) => api.get('/api/v1/updates/versions', { params: { platform } }),
  check: (data) => api.post('/api/v1/updates/check', data),
  create: (data) => api.post('/api/v1/updates/admin/versions', data),
  update: (id, data) => api.put(`/api/v1/updates/admin/versions/${id}`, data),
  upload: (formData, onUploadProgress) => {
    return api.post('/api/v1/updates/admin/versions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      }
    });
  }
};

// Telemetry API
export const telemetryAPI = {
  stats: (days = 7) => api.get('/api/v1/telemetry/stats', { params: { days } })
};

// Feedback API
export const feedbackAPI = {
  list: (params) => api.get('/api/v1/feedback', { params }),
  get: (id) => api.get(`/api/v1/feedback/${id}`),
  create: (data) => api.post('/api/v1/feedback', data),
  update: (id, data) => api.put(`/api/v1/feedback/${id}`, data),
  stats: (days = 7) => api.get('/api/v1/feedback/stats/summary', { params: { days } })
};

// Packages API
export const packagesAPI = {
  list: (subject, isActive) => api.get('/api/v1/packages/list', {
    params: { subject, is_active: isActive }
  }),
  get: (id) => api.get(`/api/v1/packages/${id}`),
  check: (data) => api.post('/api/v1/packages/check', data),
  upload: (formData, onUploadProgress) => {
    return api.post('/api/v1/packages/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      }
    });
  },
  update: (id, data) => api.put(`/api/v1/packages/admin/${id}`, data),
  delete: (id) => api.delete(`/api/v1/packages/admin/${id}`)
};

export default api;

