const fastify = require('fastify')({
  logger: true
});

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
});

fastify.register(require('@fastify/mongodb'), {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-opa',
  forceClose: true
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key'
});

// Register authentication middleware
const authMiddleware = require('./middleware/auth');
fastify.decorate('authenticate', authMiddleware);

// Swagger documentation
fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'RBAC OPA API',
      description: 'API documentation for RBAC with OPA',
      version: '1.0.0'
    }
  }
});

fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/documentation'
});

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/roles'), { prefix: '/roles' });
fastify.register(require('./routes/policies'), { prefix: '/policies' });
fastify.register(require('./routes/tenants'), { prefix: '/tenants' });
fastify.register(require('./routes/permissions'), { prefix: '/permissions' });

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Initialize OPA WASM modules
const opaService = require('./services/opa');

// Start server
const start = async () => {
  try {
    // Initialize OPA WASM modules
    await opaService.initialize();
    
    await fastify.listen({ 
      port: process.env.PORT || 3001,
      host: process.env.HOST || 'localhost'
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 