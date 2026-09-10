import api from './api';

export const userService = {
  getProfile: () => api.get('/users/profile').then((r) => r.data.data),
  updateProfile: (payload) => api.put('/users/profile', payload).then((r) => r.data.data),
};
