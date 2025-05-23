const mongoose = require('mongoose');
const User = require('../src/models/user');
const Tenant = require('../src/models/tenant');
const Role = require('../src/models/role');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-opa', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create tenants
    const tenant1 = new Tenant({ name: 'Tenant 1' });
    const tenant2 = new Tenant({ name: 'Tenant 2' });
    await tenant1.save();
    await tenant2.save();

    // Create roles
    const roles = ['admin', 'viewer', 'developer', 'editor'].map(roleType => new Role({ type: roleType }));
    await Promise.all(roles.map(role => role.save()));

    // Create a sample user with multiple tenants and one role per tenant
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      tenants: [
        {
          tenantId: tenant1._id,
          role: roles.find(role => role.type === 'admin')._id
        },
        {
          tenantId: tenant2._id,
          role: roles.find(role => role.type === 'viewer')._id
        }
      ]
    });

    await user.save();
    console.log('Sample user seeded successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 