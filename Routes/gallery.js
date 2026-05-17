const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addGalleryItem,
  getSiteGallery,
  getGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  clearGallery,
} = require('../Controllers/galleryController');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getSiteGallery);             // ?type=photo or ?type=video
router.get('/:itemId', getGalleryItem);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.post('/', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), addGalleryItem);
router.patch('/:itemId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), updateGalleryItem);
router.delete('/:itemId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, deleteGalleryItem);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.delete('/', protect, authorize('admin'), clearGallery);

module.exports = router;