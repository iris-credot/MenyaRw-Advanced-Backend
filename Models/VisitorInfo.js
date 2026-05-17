const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const visitorInfoSchema = new mongoose.Schema(
  {
    // One VisitorInfo per Site — enforced by unique index below
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
      unique: true,
    },

    // ─── Getting there ────────────────────────────────────────────────────────
    gettingThere: { type: multilingualField },     // directions / transport info
    parking: { type: Boolean, default: false },
    parkingDetails: { type: multilingualField },

    // ─── Accessibility ────────────────────────────────────────────────────────
    wheelchairAccessible: { type: Boolean, default: false },
    accessibility: { type: multilingualField },    // detailed accessibility info

    // ─── Best time to visit ───────────────────────────────────────────────────
    bestTimeToVisit: { type: multilingualField },  // e.g. "Early morning, dry season"
    averageVisitDuration: { type: String, default: '' }, // e.g. "2-3 hours"

    // ─── Guided tours ─────────────────────────────────────────────────────────
    guidedTours: { type: Boolean, default: false },
    guidedTourSchedule: { type: String, default: '' }, // e.g. "Daily at 9AM, 11AM, 2PM"
    guidedTourFee: { type: String, default: '' },
    availableLanguages: {
      type: [String],
      enum: ['en', 'rw', 'fr'],
      default: ['en'],
    },

    // ─── Nearby ───────────────────────────────────────────────────────────────
    nearbyAccommodation: { type: multilingualField },
    nearbyRestaurants: { type: multilingualField },
    nearbyAttractions: { type: multilingualField },

    // ─── Rules & tips ─────────────────────────────────────────────────────────
    dresscode: { type: multilingualField },        // e.g. "Modest dress required"
    photographyAllowed: { type: Boolean, default: true },
    photographyRules: { type: multilingualField },
    tips: { type: multilingualField },             // general visitor tips

    // ─── Contact & Social ─────────────────────────────────────────────────────
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    officialWebsite: { type: String, default: '' },
    socialMedia: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const VisitorInfo = mongoose.model('VisitorInfo', visitorInfoSchema);
module.exports = VisitorInfo;