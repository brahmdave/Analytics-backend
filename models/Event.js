const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  site_id: {
    type: String,
    required: true,
    index: true,
  },
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["page_view", "click", "scroll"],
    index: true,
  },
  path: {
    type: String,
    required: true,
    index: true,
  },
  url: {
    type: String,
  },
  referrer: {
    type: String,
  },
  x: {
    type: Number,
  },
  y: {
    type: Number,
  },
  viewport: {
    w: Number,
    h: Number,
  },
  scrollY: {
    type: Number,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
eventSchema.index({ site_id: 1, timestamp: -1 });
eventSchema.index({ site_id: 1, path: 1, timestamp: -1 });
eventSchema.index({ site_id: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model("Event", eventSchema);

