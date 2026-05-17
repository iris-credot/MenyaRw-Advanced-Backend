const jwt = require('jsonwebtoken');
const asyncWrapper = require('./async');
const { UnauthorizedError, ForbiddenError } = require('../Error/index');
const User = require('../Models/User');

// ─── Helper: extract token from header OR cookie ──────────────────────────────
// Header is used by mobile app (React Native)
// Cookie is used by web dashboard (admin/moderator browser session)
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  return null;
};

// ─── PROTECT ──────────────────────────────────────────────────────────────────
// Verifies the JWT, fetches the fresh user from DB, and attaches to req.
// Always use this before authorize().
const protect = asyncWrapper(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new UnauthorizedError('Access denied. Please log in.'));
  }

  // jwt.verify throws JsonWebTokenError or TokenExpiredError on failure —
  // both are caught and formatted by the global errorHandler middleware
  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  // Fetch user fresh from DB on every request so role/status changes take
  // effect immediately without waiting for token expiry
  const user = await User.findById(decoded.id).select('-password -otp -otpExpires');

  if (!user) {
    return next(new UnauthorizedError('Account no longer exists. Please log in again.'));
  }

  // Block regular users who haven't verified their email.
  // Moderators and admins are pre-verified at account creation so they're excluded.
  if (user.role === 'user' && !user.verified) {
    return next(new UnauthorizedError('Please verify your email before continuing.'));
  }

  // Attach to request — controllers use req.user for full object, req.userId for just the ID
  req.user = user;
  req.userId = user._id;
  next();
});

// ─── AUTHORIZE ────────────────────────────────────────────────────────────────
// Role-based access control. Always comes after protect().
// Usage:
//   authorize('admin')                  → admin only
//   authorize('admin', 'moderator')     → admin or moderator
//   authorize('admin', 'moderator', 'user') → all roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. This action requires one of: ${roles.join(', ')}.`)
      );
    }
    next();
  };
};

// ─── MUST CHANGE PASSWORD ─────────────────────────────────────────────────────
// Blocks any request from a moderator who hasn't changed their temp password yet.
// Apply this to sensitive routes that moderators access after first login.
// The frontend should handle the redirect, but this is a server-side safety net.
const mustHaveChangedPassword = (req, res, next) => {
  if (req.user.mustChangePassword) {
    return next(
      new ForbiddenError('You must change your temporary password before continuing.')
    );
  }
  next();
};

module.exports = { protect, authorize, mustHaveChangedPassword };