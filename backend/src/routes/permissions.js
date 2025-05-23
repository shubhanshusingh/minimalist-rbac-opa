const opaService = require('../services/opa');
const User = require('../models/user');
const userTenantRoleService = require('../services/userTenantRole');

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
                roles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
                      name: { type: 'string', examples: ['admin'] }
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
      // Fetch the user
      const user = await User.findById(userId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Get all roles for the user in the specified tenant
      const userRoles = await userTenantRoleService.getUserRolesInTenant(userId, tenantId);
      if (!userRoles || userRoles.length === 0) {
        return reply.code(404).send({ error: 'User has no roles in this tenant' });
      }

      // Evaluate permission using OPA for each role
      const roleResults = await Promise.all(
        userRoles.map(async (userRole) => {
          const result = await opaService.checkAccess(user, resource, action, tenantId, userRole.roleId);
          return {
            role: userRole.roleId,
            allowed: result
          };
        })
      );

      // User is allowed if any of their roles allow the action
      const allowed = roleResults.some(result => result.allowed);

      // Return detailed response
      return {
        allowed,
        user: {
          id: user._id,
          email: user.email,
          roles: userRoles.map(ur => ({
            id: ur.roleId._id,
            name: ur.roleId.name
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