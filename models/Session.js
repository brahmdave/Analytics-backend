const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
  },
  site_id: {
    type: String,
    required: true,
    index: true,
  },
  path: {
    type: String,
    required: true,
  },
  started_at: {
    type: Date,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Session", sessionSchema);

