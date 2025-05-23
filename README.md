# Minimalist RBAC with OPA

A modern Role-Based Access Control (RBAC) system built with Fastify, Open Policy Agent (OPA), and MongoDB, featuring multi-tenancy support.

## Project Structure

```
.
├── backend/          # Fastify backend server
└── opa/             # OPA policies and configurations
    ├── policies/    # Rego policy files
    └── wasm/       # Compiled WASM files
```

## Features

- Fastify backend with OPA integration
- MongoDB for data persistence
- Multi-tenant support
- Role-based access control
- Open Policy Agent for policy enforcement
- Support for both WASM and HTTP OPA modes

## Prerequisites

- Node.js >= 18
- Yarn >= 4.0.0
- MongoDB >= 6.0
- Open Policy Agent (OPA)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file in the backend directory
   cd backend
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   HOST=localhost
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/rbac-db

   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRES_IN=1d

   # API Key Configuration (Optional)
   API_KEY=your-api-key-here
   API_KEY_HEADER=X-API-Key

   # OPA Configuration
   OPA_MODE=wasm  # or 'http'
   OPA_SERVER_URL=http://localhost:8181  # Only needed if OPA_MODE=http
   ```

4. Start the development server:
   ```bash
   # Start backend
   cd backend
   yarn dev
   ```

## OPA Integration

The system supports two modes for OPA integration:

### 1. WASM Mode (Default)

In WASM mode, policies are compiled to WebAssembly and loaded directly into the Node.js process.

```bash
# Set OPA mode to WASM (default)
export OPA_MODE=wasm

# Compile policies to WASM
cd backend
./scripts/compile-policies.sh
```

### 2. HTTP Mode

In HTTP mode, policies are evaluated by a separate OPA server.

```bash
# Start OPA server with verbose logging
opa run --server --addr :8181 --log-level debug

# Set OPA mode to HTTP
export OPA_MODE=http
export OPA_SERVER_URL=http://localhost:8181
```

### Testing OPA Policies

You can test policies directly using curl commands:

1. **Health Check**:
```bash
curl -s http://localhost:8181/health
```

2. **Get Current Policy**:
```bash
curl -s http://localhost:8181/v1/policies/rbac
```

3. **Get Current Data**:
```bash
curl -s http://localhost:8181/v1/data
```

4. **Update Policy**:
```bash
curl -X PUT http://localhost:8181/v1/policies/rbac \
  -H "Content-Type: text/plain" \
  --data-binary @opa/policies/rbac.rego
```

5. **Update Data**:
```bash
curl -X PUT http://localhost:8181/v1/data \
  -H "Content-Type: application/json" \
  -d '{
    "roles": [
      {
        "type": "admin",
        "permissions": [
          {
            "resource": "settings",
            "actions": ["read", "write"]
          }
        ]
      }
    ]
  }'
```

6. **Test Policy Evaluation**:
```bash
curl -X POST http://localhost:8181/v1/data/rbac/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "role": "admin",
        "resource": "settings",
        "action": "read"
      }
    }
  }'
```

7. **Get Policy Explanation** (for debugging):
```bash
curl -X POST http://localhost:8181/v1/data/rbac/allow?explain=full \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "role": "admin",
        "resource": "settings",
        "action": "read"
      }
    }
  }'
```

### Sample Policy (rbac.rego)

```rego
package rbac

default allow := false

# Allow if user has the required permission for the action in the specified tenant
allow if {
    # Debug information
    input.user.role
    input.user.resource
    input.user.action
    
    # Check if the user's role has the required permission
    some role in data.roles
    role.type == input.user.role
    some permission in role.permissions
    permission.resource == input.user.resource
    input.user.action in permission.actions
}
```

### Sample Data

```json
{
  "roles": [
    {
      "type": "admin",
      "permissions": [
        {
          "resource": "settings",
          "actions": ["read", "write"]
        }
      ]
    },
    {
      "type": "viewer",
      "permissions": [
        {
          "resource": "settings",
          "actions": ["read"]
        }
      ]
    }
  ]
}
```

## License

MIT 