const {
  OVERALL_WEIGHTS,
  ADDITIVE_MODIFIER,
  DATA_COMPLETENESS_FIELDS,
  MIN_CONFIDENCE_FOR_STRONG_SCORE,
} = require('./scoreConfig');
const { getNested, clamp, round1 } = require('../utils/helpers');

function computeDataCompleteness(product) {
  const missingFields = [];
  let present = 0;

  for (const field of DATA_COMPLETENESS_FIELDS) {
    const value = getNested(product, field);
    const ok =
      value != null &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0);
    if (ok) present += 1;
    else missingFields.push(field);
  }

  const percentage = Math.round((present / DATA_COMPLETENESS_FIELDS.length) * 100);
  return {
    percentage,
    present,
    total: DATA_COMPLETENESS_FIELDS.length,
    missingFields,
    nutritionCompleteness: ['energyKcal100g', 'sugars100g', 'fat100g', 'proteins100g']
      .map((f) => (getNested(product, `nutrition.${f}`) != null ? 1 : 0))
      .reduce((a, b) => a + b, 0) / 4,
    ingredientCompleteness: product.ingredientsText ? 1 : 0,
    allergenCompleteness: Array.isArray(product.allergens) && product.allergens.length ? 1 : 0,
    servingSizeCompleteness: product.servingSize ? 1 : 0,
  };
}

function average(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calculateOverallScore({ product, nutritionAnalysis, ingredientAnalysis }) {
  const completeness = computeDataCompleteness(product);
  const scores = nutritionAnalysis?.scores || {};

  // Sodium preferred over salt to avoid double-counting the same mineral concern
  const sodiumOrSalt = scores.sodium != null ? scores.sodium : scores.salt;

  const components = {
    nutrition: nutritionAnalysis?.nutritionQuality ?? null,
    sugar: scores.sugar ?? null,
    sodium: sodiumOrSalt,
    fat: scores.saturatedFat != null ? scores.saturatedFat : scores.fat,
    protein: scores.protein ?? null,
    fibre: scores.fibre ?? null,
  };

  const weighted = [];
  const weightUsed = {};

  const push = (key, weight, value) => {
    if (value == null) return;
    weighted.push(value * weight);
    weightUsed[key] = weight;
  };

  push('nutrition', OVERALL_WEIGHTS.nutritionQuality, components.nutrition);
  push('sugar', OVERALL_WEIGHTS.sugar, components.sugar);
  push('sodium', OVERALL_WEIGHTS.sodium, components.sodium);
  push('saturatedFat', OVERALL_WEIGHTS.saturatedFat, components.fat);
  push('fibre', OVERALL_WEIGHTS.fibre, components.fibre);
  push('protein', OVERALL_WEIGHTS.protein, components.protein);

  const totalWeight = Object.values(weightUsed).reduce((a, b) => a + b, 0);
  let baseScore =
    totalWeight > 0 ? weighted.reduce((a, b) => a + b, 0) / totalWeight : null;

  let additivePenalty = 0;
  if (ingredientAnalysis?.hasIngredients) {
    additivePenalty += (ingredientAnalysis.preservatives?.length || 0) * ADDITIVE_MODIFIER.perPreservative;
    additivePenalty += (ingredientAnalysis.sweeteners?.length || 0) * ADDITIVE_MODIFIER.perSweetener;
    additivePenalty +=
      ((ingredientAnalysis.additives?.length || 0) -
        (ingredientAnalysis.preservatives?.length || 0) -
        (ingredientAnalysis.sweeteners?.length || 0)) *
      ADDITIVE_MODIFIER.perAdditive;
    additivePenalty = Math.min(ADDITIVE_MODIFIER.maxPenalty, Math.max(0, additivePenalty));
  }

  let ingredientsScore = null;
  if (ingredientAnalysis?.hasIngredients) {
    ingredientsScore = clamp(100 - additivePenalty * 3, 20, 100);
  }

  let additivesScore = null;
  if (ingredientAnalysis?.hasIngredients) {
    additivesScore = clamp(100 - additivePenalty * 4, 15, 100);
  }

  if (baseScore != null) {
    baseScore = clamp(baseScore - additivePenalty, 0, 100);
  }

  // Confidence reflects data completeness, not fabricated certainty
  let confidenceValue = completeness.percentage / 100;
  if (baseScore == null) confidenceValue = Math.min(confidenceValue, 0.3);
  if (confidenceValue < MIN_CONFIDENCE_FOR_STRONG_SCORE && baseScore != null) {
    // Soften extreme scores when data is sparse
    baseScore = 50 + (baseScore - 50) * confidenceValue;
  }

  const score = baseScore == null ? null : Math.round(clamp(baseScore, 0, 100));

  let category = 'insufficient_data';
  if (score != null) {
    if (score >= 80) category = 'excellent';
    else if (score >= 65) category = 'good';
    else if (score >= 50) category = 'moderate';
    else if (score >= 35) category = 'poor';
    else category = 'very_poor';
  }

  const strengths = [];
  const concerns = [];
  if (components.protein != null && components.protein >= 75) strengths.push('Good protein content');
  if (components.fibre != null && components.fibre >= 75) strengths.push('Good fibre content');
  if (components.sugar != null && components.sugar >= 75) strengths.push('Relatively low sugar');
  if (components.sodium != null && components.sodium >= 75) strengths.push('Relatively low sodium/salt');
  if (components.fat != null && components.fat >= 75) strengths.push('Moderate to low saturated fat');

  if (components.sugar != null && components.sugar <= 45) concerns.push('Elevated sugar');
  if (components.sodium != null && components.sodium <= 45) concerns.push('Elevated sodium/salt');
  if (components.fat != null && components.fat <= 45) concerns.push('Elevated saturated fat');
  if ((ingredientAnalysis?.concerns || []).length >= 3) {
    concerns.push('Multiple additive/ingredient concerns');
  }
  if (completeness.percentage < 50) concerns.push('Limited product data available');

  const breakdown = {};
  if (components.nutrition != null) breakdown.nutrition = Math.round(components.nutrition);
  if (components.sugar != null) breakdown.sugar = Math.round(components.sugar);
  if (components.sodium != null) breakdown.sodium = Math.round(components.sodium);
  if (components.fat != null) breakdown.fat = Math.round(components.fat);
  if (components.protein != null) breakdown.protein = Math.round(components.protein);
  if (components.fibre != null) breakdown.fibre = Math.round(components.fibre);
  if (ingredientsScore != null) breakdown.ingredients = Math.round(ingredientsScore);
  if (additivesScore != null) breakdown.additives = Math.round(additivesScore);

  return {
    source: 'NEXORA Analysis Engine',
    score,
    category,
    strengths,
    concerns,
    breakdown,
    dataCompleteness: completeness,
    confidence: {
      value: round1(confidenceValue),
      label:
        confidenceValue >= 0.75
          ? 'high'
          : confidenceValue >= 0.5
            ? 'medium'
            : confidenceValue >= 0.3
              ? 'low'
              : 'very_low',
      note:
        completeness.percentage < 60
          ? 'Score confidence is reduced because product information is incomplete'
          : 'Based on available Open Food Facts nutrition and ingredient data',
    },
    missingFields: completeness.missingFields,
  };
}

module.exports = { calculateOverallScore, computeDataCompleteness, average };
