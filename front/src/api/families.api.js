import { api } from './client.js';

export const familiesApi = {
  list:           ()                       => api.get('/families'),
  create:         (data)                   => api.post('/families', data),
  detail:         (id)                     => api.get(`/families/${id}`),
  rename:         (id, name)               => api.patch(`/families/${id}`, { name }),
  leave:          (id)                     => api.post(`/families/${id}/leave`),
  join:           (invite_code)            => api.post('/families/join', { invite_code }),
  approve:        (id, userId, role)       => api.post(`/families/${id}/approve/${userId}`, { role }),
  updateMember:   (id, userId, fields)     => api.patch(`/families/${id}/members/${userId}`, fields),
  removeMember:   (id, userId)             => api.delete(`/families/${id}/members/${userId}`),
  resetMemberPassword: (id, userId)        => api.post(`/families/${id}/members/${userId}/reset-password`),
  regenerateCode: (id)                     => api.post(`/families/${id}/regenerate-code`),
  remove:         (id)                     => api.delete(`/families/${id}`),
  getSettings:    (id)                     => api.get(`/families/${id}/settings`),
  updateSettings: (id, fields)             => api.put(`/families/${id}/settings`, fields),
};
