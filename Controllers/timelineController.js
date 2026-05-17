const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const TimelineEvent = require('../Models/TimelineEvent');
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

// ─── CREATE TIMELINE EVENT ────────────────────────────────────────────────────
exports.createTimelineEvent = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { year, month, title, description, isKeyEvent } = req.body;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }
  if (!year) return next(new BadRequest('Year is required.'));
  if (!title) return next(new BadRequest('Event title is required.'));

  let imageUrl = '';
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Timeline',
    });
    imageUrl = result.secure_url;
  }

  const event = await TimelineEvent.create({
    site: siteId,
    year: Number(year),
    month: month ? Number(month) : null,
    title: parseMl(title),
    description: parseMl(description),
    image: imageUrl,
    isKeyEvent: isKeyEvent === 'true' || isKeyEvent === true,
    createdBy: req.userId,
  });

  res.status(201).json({ success: true, event });
});

// ─── GET TIMELINE FOR A SITE (sorted chronologically) ────────────────────────
exports.getSiteTimeline = asyncWrapper(async (req, res) => {
  const events = await TimelineEvent.find({ site: req.params.siteId })
    .sort({ year: 1, month: 1 });
  res.status(200).json({ success: true, count: events.length, events });
});

// ─── GET SINGLE TIMELINE EVENT ────────────────────────────────────────────────
exports.getTimelineEvent = asyncWrapper(async (req, res, next) => {
  const event = await TimelineEvent.findOne({
    _id: req.params.eventId,
    site: req.params.siteId,
  });
  if (!event) return next(new NotFound('Timeline event not found.'));
  res.status(200).json({ success: true, event });
});

// ─── UPDATE TIMELINE EVENT ────────────────────────────────────────────────────
exports.updateTimelineEvent = asyncWrapper(async (req, res, next) => {
  const { siteId, eventId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const event = await TimelineEvent.findOne({ _id: eventId, site: siteId });
  if (!event) return next(new NotFound('Timeline event not found.'));

  if (req.body.year !== undefined) event.year = Number(req.body.year);
  if (req.body.month !== undefined) event.month = req.body.month ? Number(req.body.month) : null;
  if (req.body.title) event.title = parseMl(req.body.title);
  if (req.body.description) event.description = parseMl(req.body.description);
  if (req.body.isKeyEvent !== undefined) event.isKeyEvent = req.body.isKeyEvent === 'true' || req.body.isKeyEvent === true;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Timeline',
    });
    event.image = result.secure_url;
  }

  await event.save();
  res.status(200).json({ success: true, event });
});

// ─── DELETE TIMELINE EVENT ────────────────────────────────────────────────────
exports.deleteTimelineEvent = asyncWrapper(async (req, res, next) => {
  const { siteId, eventId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const event = await TimelineEvent.findOneAndDelete({ _id: eventId, site: siteId });
  if (!event) return next(new NotFound('Timeline event not found.'));

  res.status(200).json({ success: true, message: 'Timeline event deleted.' });
});