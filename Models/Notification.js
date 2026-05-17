const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Multilingual — frontend reads user.preferredLanguage and shows the right one
    // e.g. notification.title[user.preferredLanguage] || notification.title.en
    title: { type: multilingualField, required: true },
    message: { type: multilingualField, required: true },
    type: {
      type: String,
      enum: ['account', 'geofence', 'announcement', 'review', 'system'],
      default: 'system',
    },
    site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
    isRead: { type: Boolean, default: false },
    geofenceZone: { type: String, enum: ['2km', '500m', null], default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;