const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["voter", "admin"],},
  //profile data
  age: { type: Number },
  address: { type: String },
  idDocument: {
    fileName: String,   // stored filename
    fileUrl: String,    // URL/path to file
    verified: { type: Boolean, default: false },
    uploadedAt: Date,
  },

  mfa: {
    enabled: { type: Boolean, default: false },
    secret: { type: String }, 
  },
  voterId: { type: String, required: true, unique: true }, 
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  refreshTokens: [{ token: String, createdAt: Date }],
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

const userModel = mongoose.model('Users', userSchema);
module.exports = userModel
