const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
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
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure role names are unique within a tenant
roleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

// Index for efficient queries
roleSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Role', roleSchema); 