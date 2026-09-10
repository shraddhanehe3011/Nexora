import api from './api';

export const chatService = {
  ask: ({ analysisId, productId, question }) =>
    api.post('/ask-nexora', { analysisId, productId, question }).then((r) => r.data.data),
  history: (analysisId) =>
    api.get(`/ask-nexora/history/${analysisId}`).then((r) => r.data.data),
};
