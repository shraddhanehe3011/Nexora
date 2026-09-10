const mongoose = require('mongoose');

const fieldComparisonSchema = new mongoose.Schema(
  {
    field: String,
    packageValue: mongoose.Schema.Types.Mixed,
    databaseValue: mongoose.Schema.Types.Mixed,
    unit: { type: String, default: null },
    status: {
      type: String,
      enum: ['match', 'partial_match', 'mismatch', 'missing', 'unable_to_verify'],
      default: 'unable_to_verify',
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low', 'unknown'],
      default: 'unknown',
    },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      default: null,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    packageData: { type: mongoose.Schema.Types.Mixed, default: null },
    databaseData: { type: mongoose.Schema.Types.Mixed, default: null },
    comparisons: [fieldComparisonSchema],
    ocrConfidence: { type: String, default: 'unknown' },
    overallStatus: { type: String, default: 'unable_to_verify' },
    source: { type: String, default: 'User uploaded package image' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Verification', verificationSchema);
