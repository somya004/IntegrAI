const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  tenant: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Log', logSchema);
