import api from './api';

export const historyService = {
  list: (params = {}) => api.get('/history', { params }).then((r) => r.data.data),
};
