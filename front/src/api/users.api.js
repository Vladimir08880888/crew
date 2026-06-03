import { api } from './client.js';

export const usersApi = {
  updateProfile: (data) => api.patch('/users/me', data),
};
