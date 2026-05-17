const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const Activity = require('../Models/Activity');
const Site = require('../Models/Site');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ─── Helper: check site access (admin or assigned moderator) ─────────────────
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

// ─── CREATE ACTIVITY ──────────────────────────────────────────────────────────
exports.createActivity = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { name, description, duration, included, order } = req.body;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  if (!name) return next(new BadRequest('Activity name is required.'));

  const parseMl = (val) => {
    if (!val) return { en: '', rw: '', fr: '' };
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return { en: val, rw: '', fr: '' }; }
  };

  let imageUrl = '';
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Activities',
    });
    imageUrl = result.secure_url;
  }

  const activity = await Activity.create({
    site: siteId,
    name: parseMl(name),
    description: parseMl(description),
    duration: duration || '',
    included: included !== undefined ? included : true,
    order: order || 0,
    image: imageUrl,
    createdBy: req.userId,
  });

  res.status(201).json({ success: true, activity });
});

// ─── GET ALL ACTIVITIES FOR A SITE ───────────────────────────────────────────
exports.getSiteActivities = asyncWrapper(async (req, res) => {
  const activities = await Activity.find({ site: req.params.siteId }).sort('order');
  res.status(200).json({ success: true, count: activities.length, activities });
});

// ─── GET SINGLE ACTIVITY ──────────────────────────────────────────────────────
exports.getActivity = asyncWrapper(async (req, res, next) => {
  const activity = await Activity.findOne({
    _id: req.params.activityId,
    site: req.params.siteId,
  });
  if (!activity) return next(new NotFound('Activity not found.'));
  res.status(200).json({ success: true, activity });
});

// ─── UPDATE ACTIVITY ──────────────────────────────────────────────────────────
exports.updateActivity = asyncWrapper(async (req, res, next) => {
  const { siteId, activityId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const activity = await Activity.findOne({ _id: activityId, site: siteId });
  if (!activity) return next(new NotFound('Activity not found.'));

  const parseMl = (val) => {
    if (!val) return undefined;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return { en: val, rw: '', fr: '' }; }
  };

  if (req.body.name) activity.name = parseMl(req.body.name);
  if (req.body.description) activity.description = parseMl(req.body.description);
  if (req.body.duration !== undefined) activity.duration = req.body.duration;
  if (req.body.included !== undefined) activity.included = req.body.included;
  if (req.body.order !== undefined) activity.order = req.body.order;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Activities',
    });
    activity.image = result.secure_url;
  }

  await activity.save();
  res.status(200).json({ success: true, activity });
});

// ─── DELETE ACTIVITY ──────────────────────────────────────────────────────────
exports.deleteActivity = asyncWrapper(async (req, res, next) => {
  const { siteId, activityId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const activity = await Activity.findOneAndDelete({ _id: activityId, site: siteId });
  if (!activity) return next(new NotFound('Activity not found.'));

  res.status(200).json({ success: true, message: 'Activity deleted.' });
});