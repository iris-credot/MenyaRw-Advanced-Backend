const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound, ForbiddenError } = require('../Error/index');
const User = require('../Models/User');
const Site = require('../Models/Site');
const Notification = require('../Models/Notification');
const sendEmail = require('../Middleware/sendMail');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ─── Helper: generate a readable temporary password ───────────────────────────
// e.g. "Menya@4821" — easy to type, meets 8-char minimum
const generateTempPassword = () => {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const chars = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Menya@${chars}${digits}`.slice(0, 14);
};

// ─── CREATE GUIDE (admin only) ────────────────────────────────────────────────
// Admin fills in guide details + selects the site → system creates the account
// and emails login credentials to the guide.
exports.createGuide = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, phoneNumber, siteId, preferredLanguage } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!firstName || !email || !siteId) {
    return next(new BadRequest('firstName, email, and siteId are required.'));
  }

  // Check site exists
  const site = await Site.findById(siteId);
  if (!site) return next(new NotFound('Heritage site not found.'));

  // Check site doesn't already have a guide
  if (site.assignedGuide) {
    const existingGuide = await User.findById(site.assignedGuide).select('firstName lastName email');
    return next(
      new BadRequest(
        `This site already has an assigned guide: ${existingGuide?.firstName} ${existingGuide?.lastName} (${existingGuide?.email}). Remove them first before assigning a new guide.`
      )
    );
  }

  // Check email not already in use
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new BadRequest('A user with this email already exists.'));

  // ── Profile image upload (optional) ─────────────────────────────────────────
  let imageUrl = '';
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Guides',
      public_id: `GUIDE_${Date.now()}`,
    });
    imageUrl = result.secure_url;
  }

  // ── Create the account ───────────────────────────────────────────────────────
  const tempPassword = generateTempPassword();

  const guide = await User.create({
    firstName,
    lastName: lastName || '',
    username: `${firstName}${lastName || ''}`.toLowerCase().replace(/\s/g, ''),
    email: email.toLowerCase(),
    password: tempPassword,         // will be hashed by pre-save hook
    role: 'guide',
    phoneNumber: phoneNumber || '',
    preferredLanguage: preferredLanguage || 'en',
    image: imageUrl,
    verified: true,                 // admin-created accounts skip email OTP
    mustChangePassword: true,       // guide must set their own password on first login
  });

  // ── Assign guide to site ─────────────────────────────────────────────────────
  site.assignedGuide = guide._id;
  await site.save();

  // ── Send credentials email ───────────────────────────────────────────────────
  const siteName = site.name.en || site.name.rw || 'your assigned site';
  const loginUrl = `${process.env.CLIENT_URL}/login`;

  await sendEmail(
    guide.email,
    'Welcome to Menya Rwanda – Your Guide Account',
    `Dear ${firstName},\n\nYou have been assigned as the content guide for "${siteName}" on the Menya Rwanda platform.\n\nHere are your login credentials:\n\n  Email:    ${guide.email}\n  Password: ${tempPassword}\n\nPlease log in at: ${loginUrl}\n\nIMPORTANT: You will be required to change your password immediately after your first login.\n\nAs a guide, you can:\n- Update the story, historical facts, and descriptions for "${siteName}"\n- Upload photos and update visiting information\n- View visit statistics and reviews for your site\n\nIf you have any questions, please contact the Menya Rwanda admin team.\n\nBest regards,\nMenya Rwanda Team`,
    // HTML version
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2B6CB0;">Welcome to Menya Rwanda 🏛️</h2>
      <p>Dear <strong>${firstName}</strong>,</p>
      <p>You have been assigned as the content guide for <strong>"${siteName}"</strong> on the Menya Rwanda platform.</p>
      <div style="background: #f7fafc; border-left: 4px solid #2B6CB0; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>Email:</strong> ${guide.email}</p>
        <p style="margin: 8px 0 0;"><strong>Temporary Password:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
      </div>
      <p>⚠️ <strong>You will be required to change your password immediately after your first login.</strong></p>
      <a href="${loginUrl}" style="display: inline-block; background: #2B6CB0; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0;">Login to Menya Rwanda</a>
      <p>As a guide, you can update content, upload photos, and view analytics for your assigned site.</p>
      <p>Best regards,<br><strong>Menya Rwanda Team</strong></p>
    </div>`
  );

  // ── In-app welcome notification ───────────────────────────────────────────────
  await Notification.create({
    user: guide._id,
    title: 'Welcome, Guide! 🏛️',
    message: `Your guide account has been created. You are assigned to "${siteName}". Please change your password after your first login.`,
    type: 'account',
    site: site._id,
  });

  // Don't return the temp password in the API response
  guide.password = undefined;

  res.status(201).json({
    success: true,
    message: `Guide account created. Login credentials sent to ${guide.email}.`,
    guide: {
      _id: guide._id,
      firstName: guide.firstName,
      lastName: guide.lastName,
      email: guide.email,
      role: guide.role,
      image: guide.image,
      assignedSite: {
        _id: site._id,
        name: site.name,
        province: site.province,
      },
    },
  });
});

// ─── GET ALL GUIDES (admin) ───────────────────────────────────────────────────
exports.getAllGuides = asyncWrapper(async (req, res) => {
  const guides = await User.find({ role: 'guide' }).select('-otp -otpExpires -notifiedGeofences');

  // Attach each guide's assigned site
  const guidesWithSites = await Promise.all(
    guides.map(async (guide) => {
      const site = await Site.findOne({ assignedGuide: guide._id }).select(
        'name province coverImage isPublished'
      );
      return { ...guide.toObject(), assignedSite: site || null };
    })
  );

  res.status(200).json({ success: true, count: guides.length, guides: guidesWithSites });
});

// ─── GET GUIDE BY ID ──────────────────────────────────────────────────────────
exports.getGuideById = asyncWrapper(async (req, res, next) => {
  const guide = await User.findOne({ _id: req.params.id, role: 'guide' }).select(
    '-otp -otpExpires -notifiedGeofences -savedSites'
  );
  if (!guide) return next(new NotFound('Guide not found.'));

  const assignedSite = await Site.findOne({ assignedGuide: guide._id })
    .populate('category', 'name color')
    .select('name province coverImage isPublished category averageRating totalVisits');

  res.status(200).json({ success: true, guide: { ...guide.toObject(), assignedSite } });
});

// ─── GET MY ASSIGNED SITE (guide sees their own site) ────────────────────────
exports.getMyAssignedSite = asyncWrapper(async (req, res, next) => {
  if (req.user.role !== 'guide') {
    return next(new ForbiddenError('Only guides can access this endpoint.'));
  }

  const site = await Site.findOne({ assignedGuide: req.userId })
    .populate('category', 'name color icon')
    .populate('assignedGuide', 'firstName lastName email image');

  if (!site) {
    return res.status(200).json({ success: true, site: null, message: 'No site assigned yet.' });
  }

  res.status(200).json({ success: true, site });
});

// ─── REASSIGN GUIDE TO A DIFFERENT SITE (admin) ──────────────────────────────
exports.reassignGuide = asyncWrapper(async (req, res, next) => {
  const { guideId, newSiteId } = req.body;
  if (!guideId || !newSiteId) return next(new BadRequest('guideId and newSiteId are required.'));

  const guide = await User.findOne({ _id: guideId, role: 'guide' });
  if (!guide) return next(new NotFound('Guide not found.'));

  const newSite = await Site.findById(newSiteId);
  if (!newSite) return next(new NotFound('New heritage site not found.'));

  // Check the new site doesn't already have a different guide
  if (newSite.assignedGuide && newSite.assignedGuide.toString() !== guideId) {
    return next(new BadRequest('The new site already has a different guide assigned.'));
  }

  // Remove guide from their current site
  await Site.findOneAndUpdate({ assignedGuide: guideId }, { assignedGuide: null });

  // Assign to new site
  newSite.assignedGuide = guide._id;
  await newSite.save();

  const siteName = newSite.name.en || newSite.name.rw;

  // Notify the guide
  await Notification.create({
    user: guide._id,
    title: 'Site Assignment Updated',
    message: `You have been reassigned to "${siteName}".`,
    type: 'account',
    site: newSite._id,
  });

  // Email the guide about reassignment
  await sendEmail(
    guide.email,
    'Menya Rwanda – Your Site Assignment Has Changed',
    `Dear ${guide.firstName},\n\nYour guide assignment has been updated.\n\nYou are now the content guide for: "${siteName}"\n\nLog in to your account to start managing this site's content.\n\nBest regards,\nMenya Rwanda Team`
  );

  res.status(200).json({
    success: true,
    message: `${guide.firstName} has been reassigned to "${siteName}".`,
    guide: { _id: guide._id, firstName: guide.firstName, email: guide.email },
    newSite: { _id: newSite._id, name: newSite.name, province: newSite.province },
  });
});

// ─── REMOVE GUIDE FROM SITE (admin) ──────────────────────────────────────────
exports.unassignGuide = asyncWrapper(async (req, res, next) => {
  const { guideId } = req.params;

  const guide = await User.findOne({ _id: guideId, role: 'guide' });
  if (!guide) return next(new NotFound('Guide not found.'));

  const site = await Site.findOneAndUpdate(
    { assignedGuide: guideId },
    { assignedGuide: null },
    { new: true }
  );

  if (!site) {
    return res.status(200).json({ success: true, message: 'Guide had no site assigned.' });
  }

  await Notification.create({
    user: guide._id,
    title: 'Site Assignment Removed',
    message: `You have been unassigned from "${site.name.en || site.name.rw}".`,
    type: 'account',
  });

  res.status(200).json({
    success: true,
    message: `${guide.firstName} has been unassigned from "${site.name.en}".`,
  });
});

// ─── DELETE GUIDE ACCOUNT (admin) ─────────────────────────────────────────────
exports.deleteGuide = asyncWrapper(async (req, res, next) => {
  const guide = await User.findOne({ _id: req.params.id, role: 'guide' });
  if (!guide) return next(new NotFound('Guide not found.'));

  // Free up the site first
  await Site.findOneAndUpdate({ assignedGuide: guide._id }, { assignedGuide: null });

  await User.findByIdAndDelete(guide._id);

  res.status(200).json({ success: true, message: 'Guide account deleted and site unassigned.' });
});

// ─── RESET GUIDE PASSWORD (admin) ─────────────────────────────────────────────
// If a guide loses access, admin can reset their credentials
exports.resetGuidePassword = asyncWrapper(async (req, res, next) => {
  const guide = await User.findOne({ _id: req.params.id, role: 'guide' });
  if (!guide) return next(new NotFound('Guide not found.'));

  const tempPassword = generateTempPassword();
  guide.password = tempPassword;
  guide.mustChangePassword = true;
  await guide.save();

  await sendEmail(
    guide.email,
    'Menya Rwanda – Your Password Has Been Reset',
    `Dear ${guide.firstName},\n\nYour password has been reset by an administrator.\n\nNew temporary password: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\nMenya Rwanda Team`
  );

  res.status(200).json({
    success: true,
    message: `Password reset. New credentials sent to ${guide.email}.`,
  });
});