export const AGE_GROUP_OPTIONS = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_25', label: '18–25' },
  { value: '26_35', label: '26–35' },
  { value: '36_50', label: '36–50' },
  { value: '51_65', label: '51–65' },
  { value: '65_plus', label: '65+' },
];

export const DIETARY_OPTIONS = [
  { value: 'none', label: 'No specific preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'jain', label: 'Jain' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
  { value: 'low_carb', label: 'Low-carb' },
  { value: 'other', label: 'Other' },
];

export const HEALTH_OPTIONS = [
  { value: 'diabetes_blood_sugar', label: 'Diabetes / blood sugar awareness' },
  { value: 'high_blood_pressure_sodium', label: 'High blood pressure / sodium awareness' },
  { value: 'high_cholesterol_saturated_fat', label: 'High cholesterol / saturated fat awareness' },
  { value: 'weight_management', label: 'Weight management' },
  { value: 'heart_health', label: 'Heart-health preference' },
  { value: 'none', label: 'None' },
];

export const ALLERGY_OPTIONS = [
  { value: 'milk', label: 'Milk' },
  { value: 'peanut', label: 'Peanut' },
  { value: 'tree_nuts', label: 'Tree nuts' },
  { value: 'soy', label: 'Soy' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'egg', label: 'Egg' },
  { value: 'fish', label: 'Fish' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'other', label: 'Other' },
];

export const GOAL_OPTIONS = [
  { value: 'lower_sugar', label: 'Lower sugar' },
  { value: 'lower_sodium', label: 'Lower sodium' },
  { value: 'lower_saturated_fat', label: 'Lower saturated fat' },
  { value: 'higher_protein', label: 'Higher protein' },
  { value: 'higher_fibre', label: 'Higher fibre' },
  { value: 'lower_calorie', label: 'Lower calorie' },
  { value: 'general_balanced', label: 'General balanced nutrition' },
];

export function displayValue(value, fallback = 'Not available') {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return fallback;
  }
  return value;
}

export function formatLabel(value) {
  if (!value) return '';
  return String(value).replace(/_/g, ' ');
}

export function scoreTone(score) {
  if (score == null) return 'text-muted';
  if (score >= 75) return 'text-nexora-700';
  if (score >= 55) return 'text-amber-700';
  return 'text-rose-700';
}

export function scoreRing(score) {
  if (score == null) return 'border-line';
  if (score >= 75) return 'border-nexora-500';
  if (score >= 55) return 'border-amber-400';
  return 'border-rose-400';
}
