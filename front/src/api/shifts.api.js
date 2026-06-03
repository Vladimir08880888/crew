import { api } from './client.js';

export const shiftsApi = {
  list:     (params = {}) => api.get(`/shifts?${new URLSearchParams(params)}`),
  upcoming: (limit = 10)  => api.get(`/shifts/upcoming?limit=${limit}`),
  get:      (id)           => api.get(`/shifts/${id}`),
  create:   (data)         => api.post('/shifts', data),
  update:   (id, data)     => api.put(`/shifts/${id}`, data),
  remove:   (id)           => api.delete(`/shifts/${id}`),

  // Smart planning (Gold)
  summary: (params)        => api.get(`/shifts/summary?${new URLSearchParams(params)}`),
  generatePlan: (data)     => api.post('/shifts/generate-plan', data),
  applyPlan:   (data)      => api.post('/shifts/apply-plan', data),
  cloneWeek:   (data)      => api.post('/shifts/clone-week', data),
  clearWeek:   (params)    => api.delete(`/shifts/clear-week?${new URLSearchParams(params)}`),
};
