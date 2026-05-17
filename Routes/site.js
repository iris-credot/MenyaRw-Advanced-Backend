const express = require('express');
const router = express.Router();
const {
  createSite, getAllSites, getSite, updateSite, deleteSite,
  getNearbySites, getFeaturedSites, togglePublish, toggleFeature,
} = require('../Controllers/siteController');
const reviewRouter = require('./review');
const activityRouter = require('./activity');
const exhibitRouter = require('./exhibit');
const timelineRouter = require('./timeline');
const visitorInfoRouter = require('./visitorInfo');
const galleryRouter = require('./gallery');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Nested routes ────────────────────────────────────────────────────────────
router.use('/:siteId/reviews', reviewRouter);
router.use('/:siteId/activities', activityRouter);
router.use('/:siteId/exhibits', exhibitRouter);
router.use('/:siteId/timeline', timelineRouter);
router.use('/:siteId/visitor-info', visitorInfoRouter);
router.use('/:siteId/gallery', galleryRouter);

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/', getAllSites);
router.get('/featured', getFeaturedSites);
router.get('/nearby', getNearbySites);
router.get('/:id', getSite);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('admin', 'moderator'),
  mustHaveChangedPassword,
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  createSite
);
router.delete('/:id', protect, authorize('admin'), deleteSite);
router.patch('/:id/publish', protect, authorize('admin'), togglePublish);
router.patch('/:id/feature', protect, authorize('admin'), toggleFeature);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.patch(
  '/:id',
  protect,
  authorize('admin', 'moderator'),
  mustHaveChangedPassword,
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  updateSite
);

module.exports = router;