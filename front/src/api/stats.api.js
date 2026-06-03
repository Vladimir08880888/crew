import { api } from './client.js';

export const statsApi = {
  dashboard:           () => api.get('/stats/dashboard'),
  charts: (family_id) => api.get(`/stats/charts?family_id=${family_id}`),
};
