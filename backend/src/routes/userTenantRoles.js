const userTenantRoleService = require('../services/userTenantRole');

async function routes(fastify, options) {
  // Assign a role to a user in a tenant
  fastify.post('/assign', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Assign a role to a user in a specific tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      body: {
        type: 'object',
        required: ['userId', 'tenantId', 'roleId'],
        properties: {
          userId: { 
            type: 'string',
            description: 'ID of the user to assign the role to',
            examples: ['507f1f77bcf86cd799439011']
          },
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          },
          roleId: { 
            type: 'string',
            description: 'ID of the role to assign',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        201: {
          description: 'Role assigned successfully',
          type: 'object',
          properties: {
            userId: { type: 'string' },
            tenantId: { type: 'string' },
            roleId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, tenantId, roleId } = request.body;
        const result = await userTenantRoleService.assignRole(userId, tenantId, roleId);
        return reply.code(201).send(result);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Remove a role from a user in a tenant
  fastify.delete('/remove', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Remove a role from a user in a specific tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      body: {
        type: 'object',
        required: ['userId', 'tenantId', 'roleId'],
        properties: {
          userId: { 
            type: 'string',
            description: 'ID of the user',
            examples: ['507f1f77bcf86cd799439011']
          },
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          },
          roleId: { 
            type: 'string',
            description: 'ID of the role to remove',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        200: {
          description: 'Role removed successfully',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Role assignment not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, tenantId, roleId } = request.body;
        const result = await userTenantRoleService.removeRole(userId, tenantId, roleId);
        if (!result) {
          return reply.code(404).send({ error: 'Role assignment not found' });
        }
        return reply.code(200).send({ message: 'Role removed successfully' });
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Get all roles for a user in a specific tenant
  fastify.get('/user/:userId/tenant/:tenantId/roles', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all roles assigned to a user in a specific tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['userId', 'tenantId'],
        properties: {
          userId: { 
            type: 'string',
            description: 'ID of the user',
            examples: ['507f1f77bcf86cd799439011']
          },
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          }
        }
      },
      response: {
        200: {
          description: 'List of roles',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              tenantId: { type: 'string' },
              isSystem: { type: 'boolean' }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, tenantId } = request.params;
        const roles = await userTenantRoleService.getUserRolesInTenant(userId, tenantId);
        return reply.code(200).send(roles);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Get all users with a specific role in a tenant
  fastify.get('/tenant/:tenantId/role/:roleId/users', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all users who have a specific role in a tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['tenantId', 'roleId'],
        properties: {
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          },
          roleId: { 
            type: 'string',
            description: 'ID of the role',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        200: {
          description: 'List of users',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { tenantId, roleId } = request.params;
        const users = await userTenantRoleService.getUsersWithRole(tenantId, roleId);
        return reply.code(200).send(users);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Get all tenants a user belongs to with their roles
  fastify.get('/user/:userId/tenants', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all tenants a user belongs to along with their roles in each tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { 
            type: 'string',
            description: 'ID of the user',
            examples: ['507f1f77bcf86cd799439011']
          }
        }
      },
      response: {
        200: {
          description: 'List of tenants with roles',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tenant: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              roles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId } = request.params;
        const tenantsWithRoles = await userTenantRoleService.getUserTenantsWithRoles(userId);
        return reply.code(200).send(tenantsWithRoles);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Check if a user has a specific role in a tenant
  fastify.get('/check', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Check if a user has a specific role in a tenant',
      tags: ['user-tenant-roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      querystring: {
        type: 'object',
        required: ['userId', 'tenantId', 'roleId'],
        properties: {
          userId: { 
            type: 'string',
            description: 'ID of the user',
            examples: ['507f1f77bcf86cd799439011']
          },
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          },
          roleId: { 
            type: 'string',
            description: 'ID of the role to check',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        200: {
          description: 'Role check result',
          type: 'object',
          properties: {
            hasRole: { type: 'boolean' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { userId, tenantId, roleId } = request.query;
        const hasRole = await userTenantRoleService.hasRole(userId, tenantId, roleId);
        return reply.code(200).send({ hasRole });
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });
}

module.exports = routes; 