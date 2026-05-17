const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: '',
    },
    // Records the language the review was written in.
    // Frontend uses this to show a "Translate" button for reviews
    // not in the user's preferred language — TripAdvisor style.
    language: {
      type: String,
      enum: ['en', 'rw', 'fr', 'other'],
      default: 'en',
    },
    visitedOn: { type: Date, default: null },
    isVerifiedVisit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per site
reviewSchema.index({ site: 1, user: 1 }, { unique: true });

// After save → recalculate average rating on the site
reviewSchema.post('save', async function () {
  await mongoose.model('Site').updateAverageRating(this.site);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await mongoose.model('Site').updateAverageRating(doc.site);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;