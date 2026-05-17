const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../Controllers/authController');
const { protect } = require('../Middleware/auth');
const upload = require('../Middleware/upload');

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.post('/logout', protect, logout);        // protect — must be logged in to log out
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;