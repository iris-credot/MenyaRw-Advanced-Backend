const express = require('express');
const router = express.Router();
const {
  logVisit, getMyVisits, getSiteVisitStats, checkVisited,
} = require('../Controllers/visitController');
const { protect, authorize } = require('../Middleware/auth');

router.use(protect);

router.get('/my', getMyVisits);
router.post('/sites/:siteId', logVisit);
router.get('/sites/:siteId/check', checkVisited);
router.get('/sites/:siteId/stats', authorize('admin'), getSiteVisitStats);

module.exports = router;