const { PERSONALIZATION, NUTRITION_THRESHOLDS } = require('./scoreConfig');
const { clamp } = require('../utils/helpers');
const { ALLERGEN_KEYWORDS } = require('../services/ingredientAnalyzer');

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function productTextBlob(product) {
  return [
    product.ingredientsText,
    ...(product.ingredients || []),
    ...(product.allergens || []),
    ...(product.labels || []),
    ...(product.categories || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasAllergenConflict(product, allergies = [], ingredientAnalysis) {
  const blob = productTextBlob(product);
  const conflicts = [];

  for (const allergy of allergies || []) {
    if (allergy === 'other' || allergy === 'none') continue;

    const patterns = ALLERGEN_KEYWORDS[allergy] || [];
    const fromTags = (product.allergens || []).some((a) =>
      normalizeText(a).includes(allergy.replace('_', ' '))
    );
    const fromIngredients = patterns.some((p) => p.test(blob));
    const fromAnalysis = (ingredientAnalysis?.detectedAllergenKeywords || []).includes(allergy);

    if (fromTags || fromIngredients || fromAnalysis) {
      conflicts.push(allergy);
    }
  }

  return conflicts;
}

function checkDietary(product, preference) {
  if (!preference || preference === 'none' || preference === 'other') {
    return { status: 'not_applicable', note: null };
  }

  const labels = (product.labels || []).map(normalizeText);
  const blob = productTextBlob(product);
  const hasLabel = (needles) =>
    needles.some((n) => labels.some((l) => l.includes(n)) || blob.includes(n));

  if (preference === 'vegan') {
    if (hasLabel(['vegan'])) return { status: 'compatible', note: 'Product labelled vegan' };
    if (hasLabel(['milk', 'egg', 'honey', 'gelatin', 'whey', 'casein', 'meat', 'fish'])) {
      return { status: 'conflict', note: 'Evidence suggests non-vegan ingredients' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify vegan compatibility' };
  }

  if (preference === 'vegetarian' || preference === 'eggetarian') {
    if (hasLabel(['vegetarian', 'vegan'])) {
      return { status: 'compatible', note: 'Product labelled vegetarian/vegan' };
    }
    if (hasLabel(['gelatin', 'meat', 'fish', 'chicken', 'beef', 'pork', 'shellfish'])) {
      return { status: 'conflict', note: 'Evidence suggests non-vegetarian ingredients' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify vegetarian compatibility' };
  }

  if (preference === 'gluten_free') {
    if (hasLabel(['gluten-free', 'gluten free'])) {
      return { status: 'compatible', note: 'Product labelled gluten-free' };
    }
    if (hasLabel(['wheat', 'gluten', 'barley', 'rye'])) {
      return { status: 'conflict', note: 'Evidence of gluten-containing ingredients' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify gluten-free status' };
  }

  if (preference === 'dairy_free') {
    if (hasLabel(['dairy-free', 'dairy free', 'lactose-free'])) {
      return { status: 'compatible', note: 'Product labelled dairy-free' };
    }
    if (hasLabel(['milk', 'lactose', 'whey', 'casein', 'butter', 'cream', 'cheese'])) {
      return { status: 'conflict', note: 'Evidence of dairy ingredients' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify dairy-free status' };
  }

  if (preference === 'jain') {
    if (hasLabel(['onion', 'garlic', 'potato', 'root'])) {
      return { status: 'conflict', note: 'May conflict with Jain dietary preference' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify Jain compatibility' };
  }

  if (preference === 'halal') {
    if (hasLabel(['halal'])) return { status: 'compatible', note: 'Product labelled halal' };
    if (hasLabel(['pork', 'alcohol', 'wine', 'beer'])) {
      return { status: 'conflict', note: 'Evidence may conflict with Halal preference' };
    }
    return { status: 'unable_to_verify', note: 'Unable to verify Halal status' };
  }

  if (preference === 'low_carb') {
    const carbs = product.nutrition?.carbohydrates100g;
    if (carbs == null) return { status: 'unable_to_verify', note: 'Carbohydrate data unavailable' };
    if (carbs <= 10) return { status: 'compatible', note: 'Relatively low carbohydrate per 100g' };
    if (carbs >= 30) return { status: 'conflict', note: 'Higher carbohydrate per 100g' };
    return { status: 'moderate', note: 'Moderate carbohydrate per 100g' };
  }

  return { status: 'unable_to_verify', note: 'Unable to verify' };
}

function evaluateGoals(product, goals = []) {
  const n = product.nutrition || {};
  const matched = [];
  const unmet = [];
  const reasons = [];

  for (const goal of goals || []) {
    if (goal === 'general_balanced') {
      matched.push(goal);
      reasons.push('General balanced nutrition preference noted');
      continue;
    }
    if (goal === 'lower_sugar') {
      if (n.sugars100g == null) {
        reasons.push('Sugar data unavailable for lower-sugar preference');
      } else if (n.sugars100g <= NUTRITION_THRESHOLDS.sugar.good) {
        matched.push(goal);
        reasons.push('Sugar level aligns with your lower-sugar preference');
      } else {
        unmet.push(goal);
        reasons.push('Sugar level conflicts with your lower-sugar preference');
      }
    }
    if (goal === 'lower_sodium') {
      const salt = n.salt100g;
      const sodium = n.sodium100g;
      if (salt == null && sodium == null) {
        reasons.push('Sodium/salt data unavailable for lower-sodium preference');
      } else if (
        (salt != null && salt <= NUTRITION_THRESHOLDS.salt.good) ||
        (sodium != null && sodium <= NUTRITION_THRESHOLDS.sodium.good)
      ) {
        matched.push(goal);
        reasons.push('Sodium/salt level aligns with your preference');
      } else {
        unmet.push(goal);
        reasons.push('Sodium/salt level conflicts with your lower-sodium preference');
      }
    }
    if (goal === 'lower_saturated_fat') {
      if (n.saturatedFat100g == null) {
        reasons.push('Saturated fat data unavailable');
      } else if (n.saturatedFat100g <= NUTRITION_THRESHOLDS.saturatedFat.good) {
        matched.push(goal);
        reasons.push('Saturated fat aligns with your preference');
      } else {
        unmet.push(goal);
        reasons.push('Saturated fat conflicts with your preference');
      }
    }
    if (goal === 'higher_protein') {
      if (n.proteins100g == null) {
        reasons.push('Protein data unavailable');
      } else if (n.proteins100g >= NUTRITION_THRESHOLDS.protein.good) {
        matched.push(goal);
        reasons.push('Protein level supports your higher-protein preference');
      } else {
        unmet.push(goal);
        reasons.push('Protein is lower than your higher-protein preference');
      }
    }
    if (goal === 'higher_fibre') {
      if (n.fibre100g == null) {
        reasons.push('Fibre data unavailable');
      } else if (n.fibre100g >= NUTRITION_THRESHOLDS.fibre.good) {
        matched.push(goal);
        reasons.push('Fibre level supports your higher-fibre preference');
      } else {
        unmet.push(goal);
        reasons.push('Fibre is lower than your higher-fibre preference');
      }
    }
    if (goal === 'lower_calorie') {
      if (n.energyKcal100g == null) {
        reasons.push('Energy data unavailable');
      } else if (n.energyKcal100g <= NUTRITION_THRESHOLDS.energyKcal.good) {
        matched.push(goal);
        reasons.push('Energy level aligns with lower-calorie preference');
      } else {
        unmet.push(goal);
        reasons.push('Energy is higher than your lower-calorie preference');
      }
    }
  }

  return { matched, unmet, reasons };
}

function evaluateHealthPreferences(product, healthPreferences = []) {
  const n = product.nutrition || {};
  const flags = [];
  const reasons = [];

  for (const pref of healthPreferences || []) {
    if (pref === 'none') continue;
    if (pref === 'diabetes_blood_sugar') {
      if (n.sugars100g != null && n.sugars100g > NUTRITION_THRESHOLDS.sugar.moderate) {
        flags.push(pref);
        reasons.push('Sugar level may be relevant for blood-sugar awareness preference');
      }
    }
    if (pref === 'high_blood_pressure_sodium') {
      if (
        (n.salt100g != null && n.salt100g > NUTRITION_THRESHOLDS.salt.moderate) ||
        (n.sodium100g != null && n.sodium100g > NUTRITION_THRESHOLDS.sodium.moderate)
      ) {
        flags.push(pref);
        reasons.push('Sodium/salt level may be relevant for your sodium awareness preference');
      }
    }
    if (pref === 'high_cholesterol_saturated_fat') {
      if (
        n.saturatedFat100g != null &&
        n.saturatedFat100g > NUTRITION_THRESHOLDS.saturatedFat.moderate
      ) {
        flags.push(pref);
        reasons.push('Saturated fat may be relevant for cholesterol awareness preference');
      }
    }
    if (pref === 'weight_management' || pref === 'heart_health') {
      if (n.energyKcal100g != null && n.energyKcal100g > NUTRITION_THRESHOLDS.energyKcal.moderate) {
        flags.push(pref);
        reasons.push('Energy density may be relevant for your selected health preference');
      }
    }
  }

  return { flags, reasons };
}

function calculatePersonalizedScore({
  userProfile,
  product,
  ingredientAnalysis,
  nutritionAnalysis,
  overallScore,
}) {
  const profile = userProfile || {};
  const base = overallScore?.score;
  const riskFlags = [];
  const personalizedFactors = [];

  if (base == null) {
    return {
      source: 'NEXORA Analysis Engine',
      personalizedScore: null,
      suitability: 'insufficient_data',
      riskFlags: ['insufficient_product_data'],
      matchedPreferences: [],
      unmetPreferences: [],
      allergyConflict: false,
      allergyConflicts: [],
      dietaryCheck: { status: 'unable_to_verify' },
      reasons: [
        'Personalized score unavailable because overall product data is insufficient',
      ],
      profileFactors: [],
    };
  }

  let score = base;
  const allergyConflicts = hasAllergenConflict(
    product,
    profile.allergies || [],
    ingredientAnalysis
  );
  const allergyConflict = allergyConflicts.length > 0;

  if (allergyConflict) {
    score -= PERSONALIZATION.allergyConflictPenalty;
    riskFlags.push('allergy_conflict');
    personalizedFactors.push('Potential allergen conflict detected.');
  }

  const dietaryCheck = checkDietary(product, profile.dietaryPreference);
  if (dietaryCheck.status === 'conflict') {
    score -= PERSONALIZATION.dietaryConflictPenalty;
    riskFlags.push('dietary_conflict');
    personalizedFactors.push(dietaryCheck.note);
  } else if (dietaryCheck.status === 'compatible' && dietaryCheck.note) {
    personalizedFactors.push(dietaryCheck.note);
  } else if (dietaryCheck.status === 'unable_to_verify' && dietaryCheck.note) {
    personalizedFactors.push(dietaryCheck.note);
  }

  const goals = evaluateGoals(product, profile.nutritionGoals || []);
  score += goals.matched.length * PERSONALIZATION.matchedGoalBonus;
  score -= goals.unmet.length * PERSONALIZATION.unmetGoalPenalty;
  personalizedFactors.push(...goals.reasons);

  const health = evaluateHealthPreferences(product, profile.healthPreferences || []);
  score -= health.flags.length * PERSONALIZATION.healthPreferencePenalty;
  personalizedFactors.push(...health.reasons);
  riskFlags.push(...health.flags);

  score = Math.round(clamp(score, PERSONALIZATION.minScore, PERSONALIZATION.maxScore));

  let suitability = 'moderate_match';
  if (allergyConflict) suitability = 'avoid_due_to_allergen_conflict';
  else if (score >= 80) suitability = 'excellent_match';
  else if (score >= 65) suitability = 'good_match';
  else if (score >= 45) suitability = 'moderate_match';
  else suitability = 'poor_match';

  const profileFactors = [];
  if ((profile.nutritionGoals || []).includes('lower_sugar')) {
    profileFactors.push('Lower sugar preference');
  }
  if (
    (profile.healthPreferences || []).includes('high_blood_pressure_sodium') ||
    (profile.nutritionGoals || []).includes('lower_sodium')
  ) {
    profileFactors.push('Sodium awareness');
  }
  for (const a of profile.allergies || []) {
    if (a !== 'other') profileFactors.push(`${a.replace(/_/g, ' ')} allergy`);
  }
  if (profile.dietaryPreference && profile.dietaryPreference !== 'none') {
    profileFactors.push(`${profile.dietaryPreference.replace(/_/g, ' ')} preference`);
  }

  return {
    source: 'NEXORA Analysis Engine',
    personalizedScore: score,
    suitability,
    riskFlags: [...new Set(riskFlags)],
    matchedPreferences: goals.matched,
    unmetPreferences: goals.unmet,
    allergyConflict,
    allergyConflicts,
    dietaryCheck,
    reasons: personalizedFactors,
    profileFactors,
    basedOnOverallScore: base,
  };
}

module.exports = {
  calculatePersonalizedScore,
  hasAllergenConflict,
  checkDietary,
  evaluateGoals,
};
