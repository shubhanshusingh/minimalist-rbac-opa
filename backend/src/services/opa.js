const fs = require('fs');
const path = require('path');
const { loadPolicy } = require('@open-policy-agent/opa-wasm');

class OPAService {
  constructor() {
    this.policies = new Map();
    this.wasmDir = path.join(__dirname, '../policies/wasm');
    this.data = {
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
    };
  }

  async initialize() {
    try {
      const files = fs.readdirSync(this.wasmDir);
      for (const file of files) {
        if (file.endsWith('.wasm')) {
          const moduleName = path.basename(file, '.wasm');
          const wasmPath = path.join(this.wasmDir, file);
          console.log(`Loading WASM file: ${wasmPath}`);
          const policyWasm = fs.readFileSync(wasmPath);
          console.log(`WASM file size: ${policyWasm.length} bytes`);
          try {
            const policy = await loadPolicy(policyWasm);
            this.policies.set(moduleName, policy);
            console.log(`Successfully loaded policy: ${moduleName}`);
          } catch (loadError) {
            console.error(`Error loading policy ${moduleName}:`, loadError);
          } finally {
            console.log('OPA WASM modules initialized successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error initializing OPA WASM modules:', error);
      throw error;
    }
  }

  async evaluatePolicy(policyName, input) {
    try {
      const policy = this.policies.get(policyName);
      if (!policy) {
        throw new Error(`Policy ${policyName} not found`);
      }
      const result = await policy.evaluate({ input, data: this.data });
      return result[0]?.result || false;
    } catch (error) {
      console.error('Error evaluating policy:', error);
      throw error;
    }
  }

  async validatePolicy(rego) {
    // For now, we'll use the OPA CLI to validate policies
    // In a production environment, you might want to use a more robust validation method
    try {
      const { execSync } = require('child_process');
      execSync(`echo "${rego}" | opa check -`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      throw new Error('Invalid Rego policy: ' + error.message);
    }
  }

  async checkAccess(user, resource, action, tenantId) {
    // Find the user's role for the specified tenant
    const tenantRole = user.tenants.find(t => t.tenantId.toString() === tenantId);
    if (!tenantRole || !tenantRole.role) {
      return false;
    }

    const input = {
      user: {
        id: user._id.toString(),
        role: tenantRole.role.name, // Use role name instead of ID
        resource: resource,
        action: action
      }
    };

    return this.evaluatePolicy('rbac', input);
  }
}

module.exports = new OPAService(); 