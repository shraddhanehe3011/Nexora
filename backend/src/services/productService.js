const Product = require('../models/Product');
const config = require('../config');
const {
  searchProducts,
  fetchByBarcode,
} = require('../integrations/openFoodFacts/openFoodFactsService');
const { toPublicProduct } = require('../integrations/openFoodFacts/normalize');
const { AppError } = require('../utils/helpers');
const { computeDataCompleteness } = require('../scoring/overallScore');

function isStale(product) {
  if (!product?.lastFetchedAt) return true;
  const ageMs = Date.now() - new Date(product.lastFetchedAt).getTime();
  return ageMs > config.productCacheTtlHours * 60 * 60 * 1000;
}

async function upsertNormalizedProduct(normalized) {
  if (!normalized) return null;

  const filter = normalized.sourceProductId
    ? { source: 'openfoodfacts', sourceProductId: normalized.sourceProductId }
    : normalized.barcode
      ? { barcode: normalized.barcode }
      : null;

  if (!filter) {
    return Product.create(normalized);
  }

  return Product.findOneAndUpdate(
    filter,
    { $set: { ...normalized, lastFetchedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function search(query, options) {
  const result = await searchProducts(query, options);
  // Cache a sample of results opportunistically
  const saved = [];
  for (const p of result.products.slice(0, 10)) {
    try {
      const doc = await upsertNormalizedProduct(p);
      saved.push(toPublicProduct(doc));
    } catch {
      saved.push({ ...p, id: p.sourceProductId || p.barcode });
    }
  }

  return {
    ...result,
    products: saved.length ? saved : result.products,
  };
}

async function getByBarcode(barcode) {
  const cached = await Product.findOne({ barcode: String(barcode) });
  if (cached && !isStale(cached)) {
    return toPublicProduct(cached);
  }

  const normalized = await fetchByBarcode(barcode);
  if (!normalized) {
    throw new AppError(
      'The product could not be found in Open Food Facts',
      404,
      'PRODUCT_NOT_FOUND'
    );
  }

  const doc = await upsertNormalizedProduct(normalized);
  return toPublicProduct(doc);
}

async function getById(id) {
  let product = null;

  if (/^[a-f\d]{24}$/i.test(id)) {
    product = await Product.findById(id);
  }

  if (!product) {
    product = await Product.findOne({
      $or: [{ sourceProductId: id }, { barcode: id }],
    });
  }

  if (product && isStale(product) && product.barcode) {
    try {
      const fresh = await fetchByBarcode(product.barcode);
      if (fresh) product = await upsertNormalizedProduct(fresh);
    } catch {
      // keep cached
    }
  }

  if (!product && /^\d{8,14}$/.test(id)) {
    return getByBarcode(id);
  }

  if (!product) {
    throw new AppError('The product could not be found', 404, 'PRODUCT_NOT_FOUND');
  }

  const publicProduct = toPublicProduct(product);
  return {
    ...publicProduct,
    dataCompleteness: computeDataCompleteness(publicProduct),
  };
}

function unavailable(value) {
  return value == null || value === '' ? 'Not available in Open Food Facts' : value;
}

module.exports = {
  search,
  getByBarcode,
  getById,
  upsertNormalizedProduct,
  unavailable,
  isStale,
};
