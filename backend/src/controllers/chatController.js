const ChatSession = require('../models/ChatSession');
const Analysis = require('../models/Analysis');
const { askLlm } = require('../integrations/llm/askNexoraService');
const { success, AppError } = require('../utils/helpers');
const { toPublicProduct } = require('../integrations/openFoodFacts/normalize');
const Verification = require('../models/Verification');

async function ask(req, res) {
  const { analysisId, question } = req.body;

  const analysis = await Analysis.findOne({
    _id: analysisId,
    userId: req.user._id,
  }).populate('productId');

  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  let verification = null;
  if (analysis.verificationId) {
    verification = await Verification.findById(analysis.verificationId);
  }

  const context = {
    product: toPublicProduct(analysis.productId),
    overallScore: {
      score: analysis.overallScore,
      breakdown: analysis.scoreBreakdown,
      concerns: analysis.explanation?.negativeFactors,
      strengths: analysis.explanation?.positiveFactors,
    },
    personalizedScore: analysis.personalizedAnalysis,
    explanation: analysis.explanation,
    ingredientAnalysis: analysis.ingredientAnalysis,
    nutritionAnalysis: analysis.nutritionAnalysis,
    verification,
    recommendations: analysis.recommendationSummary,
    userProfile: req.user.profile,
  };

  let session = await ChatSession.findOne({
    userId: req.user._id,
    analysisId: analysis._id,
  });

  if (!session) {
    session = await ChatSession.create({
      userId: req.user._id,
      analysisId: analysis._id,
      messages: [],
    });
  }

  const history = session.messages.map((m) => ({ role: m.role, content: m.content }));
  const result = await askLlm({ question, context, history });

  session.messages.push({ role: 'user', content: question });
  session.messages.push({ role: 'assistant', content: result.answer });
  await session.save();

  return success(res, {
    answer: result.answer,
    source: result.source,
    provider: result.provider,
    messages: session.messages,
  });
}

async function history(req, res) {
  const session = await ChatSession.findOne({
    userId: req.user._id,
    analysisId: req.params.analysisId,
  });

  return success(res, {
    messages: session?.messages || [],
    analysisId: req.params.analysisId,
  });
}

module.exports = { ask, history };
