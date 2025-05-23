const mongoose = require('mongoose');

const userTenantRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can't have the same role multiple times in a tenant
userTenantRoleSchema.index({ userId: 1, tenantId: 1, roleId: 1 }, { unique: true });

// Index for efficient queries
userTenantRoleSchema.index({ userId: 1, tenantId: 1 });
userTenantRoleSchema.index({ tenantId: 1 });

module.exports = mongoose.model('UserTenantRole', userTenantRoleSchema); 