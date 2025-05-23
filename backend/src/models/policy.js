const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  rego: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for efficient queries
policySchema.index({ name: 1, tenantId: 1 }, { unique: true });
policySchema.index({ tenantId: 1 });

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy; 