const fs = require('fs');
const path = require('path');
const { loadPolicy } = require('@open-policy-agent/opa-wasm');
const axios = require('axios');

class OPAService {
  constructor() {
    this.policies = new Map();
    this.wasmDir = path.join(__dirname, '../../../opa/wasm');
    this.mode = process.env.OPA_MODE || 'wasm'; // 'wasm' or 'http'
    this.opaServerUrl = process.env.OPA_SERVER_URL || 'http://localhost:8181';
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
    if (this.mode === 'wasm') {
      await this.initializeWasm();
    } else if (this.mode === 'http') {
      await this.initializeHttp();
    } else {
      throw new Error(`Invalid OPA mode: ${this.mode}`);
    }
  }

  async initializeWasm() {
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
          }
        }
      }
      console.log('OPA WASM modules initialized successfully');
    } catch (error) {
      console.error('Error initializing OPA WASM modules:', error);
      throw error;
    }
  }

  async initializeHttp() {
    try {
      // Upload policy to OPA server
      const policyPath = path.join(__dirname, '../../../opa/policies/rbac.rego');
      const policyContent = fs.readFileSync(policyPath, 'utf8');
      
      await axios.put(`${this.opaServerUrl}/v1/policies/rbac`, policyContent, {
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('Policy uploaded to OPA server successfully');

      // Upload data to OPA server
      await axios.put(`${this.opaServerUrl}/v1/data`, this.data);
      console.log('Data uploaded to OPA server successfully');
    } catch (error) {
      console.error('Error initializing OPA HTTP mode:', error);
      throw error;
    }
  }

  async evaluatePolicy(policyName, input) {
    try {
      if (this.mode === 'wasm') {
        return this.evaluatePolicyWasm(policyName, input);
      } else if (this.mode === 'http') {
        return this.evaluatePolicyHttp(policyName, input);
      }
    } catch (error) {
      console.error('Error evaluating policy:', error);
      throw error;
    }
  }

  async evaluatePolicyWasm(policyName, input) {
    const policy = this.policies.get(policyName);
    if (!policy) {
      throw new Error(`Policy ${policyName} not found`);
    }
    console.log('data', JSON.stringify(this.data));
    await policy.setData(JSON.stringify(this.data));
    const result = await policy.evaluate({ input });
    console.log('result', result);
    return result[0]?.result || false;
  }

  async evaluatePolicyHttp(policyName, input) {
    try {
      const response = await axios.post(
        `${this.opaServerUrl}/v1/data/${policyName}/allow`,
        { input },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('OPA server response:', response.data);
      return response.data.result || false;
    } catch (error) {
      console.error('Error calling OPA server:', error.response?.data || error.message);
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
      console.log('No role found for tenant:', { tenantId, userTenants: user.tenants });
      return false;
    }

    const input = {
      user: {
        role: tenantRole.role.type, // Use role name instead of ID
        resource: resource,
        action: action
      }
    };
    console.log('Checking access with input:', JSON.stringify(input, null, 2));
    console.log('User role type:', tenantRole.role.type);

    return this.evaluatePolicy('rbac', input);
  }
}

module.exports = new OPAService(); 