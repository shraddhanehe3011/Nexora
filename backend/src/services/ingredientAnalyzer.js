/**
 * Deterministic ingredient / additive analysis.
 * Uses structured mappings — does not invent unknown ingredient functions.
 */

const ADDITIVE_MAP = {
  E100: { category: 'colour', reason: 'Colour additive' },
  E101: { category: 'colour', reason: 'Colour additive (riboflavin)' },
  E102: { category: 'colour', reason: 'Colour additive (tartrazine)' },
  E110: { category: 'colour', reason: 'Colour additive (Sunset Yellow)' },
  E120: { category: 'colour', reason: 'Colour additive (carmine)' },
  E129: { category: 'colour', reason: 'Colour additive (Allura Red)' },
  E133: { category: 'colour', reason: 'Colour additive (Brilliant Blue)' },
  E150: { category: 'colour', reason: 'Caramel colour' },
  E150A: { category: 'colour', reason: 'Caramel colour' },
  E150D: { category: 'colour', reason: 'Sulphite ammonia caramel colour' },
  E160A: { category: 'colour', reason: 'Carotene colour' },
  E200: { category: 'preservative', reason: 'Preservative (sorbic acid)' },
  E202: { category: 'preservative', reason: 'Preservative (potassium sorbate)' },
  E211: { category: 'preservative', reason: 'Preservative (sodium benzoate)' },
  E220: { category: 'preservative', reason: 'Preservative (sulphur dioxide)' },
  E250: { category: 'preservative', reason: 'Preservative (sodium nitrite)' },
  E251: { category: 'preservative', reason: 'Preservative (sodium nitrate)' },
  E280: { category: 'preservative', reason: 'Preservative (propionic acid)' },
  E300: { category: 'antioxidant', reason: 'Antioxidant (ascorbic acid)' },
  E321: { category: 'antioxidant', reason: 'Antioxidant (BHT)' },
  E322: { category: 'emulsifier', reason: 'Emulsifier (lecithin)' },
  E330: { category: 'acidity_regulator', reason: 'Used as an acidity regulator' },
  E331: { category: 'acidity_regulator', reason: 'Acidity regulator (sodium citrates)' },
  E338: { category: 'acidity_regulator', reason: 'Acidity regulator (phosphoric acid)' },
  E407: { category: 'thickener', reason: 'Thickener (carrageenan)' },
  E412: { category: 'thickener', reason: 'Thickener (guar gum)' },
  E415: { category: 'thickener', reason: 'Thickener (xanthan gum)' },
  E440: { category: 'thickener', reason: 'Thickener (pectin)' },
  E450: { category: 'emulsifier', reason: 'Emulsifier (diphosphates)' },
  E471: { category: 'emulsifier', reason: 'Emulsifier (mono- and diglycerides)' },
  E481: { category: 'emulsifier', reason: 'Emulsifier (sodium stearoyl-2-lactylate)' },
  E500: { category: 'acidity_regulator', reason: 'Acidity regulator (sodium carbonates)' },
  E621: { category: 'flavour_enhancer', reason: 'Flavour enhancer (MSG)' },
  E627: { category: 'flavour_enhancer', reason: 'Flavour enhancer (disodium guanylate)' },
  E631: { category: 'flavour_enhancer', reason: 'Flavour enhancer (disodium inosinate)' },
  E950: { category: 'sweetener', reason: 'Sweetener (acesulfame K)' },
  E951: { category: 'sweetener', reason: 'Sweetener (aspartame)' },
  E952: { category: 'sweetener', reason: 'Sweetener (cyclamate)' },
  E954: { category: 'sweetener', reason: 'Sweetener (saccharin)' },
  E955: { category: 'sweetener', reason: 'Sweetener (sucralose)' },
  E960: { category: 'sweetener', reason: 'Sweetener (steviol glycosides)' },
  E965: { category: 'sweetener', reason: 'Sweetener (maltitol)' },
};

const CONCERN_KEYWORDS = [
  { pattern: /high[\s-]?fructose|hfcs/i, name: 'High-fructose corn syrup', category: 'sweetener', reason: 'Intense added sugar ingredient' },
  { pattern: /palm oil/i, name: 'Palm oil', category: 'fat', reason: 'Often associated with saturated fat content' },
  { pattern: /hydrogenated/i, name: 'Hydrogenated oil', category: 'fat', reason: 'May indicate processed fats' },
  { pattern: /monosodium glutamate|\bmsg\b/i, name: 'MSG', category: 'flavour_enhancer', reason: 'Flavour enhancer' },
  { pattern: /artificial (flavour|flavor|colour|color)/i, name: 'Artificial flavour/colour', category: 'additive', reason: 'Artificial additive mentioned' },
];

const ALLERGEN_KEYWORDS = {
  milk: [/milk/, /lactose/, /whey/, /casein/, /butter/, /cream/, /cheese/],
  peanut: [/peanut/, /groundnut/],
  tree_nuts: [/almond/, /cashew/, /walnut/, /hazelnut/, /pistachio/, /pecan/, /macadamia/, /tree ?nut/],
  soy: [/soy/, /soya/, /soybean/],
  wheat: [/wheat/, /semolina/, /spelt/],
  gluten: [/gluten/, /wheat/, /barley/, /rye/, /malt/],
  egg: [/egg/, /albumin/, /albumen/],
  fish: [/fish/, /anchovy/, /cod/, /tuna/, /salmon/],
  shellfish: [/shellfish/, /shrimp/, /prawn/, /crab/, /lobster/, /mollusc/, /mussel/],
  sesame: [/sesame/, /tahini/],
};

function extractENumbers(text) {
  if (!text) return [];
  const matches = String(text).toUpperCase().match(/E\s?\d{3,5}[A-Z]?/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\s+/g, '')))];
}

function analyzeIngredients(ingredientsText, ingredients = [], additives = []) {
  const text = [ingredientsText || '', ...(ingredients || [])].join(' ').trim();
  const findings = [];
  const seen = new Set();

  const eNumbers = [
    ...extractENumbers(text),
    ...(additives || []).map((a) => String(a).toUpperCase().replace(/^EN:/, '')),
  ];

  for (const code of eNumbers) {
    const normalized = code.replace(/\s+/g, '').toUpperCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const mapped = ADDITIVE_MAP[normalized];
    if (mapped) {
      findings.push({
        name: normalized,
        category: mapped.category,
        reason: mapped.reason,
        sourceType: 'additive_code',
        confidence: 'high',
      });
    } else if (/^E\d/.test(normalized)) {
      findings.push({
        name: normalized,
        category: 'unknown',
        reason: 'Additive code detected but function not mapped in NEXORA rules',
        sourceType: 'additive_code',
        confidence: 'low',
      });
    }
  }

  for (const rule of CONCERN_KEYWORDS) {
    if (rule.pattern.test(text)) {
      const key = rule.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          name: rule.name,
          category: rule.category,
          reason: rule.reason,
          sourceType: 'keyword',
          confidence: 'medium',
        });
      }
    }
  }

  const allergenHits = [];
  const lower = text.toLowerCase();
  for (const [allergen, patterns] of Object.entries(ALLERGEN_KEYWORDS)) {
    if (patterns.some((p) => p.test(lower))) {
      allergenHits.push(allergen);
    }
  }

  const preservatives = findings.filter((f) => f.category === 'preservative');
  const sweeteners = findings.filter((f) => f.category === 'sweetener');
  const colours = findings.filter((f) => f.category === 'colour');
  const emulsifiers = findings.filter((f) => f.category === 'emulsifier');
  const flavourEnhancers = findings.filter((f) => f.category === 'flavour_enhancer');

  const concerns = findings.filter((f) =>
    ['preservative', 'sweetener', 'colour', 'flavour_enhancer', 'fat', 'additive'].includes(
      f.category
    )
  );

  return {
    source: 'NEXORA Analysis Engine',
    hasIngredients: Boolean(text),
    findings,
    additives: findings.filter((f) => f.sourceType === 'additive_code'),
    preservatives,
    sweeteners,
    colours,
    emulsifiers,
    flavourEnhancers,
    concerns,
    detectedAllergenKeywords: allergenHits,
    unknownCount: findings.filter((f) => f.category === 'unknown').length,
  };
}

module.exports = {
  analyzeIngredients,
  ADDITIVE_MAP,
  ALLERGEN_KEYWORDS,
  extractENumbers,
};
