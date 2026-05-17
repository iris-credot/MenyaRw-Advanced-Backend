const express = require('express');
const router = express.Router({ mergeParams: true }); // access :siteId from parent
const {
  createActivity,
  getSiteActivities,
  getActivity,
  updateActivity,
  deleteActivity,
} = require('../Controllers/activityController');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Public — anyone can view activities ──────────────────────────────────────
router.get('/', getSiteActivities);
router.get('/:activityId', getActivity);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.post('/', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), createActivity);
router.patch('/:activityId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), updateActivity);
router.delete('/:activityId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, deleteActivity);

module.exports = router;