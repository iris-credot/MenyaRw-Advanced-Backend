const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const activitySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    name: { type: multilingualField, required: true },
    description: { type: multilingualField },
    duration: { type: String, default: '' },       // e.g. "45 minutes", "2 hours"
    included: { type: Boolean, default: true },    // included in admission fee or extra cost
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },           // for sorting on frontend
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

activitySchema.index({ site: 1, order: 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;