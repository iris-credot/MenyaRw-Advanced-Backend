const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :siteId from parent router
const {
  createReview, getSiteReviews, updateReview, deleteReview, getMyReview,
} = require('../Controllers/reviewController');
const { protect } = require('../Middleware/auth');

// GET    /api/v1/sites/:siteId/reviews
// POST   /api/v1/sites/:siteId/reviews
router.route('/')
  .get(getSiteReviews)
  .post(protect, createReview);

// GET    /api/v1/sites/:siteId/reviews/mine
router.get('/mine', protect, getMyReview);

// PATCH  /api/v1/reviews/:id
// DELETE /api/v1/reviews/:id
router.route('/:id')
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;