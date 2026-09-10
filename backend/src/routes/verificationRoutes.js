const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);
router.post('/:analysisId', asyncHandler(analysisController.createVerification));

module.exports = router;
