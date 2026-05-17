const express = require('express');
const router = express.Router();
const {
  createGuide,
  getAllGuides,
  getGuideById,
  getMyAssignedSite,
  reassignGuide,
  unassignGuide,
  deleteGuide,
  resetGuidePassword,
} = require('../Controllers/guideController');
const { protect, authorize } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Guide's own route (logged-in guide) ─────────────────────────────────────
router.get('/my-site', protect, authorize('guide'), getMyAssignedSite);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.use(protect, authorize('admin'));

router.get('/', getAllGuides);
router.post('/', upload.single('image'), createGuide);
router.get('/:id', getGuideById);
router.delete('/:id', deleteGuide);
router.patch('/reassign', reassignGuide);
router.patch('/:id/unassign', unassignGuide);
router.patch('/:id/reset-password', resetGuidePassword);

module.exports = router;