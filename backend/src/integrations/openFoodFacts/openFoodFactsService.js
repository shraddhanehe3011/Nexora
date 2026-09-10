const axios = require('axios');
const config = require('../../config');
const { AppError } = require('../../utils/helpers');
const { normalizeOffProduct } = require('./normalize');

const client = axios.create({
  baseURL: config.openFoodFactsBaseUrl,
  timeout: 20000,
  headers: {
    'User-Agent': config.openFoodFactsUserAgent,
  },
});

async function searchProducts(query, { page = 1, pageSize = 20 } = {}) {
  if (!query || !String(query).trim()) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  try {
    const { data } = await client.get('/cgi/search.pl', {
      params: {
        search_terms: String(query).trim(),
        search_simple: 1,
        action: 'process',
        json: 1,
        page,
        page_size: Math.min(pageSize, 50),
        fields:
          'code,product_name,product_name_en,brands,image_front_url,image_url,nutriscore_grade,nova_group,categories,nutriments,ingredients_text',
      },
    });

    const products = (data.products || [])
      .map(normalizeOffProduct)
      .filter((p) => p && (p.productName || p.barcode));

    return {
      products,
      count: data.count || products.length,
      page: Number(page),
      pageSize: Number(pageSize),
      source: 'Open Food Facts',
    };
  } catch (err) {
    if (err.response?.status === 429) {
      throw new AppError(
        'Open Food Facts rate limit reached. Please try again shortly.',
        503,
        'OFF_RATE_LIMIT'
      );
    }
    throw new AppError(
      'Unable to search Open Food Facts right now',
      503,
      'OFF_UNAVAILABLE'
    );
  }
}

async function fetchByBarcode(barcode) {
  const code = String(barcode || '').trim();
  if (!code) {
    throw new AppError('Barcode is required', 400, 'VALIDATION_ERROR');
  }

  try {
    const { data } = await client.get(`/api/v2/product/${encodeURIComponent(code)}.json`);
    if (!data || data.status === 0 || !data.product) {
      return null;
    }
    return normalizeOffProduct(data.product);
  } catch (err) {
    if (err.response?.status === 404) return null;
    if (err.response?.status === 429) {
      throw new AppError(
        'Open Food Facts rate limit reached. Please try again shortly.',
        503,
        'OFF_RATE_LIMIT'
      );
    }
    throw new AppError(
      'Unable to fetch product from Open Food Facts',
      503,
      'OFF_UNAVAILABLE'
    );
  }
}

async function searchByCategory(category, { pageSize = 30 } = {}) {
  const terms = category || 'packaged foods';
  return searchProducts(terms, { page: 1, pageSize });
}

module.exports = {
  searchProducts,
  fetchByBarcode,
  searchByCategory,
};
