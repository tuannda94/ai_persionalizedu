/**
 * API Client for Remote API Server
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

