const asyncWrapper = require('../Middleware/async');
const { NotFound, ForbiddenError } = require('../Error/index');
const VisitorInfo = require('../Models/VisitorInfo');
const Site = require('../Models/Site');

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

// ─── GET VISITOR INFO FOR A SITE ──────────────────────────────────────────────
// Public — anyone can read this
exports.getVisitorInfo = asyncWrapper(async (req, res) => {
  const info = await VisitorInfo.findOne({ site: req.params.siteId });
  res.status(200).json({ success: true, visitorInfo: info || null });
});

// ─── CREATE OR UPDATE VISITOR INFO ───────────────────────────────────────────
// One VisitorInfo per site — if it exists update it, if not create it
exports.upsertVisitorInfo = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  const {
    gettingThere, parking, parkingDetails,
    wheelchairAccessible, accessibility,
    bestTimeToVisit, averageVisitDuration,
    guidedTours, guidedTourSchedule, guidedTourFee, availableLanguages,
    nearbyAccommodation, nearbyRestaurants, nearbyAttractions,
    dresscode, photographyAllowed, photographyRules, tips,
    phone, email, officialWebsite, socialMedia,
  } = req.body;

  const data = {
    site: siteId,
    updatedBy: req.userId,
  };

  // Only include fields that were sent
  if (gettingThere !== undefined) data.gettingThere = parseMl(gettingThere);
  if (parking !== undefined) data.parking = parking === 'true' || parking === true;
  if (parkingDetails !== undefined) data.parkingDetails = parseMl(parkingDetails);
  if (wheelchairAccessible !== undefined) data.wheelchairAccessible = wheelchairAccessible === 'true' || wheelchairAccessible === true;
  if (accessibility !== undefined) data.accessibility = parseMl(accessibility);
  if (bestTimeToVisit !== undefined) data.bestTimeToVisit = parseMl(bestTimeToVisit);
  if (averageVisitDuration !== undefined) data.averageVisitDuration = averageVisitDuration;
  if (guidedTours !== undefined) data.guidedTours = guidedTours === 'true' || guidedTours === true;
  if (guidedTourSchedule !== undefined) data.guidedTourSchedule = guidedTourSchedule;
  if (guidedTourFee !== undefined) data.guidedTourFee = guidedTourFee;
  if (availableLanguages !== undefined) data.availableLanguages = Array.isArray(availableLanguages) ? availableLanguages : [availableLanguages];
  if (nearbyAccommodation !== undefined) data.nearbyAccommodation = parseMl(nearbyAccommodation);
  if (nearbyRestaurants !== undefined) data.nearbyRestaurants = parseMl(nearbyRestaurants);
  if (nearbyAttractions !== undefined) data.nearbyAttractions = parseMl(nearbyAttractions);
  if (dresscode !== undefined) data.dresscode = parseMl(dresscode);
  if (photographyAllowed !== undefined) data.photographyAllowed = photographyAllowed === 'true' || photographyAllowed === true;
  if (photographyRules !== undefined) data.photographyRules = parseMl(photographyRules);
  if (tips !== undefined) data.tips = parseMl(tips);
  if (phone !== undefined) data.phone = phone;
  if (email !== undefined) data.email = email;
  if (officialWebsite !== undefined) data.officialWebsite = officialWebsite;
  if (socialMedia !== undefined) {
    data.socialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia;
  }

  // upsert: true → creates if doesn't exist, updates if it does
  const info = await VisitorInfo.findOneAndUpdate(
    { site: siteId },
    { $set: data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, visitorInfo: info });
});

// ─── DELETE VISITOR INFO ──────────────────────────────────────────────────────
exports.deleteVisitorInfo = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;

  try { await checkSiteAccess(siteId, req.user); } catch (e) { return next(e); }

  await VisitorInfo.findOneAndDelete({ site: siteId });
  res.status(200).json({ success: true, message: 'Visitor info deleted.' });
});