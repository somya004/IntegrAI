const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  tenant: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  mapping: {
    type: Map,
    of: String,
    required: true
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    confidence: {
      type: Number,
      required: true
    },
    totalFields: {
      type: Number,
      required: true
    },
    mandatory: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Config', configSchema);
