const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, profileSchema } = require('../validators/schemas');
const { authMiddleware } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', validate(profileSchema), asyncHandler(userController.updateProfile));

module.exports = router;
