const { toNumberOrNull } = require('../../utils/helpers');

function splitCsv(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function firstImage(product) {
  return (
    product.image_front_url ||
    product.image_url ||
    product.image_small_url ||
    product.image_front_small_url ||
    null
  );
}

function normalizeOffProduct(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const n = raw.nutriments || {};
  const sourceProductId = raw.code || raw._id || raw.id || null;

  const sugars =
    toNumberOrNull(n['sugars_100g']) ??
    toNumberOrNull(n.sugars) ??
    null;

  const salt =
    toNumberOrNull(n['salt_100g']) ??
    toNumberOrNull(n.salt) ??
    null;

  let sodium =
    toNumberOrNull(n['sodium_100g']) ??
    toNumberOrNull(n.sodium) ??
    null;

  // OFF sodium is often in g; convert to mg/100g when value looks like grams
  if (sodium != null && sodium < 5) {
    sodium = sodium * 1000;
  } else if (sodium == null && salt != null) {
    sodium = salt * 400; // approx: salt(g) * 0.4 * 1000
  }

  const energyKcal =
    toNumberOrNull(n['energy-kcal_100g']) ??
    toNumberOrNull(n['energy-kcal']) ??
    (toNumberOrNull(n['energy_100g']) != null
      ? Math.round(toNumberOrNull(n['energy_100g']) / 4.184)
      : null);

  const ingredientsFromTags = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((i) => i.text || i.id || i).filter(Boolean)
    : [];

  const ingredientsText =
    raw.ingredients_text_en ||
    raw.ingredients_text ||
    (ingredientsFromTags.length ? ingredientsFromTags.join(', ') : null);

  return {
    source: 'openfoodfacts',
    sourceProductId: sourceProductId ? String(sourceProductId) : null,
    barcode: raw.code ? String(raw.code) : sourceProductId ? String(sourceProductId) : null,
    productName: raw.product_name_en || raw.product_name || raw.generic_name || null,
    brand: raw.brands || (Array.isArray(raw.brands_tags) ? raw.brands_tags[0] : null) || null,
    imageUrl: firstImage(raw),
    categories: splitCsv(raw.categories).length
      ? splitCsv(raw.categories)
      : (raw.categories_tags || []).map((c) => String(c).replace(/^en:/, '')),
    ingredientsText,
    ingredients: ingredientsFromTags.length
      ? ingredientsFromTags
      : ingredientsText
        ? ingredientsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    nutrition: {
      energyKcal100g: energyKcal,
      fat100g: toNumberOrNull(n['fat_100g']) ?? toNumberOrNull(n.fat),
      saturatedFat100g:
        toNumberOrNull(n['saturated-fat_100g']) ?? toNumberOrNull(n['saturated-fat']),
      carbohydrates100g:
        toNumberOrNull(n['carbohydrates_100g']) ?? toNumberOrNull(n.carbohydrates),
      sugars100g: sugars,
      fibre100g:
        toNumberOrNull(n['fiber_100g']) ??
        toNumberOrNull(n['fibre_100g']) ??
        toNumberOrNull(n.fiber),
      proteins100g: toNumberOrNull(n['proteins_100g']) ?? toNumberOrNull(n.proteins),
      salt100g: salt,
      sodium100g: sodium,
    },
    servingSize: raw.serving_size || null,
    additives: (raw.additives_tags || []).map((a) => String(a).replace(/^en:/, '').toUpperCase()),
    allergens: [
      ...splitCsv(raw.allergens),
      ...(raw.allergens_tags || []).map((a) => String(a).replace(/^en:/, '')),
    ],
    labels: [
      ...splitCsv(raw.labels),
      ...(raw.labels_tags || []).map((l) => String(l).replace(/^en:/, '')),
    ],
    novaGroup: toNumberOrNull(raw.nova_group),
    nutriScore: raw.nutriscore_grade || raw.nutrition_grades || null,
    countries: splitCsv(raw.countries),
    packaging: raw.packaging || null,
    rawSourceData: null, // omit bulky raw by default when persisting
    lastFetchedAt: new Date(),
  };
}

function toPublicProduct(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj.rawSourceData;
  delete obj.__v;
  return {
    ...obj,
    id: obj._id?.toString?.() || obj.id,
    sourceLabel: 'Open Food Facts',
  };
}

module.exports = { normalizeOffProduct, toPublicProduct, splitCsv };
