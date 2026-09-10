const analysisService = require('../services/analysisService');
const { getRecommendations } = require('../services/recommendationService');
const Analysis = require('../models/Analysis');
const Verification = require('../models/Verification');
const { verifyPackageAgainstDatabase } = require('../services/verificationService');
const { success, AppError } = require('../utils/helpers');
const productService = require('../services/productService');

async function analyzeProduct(req, res) {
  const data = await analysisService.runAnalysis({
    user: req.user,
    productId: req.params.productId,
  });
  return success(res, data, 201);
}

async function getAnalysis(req, res) {
  const data = await analysisService.getAnalysisForUser(req.params.analysisId, req.user._id);
  return success(res, data);
}

async function getRecommendationsForAnalysis(req, res) {
  const analysis = await Analysis.findOne({
    _id: req.params.analysisId,
    userId: req.user._id,
  }).populate('productId');

  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  if (analysis.recommendationSummary?.recommendations?.length) {
    return success(res, analysis.recommendationSummary);
  }

  const product = await productService.getById(analysis.productId._id.toString());
  const recommendations = await getRecommendations({
    product,
    userProfile: req.user.profile,
    analysis: {
      overallScore: analysis.overallScore,
      personalizedScore: analysis.personalizedScore,
    },
  });

  analysis.recommendationSummary = recommendations;
  await analysis.save();

  return success(res, recommendations);
}

async function createVerification(req, res) {
  const analysis = await Analysis.findOne({
    _id: req.params.analysisId,
    userId: req.user._id,
  }).populate('productId');

  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  const packageData = req.body.packageData || req.body;
  const product = analysis.productId;
  const payload = verifyPackageAgainstDatabase(packageData, product);

  const verification = await Verification.create({
    userId: req.user._id,
    analysisId: analysis._id,
    productId: product._id,
    packageData,
    databaseData: payload.databaseData,
    comparisons: payload.comparisons,
    ocrConfidence: packageData.confidence || 'unknown',
    overallStatus: payload.overallStatus,
  });

  analysis.verificationId = verification._id;
  await analysis.save();

  return success(res, { verification: { id: verification._id.toString(), ...payload } }, 201);
}

module.exports = {
  analyzeProduct,
  getAnalysis,
  getRecommendationsForAnalysis,
  createVerification,
};
