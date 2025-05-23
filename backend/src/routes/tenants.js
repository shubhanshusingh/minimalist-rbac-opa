const Tenant = require('../models/tenant');

async function tenantRoutes(fastify, options) {
  // Get all tenants (admin only)
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all tenants (admin only)',
      tags: ['tenants'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
              name: { type: 'string', examples: ['Acme Corp'] },
              domain: { type: 'string', examples: ['acme.com'] },
              settings: {
                type: 'object',
                properties: {
                  theme: { type: 'string', examples: ['light'] },
                  features: {
                    type: 'array',
                    items: { type: 'string', examples: ['advanced-analytics'] }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const tenants = await Tenant.find();
      return tenants;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get tenant by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get tenant by ID',
      tags: ['tenants'],
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
            name: { type: 'string', examples: ['Acme Corp'] },
            domain: { type: 'string', examples: ['acme.com'] },
            settings: {
              type: 'object',
              properties: {
                theme: { type: 'string', examples: ['light'] },
                features: {
                  type: 'array',
                  items: { type: 'string', examples: ['advanced-analytics'] }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Tenant not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const tenant = await Tenant.findById(request.params.id);
      
      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }
      
      return tenant;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create tenant
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Create a new tenant',
      tags: ['tenants'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'domain'],
        properties: {
          name: { type: 'string', examples: ['Acme Corp'] },
          domain: { type: 'string', examples: ['acme.com'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['Acme Corp'] },
            domain: { type: 'string', examples: ['acme.com'] },
            settings: {
              type: 'object',
              properties: {
                theme: { type: 'string', examples: ['light'] },
                features: {
                  type: 'array',
                  items: { type: 'string', examples: ['advanced-analytics'] }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Tenant with this domain already exists'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, domain } = request.body;
      
      const existingTenant = await Tenant.findOne({ domain });
      if (existingTenant) {
        return reply.code(400).send({ error: 'Tenant with this domain already exists' });
      }

      const tenant = new Tenant({
        name,
        domain
      });

      await tenant.save();
      return tenant;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update tenant
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Update an existing tenant',
      tags: ['tenants'],
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
          name: { type: 'string', examples: ['Acme Corp'] },
          settings: {
            type: 'object',
            properties: {
              theme: { type: 'string', examples: ['dark'] },
              features: {
                type: 'array',
                items: { type: 'string', examples: ['advanced-analytics'] }
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
            name: { type: 'string', examples: ['Acme Corp'] },
            domain: { type: 'string', examples: ['acme.com'] },
            settings: {
              type: 'object',
              properties: {
                theme: { type: 'string', examples: ['dark'] },
                features: {
                  type: 'array',
                  items: { type: 'string', examples: ['advanced-analytics'] }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Tenant not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, settings } = request.body;
      
      const tenant = await Tenant.findById(request.params.id);
      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      tenant.name = name || tenant.name;
      tenant.settings = { ...tenant.settings, ...settings };

      await tenant.save();
      return tenant;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete tenant
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Delete a tenant',
      tags: ['tenants'],
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
            message: { type: 'string', examples: ['Tenant deleted successfully'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Tenant not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const tenant = await Tenant.findByIdAndDelete(request.params.id);
      
      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      return { message: 'Tenant deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = tenantRoutes; 