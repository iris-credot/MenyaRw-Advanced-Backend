const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createExhibit,
  getSiteExhibits,
  getExhibit,
  updateExhibit,
  deleteExhibit,
} = require('../Controllers/exhibitController');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getSiteExhibits);
router.get('/:exhibitId', getExhibit);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
router.post('/', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), createExhibit);
router.patch('/:exhibitId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upload.single('image'), updateExhibit);
router.delete('/:exhibitId', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, deleteExhibit);

module.exports = router;