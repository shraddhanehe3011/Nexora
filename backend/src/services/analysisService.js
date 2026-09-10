const Analysis = require('../models/Analysis');
const Verification = require('../models/Verification');
const Product = require('../models/Product');
const productService = require('./productService');
const { analyzeIngredients } = require('./ingredientAnalyzer');
const { analyzeNutrition } = require('./nutritionAnalyzer');
const { calculateOverallScore } = require('../scoring/overallScore');
const { calculatePersonalizedScore } = require('../scoring/personalizedScore');
const { buildExplanation } = require('./explanationService');
const { getRecommendations } = require('./recommendationService');
const { toPublicProduct } = require('../integrations/openFoodFacts/normalize');
const { AppError } = require('../utils/helpers');

async function runAnalysis({ user, productId, verificationId = null }) {
  const productPayload = await productService.getById(productId);
  const productDoc = await Product.findById(productPayload.id || productId);
  if (!productDoc) {
    throw new AppError('The product could not be found', 404, 'PRODUCT_NOT_FOUND');
  }

  const product = toPublicProduct(productDoc);

  const ingredientAnalysis = analyzeIngredients(
    product.ingredientsText,
    product.ingredients,
    product.additives
  );
  const nutritionAnalysis = analyzeNutrition(product.nutrition);
  const overall = calculateOverallScore({
    product,
    nutritionAnalysis,
    ingredientAnalysis,
  });
  const personalized = calculatePersonalizedScore({
    userProfile: user.profile,
    product,
    ingredientAnalysis,
    nutritionAnalysis,
    overallScore: overall,
  });
  const explanation = buildExplanation({
    overallResult: overall,
    personalizedResult: personalized,
    nutritionAnalysis,
    ingredientAnalysis,
  });

  let recommendationSummary;
  try {
    recommendationSummary = await getRecommendations({
      product,
      userProfile: user.profile,
      analysis: { overallScore: overall.score, personalizedScore: personalized.personalizedScore },
    });
  } catch {
    recommendationSummary = {
      recommendations: [],
      explanation:
        'No suitable alternative was found in the available product database.',
    };
  }

  let verification = null;
  if (verificationId) {
    verification = await Verification.findById(verificationId);
  }

  const analysis = await Analysis.create({
    userId: user._id,
    productId: productDoc._id,
    overallScore: overall.score,
    personalizedScore: personalized.personalizedScore,
    scoreBreakdown: overall.breakdown,
    ingredientAnalysis,
    nutritionAnalysis,
    personalizedAnalysis: personalized,
    explanation,
    dataCompleteness: overall.dataCompleteness,
    confidence: overall.confidence,
    recommendationSummary,
    verificationId: verification?._id || null,
    status: overall.score == null ? 'partial' : 'completed',
  });

  return formatAnalysisResponse(analysis, product, verification);
}

async function getAnalysisForUser(analysisId, userId) {
  const analysis = await Analysis.findOne({ _id: analysisId, userId }).populate('productId');
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  let verification = null;
  if (analysis.verificationId) {
    verification = await Verification.findById(analysis.verificationId);
  }

  const product = toPublicProduct(analysis.productId);
  return formatAnalysisResponse(analysis, product, verification);
}

function formatAnalysisResponse(analysis, product, verification) {
  return {
    id: analysis._id.toString(),
    analysisId: analysis._id.toString(),
    status: analysis.status,
    createdAt: analysis.createdAt,
    product,
    ingredientAnalysis: analysis.ingredientAnalysis,
    nutritionAnalysis: analysis.nutritionAnalysis,
    verification: verification
      ? {
          id: verification._id.toString(),
          comparisons: verification.comparisons,
          overallStatus: verification.overallStatus,
          ocrConfidence: verification.ocrConfidence,
          packageData: verification.packageData,
          databaseData: verification.databaseData,
          lowConfidenceWarning:
            verification.ocrConfidence === 'low'
              ? 'Low OCR confidence — please verify this information manually.'
              : null,
        }
      : null,
    overallScore: {
      score: analysis.overallScore,
      category: scoreCategory(analysis.overallScore),
      breakdown: analysis.scoreBreakdown,
      strengths: analysis.explanation?.positiveFactors || [],
      concerns: analysis.explanation?.negativeFactors || [],
      source: 'NEXORA Analysis Engine',
    },
    personalizedScore: analysis.personalizedAnalysis,
    explanation: analysis.explanation,
    recommendationSummary: analysis.recommendationSummary,
    dataCompleteness: analysis.dataCompleteness,
    confidence: analysis.confidence,
  };
}

function scoreCategory(score) {
  if (score == null) return 'insufficient_data';
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'moderate';
  if (score >= 35) return 'poor';
  return 'very_poor';
}

module.exports = { runAnalysis, getAnalysisForUser, formatAnalysisResponse };
