const { API_KEY, API_KEY_HEADER = 'X-API-Key', AUTH_MODE = 'jwt' } = process.env;

async function authMiddleware(request, reply) {
  try {
    // Handle authentication based on configured mode
    switch (AUTH_MODE.toLowerCase()) {
      case 'jwt':
        await request.jwtVerify();
        break;

      case 'api-key':
        const apiKey = request.headers[API_KEY_HEADER.toLowerCase()];
        if (!apiKey) {
          throw new Error('No API key provided');
        }
        if (apiKey !== API_KEY) {
          throw new Error('Invalid API key');
        }
        request.user = {
          type: 'api_key',
          authenticated: true
        };
        break;

      case 'both':
        // Try JWT first, then fall back to API key
        try {
          await request.jwtVerify();
        } catch (jwtError) {
          const apiKey = request.headers[API_KEY_HEADER.toLowerCase()];
          if (!apiKey) {
            throw new Error('No authentication provided');
          }
          if (apiKey !== API_KEY) {
            throw new Error('Invalid API key');
          }
          request.user = {
            type: 'api_key',
            authenticated: true
          };
        }
        break;

      default:
        throw new Error(`Invalid AUTH_MODE: ${AUTH_MODE}`);
    }
  } catch (err) {
    reply.code(401).send({ 
      error: 'Unauthorized',
      message: err.message || 'Authentication failed'
    });
  }
}

module.exports = authMiddleware; 