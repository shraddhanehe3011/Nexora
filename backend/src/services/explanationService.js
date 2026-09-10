function buildExplanation({
  overallResult,
  personalizedResult,
  nutritionAnalysis,
  ingredientAnalysis,
}) {
  const positiveFactors = [...(overallResult?.strengths || [])];
  const negativeFactors = [...(overallResult?.concerns || [])];

  for (const flag of nutritionAnalysis?.flags || []) {
    if (flag.type?.startsWith('good_') && !positiveFactors.includes(flag.message)) {
      positiveFactors.push(flag.message);
    }
    if (flag.type?.startsWith('high_') && !negativeFactors.includes(flag.message)) {
      negativeFactors.push(flag.message);
    }
  }

  if ((ingredientAnalysis?.additives || []).length > 0) {
    const msg = `${ingredientAnalysis.additives.length} additive code(s) identified`;
    if (!negativeFactors.includes(msg)) negativeFactors.push(msg);
  }

  const personalizedFactors = [...(personalizedResult?.reasons || [])];

  return {
    source: 'NEXORA Analysis Engine',
    title: 'Why did this product get this score?',
    positiveFactors,
    negativeFactors,
    personalizedFactors,
    allergyWarning: personalizedResult?.allergyConflict
      ? 'Potential allergy conflict detected.'
      : null,
    disclaimer:
      'NEXORA provides food-information insights based on available package and Open Food Facts data. It does not diagnose medical conditions or provide medical treatment.',
  };
}

module.exports = { buildExplanation };
