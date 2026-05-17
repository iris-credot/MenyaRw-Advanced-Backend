const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createTimelineEvent,
  getSiteTimeline,
  getTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} = require('../Controllers/timelineController');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getSiteTimeline);
router.get('/:eventId', getTimelineEvent);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.post('/', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), createTimelineEvent);
router.patch('/:eventId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), updateTimelineEvent);
router.delete('/:eventId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, deleteTimelineEvent);

module.exports = router;