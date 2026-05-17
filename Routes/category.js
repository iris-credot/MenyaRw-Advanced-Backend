const express = require('express');
const router = express.Router();
const {
  createCategory, getAllCategories, getCategoryById,
  updateCategory, deleteCategory,
} = require('../Controllers/categoryController');
const { protect, authorize } = require('../Middleware/auth');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, authorize('admin'), createCategory);
router.patch('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;