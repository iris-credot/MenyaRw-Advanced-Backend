const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const Site = require('../Models/Site');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ─── CREATE SITE (admin) ──────────────────────────────────────────────────────
exports.createSite = asyncWrapper(async (req, res, next) => {
  const {
    name, category, province, district, historicalPeriod,
    shortDescription, fullStory, significance, historicalFacts,
    longitude, latitude,
    address, openingHours, admissionFee, contactInfo, website,
    geofenceTeaser, geofenceWelcome,
  } = req.body;

  if (!name || !category || !province || !longitude || !latitude) {
    return next(new BadRequest('name, category, province, longitude, and latitude are required.'));
  }

  // Parse multilingual JSON strings sent from forms
  const parseMl = (val) => {
    if (!val) return { en: '', rw: '', fr: '' };
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return { en: val, rw: '', fr: '' }; }
  };

  let coverImage = '';
  const images = [];

  if (req.files) {
    if (req.files.coverImage) {
      const r = await cloudinary.uploader.upload(req.files.coverImage[0].path, {
        folder: 'MenyaRwanda/Sites',
      });
      coverImage = r.secure_url;
    }
    if (req.files.images) {
      for (const file of req.files.images) {
        const r = await cloudinary.uploader.upload(file.path, {
          folder: 'MenyaRwanda/Sites',
        });
        images.push(r.secure_url);
      }
    }
  }

  const site = await Site.create({
    name: parseMl(name),
    category,
    province,
    district,
    historicalPeriod,
    shortDescription: parseMl(shortDescription),
    fullStory: parseMl(fullStory),
    significance: parseMl(significance),
    historicalFacts: historicalFacts ? JSON.parse(historicalFacts) : [],
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    address,
    openingHours,
    admissionFee,
    contactInfo,
    website,
    coverImage,
    images,
    geofence: {
      teaser: parseMl(geofenceTeaser),
      welcome: parseMl(geofenceWelcome),
    },
    createdBy: req.userId,
  });

  res.status(201).json({ success: true, site });
});

// ─── GET ALL SITES (with filtering, sorting, pagination) ──────────────────────
exports.getAllSites = asyncWrapper(async (req, res) => {
  const {
    category, province, historicalPeriod, search,
    page = 1, limit = 20, sort = '-createdAt',
    published,
  } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (province) filter.province = province;
  if (historicalPeriod) filter.historicalPeriod = historicalPeriod;
  if (published !== undefined) filter.isPublished = published === 'true';
  else filter.isPublished = true; // non-admins only see published

  if (search) {
    filter.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { 'name.rw': { $regex: search, $options: 'i' } },
      { 'name.fr': { $regex: search, $options: 'i' } },
      { 'shortDescription.en': { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [sites, total] = await Promise.all([
    Site.find(filter)
      .populate('category', 'name color icon slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-fullStory -historicalFacts'), // exclude heavy fields from list view
    Site.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    sites,
  });
});

// ─── GET SITE BY ID OR SLUG ───────────────────────────────────────────────────
exports.getSite = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { slug: id };

  const site = await Site.findOne(query)
    .populate('category', 'name color icon')
    .populate('createdBy', 'firstName lastName');

  if (!site) return next(new NotFound('Heritage site not found.'));
  res.status(200).json({ success: true, site });
});

// ─── UPDATE SITE (admin OR assigned guide) ───────────────────────────────────
exports.updateSite = asyncWrapper(async (req, res, next) => {
  const site = await Site.findById(req.params.id);
  if (!site) return next(new NotFound('Heritage site not found.'));

  const isAdmin = req.user.role === 'admin';
  const isAssignedGuide =
    req.user.role === 'guide' &&
    site.assignedGuide?.toString() === req.userId.toString();

  if (!isAdmin && !isAssignedGuide) {
    return next(new ForbiddenError('You are not authorized to edit this site.'));
  }

  const updateData = { ...req.body };

  // ─── Guides can only update content fields, not structural/admin fields ──────
  if (isAssignedGuide) {
    const guideAllowedFields = [
      'shortDescription', 'fullStory', 'significance', 'historicalFacts',
      'openingHours', 'admissionFee', 'contactInfo', 'website', 'audioGuideUrl',
      'geofence',
    ];
    // Strip any fields a guide is not allowed to touch
    Object.keys(updateData).forEach((key) => {
      if (!guideAllowedFields.includes(key)) delete updateData[key];
    });
  }

  // Handle coordinate updates (admin only — guides cannot move a site)
  if (isAdmin && (req.body.longitude || req.body.latitude)) {
    updateData.location = {
      type: 'Point',
      coordinates: [
        parseFloat(req.body.longitude) || site.location.coordinates[0],
        parseFloat(req.body.latitude)  || site.location.coordinates[1],
      ],
    };
    delete updateData.longitude;
    delete updateData.latitude;
  }

  if (req.files?.coverImage) {
    const r = await cloudinary.uploader.upload(req.files.coverImage[0].path, {
      folder: 'MenyaRwanda/Sites',
    });
    updateData.coverImage = r.secure_url;
  }

  const updated = await Site.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('category', 'name color icon');

  res.status(200).json({ success: true, site: updated });
});

// ─── DELETE SITE (admin) ──────────────────────────────────────────────────────
exports.deleteSite = asyncWrapper(async (req, res, next) => {
  const site = await Site.findByIdAndDelete(req.params.id);
  if (!site) return next(new NotFound('Heritage site not found.'));
  res.status(200).json({ success: true, message: 'Heritage site deleted.' });
});

// ─── NEARBY SITES (geospatial) ────────────────────────────────────────────────
// GET /api/v1/sites/nearby?longitude=XX&latitude=YY&radius=5000
exports.getNearbySites = asyncWrapper(async (req, res, next) => {
  const { longitude, latitude, radius = 5000, limit = 10 } = req.query;

  if (!longitude || !latitude) {
    return next(new BadRequest('longitude and latitude query params are required.'));
  }

  const sites = await Site.find({
    isPublished: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        $maxDistance: Number(radius),
      },
    },
  })
    .limit(Number(limit))
    .populate('category', 'name color icon')
    .select('name coverImage province category location averageRating geofence');

  res.status(200).json({ success: true, count: sites.length, sites });
});

// ─── FEATURED SITES ───────────────────────────────────────────────────────────
exports.getFeaturedSites = asyncWrapper(async (req, res) => {
  const sites = await Site.find({ isPublished: true, isFeatured: true })
    .populate('category', 'name color icon')
    .select('name coverImage province category averageRating totalVisits')
    .limit(10);
  res.status(200).json({ success: true, sites });
});

// ─── TOGGLE PUBLISH / FEATURE (admin) ─────────────────────────────────────────
exports.togglePublish = asyncWrapper(async (req, res, next) => {
  const site = await Site.findById(req.params.id);
  if (!site) return next(new NotFound('Site not found.'));
  site.isPublished = !site.isPublished;
  await site.save();
  res.status(200).json({ success: true, isPublished: site.isPublished });
});

exports.toggleFeature = asyncWrapper(async (req, res, next) => {
  const site = await Site.findById(req.params.id);
  if (!site) return next(new NotFound('Site not found.'));
  site.isFeatured = !site.isFeatured;
  await site.save();
  res.status(200).json({ success: true, isFeatured: site.isFeatured });
});