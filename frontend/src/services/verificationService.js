import api from './api';

export const verificationService = {
  create: (analysisId, packageData) =>
    api.post(`/verification/${analysisId}`, { packageData }).then((r) => r.data.data),
};
