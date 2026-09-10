const Joi = require('joi');
const {
  AGE_GROUPS,
  DIETARY_PREFERENCES,
  HEALTH_PREFERENCES,
  ALLERGIES,
  NUTRITION_GOALS,
} = require('../models/User');
const { AppError } = require('../utils/helpers');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
          fields: error.details.map((d) => ({
            path: d.path.join('.'),
            message: d.message,
          })),
        })
      );
    }

    req[property] = value;
    return next();
  };
}

const registerSchema = Joi.object({
  username: Joi.string().trim().min(2).max(40).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation must match',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const profileSchema = Joi.object({
  ageGroup: Joi.string()
    .valid(...AGE_GROUPS)
    .required(),
  dietaryPreference: Joi.string()
    .valid(...DIETARY_PREFERENCES)
    .required(),
  healthPreferences: Joi.array()
    .items(Joi.string().valid(...HEALTH_PREFERENCES))
    .min(1)
    .required(),
  allergies: Joi.array()
    .items(Joi.string().valid(...ALLERGIES))
    .default([]),
  nutritionGoals: Joi.array()
    .items(Joi.string().valid(...NUTRITION_GOALS))
    .min(1)
    .required(),
  otherPreferences: Joi.string().allow('').max(500).default(''),
});

const askNexoraSchema = Joi.object({
  analysisId: Joi.string().hex().length(24).required(),
  question: Joi.string().trim().min(3).max(1000).required(),
  productId: Joi.string().hex().length(24).optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  profileSchema,
  askNexoraSchema,
};
