const Role = require('../models/role');
const Tenant = require('../models/tenant');

async function routes(fastify, options) {
  // Get all roles for a tenant
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all roles for a specific tenant',
      tags: ['roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      querystring: {
        type: 'object',
        required: ['tenantId'],
        properties: {
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
              isSystem: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
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
          description: 'Tenant not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { tenantId } = request.query;
        
        // Verify tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }

        const roles = await Role.find({ tenantId });
        return reply.code(200).send(roles);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Create a new role
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Create a new role in a specific tenant',
      tags: ['roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      body: {
        type: 'object',
        required: ['name', 'tenantId'],
        properties: {
          name: { 
            type: 'string',
            description: 'Name of the role',
            examples: ['admin', 'viewer', 'editor']
          },
          description: { 
            type: 'string',
            description: 'Description of the role',
            examples: ['Administrator with full access', 'View-only access']
          },
          tenantId: { 
            type: 'string',
            description: 'ID of the tenant',
            examples: ['507f1f77bcf86cd799439012']
          },
          isSystem: { 
            type: 'boolean',
            description: 'Whether this is a system role that cannot be deleted',
            default: false
          }
        }
      },
      response: {
        201: {
          description: 'Role created successfully',
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            tenantId: { type: 'string' },
            isSystem: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
          description: 'Tenant not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        409: {
          description: 'Role name already exists in tenant',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { name, description, tenantId, isSystem = false } = request.body;

        // Verify tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }

        // Check if role with same name exists in tenant
        const existingRole = await Role.findOne({ name, tenantId });
        if (existingRole) {
          return reply.code(409).send({ error: 'Role with this name already exists in this tenant' });
        }

        const role = new Role({
          name,
          description,
          tenantId,
          isSystem
        });

        await role.save();
        return reply.code(201).send(role);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Get a role by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get a role by its ID',
      tags: ['roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            description: 'ID of the role',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        200: {
          description: 'Role details',
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            tenantId: { type: 'string' },
            isSystem: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
          description: 'Role not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const role = await Role.findById(id);
        
        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        return reply.code(200).send(role);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Update a role
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Update an existing role',
      tags: ['roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            description: 'ID of the role to update',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { 
            type: 'string',
            description: 'New name for the role',
            examples: ['admin', 'viewer', 'editor']
          },
          description: { 
            type: 'string',
            description: 'New description for the role',
            examples: ['Administrator with full access', 'View-only access']
          },
          isSystem: { 
            type: 'boolean',
            description: 'Whether this is a system role that cannot be deleted'
          }
        }
      },
      response: {
        200: {
          description: 'Role updated successfully',
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            tenantId: { type: 'string' },
            isSystem: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
          description: 'Role not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        409: {
          description: 'Role name already exists in tenant',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { name, description, isSystem } = request.body;

        const role = await Role.findById(id);
        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        // If name is being updated, check for duplicates
        if (name && name !== role.name) {
          const existingRole = await Role.findOne({ name, tenantId: role.tenantId });
          if (existingRole) {
            return reply.code(409).send({ error: 'Role with this name already exists in this tenant' });
          }
          role.name = name;
        }

        if (description !== undefined) role.description = description;
        if (isSystem !== undefined) role.isSystem = isSystem;

        await role.save();
        return reply.code(200).send(role);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });

  // Delete a role
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Delete a role',
      tags: ['roles'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string',
            description: 'ID of the role to delete',
            examples: ['507f1f77bcf86cd799439013']
          }
        }
      },
      response: {
        200: {
          description: 'Role deleted successfully',
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
          description: 'Role not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Cannot delete system role',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const role = await Role.findById(id);
        
        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        if (role.isSystem) {
          return reply.code(403).send({ error: 'Cannot delete a system role' });
        }

        await role.deleteOne();
        return reply.code(200).send({ message: 'Role deleted successfully' });
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
  });
}

module.exports = routes; 