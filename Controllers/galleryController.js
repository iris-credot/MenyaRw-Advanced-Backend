const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const Gallery = require('../Models/Gallery');
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

// ─── ADD MEDIA TO GALLERY ─────────────────────────────────────────────────────
exports.addGalleryItem = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { type, title, caption, videoUrl, thumbnailUrl, order, isCover } = req.body;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }
  if (!type) return next(new BadRequest('Media type (photo or video) is required.'));

  let url = '';

  if (type === 'photo') {
    // Photo — must upload a file
    if (!req.file) return next(new BadRequest('Image file is required for photo type.'));
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Gallery',
    });
    url = result.secure_url;
  } else if (type === 'video') {
    // Video — moderator provides YouTube embed URL
    if (!videoUrl) return next(new BadRequest('videoUrl is required for video type.'));
    url = videoUrl;
  }

  const item = await Gallery.create({
    site: siteId,
    type,
    title: parseMl(title),
    caption: parseMl(caption),
    url,
    thumbnailUrl: thumbnailUrl || '',
    order: order || 0,
    isCover: isCover === 'true' || isCover === true,
    createdBy: req.userId,
  });

  // If this is set as cover, unset any previous cover
  if (item.isCover) {
    await Gallery.updateMany(
      { site: siteId, _id: { $ne: item._id }, isCover: true },
      { isCover: false }
    );
  }

  res.status(201).json({ success: true, item });
});

// ─── GET GALLERY FOR A SITE ───────────────────────────────────────────────────
exports.getSiteGallery = asyncWrapper(async (req, res) => {
  const { type } = req.query; // optional filter: ?type=photo or ?type=video
  const filter = { site: req.params.siteId };
  if (type) filter.type = type;

  const items = await Gallery.find(filter).sort('order');
  res.status(200).json({ success: true, count: items.length, gallery: items });
});

// ─── GET SINGLE GALLERY ITEM ──────────────────────────────────────────────────
exports.getGalleryItem = asyncWrapper(async (req, res, next) => {
  const item = await Gallery.findOne({
    _id: req.params.itemId,
    site: req.params.siteId,
  });
  if (!item) return next(new NotFound('Gallery item not found.'));
  res.status(200).json({ success: true, item });
});

// ─── UPDATE GALLERY ITEM ──────────────────────────────────────────────────────
exports.updateGalleryItem = asyncWrapper(async (req, res, next) => {
  const { siteId, itemId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const item = await Gallery.findOne({ _id: itemId, site: siteId });
  if (!item) return next(new NotFound('Gallery item not found.'));

  if (req.body.title) item.title = parseMl(req.body.title);
  if (req.body.caption) item.caption = parseMl(req.body.caption);
  if (req.body.order !== undefined) item.order = req.body.order;
  if (req.body.thumbnailUrl) item.thumbnailUrl = req.body.thumbnailUrl;
  if (req.body.isCover !== undefined) {
    item.isCover = req.body.isCover === 'true' || req.body.isCover === true;
    if (item.isCover) {
      await Gallery.updateMany(
        { site: siteId, _id: { $ne: itemId }, isCover: true },
        { isCover: false }
      );
    }
  }

  // Replace photo if new file uploaded
  if (req.file && item.type === 'photo') {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Gallery',
    });
    item.url = result.secure_url;
  }

  // Replace video URL
  if (req.body.videoUrl && item.type === 'video') {
    item.url = req.body.videoUrl;
  }

  await item.save();
  res.status(200).json({ success: true, item });
});

// ─── DELETE GALLERY ITEM ──────────────────────────────────────────────────────
exports.deleteGalleryItem = asyncWrapper(async (req, res, next) => {
  const { siteId, itemId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const item = await Gallery.findOneAndDelete({ _id: itemId, site: siteId });
  if (!item) return next(new NotFound('Gallery item not found.'));

  res.status(200).json({ success: true, message: 'Gallery item deleted.' });
});

// ─── BULK DELETE GALLERY (admin only — clear all media for a site) ────────────
exports.clearGallery = asyncWrapper(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ForbiddenError('Admin only.'));
  await Gallery.deleteMany({ site: req.params.siteId });
  res.status(200).json({ success: true, message: 'Gallery cleared.' });
});