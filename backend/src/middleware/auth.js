const { API_KEY, API_KEY_HEADER = 'X-API-Key' } = process.env;

async function authMiddleware(request, reply) {
  try {
    // First try JWT authentication
    try {
      await request.jwtVerify();
      return; // If JWT verification succeeds, proceed
    } catch (jwtError) {
      // If JWT fails, try API key authentication
      const apiKey = request.headers[API_KEY_HEADER.toLowerCase()];
      
      if (!apiKey) {
        throw new Error('No authentication provided');
      }

      if (apiKey !== API_KEY) {
        throw new Error('Invalid API key');
      }

      // Add API key authentication info to request
      request.user = {
        type: 'api_key',
        authenticated: true
      };
    }
  } catch (err) {
    reply.code(401).send({ 
      error: 'Unauthorized',
      message: err.message || 'Authentication failed'
    });
  }
}

module.exports = authMiddleware; 