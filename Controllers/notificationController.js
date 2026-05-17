const asyncWrapper = require('../Middleware/async');
const { NotFound } = require('../Error/index');
const Notification = require('../Models/Notification');

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
exports.getMyNotifications = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { user: req.userId };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('site', 'name.en coverImage')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.userId, isRead: false }),
  ]);

  res.status(200).json({ success: true, total, unreadCount, notifications });
});

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
exports.markAsRead = asyncWrapper(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new NotFound('Notification not found.'));
  res.status(200).json({ success: true, notification });
});

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
exports.markAllAsRead = asyncWrapper(async (req, res) => {
  await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// ─── DELETE NOTIFICATION ──────────────────────────────────────────────────────
exports.deleteNotification = asyncWrapper(async (req, res, next) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!n) return next(new NotFound('Notification not found.'));
  res.status(200).json({ success: true, message: 'Notification deleted.' });
});

// ─── HELPER: create notification (used by other controllers) ──────────────────
exports.createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};