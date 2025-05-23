const opaService = require('../services/opa');
const User = require('../models/user');
const { evaluatePolicy } = require('../services/opa');

async function permissionsRoutes(fastify, options) {
  // Check permission for a user
  fastify.post('/check', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Check if a user has permission to perform an action on a resource',
      tags: ['permissions'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      body: {
        type: 'object',
        required: ['resource', 'action', 'tenantId'],
        properties: {
          userId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
          tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
          resource: { type: 'string', examples: ['users'] },
          action: { type: 'string', examples: ['read'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            allowed: { type: 'boolean', examples: [true] },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                email: { type: 'string', examples: ['user@example.com'] },
                tenantRoles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                      role: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                          name: { type: 'string', examples: ['admin'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            request: {
              type: 'object',
              properties: {
                resource: { type: 'string', examples: ['users'] },
                action: { type: 'string', examples: ['read'] },
                tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['User not found'] }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Failed to evaluate policy'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { resource, action, userId, tenantId } = request.body;
    try {
      // Fetch the user with tenant roles populated
      const user = await User.findById(userId)
        .populate({
          path: 'tenants.role',
          model: 'Role'
        });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Find the user's role for the specified tenant
      const tenantRole = user.tenants.find(t => t.tenantId.toString() === tenantId);
      if (!tenantRole) {
        return reply.code(404).send({ error: 'User not found in tenant' });
      }

      // Evaluate permission using OPA
      const result = await opaService.checkAccess(user, resource, action, tenantId);

      // Return detailed response
      return {
        allowed: !!result,
        user: {
          id: user._id,
          email: user.email,
          tenantRoles: user.tenants.map(t => ({
            tenantId: t.tenantId,
            role: t.role ? {
              id: t.role._id,
              name: t.role.name
            } : null
          }))
        },
        request: {
          resource,
          action,
          tenantId
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = permissionsRoutes; 