require('dotenv').config();
const mongoose = require('mongoose');
const fastify = require('fastify')({
  logger: true
});
const metrics = require('./services/metrics');

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac-opa', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
});

mongoose.connection.on('connected', () => {
  fastify.log.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  fastify.log.error('Mongoose connection error:', err);
});

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
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
    },
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Enter your bearer token in the format **Bearer <token>**'
      },
      apiKeyAuth: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'Enter your API key'
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  }
});

// Redoc documentation
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/redoc',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  uiHooks: {
    onRequest: function (request, reply, next) { next(); },
    preHandler: function (request, reply, next) { next(); }
  },
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true,
  theme: {
    js: [
      { filename: 'https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js', type: 'text/javascript' }
    ],
    css: [
      { filename: 'https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700', type: 'text/css' }
    ]
  }
});

// Add metrics middleware
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = process.hrtime();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = process.hrtime(request.startTime);
  const durationInSeconds = duration[0] + duration[1] / 1e9;

  metrics.httpRequestDurationMicroseconds
    .labels(request.method, request.routeOptions.url, reply.statusCode.toString())
    .observe(durationInSeconds);

  metrics.httpRequestsTotal
    .labels(request.method, request.routeOptions.url, reply.statusCode.toString())
    .inc();
});

// Add metrics endpoint
fastify.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', metrics.register.contentType);
  return metrics.register.metrics();
});

// Register routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/roles'), { prefix: '/roles' });
fastify.register(require('./routes/policies'), { prefix: '/policies' });
fastify.register(require('./routes/tenants'), { prefix: '/tenants' });
fastify.register(require('./routes/permissions'), { prefix: '/permissions' });
fastify.register(require('./routes/userTenantRoles'), { prefix: '/userTenantRoles' });

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