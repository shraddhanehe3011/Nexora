const fs = require('fs');
const productService = require('../services/productService');
const { success } = require('../utils/helpers');
const { computeDataCompleteness } = require('../scoring/overallScore');

async function search(req, res) {
  const q = req.query.q || req.query.query;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const data = await productService.search(q, { page, pageSize });
  return success(res, data);
}

async function barcode(req, res) {
  const product = await productService.getByBarcode(req.params.barcode);
  return success(res, {
    product: {
      ...product,
      dataCompleteness: computeDataCompleteness(product),
    },
  });
}

async function getProduct(req, res) {
  const product = await productService.getById(req.params.id);
  return success(res, { product });
}

async function analyzeImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'Please upload a product image' },
    });
  }

  const { processImage } = require('../integrations/ocr/ocrService');
  const { verifyPackageAgainstDatabase } = require('../services/verificationService');
  const Verification = require('../models/Verification');
  const analysisService = require('../services/analysisService');
  const { AppError } = require('../utils/helpers');

  let ocrResult;
  try {
    ocrResult = await processImage(req.file.path);
  } catch (err) {
    throw new AppError(
      'Unable to process the uploaded image. Please try a clearer photo.',
      500,
      'OCR_FAILED',
      process.env.NODE_ENV === 'production' ? null : { reason: err.message }
    );
  }

  let product = null;
  let matchStatus = 'no_match';

  if (ocrResult.detectedBarcode) {
    try {
      product = await productService.getByBarcode(ocrResult.detectedBarcode);
      matchStatus = 'matched_by_barcode';
    } catch {
      matchStatus = 'barcode_not_found';
    }
  }

  if (!product && ocrResult.productName) {
    try {
      const search = await productService.search(ocrResult.productName, { pageSize: 5 });
      product = search.products?.[0] || null;
      if (product) matchStatus = 'matched_by_text';
    } catch {
      // ignore
    }
  }

  let verificationDoc = null;
  let verificationPayload = null;
  if (product) {
    verificationPayload = verifyPackageAgainstDatabase(ocrResult, product);
    const productObjectId = product.id || product._id;
    verificationDoc = await Verification.create({
      userId: req.user._id,
      productId: productObjectId,
      packageData: ocrResult,
      databaseData: verificationPayload.databaseData,
      comparisons: verificationPayload.comparisons,
      ocrConfidence: ocrResult.confidence,
      overallStatus: verificationPayload.overallStatus,
    });
  }

  let analysis = null;
  if (product) {
    analysis = await analysisService.runAnalysis({
      user: req.user,
      productId: product.id || product._id,
      verificationId: verificationDoc?._id,
    });
    if (verificationDoc) {
      verificationDoc.analysisId = analysis.id;
      await verificationDoc.save();
    }
  }

  return success(res, {
    ocr: ocrResult,
    matchStatus,
    product,
    verification: verificationDoc
      ? {
          id: verificationDoc._id.toString(),
          ...verificationPayload,
        }
      : null,
    analysis,
    processing: {
      status: 'completed',
      message:
        matchStatus === 'no_match'
          ? 'OCR completed but no Open Food Facts match was found'
          : 'OCR and Open Food Facts matching completed',
    },
  });
}

module.exports = { search, barcode, getProduct, analyzeImage };
