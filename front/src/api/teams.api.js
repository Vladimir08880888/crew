import { api } from './client.js';

export const teamsApi = {
  list:           ()                       => api.get('/teams'),
  create:         (data)                   => api.post('/teams', data),
  detail:         (id)                     => api.get(`/teams/${id}`),
  rename:         (id, name)               => api.patch(`/teams/${id}`, { name }),
  leave:          (id)                     => api.post(`/teams/${id}/leave`),
  join:           (invite_code)            => api.post('/teams/join', { invite_code }),
  approve:        (id, userId, role)       => api.post(`/teams/${id}/approve/${userId}`, { role }),
  updateMember:   (id, userId, fields)     => api.patch(`/teams/${id}/members/${userId}`, fields),
  removeMember:   (id, userId)             => api.delete(`/teams/${id}/members/${userId}`),
  resetMemberPassword: (id, userId)        => api.post(`/teams/${id}/members/${userId}/reset-password`),
  regenerateCode: (id)                     => api.post(`/teams/${id}/regenerate-code`),
  remove:         (id)                     => api.delete(`/teams/${id}`),
  getSettings:    (id)                     => api.get(`/teams/${id}/settings`),
  updateSettings: (id, fields)             => api.put(`/teams/${id}/settings`, fields),
};
