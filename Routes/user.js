const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, updateProfile,
  updatePassword, deleteUser,
  toggleSavedSite, getSavedSites, updateFcmToken,
} = require('../Controllers/userController');
const { protect, authorize } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

// ─── Protected routes (any logged-in user) ───────────────────────────────────
router.use(protect);

router.get('/saved-sites', getSavedSites);
router.post('/saved-sites/:siteId', toggleSavedSite);
router.patch('/profile', upload.single('image'), updateProfile);
router.patch('/password', updatePassword);
router.patch('/fcm-token', updateFcmToken);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', getUserById);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;