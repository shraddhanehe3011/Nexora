function normalizeComparable(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const asNum = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(asNum) && String(value).match(/[0-9]/)) {
    // For numeric nutrition comparisons keep number
    return asNum;
  }
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function compareStrings(a, b) {
  if (a == null && b == null) return 'missing';
  if (a == null || b == null) return 'unable_to_verify';
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  if (sa === sb) return 'match';
  if (sa.includes(sb) || sb.includes(sa)) return 'partial_match';
  const tokensA = new Set(sa.split(/\W+/).filter(Boolean));
  const tokensB = new Set(sb.split(/\W+/).filter(Boolean));
  let overlap = 0;
  for (const t of tokensA) if (tokensB.has(t)) overlap += 1;
  const ratio = overlap / Math.max(tokensA.size, tokensB.size, 1);
  if (ratio >= 0.6) return 'partial_match';
  return 'mismatch';
}

function compareNumbers(a, b, tolerance = 0.15) {
  if (a == null && b == null) return 'missing';
  if (a == null || b == null) return 'unable_to_verify';
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return 'unable_to_verify';
  if (na === nb) return 'match';
  const denom = Math.max(Math.abs(nb), 1);
  const diff = Math.abs(na - nb) / denom;
  if (diff <= tolerance) return 'partial_match';
  return 'mismatch';
}

function compareField(field, packageValue, databaseValue, { numeric = false, unit = null } = {}) {
  let status;
  if (packageValue == null && databaseValue == null) status = 'missing';
  else if (packageValue == null || databaseValue == null) status = 'unable_to_verify';
  else if (numeric) status = compareNumbers(packageValue, databaseValue);
  else status = compareStrings(packageValue, databaseValue);

  let confidence = 'unknown';
  if (status === 'match') confidence = 'high';
  else if (status === 'partial_match') confidence = 'medium';
  else if (status === 'mismatch') confidence = 'high';
  else confidence = 'low';

  return {
    field,
    packageValue: packageValue ?? null,
    databaseValue: databaseValue ?? null,
    unit,
    status,
    confidence,
  };
}

function verifyPackageAgainstDatabase(packageData, product) {
  const pkg = packageData || {};
  const nutrition = product?.nutrition || {};

  const comparisons = [
    compareField('productName', pkg.productName, product?.productName),
    compareField('brand', pkg.brand, product?.brand),
    compareField('ingredients', pkg.ingredientsText, product?.ingredientsText),
    compareField('calories', pkg.nutritionData?.energyKcal, nutrition.energyKcal100g, {
      numeric: true,
      unit: 'kcal (compare carefully: package may use different basis)',
    }),
    compareField('sugar', pkg.nutritionData?.sugar, nutrition.sugars100g, {
      numeric: true,
      unit: 'g',
    }),
    compareField('fat', pkg.nutritionData?.fat, nutrition.fat100g, {
      numeric: true,
      unit: 'g',
    }),
    compareField('protein', pkg.nutritionData?.protein, nutrition.proteins100g, {
      numeric: true,
      unit: 'g',
    }),
    compareField('fibre', pkg.nutritionData?.fibre, nutrition.fibre100g, {
      numeric: true,
      unit: 'g',
    }),
    compareField('salt', pkg.nutritionData?.salt, nutrition.salt100g, {
      numeric: true,
      unit: 'g',
    }),
    compareField('sodium', pkg.nutritionData?.sodium, nutrition.sodium100g, {
      numeric: true,
      unit: 'mg',
    }),
    compareField(
      'allergens',
      Array.isArray(pkg.allergens) ? pkg.allergens.join(', ') : pkg.allergens,
      Array.isArray(product?.allergens) ? product.allergens.join(', ') : product?.allergens
    ),
    compareField('servingSize', pkg.servingSize, product?.servingSize),
    compareField(
      'additives',
      Array.isArray(pkg.additives) ? pkg.additives.join(', ') : pkg.additives,
      Array.isArray(product?.additives) ? product.additives.join(', ') : product?.additives
    ),
  ];

  const statuses = comparisons.map((c) => c.status);
  let overallStatus = 'unable_to_verify';
  if (statuses.includes('mismatch')) overallStatus = 'mismatch';
  else if (statuses.includes('partial_match')) overallStatus = 'partial_match';
  else if (statuses.every((s) => s === 'match' || s === 'missing' || s === 'unable_to_verify')) {
    if (statuses.some((s) => s === 'match')) overallStatus = 'match';
  }

  return {
    source: 'NEXORA Analysis Engine',
    packageData: pkg,
    databaseData: {
      productName: product?.productName ?? null,
      brand: product?.brand ?? null,
      ingredientsText: product?.ingredientsText ?? null,
      nutrition: product?.nutrition ?? null,
      allergens: product?.allergens ?? [],
      additives: product?.additives ?? [],
      servingSize: product?.servingSize ?? null,
      source: 'Open Food Facts',
    },
    comparisons,
    overallStatus,
    ocrConfidence: pkg.confidence || 'unknown',
    lowConfidenceWarning:
      pkg.confidence === 'low' || (pkg.confidenceValue != null && pkg.confidenceValue < 0.45)
        ? 'Low OCR confidence — please verify this information manually.'
        : null,
  };
}

module.exports = {
  verifyPackageAgainstDatabase,
  compareField,
  compareNumbers,
  compareStrings,
};
