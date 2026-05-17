const jwt = require('jsonwebtoken');
const asyncWrapper = require('../Middleware/async');
const { BadRequest, UnauthorizedError, NotFound } = require('../Error/index');
const User = require('../Models/User');
const ResetToken = require('../Models/ResetToken');
const Notification = require('../Models/Notification');
const sendEmail = require('../Middleware/sendMail');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: create notification ─────────────────────────────────────────────
const createNotification = async (data) => {
  try {
    await Notification.create(data);
  } catch (e) {
    console.error('Notification creation failed:', e.message);
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, password, gender, phoneNumber, preferredLanguage } = req.body;

  if (!email || !password || !firstName) {
    return next(new BadRequest('First name, email, and password are required.'));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new BadRequest('Email is already in use.'));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  let imageUrl = '';
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Users',
      public_id: `USER_${Date.now()}`,
    });
    imageUrl = result.secure_url;
  }

  const user = await User.create({
    firstName,
    lastName,
    username: `${firstName}${lastName}`.toLowerCase().replace(/\s/g, ''),
    email: email.toLowerCase(),
    password,
    gender: gender || '',
    phoneNumber: phoneNumber || '',
    preferredLanguage: preferredLanguage || 'en',
    image: imageUrl,
    otp,
    otpExpires,
  });

  await createNotification({
    user: user._id,
    title: 'Welcome to Menya Rwanda! 🎉',
    message: 'Your account has been created. Please verify your email to continue.',
    type: 'account',
  });

  await sendEmail(
    user.email,
    'Menya Rwanda – Verify Your Account',
    `Welcome ${firstName}!\n\nYour OTP verification code is: ${otp}\nThis code expires in 5 minutes.\n\nBest regards,\nMenya Rwanda Team`
  );

  // Don't return password or OTP in response
  user.password = undefined;
  user.otp = undefined;

  res.status(201).json({
    success: true,
    message: 'Account created. OTP sent to your email.',
    user,
  });
});

exports.login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new BadRequest('Email and password are required.'));

  // 1. Authenticate
  let user;
  try {
    user = await User.login(email.toLowerCase(), password);
  } catch (err) {
    return next(new UnauthorizedError('Invalid email or password.'));
  }

  // 2. Block unverified regular users
  if (user.role === 'user' && !user.verified) {
    return next(new UnauthorizedError('Please verify your email before logging in.'));
  }

  // 3. Sign token
  const token = jwt.sign(
    { id: user._id },           // keep payload minimal — fetch fresh from DB in protect()
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // 4. Set cookie (for web dashboard) AND header (for mobile)
  res.cookie('jwt', token, {
    httpOnly: true,             // JS cannot access it — protects against XSS
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'none',           // allows cross-domain requests (mobile + web)
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
  });

  res.setHeader('Authorization', `Bearer ${token}`);

  // 5. Send response — only what frontend needs, not the whole user object
  res.status(200).json({
    success: true,
    token,
    mustChangePassword: user.mustChangePassword || false,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      image: user.image,
      preferredLanguage: user.preferredLanguage,
    },
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = asyncWrapper(async (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});
// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = asyncWrapper(async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) return next(new BadRequest('OTP is required.'));

  const user = await User.findOne({ otp });
  if (!user) return next(new UnauthorizedError('Invalid OTP.'));
  if (user.isOtpExpired()) return next(new UnauthorizedError('OTP has expired. Request a new one.'));

  user.verified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  await createNotification({
    user: user._id,
    title: 'Email Verified ✅',
    message: 'Your account has been verified. Welcome to Menya Rwanda!',
    type: 'account',
  });

  const token = signToken(user._id);
  res.status(200).json({ success: true, message: 'Account verified.', token });
});

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOtp = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new BadRequest('Email is required.'));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new NotFound('No account found with that email.'));
  if (user.verified) return next(new BadRequest('Account is already verified.'));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  await sendEmail(
    user.email,
    'Menya Rwanda – New OTP Code',
    `Your new verification code is: ${otp}\nThis code expires in 5 minutes.`
  );

  res.status(200).json({ success: true, message: 'New OTP sent to your email.' });
});


// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new BadRequest('Email is required.'));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new NotFound('No account found with that email.'));

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '15m' });

  await ResetToken.create({
    token,
    user: user._id,
    expirationDate: new Date(Date.now() + 15 * 60 * 1000),
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail(
    user.email,
    'Menya Rwanda – Reset Your Password',
    `Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`
  );

  await createNotification({
    user: user._id,
    title: 'Password Reset Requested 🔐',
    message: 'A password reset link has been sent to your email.',
    type: 'account',
  });

  res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = asyncWrapper(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword, confirm } = req.body;

  if (!newPassword || !confirm) return next(new BadRequest('Both password fields are required.'));
  if (newPassword !== confirm) return next(new BadRequest('Passwords do not match.'));
  if (newPassword.length < 8) return next(new BadRequest('Password must be at least 8 characters.'));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.SECRET_KEY);
  } catch {
    return next(new UnauthorizedError('Invalid or expired reset link.'));
  }

  const resetRecord = await ResetToken.findOne({ token, used: false });
  if (!resetRecord) return next(new UnauthorizedError('Reset link has already been used or is invalid.'));

  const user = await User.findById(decoded.id);
  if (!user) return next(new NotFound('User not found.'));

  user.password = newPassword;
  await user.save();

  // Mark token as used
  resetRecord.used = true;
  await resetRecord.save();

  await createNotification({
    user: user._id,
    title: 'Password Updated 🔐',
    message: 'Your password has been changed successfully.',
    type: 'account',
  });

  res.status(200).json({ success: true, message: 'Password reset successfully.' });
});

// ─── GET CURRENT USER (me) ────────────────────────────────────────────────────
exports.getMe = asyncWrapper(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});