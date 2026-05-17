const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const Exhibit = require('../Models/Exhibit');
const Site = require('../Models/Site');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const checkSiteAccess = async (siteId, user) => {
  const site = await Site.findById(siteId);
  if (!site) throw new NotFound('Heritage site not found.');
  const isAdmin = user.role === 'admin';
  const isAssignedModerator =
    user.role === 'moderator' &&
    site.assignedGuide?.toString() === user._id.toString();
  if (!isAdmin && !isAssignedModerator) {
    throw new ForbiddenError('You are not authorized to manage this site\'s content.');
  }
  return site;
};

const parseMl = (val) => {
  if (!val) return { en: '', rw: '', fr: '' };
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return { en: val, rw: '', fr: '' }; }
};

// ─── CREATE EXHIBIT ───────────────────────────────────────────────────────────
exports.createExhibit = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { name, description, yearCreated, origin, material, location, order } = req.body;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }
  if (!name) return next(new BadRequest('Exhibit name is required.'));

  let imageUrl = '';
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Exhibits',
    });
    imageUrl = result.secure_url;
  }

  const exhibit = await Exhibit.create({
    site: siteId,
    name: parseMl(name),
    description: parseMl(description),
    yearCreated: yearCreated || null,
    origin: parseMl(origin),
    material: parseMl(material),
    location: parseMl(location),
    order: order || 0,
    image: imageUrl,
    createdBy: req.userId,
  });

  res.status(201).json({ success: true, exhibit });
});

// ─── GET ALL EXHIBITS FOR A SITE ──────────────────────────────────────────────
exports.getSiteExhibits = asyncWrapper(async (req, res) => {
  const exhibits = await Exhibit.find({ site: req.params.siteId }).sort('order');
  res.status(200).json({ success: true, count: exhibits.length, exhibits });
});

// ─── GET SINGLE EXHIBIT ───────────────────────────────────────────────────────
exports.getExhibit = asyncWrapper(async (req, res, next) => {
  const exhibit = await Exhibit.findOne({
    _id: req.params.exhibitId,
    site: req.params.siteId,
  });
  if (!exhibit) return next(new NotFound('Exhibit not found.'));
  res.status(200).json({ success: true, exhibit });
});

// ─── UPDATE EXHIBIT ───────────────────────────────────────────────────────────
exports.updateExhibit = asyncWrapper(async (req, res, next) => {
  const { siteId, exhibitId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const exhibit = await Exhibit.findOne({ _id: exhibitId, site: siteId });
  if (!exhibit) return next(new NotFound('Exhibit not found.'));

  if (req.body.name) exhibit.name = parseMl(req.body.name);
  if (req.body.description) exhibit.description = parseMl(req.body.description);
  if (req.body.origin) exhibit.origin = parseMl(req.body.origin);
  if (req.body.material) exhibit.material = parseMl(req.body.material);
  if (req.body.location) exhibit.location = parseMl(req.body.location);
  if (req.body.yearCreated !== undefined) exhibit.yearCreated = req.body.yearCreated;
  if (req.body.order !== undefined) exhibit.order = req.body.order;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Exhibits',
    });
    exhibit.image = result.secure_url;
  }

  await exhibit.save();
  res.status(200).json({ success: true, exhibit });
});

// ─── DELETE EXHIBIT ───────────────────────────────────────────────────────────
exports.deleteExhibit = asyncWrapper(async (req, res, next) => {
  const { siteId, exhibitId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const exhibit = await Exhibit.findOneAndDelete({ _id: exhibitId, site: siteId });
  if (!exhibit) return next(new NotFound('Exhibit not found.'));

  res.status(200).json({ success: true, message: 'Exhibit deleted.' });
});