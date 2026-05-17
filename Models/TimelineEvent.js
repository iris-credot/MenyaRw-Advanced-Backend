const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const timelineEventSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    year: { type: Number, required: [true, 'Year is required'] },
    // Month is optional — some events only have a year
    month: { type: Number, min: 1, max: 12, default: null },
    title: { type: multilingualField, required: true },
    description: { type: multilingualField },
    image: { type: String, default: '' },          // optional photo related to this event
    isKeyEvent: { type: Boolean, default: false }, // highlight as a major milestone
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Sort chronologically by default
timelineEventSchema.index({ site: 1, year: 1, month: 1 });

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);
module.exports = TimelineEvent;