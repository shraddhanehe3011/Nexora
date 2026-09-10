const {
  searchByCategory,
} = require('../integrations/openFoodFacts/openFoodFactsService');
const { upsertNormalizedProduct } = require('./productService');
const { toPublicProduct } = require('../integrations/openFoodFacts/normalize');
const { analyzeNutrition } = require('./nutritionAnalyzer');
const { analyzeIngredients } = require('./ingredientAnalyzer');
const { calculateOverallScore } = require('../scoring/overallScore');
const { calculatePersonalizedScore, hasAllergenConflict } = require('../scoring/personalizedScore');

function pickCategory(product) {
  if (product.categories?.length) return product.categories[0];
  if (product.brand) return product.brand;
  if (product.productName) {
    return product.productName.split(/\s+/).slice(0, 2).join(' ');
  }
  return 'packaged food';
}

function hasEnoughData(p) {
  const n = p.nutrition || {};
  const nutritionCount = [
    n.sugars100g,
    n.salt100g,
    n.proteins100g,
    n.fat100g,
    n.energyKcal100g,
  ].filter((v) => v != null).length;
  return Boolean(p.productName) && nutritionCount >= 2;
}

function nutritionDelta(current, candidate, key) {
  const a = current?.nutrition?.[key];
  const b = candidate?.nutrition?.[key];
  if (a == null || b == null) return null;
  return Math.round((b - a) * 10) / 10;
}

async function getRecommendations({ product, userProfile, analysis }) {
  const goals = userProfile?.nutritionGoals || [];
  const category = pickCategory(product);

  let searchResult;
  try {
    searchResult = await searchByCategory(category, { pageSize: 30 });
  } catch {
    return {
      source: 'Open Food Facts',
      recommendations: [],
      explanation:
        'No suitable alternative was found in the available product database.',
    };
  }

  const currentId = product.sourceProductId || product.barcode;
  const candidates = [];

  for (const raw of searchResult.products || []) {
    if (!hasEnoughData(raw)) continue;
    if (raw.sourceProductId && raw.sourceProductId === currentId) continue;
    if (raw.barcode && raw.barcode === product.barcode) continue;

    const allergyConflicts = hasAllergenConflict(raw, userProfile?.allergies || [], null);
    if (allergyConflicts.length) continue;

    let overall;
    let personalized;
    try {
      const nutritionAnalysis = analyzeNutrition(raw.nutrition);
      const ingredientAnalysis = analyzeIngredients(
        raw.ingredientsText,
        raw.ingredients,
        raw.additives
      );
      overall = calculateOverallScore({
        product: raw,
        nutritionAnalysis,
        ingredientAnalysis,
      });
      personalized = calculatePersonalizedScore({
        userProfile,
        product: raw,
        ingredientAnalysis,
        nutritionAnalysis,
        overallScore: overall,
      });
    } catch {
      continue;
    }

    if (personalized.allergyConflict) continue;
    if (personalized.suitability === 'avoid_due_to_allergen_conflict') continue;

    const reasons = [];
    const sugarDelta = nutritionDelta(product, raw, 'sugars100g');
    const proteinDelta = nutritionDelta(product, raw, 'proteins100g');
    const saltDelta = nutritionDelta(product, raw, 'salt100g');
    const fibreDelta = nutritionDelta(product, raw, 'fibre100g');

    if (goals.includes('lower_sugar') && sugarDelta != null && sugarDelta < -1) {
      reasons.push('Lower sugar than the analysed product');
    }
    if (goals.includes('higher_protein') && proteinDelta != null && proteinDelta > 1) {
      reasons.push('Better matches your high-protein preference');
    }
    if (goals.includes('lower_sodium') && saltDelta != null && saltDelta < -0.1) {
      reasons.push('Lower salt than the analysed product');
    }
    if (goals.includes('higher_fibre') && fibreDelta != null && fibreDelta > 0.5) {
      reasons.push('Higher fibre than the analysed product');
    }
    if (
      overall.score != null &&
      analysis?.overallScore != null &&
      overall.score > analysis.overallScore
    ) {
      reasons.push('Higher overall food score');
    }

    if (!reasons.length) {
      if (
        overall.score != null &&
        analysis?.overallScore != null &&
        overall.score >= analysis.overallScore
      ) {
        reasons.push('Comparable or better nutritional profile in a similar category');
      } else {
        continue;
      }
    }

    let rank =
      (personalized.personalizedScore || 0) * 0.6 + (overall.score || 0) * 0.4;
    if (reasons.some((r) => /Lower sugar|Lower salt|Higher fibre|high-protein/i.test(r))) {
      rank += 5;
    }

    candidates.push({
      product: {
        sourceProductId: raw.sourceProductId,
        barcode: raw.barcode,
        productName: raw.productName,
        brand: raw.brand,
        imageUrl: raw.imageUrl,
        nutriScore: raw.nutriScore,
        novaGroup: raw.novaGroup,
      },
      reason: reasons[0],
      reasons,
      comparison: {
        sugarDelta,
        proteinDelta,
        saltDelta,
        fibreDelta,
      },
      overallScore: overall.score,
      personalizedSuitability: personalized.suitability,
      personalizedScore: personalized.personalizedScore,
      rank,
    });
  }

  candidates.sort((a, b) => b.rank - a.rank);
  const top = candidates.slice(0, 5);

  // Persist recommended products for later detail views
  for (const item of top) {
    try {
      const full = (searchResult.products || []).find(
        (p) => p.sourceProductId === item.product.sourceProductId
      );
      if (full) {
        const doc = await upsertNormalizedProduct(full);
        item.product.id = doc._id.toString();
        item.product = { ...item.product, ...toPublicProduct(doc) };
      }
    } catch {
      // non-fatal
    }
  }

  return {
    source: 'Open Food Facts',
    recommendations: top,
    explanation: top.length
      ? 'Alternatives ranked from Open Food Facts using your preferences and available nutrition data.'
      : 'No suitable alternative was found in the available product database.',
  };
}

module.exports = { getRecommendations };
