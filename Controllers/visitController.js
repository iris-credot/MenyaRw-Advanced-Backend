const asyncWrapper = require('../Middleware/async');
const { NotFound, BadRequest } = require('../Error/index');
const Visit = require('../Models/Visit');
const Site = require('../Models/Site');

// ─── LOG A VISIT (check-in) ───────────────────────────────────────────────────
exports.logVisit = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { longitude, latitude, trigger, notes } = req.body;

  const site = await Site.findById(siteId);
  if (!site) return next(new NotFound('Heritage site not found.'));

  // Calculate distance if user coordinates provided
  let distanceFromSite = null;
  if (longitude && latitude) {
    const [siteLng, siteLat] = site.location.coordinates;
    // Haversine approximation (metres)
    const R = 6371000;
    const dLat = ((siteLat - parseFloat(latitude)) * Math.PI) / 180;
    const dLng = ((siteLng - parseFloat(longitude)) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((parseFloat(latitude) * Math.PI) / 180) *
        Math.cos((siteLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    distanceFromSite = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  const visit = await Visit.create({
    user: req.userId,
    site: siteId,
    trigger: trigger || 'manual',
    userLocation: longitude && latitude
      ? { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] }
      : undefined,
    distanceFromSite,
    notes,
  });

  await visit.populate('site', 'name.en coverImage');

  res.status(201).json({ success: true, visit });
});

// ─── GET MY VISIT HISTORY ─────────────────────────────────────────────────────
exports.getMyVisits = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [visits, total] = await Promise.all([
    Visit.find({ user: req.userId })
      .populate('site', 'name.en name.rw coverImage province category')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Visit.countDocuments({ user: req.userId }),
  ]);

  res.status(200).json({ success: true, total, visits });
});

// ─── GET VISIT STATS FOR A SITE (admin) ──────────────────────────────────────
exports.getSiteVisitStats = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const site = await Site.findById(siteId);
  if (!site) return next(new NotFound('Site not found.'));

  const stats = await Visit.aggregate([
    { $match: { site: site._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byTrigger: {
          $push: '$trigger',
        },
        avgDistance: { $avg: '$distanceFromSite' },
      },
    },
  ]);

  res.status(200).json({ success: true, stats: stats[0] || { total: 0 } });
});

// ─── CHECK IF USER HAS VISITED A SITE ────────────────────────────────────────
exports.checkVisited = asyncWrapper(async (req, res) => {
  const visited = await Visit.exists({ user: req.userId, site: req.params.siteId });
  res.status(200).json({ success: true, visited: !!visited });
});