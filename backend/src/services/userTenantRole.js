const UserTenantRole = require('../models/userTenantRole');
const User = require('../models/user');
const Tenant = require('../models/tenant');
const Role = require('../models/role');

class UserTenantRoleService {
  // Assign a role to a user in a tenant
  async assignRole(userId, tenantId, roleId) {
    const [user, tenant, role] = await Promise.all([
      User.findById(userId),
      Tenant.findById(tenantId),
      Role.findById(roleId)
    ]);

    if (!user || !tenant || !role) {
      throw new Error('User, tenant, or role not found');
    }

    // Verify role belongs to the tenant
    if (role.tenantId.toString() !== tenantId.toString()) {
      throw new Error('Role does not belong to the specified tenant');
    }

    const userTenantRole = new UserTenantRole({
      userId,
      tenantId,
      roleId
    });

    return userTenantRole.save();
  }

  // Remove a role from a user in a tenant
  async removeRole(userId, tenantId, roleId) {
    return UserTenantRole.findOneAndDelete({
      userId,
      tenantId,
      roleId
    });
  }

  // Get all roles for a user in a specific tenant
  async getUserRolesInTenant(userId, tenantId) {
    return UserTenantRole.find({
      userId,
      tenantId
    }).populate('roleId');
  }

  // Get all users with a specific role in a tenant
  async getUsersWithRole(tenantId, roleId) {
    return UserTenantRole.find({
      tenantId,
      roleId
    }).populate('userId');
  }

  // Get all tenants a user belongs to with their roles
  async getUserTenantsWithRoles(userId) {
    const userTenantRoles = await UserTenantRole.find({ userId })
      .populate('tenantId')
      .populate('roleId');

    // Group by tenant
    const tenantMap = new Map();
    userTenantRoles.forEach(utr => {
      const tenantId = utr.tenantId._id.toString();
      if (!tenantMap.has(tenantId)) {
        tenantMap.set(tenantId, {
          tenant: utr.tenantId,
          roles: []
        });
      }
      tenantMap.get(tenantId).roles.push(utr.roleId);
    });

    return Array.from(tenantMap.values());
  }

  // Check if a user has a specific role in a tenant
  async hasRole(userId, tenantId, roleId) {
    const userTenantRole = await UserTenantRole.findOne({
      userId,
      tenantId,
      roleId
    });
    return !!userTenantRole;
  }
}

module.exports = new UserTenantRoleService(); 