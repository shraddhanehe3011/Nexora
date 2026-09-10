const mongoose = require('mongoose');

const AGE_GROUPS = ['under_18', '18_25', '26_35', '36_50', '51_65', '65_plus'];
const DIETARY_PREFERENCES = [
  'none',
  'vegetarian',
  'vegan',
  'eggetarian',
  'jain',
  'halal',
  'gluten_free',
  'dairy_free',
  'low_carb',
  'other',
];
const HEALTH_PREFERENCES = [
  'diabetes_blood_sugar',
  'high_blood_pressure_sodium',
  'high_cholesterol_saturated_fat',
  'weight_management',
  'heart_health',
  'none',
];
const ALLERGIES = [
  'milk',
  'peanut',
  'tree_nuts',
  'soy',
  'wheat',
  'gluten',
  'egg',
  'fish',
  'shellfish',
  'sesame',
  'other',
];
const NUTRITION_GOALS = [
  'lower_sugar',
  'lower_sodium',
  'lower_saturated_fat',
  'higher_protein',
  'higher_fibre',
  'lower_calorie',
  'general_balanced',
];

const profileSchema = new mongoose.Schema(
  {
    ageGroup: { type: String, enum: AGE_GROUPS, default: null },
    dietaryPreference: { type: String, enum: DIETARY_PREFERENCES, default: null },
    healthPreferences: [{ type: String, enum: HEALTH_PREFERENCES }],
    allergies: [{ type: String, enum: ALLERGIES }],
    nutritionGoals: [{ type: String, enum: NUTRITION_GOALS }],
    otherPreferences: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    profile: this.profile,
    profileCompleted: this.profileCompleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.AGE_GROUPS = AGE_GROUPS;
module.exports.DIETARY_PREFERENCES = DIETARY_PREFERENCES;
module.exports.HEALTH_PREFERENCES = HEALTH_PREFERENCES;
module.exports.ALLERGIES = ALLERGIES;
module.exports.NUTRITION_GOALS = NUTRITION_GOALS;
