import api from './api';

export const analysisService = {
  analyzeProduct: (productId) =>
    api.post(`/analysis/product/${productId}`).then((r) => r.data.data),
  getById: (analysisId) => api.get(`/analysis/${analysisId}`).then((r) => r.data.data),
};
