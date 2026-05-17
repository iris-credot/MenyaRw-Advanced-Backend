const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    image: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: {
      type: String,
      enum: ['user', 'modulator', 'admin'],
      default: 'user',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'rw', 'fr'],
      default: 'en',
    },
    phoneNumber: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      validate: [isEmail, 'Please provide a valid email'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    verified: { type: Boolean, default: false },
    // Set to true when admin creates a guide account with a temp password
    // Frontend must redirect to change-password screen when this is true
    mustChangePassword: { type: Boolean, default: false },
    // Saved/bookmarked heritage sites
    savedSites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
    // FCM token for push notifications
    fcmToken: { type: String, default: '' },
    // Track which geofence notifications the user has received to avoid duplicates
    notifiedGeofences: [
      {
        site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
        zone: { type: String, enum: ['2km', '500m'] },
        notifiedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Pre-update: Hash password if being updated ───────────────────────────────
userSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  const pwd = update.password || (update.$set && update.$set.password);
  if (!pwd) return;
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(pwd, salt);
  if (update.password) update.password = hashed;
  else update.$set.password = hashed;
});

// ─── Static: Login ────────────────────────────────────────────────────────────
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email }).select('+password');
  if (!user) throw new Error('Incorrect email');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Incorrect password');
  return user;
};

// ─── Instance: Compare password ───────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Instance: Check OTP expiry ───────────────────────────────────────────────
userSchema.methods.isOtpExpired = function () {
  if (!this.otpExpires) return true;
  return new Date(this.otpExpires) < new Date();
};

const User = mongoose.model('User', userSchema);
module.exports = User;