const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, registerSchema, loginSchema } = require('../validators/schemas');
const { authMiddleware } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

module.exports = router;
