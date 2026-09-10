const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);
router.get('/:analysisId', asyncHandler(analysisController.getRecommendationsForAnalysis));

module.exports = router;
