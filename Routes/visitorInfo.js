const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getVisitorInfo,
  upsertVisitorInfo,
  deleteVisitorInfo,
} = require('../Controllers/visitorInfoController');
const { protect, authorize, mustHaveChangedPassword } = require('../Middleware/auth');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getVisitorInfo);

// ─── Admin or assigned moderator ─────────────────────────────────────────────
// PUT is used here — creates if not exists, updates if it does (upsert)
router.put('/', protect, authorize('admin', 'moderator'), mustHaveChangedPassword, upsertVisitorInfo);
router.delete('/', protect, authorize('admin'), deleteVisitorInfo); // admin only — destructive

module.exports = router;