const Policy = require('../models/policy');
const opaService = require('../services/opa');

async function policyRoutes(fastify, options) {
  // Get all policies
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all policies for the current tenant',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              name: { type: 'string', example: 'content-access' },
              description: { type: 'string', example: 'Content access policy' },
              rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' },
              version: { type: 'number', example: 1 },
              tenantId: { type: 'string', example: '507f1f77bcf86cd799439011' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const policies = await Policy.find({ tenantId: request.user.tenantId });
      return policies;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get policy by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get policy by ID',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'content-access' },
            description: { type: 'string', example: 'Content access policy' },
            rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' },
            version: { type: 'number', example: 1 },
            tenantId: { type: 'string', example: '507f1f77bcf86cd799439011' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Policy not found' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const policy = await Policy.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });
      
      if (!policy) {
        return reply.code(404).send({ error: 'Policy not found' });
      }
      
      return policy;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create policy
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Create a new policy',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'rego'],
        properties: {
          name: { type: 'string', example: 'content-access' },
          description: { type: 'string', example: 'Content access policy' },
          rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'content-access' },
            description: { type: 'string', example: 'Content access policy' },
            rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' },
            version: { type: 'number', example: 1 },
            tenantId: { type: 'string', example: '507f1f77bcf86cd799439011' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Policy with this name already exists' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, rego } = request.body;
      
      const existingPolicy = await Policy.findOne({
        name,
        tenantId: request.user.tenantId
      });

      if (existingPolicy) {
        return reply.code(400).send({ error: 'Policy with this name already exists' });
      }

      // Validate Rego policy
      try {
        await opaService.validatePolicy(rego);
      } catch (error) {
        return reply.code(400).send({ error: 'Invalid Rego policy: ' + error.message });
      }

      const policy = new Policy({
        name,
        description,
        rego,
        tenantId: request.user.tenantId
      });

      await policy.save();
      return policy;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update policy
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Update an existing policy',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'content-access' },
          description: { type: 'string', example: 'Content access policy' },
          rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'content-access' },
            description: { type: 'string', example: 'Content access policy' },
            rego: { type: 'string', example: 'package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' },
            version: { type: 'number', example: 2 },
            tenantId: { type: 'string', example: '507f1f77bcf86cd799439011' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid Rego policy: syntax error' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Policy not found' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, rego } = request.body;
      
      const policy = await Policy.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!policy) {
        return reply.code(404).send({ error: 'Policy not found' });
      }

      // Validate Rego policy if provided
      if (rego) {
        try {
          await opaService.validatePolicy(rego);
        } catch (error) {
          return reply.code(400).send({ error: 'Invalid Rego policy: ' + error.message });
        }
      }

      policy.name = name || policy.name;
      policy.description = description || policy.description;
      policy.rego = rego || policy.rego;
      policy.version += 1;

      await policy.save();
      return policy;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete policy
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Delete a policy',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Policy deleted successfully' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Policy not found' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const policy = await Policy.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!policy) {
        return reply.code(404).send({ error: 'Policy not found' });
      }

      await policy.deleteOne();
      return { message: 'Policy deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Evaluate policy
  fastify.post('/:id/evaluate', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Evaluate a policy with input data',
      tags: ['policies'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' }
        }
      },
      body: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'object',
            properties: {
              action: { type: 'string', example: 'read' },
              user: {
                type: 'object',
                properties: {
                  roles: {
                    type: 'array',
                    items: { type: 'string', example: 'editor' }
                  }
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
            result: { type: 'boolean', example: true }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Policy not found' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const policy = await Policy.findOne({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!policy) {
        return reply.code(404).send({ error: 'Policy not found' });
      }

      const result = await opaService.evaluatePolicy(policy.name, request.body);
      return result;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = policyRoutes; 