const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);

router.post('/product/:productId', asyncHandler(analysisController.analyzeProduct));
router.get('/:analysisId', asyncHandler(analysisController.getAnalysis));

module.exports = router;
