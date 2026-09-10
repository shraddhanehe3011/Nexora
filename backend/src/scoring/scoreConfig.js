/**
 * Centralized scoring thresholds and weights.
 * All magic numbers for scoring live here.
 */

const OVERALL_WEIGHTS = {
  nutritionQuality: 0.4,
  sugar: 0.15,
  sodium: 0.15,
  saturatedFat: 0.1,
  fibre: 0.1,
  protein: 0.1,
};

const ADDITIVE_MODIFIER = {
  maxPenalty: 15,
  perAdditive: 2,
  perPreservative: 1.5,
  perSweetener: 2,
};

const NUTRITION_THRESHOLDS = {
  // per 100g reference values
  sugar: { excellent: 5, good: 10, moderate: 15, high: 22 },
  salt: { excellent: 0.3, good: 0.6, moderate: 1.0, high: 1.5 },
  sodium: { excellent: 120, good: 240, moderate: 400, high: 600 }, // mg/100g
  saturatedFat: { excellent: 1.5, good: 3, moderate: 5, high: 8 },
  fat: { excellent: 3, good: 10, moderate: 17, high: 25 },
  fibre: { excellent: 6, good: 3, moderate: 1.5, low: 0.5 }, // higher is better
  protein: { excellent: 12, good: 8, moderate: 4, low: 2 }, // higher is better
  energyKcal: { excellent: 150, good: 250, moderate: 350, high: 450 },
};

const PERSONALIZATION = {
  allergyConflictPenalty: 55,
  dietaryConflictPenalty: 25,
  unmetGoalPenalty: 8,
  matchedGoalBonus: 5,
  healthPreferencePenalty: 6,
  minScore: 5,
  maxScore: 100,
};

const DATA_COMPLETENESS_FIELDS = [
  'productName',
  'brand',
  'ingredientsText',
  'nutrition.energyKcal100g',
  'nutrition.sugars100g',
  'nutrition.fat100g',
  'nutrition.saturatedFat100g',
  'nutrition.proteins100g',
  'nutrition.fibre100g',
  'nutrition.salt100g',
  'allergens',
  'servingSize',
];

const MIN_CONFIDENCE_FOR_STRONG_SCORE = 0.45;

module.exports = {
  OVERALL_WEIGHTS,
  ADDITIVE_MODIFIER,
  NUTRITION_THRESHOLDS,
  PERSONALIZATION,
  DATA_COMPLETENESS_FIELDS,
  MIN_CONFIDENCE_FOR_STRONG_SCORE,
};
