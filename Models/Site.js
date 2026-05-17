const mongoose = require('mongoose');

// Multilingual content block reused across fields
const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const siteSchema = new mongoose.Schema(
  {
    // ─── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: multilingualField,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    // ─── Classification ────────────────────────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    province: {
      type: String,
      enum: ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'],
      required: [true, 'Province is required'],
    },
    district: { type: String, default: '' },
    historicalPeriod: {
      type: String,
      enum: ['Pre-colonial', 'Colonial', 'Post-independence', 'Post-genocide', 'Contemporary', ''],
      default: '',
    },

    // ─── Content (multilingual) ────────────────────────────────────────────────
    shortDescription: { type: multilingualField },
    fullStory: { type: multilingualField }, // Main narrative fed into RAG
    historicalFacts: [
      {
        fact: { type: multilingualField },
        year: { type: Number },
      },
    ],
    significance: { type: multilingualField },

    // ─── Media ─────────────────────────────────────────────────────────────────
    coverImage: { type: String, default: '' },
    images: [{ type: String }], // Array of Cloudinary URLs
    audioGuideUrl: { type: String, default: '' }, // Optional audio file URL

    // ─── Geospatial (GeoJSON Point – required for geofencing & map) ────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: (v) =>
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90  && v[1] <= 90,
          message: 'Coordinates must be [longitude, latitude] in valid ranges',
        },
      },
    },
    address: { type: String, default: '' },

    // ─── Geofencing configuration ──────────────────────────────────────────────
    geofence: {
      enabled: { type: Boolean, default: true },
      radius2km: { type: Number, default: 2000 },   // in metres
      radius500m: { type: Number, default: 500 },   // in metres
      teaser: { type: multilingualField },          // notification text at 2 km
      welcome: { type: multilingualField },         // notification text at 500 m
    },

    // ─── Visiting Info ─────────────────────────────────────────────────────────
    openingHours: { type: String, default: '' },
    admissionFee: { type: String, default: 'Free' },
    contactInfo: { type: String, default: '' },
    website: { type: String, default: '' },

    // ─── Stats ─────────────────────────────────────────────────────────────────
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },

    // ─── Status ────────────────────────────────────────────────────────────────
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // The guide responsible for this site's content accuracy
    assignedGuide: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ─── 2dsphere index for geospatial queries ────────────────────────────────────
siteSchema.index({ location: '2dsphere' });
siteSchema.index({ province: 1, category: 1 });

// ─── Auto-generate slug from English name ─────────────────────────────────────
siteSchema.pre('save', function (next) {
  if (this.isModified('name.en') && this.name.en) {
    this.slug = this.name.en
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

// ─── Update rating helper ─────────────────────────────────────────────────────
siteSchema.statics.updateAverageRating = async function (siteId) {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { site: siteId } },
    { $group: { _id: '$site', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length > 0) {
    await this.findByIdAndUpdate(siteId, {
      averageRating: Math.round(result[0].avg * 10) / 10,
      totalReviews: result[0].count,
    });
  } else {
    await this.findByIdAndUpdate(siteId, { averageRating: 0, totalReviews: 0 });
  }
};

const Site = mongoose.model('Site', siteSchema);
module.exports = Site;