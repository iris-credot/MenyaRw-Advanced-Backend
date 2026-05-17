const asyncWrapper = require('../Middleware/async');
const { NotFound, BadRequest, ForbiddenError } = require('../Error/index');
const Review = require('../Models/Review');
const Site = require('../Models/Site');
const Visit = require('../Models/Visit');

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
exports.createReview = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const { rating, comment, visitedOn, language } = req.body;

  if (!rating) return next(new BadRequest('Rating is required.'));

  const site = await Site.findById(siteId);
  if (!site) return next(new NotFound('Heritage site not found.'));

  const existing = await Review.findOne({ site: siteId, user: req.userId });
  if (existing) return next(new BadRequest('You have already reviewed this site. Edit your existing review.'));

  const visited = await Visit.exists({ user: req.userId, site: siteId });

  const review = await Review.create({
    site: siteId,
    user: req.userId,
    rating,
    comment,
    visitedOn,
    // Use provided language or fall back to user's preferred language
    language: language || req.user.preferredLanguage || 'en',
    isVerifiedVisit: !!visited,
  });

  await review.populate('user', 'firstName lastName image preferredLanguage');

  res.status(201).json({ success: true, review });
});

// ─── GET ALL REVIEWS FOR A SITE ───────────────────────────────────────────────
exports.getSiteReviews = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ site: req.params.siteId })
      .populate('user', 'firstName lastName image')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ site: req.params.siteId }),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    reviews,
  });
});

// ─── UPDATE REVIEW ────────────────────────────────────────────────────────────
exports.updateReview = asyncWrapper(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new NotFound('Review not found.'));
  if (review.user.toString() !== req.userId.toString()) {
    return next(new ForbiddenError('You can only edit your own reviews.'));
  }

  const { rating, comment, visitedOn } = req.body;
  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (visitedOn) review.visitedOn = visitedOn;
  await review.save();

  res.status(200).json({ success: true, review });
});

// ─── DELETE REVIEW ────────────────────────────────────────────────────────────
exports.deleteReview = asyncWrapper(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new NotFound('Review not found.'));

  const isOwner = review.user.toString() === req.userId.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return next(new ForbiddenError('Not authorized.'));

  await Review.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Review deleted.' });
});

// ─── GET MY REVIEW FOR A SITE ─────────────────────────────────────────────────
exports.getMyReview = asyncWrapper(async (req, res) => {
  const review = await Review.findOne({ site: req.params.siteId, user: req.userId });
  res.status(200).json({ success: true, review: review || null });
});

