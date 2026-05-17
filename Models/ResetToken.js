const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expirationDate: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired tokens
resetTokenSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

const ResetToken = mongoose.model('ResetToken', resetTokenSchema);
module.exports = ResetToken;