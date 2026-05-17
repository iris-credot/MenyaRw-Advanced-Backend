const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const gallerySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    type: {
      type: String,
      enum: ['photo', 'video'],
      required: [true, 'Media type is required'],
    },
    title: { type: multilingualField },
    caption: { type: multilingualField },
    url: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    // For photos: Cloudinary URL
    // For videos: YouTube embed URL e.g. https://www.youtube.com/embed/xxxxx
    thumbnailUrl: { type: String, default: '' }, // thumbnail for videos
    order: { type: Number, default: 0 },         // for sorting in the gallery
    isCover: { type: Boolean, default: false },  // mark as the main cover image
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

gallerySchema.index({ site: 1, type: 1, order: 1 });

const Gallery = mongoose.model('Gallery', gallerySchema);
module.exports = Gallery;