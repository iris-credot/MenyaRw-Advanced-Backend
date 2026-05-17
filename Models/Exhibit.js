const mongoose = require('mongoose');

const multilingualField = {
  en: { type: String, default: '' },
  rw: { type: String, default: '' },
  fr: { type: String, default: '' },
};

const exhibitSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    name: { type: multilingualField, required: true },
    description: { type: multilingualField },
    image: { type: String, default: '' },
    yearCreated: { type: Number, default: null },   // year the artifact/exhibit was created
    origin: { type: multilingualField },            // where it came from
    material: { type: multilingualField },          // what it is made of
    location: { type: multilingualField },          // where inside the site it is displayed
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

exhibitSchema.index({ site: 1, order: 1 });

const Exhibit = mongoose.model('Exhibit', exhibitSchema);
module.exports = Exhibit;