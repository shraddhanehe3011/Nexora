import api from './api';

export const recommendationService = {
  getByAnalysis: (analysisId) =>
    api.get(`/recommendations/${analysisId}`).then((r) => r.data.data),
};
