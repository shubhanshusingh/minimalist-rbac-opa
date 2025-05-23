const Role = require('../models/role');

async function roleRoutes(fastify, options) {
  // Get all roles
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all roles for the current tenant',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
              type: { type: 'string', examples: ['admin'] },
              description: { type: 'string', examples: ['Administrator role'] },
              permissions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    resource: { type: 'string', examples: ['users'] },
                    actions: {
                      type: 'array',
                      items: { type: 'string', examples: ['read'] }
                    }
                  }
                }
              },
              isSystem: { type: 'boolean', examples: [false] },
              tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const roles = await Role.find({ tenantId: request.user.tenantId });
      return roles;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get role by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get role by ID',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['admin'] },
            description: { type: 'string', examples: ['Administrator role'] },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resource: { type: 'string', examples: ['users'] },
                  actions: {
                    type: 'array',
                    items: { type: 'string', examples: ['read'] }
                  }
                }
              }
            },
            isSystem: { type: 'boolean', examples: [false] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Role not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const role = await Role.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });
      
      if (!role) {
        return reply.code(404).send({ error: 'Role not found' });
      }
      
      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create role
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Create a new role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'permissions'],
        properties: {
          name: { type: 'string', examples: ['editor'] },
          description: { type: 'string', examples: ['Content editor role'] },
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resource: { type: 'string', examples: ['content'] },
                actions: {
                  type: 'array',
                  items: { type: 'string', examples: ['write'] }
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['editor'] },
            description: { type: 'string', examples: ['Content editor role'] },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resource: { type: 'string', examples: ['content'] },
                  actions: {
                    type: 'array',
                    items: { type: 'string', examples: ['write'] }
                  }
                }
              }
            },
            isSystem: { type: 'boolean', examples: [false] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Role with this name already exists'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, permissions } = request.body;
      
      const existingRole = await Role.findOne({
        name,
        tenantId: request.user.tenantId
      });

      if (existingRole) {
        return reply.code(400).send({ error: 'Role with this name already exists' });
      }

      const role = new Role({
        name,
        description,
        permissions,
        tenantId: request.user.tenantId
      });

      await role.save();
      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update role
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Update an existing role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', examples: ['editor'] },
          description: { type: 'string', examples: ['Content editor role'] },
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resource: { type: 'string', examples: ['content'] },
                actions: {
                  type: 'array',
                  items: { type: 'string', examples: ['write'] }
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['editor'] },
            description: { type: 'string', examples: ['Content editor role'] },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resource: { type: 'string', examples: ['content'] },
                  actions: {
                    type: 'array',
                    items: { type: 'string', examples: ['write'] }
                  }
                }
              }
            },
            isSystem: { type: 'boolean', examples: [false] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Cannot modify system role'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Role not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, permissions } = request.body;
      
      const role = await Role.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!role) {
        return reply.code(404).send({ error: 'Role not found' });
      }

      if (role.isSystem) {
        return reply.code(403).send({ error: 'Cannot modify system role' });
      }

      role.name = name || role.name;
      role.description = description || role.description;
      role.permissions = permissions || role.permissions;

      await role.save();
      return role;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete role
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Delete a role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', examples: ['Role deleted successfully'] }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Cannot delete system role'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Role not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const role = await Role.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!role) {
        return reply.code(404).send({ error: 'Role not found' });
      }

      if (role.isSystem) {
        return reply.code(403).send({ error: 'Cannot delete system role' });
      }

      await role.deleteOne();
      return { message: 'Role deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = roleRoutes; 