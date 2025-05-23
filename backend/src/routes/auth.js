const fastify = require('fastify');
const User = require('../models/user');
const bcrypt = require('bcrypt');

async function authRoutes(fastify, options) {
  // Login route
  fastify.post('/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', examples: ['user@example.com'] },
          password: { type: 'string', format: 'password', examples: ['password123'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string', examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'] }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Invalid credentials'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ 
        id: user._id,
        email: user.email,
        tenantId: user.tenantId
      });

      return { token };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Register route
  fastify.post('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email', examples: ['user@example.com'] },
          password: { type: 'string', format: 'password', examples: ['password123'] },
          firstName: { type: 'string', examples: ['John'] },
          lastName: { type: 'string', examples: ['Doe'] },
          tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string', examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'] }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Email already registered'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, firstName, lastName, tenantId } = request.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return reply.code(400).send({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        tenantId
      });

      await user.save();

      const token = fastify.jwt.sign({ 
        id: user._id,
        email: user.email,
        tenantId: user.tenantId
      });

      return { token };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get current user profile',
      tags: ['auth'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            email: { type: 'string', format: 'email', examples: ['user@example.com'] },
            firstName: { type: 'string', examples: ['John'] },
            lastName: { type: 'string', examples: ['Doe'] },
            tenants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tenantId: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                      name: { type: 'string', examples: ['Acme Corp'] }
                    }
                  },
                  role: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                      type: { type: 'string', examples: ['admin'] }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Unauthorized'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await User.findById(request.user.id)
        .select('-password')
        .populate([
          { path: 'tenants.role', model: 'Role', select: 'type' },
          { path: 'tenants.tenantId', model: 'Tenant', select: 'name' }
        ]);
      return user;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = authRoutes; 