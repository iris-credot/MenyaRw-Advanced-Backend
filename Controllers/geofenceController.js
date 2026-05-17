const asyncWrapper = require('../Middleware/async');
const { BadRequest } = require('../Error/index');
const Site = require('../Models/Site');
const User = require('../Models/User');
const Notification = require('../Models/Notification');

// ─── Helper: Haversine distance in metres ─────────────────────────────────────
const haversineDistance = (lng1, lat1, lng2, lat2) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── LOCATION PING ────────────────────────────────────────────────────────────
// The mobile app sends periodic location pings. We check which geofenced sites
// the user is within, and create notifications for new zone entries.
// POST /api/v1/geofence/ping  { longitude, latitude }
exports.locationPing = asyncWrapper(async (req, res, next) => {
  const { longitude, latitude } = req.body;
  if (!longitude || !latitude) {
    return next(new BadRequest('longitude and latitude are required.'));
  }

  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  const lang = req.user.preferredLanguage || 'en';

  // Find all published, geofence-enabled sites within 2 km
  const nearbySites = await Site.find({
    isPublished: true,
    'geofence.enabled': true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 2000, // 2 km – our outer fence boundary
      },
    },
  }).select('name location geofence');

  const user = await User.findById(req.userId).select('notifiedGeofences fcmToken preferredLanguage');
  const triggered = [];

  for (const site of nearbySites) {
    const [siteLng, siteLat] = site.location.coordinates;
    const dist = haversineDistance(lng, lat, siteLng, siteLat);

    // Determine which zone the user is in
    let zone = null;
    if (dist <= 500) zone = '500m';
    else if (dist <= 2000) zone = '2km';

    if (!zone) continue;

    // Check if user already got this notification for this zone today
    const alreadyNotified = user.notifiedGeofences.some(
      (nf) =>
        nf.site.toString() === site._id.toString() &&
        nf.zone === zone &&
        new Date() - new Date(nf.notifiedAt) < 24 * 60 * 60 * 1000 // within 24h
    );

    if (alreadyNotified) continue;

    // Pick correct multilingual content from site's geofence config
    const content = zone === '500m' ? site.geofence.welcome : site.geofence.teaser;
    const siteNameEn = site.name.en || site.name.rw || site.name.fr;
    const siteNameRw = site.name.rw || site.name.en;
    const siteNameFr = site.name.fr || site.name.en;

    // Save in-app notification with all 3 languages
    await Notification.create({
      user: req.userId,
      title: {
        en: zone === '500m' ? `Welcome to ${siteNameEn}! 🏛️` : `${siteNameEn} is nearby 📍`,
        rw: zone === '500m' ? `Murakaza neza kuri ${siteNameRw}! 🏛️` : `${siteNameRw} iri hafi 📍`,
        fr: zone === '500m' ? `Bienvenue à ${siteNameFr}! 🏛️` : `${siteNameFr} est à proximité 📍`,
      },
      message: {
        en: content.en || `You are near ${siteNameEn}!`,
        rw: content.rw || `Uri hafi ya ${siteNameRw}!`,
        fr: content.fr || `Vous êtes près de ${siteNameFr}!`,
      },
      type: 'geofence',
      site: site._id,
      geofenceZone: zone,
    });

    // Record that we notified the user
    user.notifiedGeofences.push({ site: site._id, zone, notifiedAt: new Date() });
    triggered.push({ site: site._id, siteName, zone, distance: Math.round(dist) });
  }

  if (user.notifiedGeofences.length > 0) {
    // Keep only last 100 entries to prevent unbounded growth
    if (user.notifiedGeofences.length > 100) {
      user.notifiedGeofences = user.notifiedGeofences.slice(-100);
    }
    await user.save();
  }

  res.status(200).json({
    success: true,
    triggered,
    message: triggered.length > 0
      ? `${triggered.length} geofence(s) triggered.`
      : 'No new geofence zones entered.',
  });
});

// ─── GET SITES IN RADIUS (for map overlay) ────────────────────────────────────
// GET /api/v1/geofence/check?longitude=X&latitude=Y&radius=5000
exports.checkRadius = asyncWrapper(async (req, res, next) => {
  const { longitude, latitude, radius = 5000 } = req.query;
  if (!longitude || !latitude) return next(new BadRequest('longitude and latitude are required.'));

  const sites = await Site.find({
    isPublished: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: Number(radius),
      },
    },
  })
    .select('name location geofence.radius2km geofence.radius500m coverImage category')
    .populate('category', 'name color')
    .limit(20);

  res.status(200).json({ success: true, count: sites.length, sites });
});