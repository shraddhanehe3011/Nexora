const { NUTRITION_THRESHOLDS } = require('../scoring/scoreConfig');
const { round1 } = require('../utils/helpers');

function scoreLowerIsBetter(value, thresholds) {
  if (value == null) return null;
  if (value <= thresholds.excellent) return 95;
  if (value <= thresholds.good) return 80;
  if (value <= thresholds.moderate) return 60;
  if (value <= thresholds.high) return 40;
  return 20;
}

function scoreHigherIsBetter(value, thresholds) {
  if (value == null) return null;
  if (value >= thresholds.excellent) return 95;
  if (value >= thresholds.good) return 80;
  if (value >= thresholds.moderate) return 55;
  if (value >= thresholds.low) return 35;
  return 20;
}

function analyzeNutrition(nutrition = {}) {
  const n = nutrition || {};
  const available = {};
  const scores = {};

  const fields = [
    ['energyKcal100g', 'energy'],
    ['sugars100g', 'sugar'],
    ['salt100g', 'salt'],
    ['sodium100g', 'sodium'],
    ['saturatedFat100g', 'saturatedFat'],
    ['fat100g', 'fat'],
    ['fibre100g', 'fibre'],
    ['proteins100g', 'protein'],
    ['carbohydrates100g', 'carbohydrates'],
  ];

  for (const [key, label] of fields) {
    available[label] = n[key] != null;
  }

  scores.sugar = scoreLowerIsBetter(n.sugars100g, NUTRITION_THRESHOLDS.sugar);
  scores.salt = scoreLowerIsBetter(n.salt100g, NUTRITION_THRESHOLDS.salt);
  scores.sodium = scoreLowerIsBetter(n.sodium100g, NUTRITION_THRESHOLDS.sodium);
  scores.saturatedFat = scoreLowerIsBetter(
    n.saturatedFat100g,
    NUTRITION_THRESHOLDS.saturatedFat
  );
  scores.fat = scoreLowerIsBetter(n.fat100g, NUTRITION_THRESHOLDS.fat);
  scores.fibre = scoreHigherIsBetter(n.fibre100g, NUTRITION_THRESHOLDS.fibre);
  scores.protein = scoreHigherIsBetter(n.proteins100g, NUTRITION_THRESHOLDS.protein);
  scores.energy = scoreLowerIsBetter(n.energyKcal100g, NUTRITION_THRESHOLDS.energyKcal);

  const presentScores = Object.values(scores).filter((s) => s != null);
  const nutritionQuality =
    presentScores.length > 0
      ? Math.round(presentScores.reduce((a, b) => a + b, 0) / presentScores.length)
      : null;

  const flags = [];
  if (n.sugars100g != null && n.sugars100g > NUTRITION_THRESHOLDS.sugar.high) {
    flags.push({ type: 'high_sugar', message: 'High sugar per 100g' });
  }
  if (n.salt100g != null && n.salt100g > NUTRITION_THRESHOLDS.salt.high) {
    flags.push({ type: 'high_salt', message: 'High salt per 100g' });
  }
  if (
    n.saturatedFat100g != null &&
    n.saturatedFat100g > NUTRITION_THRESHOLDS.saturatedFat.high
  ) {
    flags.push({ type: 'high_saturated_fat', message: 'High saturated fat per 100g' });
  }
  if (n.fibre100g != null && n.fibre100g >= NUTRITION_THRESHOLDS.fibre.good) {
    flags.push({ type: 'good_fibre', message: 'Good fibre content per 100g' });
  }
  if (n.proteins100g != null && n.proteins100g >= NUTRITION_THRESHOLDS.protein.good) {
    flags.push({ type: 'good_protein', message: 'Good protein content per 100g' });
  }

  return {
    source: 'NEXORA Analysis Engine',
    basis: 'per_100g',
    values: {
      energyKcal100g: round1(n.energyKcal100g),
      fat100g: round1(n.fat100g),
      saturatedFat100g: round1(n.saturatedFat100g),
      carbohydrates100g: round1(n.carbohydrates100g),
      sugars100g: round1(n.sugars100g),
      fibre100g: round1(n.fibre100g),
      proteins100g: round1(n.proteins100g),
      salt100g: round1(n.salt100g),
      sodium100g: round1(n.sodium100g),
    },
    available,
    scores,
    nutritionQuality,
    flags,
    missingFields: fields.filter(([key]) => n[key] == null).map(([, label]) => label),
  };
}

module.exports = { analyzeNutrition, scoreLowerIsBetter, scoreHigherIsBetter };
