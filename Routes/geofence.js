const express = require('express');
const router = express.Router();
const { locationPing, checkRadius } = require('../Controllers/geofenceController');
const { protect } = require('../Middleware/auth');

router.use(protect);

// Mobile app pings this every N seconds with user's GPS coordinates
router.post('/ping', locationPing);

// Get all geofenced sites within a custom radius (for map display)
router.get('/check', checkRadius);

module.exports = router;