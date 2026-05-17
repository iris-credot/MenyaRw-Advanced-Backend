const express = require('express');
const router = express.Router();
const {
  createSite, getAllSites, getSite, updateSite, deleteSite,
  getNearbySites, getFeaturedSites, togglePublish, toggleFeature,
} = require('../Controllers/siteController');
const reviewRouter = require('./review');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Nested reviews ───────────────────────────────────────────────────────────
router.use('/:siteId/reviews', reviewRouter);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getAllSites);
router.get('/featured', getFeaturedSites);
router.get('/nearby', getNearbySites);
router.get('/:id', getSite);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), createSite);
router.delete('/:id', protect, authorize('admin'), deleteSite);
router.patch('/:id/publish', protect, authorize('admin'), togglePublish);
router.patch('/:id/feature', protect, authorize('admin'), toggleFeature);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.patch('/:id', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), updateSite);

module.exports = router;