const User = require('../models/User');
const { success } = require('../utils/helpers');

function isProfileComplete(profile) {
  if (!profile) return false;
  if (!profile.ageGroup || !profile.dietaryPreference) return false;
  if (!Array.isArray(profile.healthPreferences) || profile.healthPreferences.length === 0) {
    return false;
  }
  if (!Array.isArray(profile.nutritionGoals) || profile.nutritionGoals.length === 0) {
    return false;
  }
  return true;
}

async function getProfile(req, res) {
  return success(res, {
    profile: req.user.profile,
    profileCompleted: req.user.profileCompleted,
    user: req.user.toSafeObject(),
  });
}

async function updateProfile(req, res) {
  const body = req.body;

  req.user.profile = {
    ageGroup: body.ageGroup,
    dietaryPreference: body.dietaryPreference,
    healthPreferences: body.healthPreferences,
    allergies: body.allergies || [],
    nutritionGoals: body.nutritionGoals,
    otherPreferences: body.otherPreferences || '',
  };

  req.user.profileCompleted = isProfileComplete(req.user.profile);
  await req.user.save();

  return success(res, {
    profile: req.user.profile,
    profileCompleted: req.user.profileCompleted,
    user: req.user.toSafeObject(),
  });
}

module.exports = { getProfile, updateProfile, isProfileComplete };
