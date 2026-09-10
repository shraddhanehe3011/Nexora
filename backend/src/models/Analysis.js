const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    overallScore: { type: Number, default: null },
    personalizedScore: { type: Number, default: null },
    scoreBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    ingredientAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    nutritionAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    personalizedAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: mongoose.Schema.Types.Mixed, default: null },
    dataCompleteness: { type: mongoose.Schema.Types.Mixed, default: null },
    confidence: { type: mongoose.Schema.Types.Mixed, default: null },
    recommendationSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Verification',
      default: null,
    },
    status: {
      type: String,
      enum: ['completed', 'partial', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
