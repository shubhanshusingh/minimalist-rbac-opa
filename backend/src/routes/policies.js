const Policy = require('../models/policy');
const opaService = require('../services/opa');

async function policyRoutes(fastify, options) {
  // Get all policies
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Get all policies for the current tenant',
      tags: ['policies'],
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
              name: { type: 'string', examples: ['content-access'] },
              description: { type: 'string', examples: ['Content access policy'] },
              rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] },
              version: { type: 'number', examples: [1] },
              tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
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
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
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
            name: { type: 'string', examples: ['content-access'] },
            description: { type: 'string', examples: ['Content access policy'] },
            rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] },
            version: { type: 'number', examples: [1] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Policy not found'] }
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
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      body: {
        type: 'object',
        required: ['name', 'rego'],
        properties: {
          name: { type: 'string', examples: ['content-access'] },
          description: { type: 'string', examples: ['Content access policy'] },
          rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['content-access'] },
            description: { type: 'string', examples: ['Content access policy'] },
            rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] },
            version: { type: 'number', examples: [1] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Policy with this name already exists'] }
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
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
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
          name: { type: 'string', examples: ['content-access'] },
          description: { type: 'string', examples: ['Content access policy'] },
          rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string', examples: ['507f1f77bcf86cd799439011'] },
            name: { type: 'string', examples: ['content-access'] },
            description: { type: 'string', examples: ['Content access policy'] },
            rego: { type: 'string', examples: ['package content\n\ndefault allow = false\n\nallow {\n    input.action == "read"\n    input.user.roles[_] == "editor"\n}' ] },
            version: { type: 'number', examples: [2] },
            tenantId: { type: 'string', examples: ['507f1f77bcf86cd799439011'] }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Invalid Rego policy: syntax error'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Policy not found'] }
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
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
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
            message: { type: 'string', examples: ['Policy deleted successfully'] }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', examples: ['Policy not found'] }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const policy = await Policy.findOneAndDelete({
        _id: request.params.id,
        tenantId: request.user.tenantId
      });

      if (!policy) {
        return reply.code(404).send({ error: 'Policy not found' });
      }

      return { message: 'Policy deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

}

module.exports = policyRoutes; 