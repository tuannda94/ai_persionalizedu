/**
 * Feedback API Client
 */
import api from './api';

export const feedbackAPI = {
  list: (params) => api.get('/api/v1/feedback', { params }),
  get: (id) => api.get(`/api/v1/feedback/${id}`),
  create: (data) => api.post('/api/v1/feedback', data),
  update: (id, data) => api.put(`/api/v1/feedback/${id}`, data),
  stats: (days = 7) => api.get('/api/v1/feedback/stats/summary', { params: { days } })
};

