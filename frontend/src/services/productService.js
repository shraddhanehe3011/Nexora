import api from './api';

export const productService = {
  search: (q, params = {}) =>
    api.get('/products/search', { params: { q, ...params } }).then((r) => r.data.data),
  barcode: (barcode) =>
    api.get(`/products/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data.data),
  getById: (id) => api.get(`/products/${encodeURIComponent(id)}`).then((r) => r.data.data),
  analyzeImage: (file, onUploadProgress) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/products/analyze-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
        timeout: 120000,
      })
      .then((r) => r.data.data);
  },
};
