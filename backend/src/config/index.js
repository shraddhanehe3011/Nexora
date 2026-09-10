const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'nexora-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173'
  ),
  openFoodFactsBaseUrl:
    process.env.OPEN_FOOD_FACTS_BASE_URL || 'https://world.openfoodfacts.org',
  openFoodFactsUserAgent:
    process.env.OPEN_FOOD_FACTS_USER_AGENT ||
    'NEXORA/1.0 (food-intelligence platform)',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  ocrProvider: process.env.OCR_PROVIDER || 'tesseract',
  ocrApiKey: process.env.OCR_API_KEY || '',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,
  productCacheTtlHours: Number(process.env.PRODUCT_CACHE_TTL_HOURS) || 168,
  uploadsDir: path.join(__dirname, '../../uploads'),
};

module.exports = config;
