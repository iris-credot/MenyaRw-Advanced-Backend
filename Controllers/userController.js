const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound } = require('../Error/index');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ─── GET ALL USERS (admin) ────────────────────────────────────────────────────
exports.getAllUsers = asyncWrapper(async (req, res) => {
  const users = await User.find({}).select('-otp -otpExpires');
  res.status(200).json({ success: true, count: users.length, users });
});

// ─── GET USER BY ID ───────────────────────────────────────────────────────────
exports.getUserById = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-otp -otpExpires').populate('savedSites', 'name.en coverImage province');
  if (!user) return next(new NotFound('User not found.'));
  res.status(200).json({ success: true, user });
});

// ─── UPDATE USER PROFILE ──────────────────────────────────────────────────────
exports.updateProfile = asyncWrapper(async (req, res, next) => {
  // Fields that are safe to update
  const allowed = ['firstName', 'lastName', 'username', 'bio', 'phoneNumber', 'dateOfBirth', 'gender', 'preferredLanguage'];
  const updateData = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Users',
      public_id: `USER_${req.userId}_${Date.now()}`,
    });
    updateData.image = result.secure_url;
  }

  const user = await User.findByIdAndUpdate(req.userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-otp -otpExpires');

  if (!user) return next(new NotFound('User not found.'));

  res.status(200).json({ success: true, message: 'Profile updated.', user });
});

// ─── UPDATE PASSWORD ──────────────────────────────────────────────────────────
exports.updatePassword = asyncWrapper(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new BadRequest('Both current and new password are required.'));
  }
  if (newPassword.length < 8) {
    return next(new BadRequest('New password must be at least 8 characters.'));
  }

  const user = await User.findById(req.userId).select('+password');
  if (!user) return next(new NotFound('User not found.'));

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return next(new BadRequest('Current password is incorrect.'));

  user.password = newPassword;
  user.mustChangePassword = false; // Clear the forced-change flag (for guides)
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully.' });
});

// ─── DELETE USER (admin or self) ──────────────────────────────────────────────
exports.deleteUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new NotFound('User not found.'));
  res.status(200).json({ success: true, message: 'User deleted.' });
});

// ─── SAVE / UNSAVE A HERITAGE SITE ────────────────────────────────────────────
exports.toggleSavedSite = asyncWrapper(async (req, res, next) => {
  const { siteId } = req.params;
  const user = await User.findById(req.userId);
  if (!user) return next(new NotFound('User not found.'));

  const isSaved = user.savedSites.some((id) => id.toString() === siteId);

  if (isSaved) {
    user.savedSites = user.savedSites.filter((id) => id.toString() !== siteId);
    await user.save();
    return res.status(200).json({ success: true, message: 'Site removed from saved.', saved: false });
  } else {
    user.savedSites.push(siteId);
    await user.save();
    return res.status(200).json({ success: true, message: 'Site saved.', saved: true });
  }
});

// ─── GET USER'S SAVED SITES ───────────────────────────────────────────────────
exports.getSavedSites = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate({
      path: 'savedSites',
      select: 'name.en name.rw name.fr coverImage province category averageRating',
      populate: { path: 'category', select: 'name color icon' },
    });
  res.status(200).json({ success: true, savedSites: user.savedSites });
});

// ─── REGISTER / UPDATE FCM TOKEN (for push notifications) ────────────────────
exports.updateFcmToken = asyncWrapper(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return next(new BadRequest('FCM token is required.'));

  await User.findByIdAndUpdate(req.userId, { fcmToken });
  res.status(200).json({ success: true, message: 'FCM token registered.' });
});