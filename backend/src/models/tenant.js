const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

// Index for efficient queries
tenantSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Tenant', tenantSchema); 