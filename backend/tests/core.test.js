const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeOffProduct } = require('../src/integrations/openFoodFacts/normalize');
const { analyzeNutrition } = require('../src/services/nutritionAnalyzer');
const { analyzeIngredients, extractENumbers } = require('../src/services/ingredientAnalyzer');
const { calculateOverallScore } = require('../src/scoring/overallScore');
const {
  calculatePersonalizedScore,
  hasAllergenConflict,
  checkDietary,
} = require('../src/scoring/personalizedScore');
const {
  compareNumbers,
  compareStrings,
  verifyPackageAgainstDatabase,
} = require('../src/services/verificationService');
const { buildExplanation } = require('../src/services/explanationService');

test('normalizeOffProduct maps OFF fields without inventing values', () => {
  const normalized = normalizeOffProduct({
    code: '3017620422003',
    product_name: 'Test Spread',
    brands: 'TestBrand',
    nutriments: {
      'energy-kcal_100g': 500,
      sugars_100g: 56,
      fat_100g: 30,
      'saturated-fat_100g': 10,
      proteins_100g: 6,
      salt_100g: 0.1,
    },
    ingredients_text: 'Sugar, palm oil, hazelnuts, cocoa, E322',
    allergens_tags: ['en:nuts', 'en:milk'],
    additives_tags: ['en:e322'],
    nova_group: 4,
    nutriscore_grade: 'e',
  });

  assert.equal(normalized.barcode, '3017620422003');
  assert.equal(normalized.productName, 'Test Spread');
  assert.equal(normalized.nutrition.sugars100g, 56);
  assert.equal(normalized.nutrition.fibre100g, null);
  assert.ok(normalized.additives.includes('E322'));
});

test('missing nutrition is null not zero', () => {
  const analysis = analyzeNutrition({ sugars100g: null, proteins100g: 8 });
  assert.equal(analysis.scores.sugar, null);
  assert.notEqual(analysis.scores.protein, null);
  assert.ok(analysis.missingFields.includes('sugar'));
});

test('ingredient analyzer maps known additives and unknowns safely', () => {
  const result = analyzeIngredients('Water, sugar, E330, E99999', [], ['E330']);
  assert.ok(result.findings.some((f) => f.name === 'E330' && f.category === 'acidity_regulator'));
  assert.ok(result.findings.some((f) => f.name === 'E99999' && f.category === 'unknown'));
  assert.deepEqual(extractENumbers('contains E 471 and e621'), ['E471', 'E621']);
});

test('overall score is deterministic and handles sparse data', () => {
  const product = {
    productName: 'Sparse',
    brand: null,
    ingredientsText: null,
    nutrition: { sugars100g: 20 },
    allergens: [],
    servingSize: null,
  };
  const nutritionAnalysis = analyzeNutrition(product.nutrition);
  const ingredientAnalysis = analyzeIngredients(null, [], []);
  const a = calculateOverallScore({ product, nutritionAnalysis, ingredientAnalysis });
  const b = calculateOverallScore({ product, nutritionAnalysis, ingredientAnalysis });
  assert.equal(a.score, b.score);
  assert.ok(a.dataCompleteness.percentage < 50);
  assert.ok(a.confidence.value < 0.75);
});

test('allergy conflict reduces personalized score', () => {
  const product = {
    productName: 'Peanut Butter',
    ingredientsText: 'peanuts, salt',
    allergens: ['peanuts'],
    nutrition: { sugars100g: 5, proteins100g: 20, salt100g: 0.5, fat100g: 45, saturatedFat100g: 8, fibre100g: 6, energyKcal100g: 600 },
    labels: [],
    categories: [],
  };
  const nutritionAnalysis = analyzeNutrition(product.nutrition);
  const ingredientAnalysis = analyzeIngredients(product.ingredientsText, [], []);
  const overall = calculateOverallScore({ product, nutritionAnalysis, ingredientAnalysis });
  const personalized = calculatePersonalizedScore({
    userProfile: {
      allergies: ['peanut'],
      dietaryPreference: 'none',
      nutritionGoals: ['higher_protein'],
      healthPreferences: ['none'],
    },
    product,
    ingredientAnalysis,
    nutritionAnalysis,
    overallScore: overall,
  });
  assert.equal(personalized.allergyConflict, true);
  assert.equal(personalized.suitability, 'avoid_due_to_allergen_conflict');
  assert.ok(personalized.personalizedScore < overall.score);
});

test('dietary vegan conflict detection', () => {
  const result = checkDietary(
    { labels: [], ingredientsText: 'milk powder, cocoa', allergens: ['milk'], categories: [] },
    'vegan'
  );
  assert.equal(result.status, 'conflict');
});

test('verification compares OCR vs OFF', () => {
  assert.equal(compareNumbers(10, 10), 'match');
  assert.equal(compareNumbers(10, 11), 'partial_match');
  assert.equal(compareNumbers(10, 20), 'mismatch');
  assert.equal(compareStrings('Coca Cola', 'coca cola'), 'match');

  const verification = verifyPackageAgainstDatabase(
    {
      productName: 'Test',
      nutritionData: { sugar: 18 },
      confidence: 'low',
    },
    {
      productName: 'Test',
      nutrition: { sugars100g: 12 },
    }
  );
  const sugar = verification.comparisons.find((c) => c.field === 'sugar');
  assert.equal(sugar.status, 'mismatch');
  assert.ok(verification.lowConfidenceWarning);
});

test('explanation is built from structured analysis', () => {
  const explanation = buildExplanation({
    overallResult: { strengths: ['Good protein content'], concerns: ['High sugar'] },
    personalizedResult: {
      reasons: ['Sugar level conflicts with your lower-sugar preference'],
      allergyConflict: true,
    },
    nutritionAnalysis: { flags: [] },
    ingredientAnalysis: { additives: [{ name: 'E330' }] },
  });
  assert.ok(explanation.positiveFactors.includes('Good protein content'));
  assert.equal(explanation.allergyWarning, 'Potential allergy conflict detected.');
});

test('hasAllergenConflict finds milk', () => {
  const conflicts = hasAllergenConflict(
    { ingredientsText: 'skimmed milk powder', allergens: [], labels: [], categories: [] },
    ['milk'],
    null
  );
  assert.deepEqual(conflicts, ['milk']);
});
