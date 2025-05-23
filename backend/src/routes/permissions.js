const opaService = require('../services/opa');
const User = require('../models/user');

async function permissionsRoutes(fastify, options) {
  // Check permission for a user
  fastify.post('/check', {
    onRequest: [fastify.authenticate],
    schema: {
      description: 'Check if a user has permission to perform an action on a resource',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['resource', 'action'],
        properties: {
          resource: { type: 'string', example: 'profile' },
          action: { type: 'string', example: 'read' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            allow: { type: 'boolean', example: true }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'User not found' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Internal server error' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { resource, action } = request.body;
    try {
      // Fetch the user with roles populated
      const user = await User.findById(request.user.id).populate('roles');
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      // Evaluate permission using OPA
      const result = await opaService.checkAccess(user, resource, action);
      return { allow: !!result }; // result should be true/false
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

module.exports = permissionsRoutes; 