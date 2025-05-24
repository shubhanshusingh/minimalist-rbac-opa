# Minimalist RBAC with OPA

A modern Role-Based Access Control (RBAC) system built with Fastify, Open Policy Agent (OPA), and MongoDB, featuring multi-tenancy support.

## Project Structure

```
.
├── backend/          # Fastify backend server
│   ├── src/         # Source code
│   │   ├── models/  # Database models
│   │   ├── routes/  # API routes
│   │   ├── services/# Business logic
│   │   └── server.js# Main application file
│   ├── scripts/     # Utility scripts
│   ├── opa/         # OPA policies and configurations
│   │   └── policies/# Rego policy files and data
│   └── Dockerfile   # Backend service container definition
└── scripts/         # Project-wide utility scripts
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
- Open Policy Agent (OPA) >= 1.4.2

### Installing OPA

#### macOS
```bash
# Using Homebrew
brew install opa

# Verify installation
opa version
```

#### Linux
```bash
# Download the latest release
curl -L -o opa https://github.com/open-policy-agent/opa/releases/download/v1.4.2/opa_linux_amd64

# Make it executable
chmod +x opa

# Move to a directory in your PATH
sudo mv opa /usr/local/bin/

# Verify installation
opa version
```

#### Windows
```powershell
# Using Chocolatey
choco install opa

# Verify installation
opa version
```

For more installation options and details, visit the [official OPA documentation](https://www.openpolicyagent.org/docs/latest/#running-opa).

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

   # Authentication Mode
   AUTH_MODE=jwt  # Options: 'jwt', 'api-key', or 'both'

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

## Seeding the Database

To quickly populate your database with sample tenants, roles, users, and user-tenant-role assignments, run the following command from the backend directory:

```bash
node scripts/seed.js
```

This script will:
- Create two tenants: Tenant 1 and Tenant 2
- Create four roles (admin, viewer, developer, editor) for each tenant
- Create two users: admin@example.com and user@example.com
- Assign the admin role to admin@example.com in both tenants
- Assign the viewer role to user@example.com in both tenants

You can safely run this script multiple times; it will not create duplicates.

## API Usage

### Authentication

The system supports both JWT and API Key authentication:

### 1. JWT Authentication

Get a JWT token by logging in:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Use the JWT token in subsequent requests:
```bash
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 2. API Key Authentication

Configure your API key in the `.env` file:
```env
API_KEY=your-api-key-here
API_KEY_HEADER=X-API-Key
```

Use the API key in requests:
```bash
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'X-API-Key: your-api-key-here'
```

### 3. Authentication Modes

The system supports three authentication modes:

1. **JWT Mode** (`AUTH_MODE=jwt`):
   - Uses JWT tokens for authentication
   - Tokens are obtained through the `/auth/login` endpoint
   - Include token in requests using the `Authorization: Bearer <token>` header

2. **API Key Mode** (`AUTH_MODE=api-key`):
   - Uses API keys for authentication
   - Configure API key in `.env` file
   - Include API key in requests using the `X-API-Key` header

3. **Both Modes** (`AUTH_MODE=both`):
   - Supports both JWT and API key authentication
   - Tries JWT first, falls back to API key if JWT fails
   - Useful for transitioning between authentication methods

To switch between modes, update the `AUTH_MODE` environment variable in your `.env` file.

### Example API Calls

1. **Using JWT**:
```bash
# Login to get JWT token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Use JWT token
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

2. **Using API Key**:
```bash
# Direct API key usage
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'X-API-Key: your-api-key-here'
```

3. **Using Both (JWT with API Key fallback)**:
```bash
# Try JWT first, falls back to API key if JWT fails
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'X-API-Key: your-api-key-here'
```

Note: Replace `TENANT_ID`, `YOUR_JWT_TOKEN`, and `your-api-key-here` with actual values from your configuration.

### Roles

All role-related endpoints require a `tenantId` query parameter:

1. **List Roles for a Tenant**:
```bash
curl -X GET 'http://localhost:3001/roles?tenantId=TENANT_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

2. **Create a New Role**:
```bash
curl -X POST http://localhost:3001/roles \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "name": "custom-role",
    "description": "Custom role description",
    "tenantId": "TENANT_ID"
  }'
```

3. **Get Role by ID**:
```bash
curl -X GET http://localhost:3001/roles/ROLE_ID \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

4. **Update Role**:
```bash
curl -X PUT http://localhost:3001/roles/ROLE_ID \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "name": "updated-role",
    "description": "Updated role description"
  }'
```

5. **Delete Role**:
```bash
curl -X DELETE http://localhost:3001/roles/ROLE_ID \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### User-Tenant-Role Assignments

1. **Assign Role to User**:
```bash
curl -X POST http://localhost:3001/userTenantRole/assign \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "userId": "USER_ID",
    "tenantId": "TENANT_ID",
    "roleId": "ROLE_ID"
  }'
```

2. **Get User's Roles in a Tenant**:
```bash
curl -X GET 'http://localhost:3001/userTenantRole/user/USER_ID/tenant/TENANT_ID/roles' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

3. **Remove Role from User**:
```bash
curl -X DELETE http://localhost:3001/userTenantRole/remove \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "userId": "USER_ID",
    "tenantId": "TENANT_ID",
    "roleId": "ROLE_ID"
  }'
```

4. **Get All Users with a Role in a Tenant**:
```bash
curl -X GET 'http://localhost:3001/userTenantRole/tenant/TENANT_ID/role/ROLE_ID/users' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

5. **Get All Tenants a User Belongs To**:
```bash
curl -X GET 'http://localhost:3001/userTenantRole/user/USER_ID/tenants' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

6. **Check if User Has a Role**:
```bash
curl -X GET 'http://localhost:3001/userTenantRole/check?userId=USER_ID&tenantId=TENANT_ID&roleId=ROLE_ID' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Note: Replace `TENANT_ID`, `USER_ID`, `ROLE_ID`, and `YOUR_JWT_TOKEN` with actual values from your database.

## OPA Integration

The system supports two modes for OPA integration:

### 1. WASM Mode 

In WASM mode, policies are compiled to WebAssembly and loaded directly into the Node.js process.

```bash
# Set OPA mode to WASM (default)
export OPA_MODE=wasm

# Compile policies to WASM
cd backend
./scripts/compile-policies.sh
```

### 2. HTTP Mode (Default)

In HTTP mode, policies are evaluated by a separate OPA server. The system automatically:

1. Loads all `.rego` files from the `opa/policies` directory
2. Loads `data.json` from the `opa/policies` directory if it exists
3. Uploads both policies and data to the OPA server during initialization

File Structure:
```
opa/
├── policies/
│   ├── rbac.rego          # RBAC policy
│   ├── rbac_advanced.rego # Advanced RBAC policy
│   └── data.json         # Policy data (optional)
└── wasm/                 # Compiled WASM files (for WASM mode)
```

The `data.json` file should follow this structure:
```json
{
  "roles": [
    {
      "type": "admin",
      "permissions": [
        {
          "resource": "profile",
          "actions": ["read", "write"]
        }
      ]
    }
  ],
  "tenants": ["tenant1", "tenant2"],
  "tenant_users": {
    "tenant1": {
      "user1": true
    }
  },
  "users": {
    "user1": {
      "status": "active",
      "role": "admin"
    }
  }
}
```

To use HTTP mode:

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
            "resource": "profile",
            "actions": ["read", "write"]
          },
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
            "resource": "profile",
            "actions": ["read"]
          },
          {
            "resource": "settings",
            "actions": ["read"]
          }
        ]
      },
      {
        "type": "developer",
        "permissions": [
          {
            "resource": "profile",
            "actions": ["read", "write"]
          },
          {
            "resource": "settings",
            "actions": ["read", "write"]
          },
          {
            "resource": "code",
            "actions": ["read", "write"]
          }
        ]
      },
      {
        "type": "editor",
        "permissions": [
          {
            "resource": "profile",
            "actions": ["read", "write"]
          },
          {
            "resource": "settings",
            "actions": ["read", "write"]
          },
          {
            "resource": "content",
            "actions": ["read", "write"]
          }
        ]
      }
    ]
  }
```

## License

MIT 