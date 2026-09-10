const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { authMiddleware, requireProfileCompleted } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const productController = require('../controllers/productController');

const router = express.Router();

router.use(authMiddleware, requireProfileCompleted);

router.get('/search', asyncHandler(productController.search));
router.get('/barcode/:barcode', asyncHandler(productController.barcode));
router.post('/analyze-image', upload.single('image'), asyncHandler(productController.analyzeImage));
router.get('/:id', asyncHandler(productController.getProduct));

module.exports = router;
