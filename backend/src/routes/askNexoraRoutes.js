const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, askNexoraSchema } = require('../validators/schemas');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);
router.post('/', validate(askNexoraSchema), asyncHandler(chatController.ask));
router.get('/history/:analysisId', asyncHandler(chatController.history));

module.exports = router;
