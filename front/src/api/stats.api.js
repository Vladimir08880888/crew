import { api } from './client.js';

export const statsApi = {
  dashboard:           () => api.get('/stats/dashboard'),
  charts: (team_id) => api.get(`/stats/charts?team_id=${team_id}`),
};
