const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      // Matches the 5 types defined in the proposal
      enum: [
        'Royal Heritage',
        'Genocide Memorial',
        'Natural Heritage',
        'Colonial-Era Site',
        'Living Cultural Site',
      ],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      en: { type: String, default: '' },
      rw: { type: String, default: '' },
      fr: { type: String, default: '' },
    },
    icon: { type: String, default: '' }, // icon name or URL for map pin
    color: { type: String, default: '#2B6CB0' }, // map pin color per category
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;