const mongoose = require('mongoose');
const User = require('../src/models/user');
const Role = require('../src/models/role');
const Tenant = require('../src/models/tenant');
const UserTenantRole = require('../src/models/userTenantRole');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get or create tenants
    let tenant1 = await Tenant.findOne({ name: 'Tenant 1' });
    let tenant2 = await Tenant.findOne({ name: 'Tenant 2' });

    if (!tenant1) {
      tenant1 = new Tenant({ name: 'Tenant 1' });
      await tenant1.save();
      console.log('Created Tenant 1');
    } else {
      console.log('Found existing Tenant 1');
    }

    if (!tenant2) {
      tenant2 = new Tenant({ name: 'Tenant 2' });
      await tenant2.save();
      console.log('Created Tenant 2');
    } else {
      console.log('Found existing Tenant 2');
    }

    // Create roles for each tenant
    const roles = ['admin', 'viewer', 'developer', 'editor'].map(roleName => ({
      name: roleName,
      description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
      isSystem: true
    }));

    // Create roles for tenant 1
    for (const roleData of roles) {
      const existingRole = await Role.findOne({
        name: roleData.name,
        tenantId: tenant1._id
      });

      if (!existingRole) {
        await new Role({ ...roleData, tenantId: tenant1._id }).save();
        console.log(`Created role ${roleData.name} for Tenant 1`);
      } else {
        console.log(`Role ${roleData.name} already exists for Tenant 1`);
      }
    }

    // Create roles for tenant 2
    for (const roleData of roles) {
      const existingRole = await Role.findOne({
        name: roleData.name,
        tenantId: tenant2._id
      });

      if (!existingRole) {
        await new Role({ ...roleData, tenantId: tenant2._id }).save();
        console.log(`Created role ${roleData.name} for Tenant 2`);
      } else {
        console.log(`Role ${roleData.name} already exists for Tenant 2`);
      }
    }

    // Create users if they don't exist
    const users = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        email: 'user@example.com',
        password: 'user123',
        firstName: 'Regular',
        lastName: 'User'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await new User(userData).save();
        console.log(`Created user ${userData.email}`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }

    // Assign user-tenant-roles
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    const regularUser = await User.findOne({ email: 'user@example.com' });
    const tenant1AdminRole = await Role.findOne({ name: 'admin', tenantId: tenant1._id });
    const tenant2AdminRole = await Role.findOne({ name: 'admin', tenantId: tenant2._id });
    const tenant1ViewerRole = await Role.findOne({ name: 'viewer', tenantId: tenant1._id });
    const tenant2ViewerRole = await Role.findOne({ name: 'viewer', tenantId: tenant2._id });

    // Helper to assign if not already assigned
    async function assignUserTenantRole(userId, tenantId, roleId) {
      const exists = await UserTenantRole.findOne({ userId, tenantId, roleId });
      if (!exists) {
        await new UserTenantRole({ userId, tenantId, roleId }).save();
        console.log(`Assigned role ${roleId} to user ${userId} in tenant ${tenantId}`);
      } else {
        console.log(`User ${userId} already has role ${roleId} in tenant ${tenantId}`);
      }
    }

    await assignUserTenantRole(adminUser._id, tenant1._id, tenant1AdminRole._id);
    await assignUserTenantRole(adminUser._id, tenant2._id, tenant2AdminRole._id);
    await assignUserTenantRole(regularUser._id, tenant1._id, tenant1ViewerRole._id);
    await assignUserTenantRole(regularUser._id, tenant2._id, tenant2ViewerRole._id);

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed(); 