const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  tenants: [{
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });
userSchema.index({ tenantId: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 