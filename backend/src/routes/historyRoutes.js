const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const historyController = require('../controllers/historyController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);
router.get('/', asyncHandler(historyController.getHistory));

module.exports = router;
