const axios = require('axios');
const config = require('../../config');

const SYSTEM_PROMPT = `You are Ask Nexora. Answer only using the supplied product information, analysis results, verification results and user personalization context. Do not invent product facts, nutrition values, ingredients, scores or recommendations. If information is unavailable, explicitly say that it is unavailable. Do not diagnose medical conditions or provide medical treatment. Explain food information clearly and cautiously. Never calculate or recalculate scores — only explain the scores already provided in the context.`;

function buildFallbackAnswer(question, context) {
  const q = String(question || '').toLowerCase();
  const overall = context.overallScore?.score;
  const personalized = context.personalizedScore?.personalizedScore;
  const explanation = context.explanation || {};

  if (q.includes('score') && q.includes('why')) {
    const positives = (explanation.positiveFactors || []).join('; ') || 'None listed';
    const negatives = (explanation.negativeFactors || []).join('; ') || 'None listed';
    return `Based on the NEXORA analysis, the overall score is ${overall ?? 'unavailable'}. Positive factors: ${positives}. Concerns: ${negatives}. This explanation uses only the structured analysis already computed for this product.`;
  }

  if (q.includes('not suitable') || q.includes('suitable for me')) {
    const factors = (explanation.personalizedFactors || []).join('; ') || 'No personalized factors recorded';
    const allergy = explanation.allergyWarning || '';
    return `Your personalized score is ${personalized ?? 'unavailable'} (suitability: ${context.personalizedScore?.suitability || 'unavailable'}). ${allergy} Personalized factors: ${factors}. NEXORA does not provide medical advice.`;
  }

  if (q.includes('ingredient')) {
    const concerns = (context.ingredientAnalysis?.concerns || [])
      .map((c) => c.name)
      .slice(0, 8);
    const text = context.product?.ingredientsText;
    if (!text) {
      return 'Ingredient information is unavailable for this product in the current data sources.';
    }
    return `Ingredients on record: ${text}. Notable ingredient/additive findings: ${concerns.length ? concerns.join(', ') : 'none mapped by NEXORA rules'}.`;
  }

  if (q.includes('sugar')) {
    const sugar = context.product?.nutrition?.sugars100g;
    if (sugar == null) return 'Sugar information is not available for this product.';
    return `Sugar is recorded as ${sugar} g per 100g according to Open Food Facts / analysis data. Whether this is high depends on thresholds used by the NEXORA scoring engine and your preferences.`;
  }

  if (q.includes('concern')) {
    const concerns = context.overallScore?.concerns || [];
    return concerns.length
      ? `Main concerns from analysis: ${concerns.join('; ')}.`
      : 'No major concerns were flagged by the structured analysis, or data was insufficient.';
  }

  if (q.includes('recommend')) {
    const recs = context.recommendations?.recommendations || [];
    if (!recs.length) {
      return (
        context.recommendations?.explanation ||
        'No suitable alternative was found in the available product database.'
      );
    }
    return `Recommended alternatives are based on Open Food Facts matches. Top suggestion: ${recs[0].product?.productName || 'Unknown'} — ${recs[0].reason}.`;
  }

  return `I can only answer from the supplied analysis context. Overall score: ${overall ?? 'unavailable'}; personalized score: ${personalized ?? 'unavailable'}. Ask about score reasons, ingredients, sugar, concerns, suitability, or recommendations. If a detail is missing from the context, it is unavailable.`;
}

async function askLlm({ question, context, history = [] }) {
  if (!config.llmApiKey) {
    return {
      answer: buildFallbackAnswer(question, context),
      source: 'Ask Nexora',
      provider: 'deterministic_fallback',
    };
  }

  const contextPayload = JSON.stringify(
    {
      product: {
        name: context.product?.productName,
        brand: context.product?.brand,
        barcode: context.product?.barcode,
        ingredientsText: context.product?.ingredientsText,
        nutrition: context.product?.nutrition,
        allergens: context.product?.allergens,
        labels: context.product?.labels,
      },
      overallScore: context.overallScore,
      personalizedScore: context.personalizedScore,
      explanation: context.explanation,
      ingredientAnalysis: {
        concerns: context.ingredientAnalysis?.concerns,
        additives: context.ingredientAnalysis?.additives,
      },
      nutritionAnalysis: context.nutritionAnalysis,
      verification: context.verification
        ? {
            overallStatus: context.verification.overallStatus,
            lowConfidenceWarning: context.verification.lowConfidenceWarning,
            comparisons: context.verification.comparisons,
          }
        : null,
      recommendations: context.recommendations,
      userProfile: {
        dietaryPreference: context.userProfile?.dietaryPreference,
        allergies: context.userProfile?.allergies,
        nutritionGoals: context.userProfile?.nutritionGoals,
        healthPreferences: context.userProfile?.healthPreferences,
      },
    },
    null,
    2
  );

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Context (JSON):\n${contextPayload}\n\nQuestion: ${question}`,
      },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    ];

    const { data } = await axios.post(
      `${config.llmBaseUrl}/chat/completions`,
      {
        model: config.llmModel,
        messages,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.llmApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return {
        answer: buildFallbackAnswer(question, context),
        source: 'Ask Nexora',
        provider: 'deterministic_fallback',
      };
    }

    return {
      answer,
      source: 'Ask Nexora',
      provider: 'llm',
    };
  } catch {
    return {
      answer: buildFallbackAnswer(question, context),
      source: 'Ask Nexora',
      provider: 'deterministic_fallback',
    };
  }
}

module.exports = { askLlm, buildFallbackAnswer, SYSTEM_PROMPT };
