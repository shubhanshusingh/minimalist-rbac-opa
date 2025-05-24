const fs = require('fs');
const path = require('path');
const { loadPolicy } = require('@open-policy-agent/opa-wasm');
const axios = require('axios');
const Role = require('../models/role');

class OPAService {
  constructor() {
    this.policies = new Map();
    this.wasmDir = path.join(__dirname, '../../../opa/wasm');
    this.mode = process.env.OPA_MODE || 'http'; // Changed default to 'http'
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
            await policy.setData(this.data);
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
      // Load and upload policies from the opa/policies directory
      const policiesDir = path.join(__dirname, '../../opa/policies');
      const policyFiles = fs.readdirSync(policiesDir)
        .filter(file => file.endsWith('.rego'));

      for (const file of policyFiles) {
        const policyPath = path.join(policiesDir, file);
        const policyContent = fs.readFileSync(policyPath, 'utf8');
        const policyName = path.basename(file, '.rego');

        // Upload policy to OPA server
        await axios.put(
          `${this.opaServerUrl}/v1/policies/${policyName}`,
          policyContent,
          {
            headers: { 'Content-Type': 'text/plain' }
          }
        );
        console.log(`Policy ${policyName} uploaded successfully`);
      }

      // Load data.json if it exists
      const dataPath = path.join(policiesDir, 'data.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        await axios.put(
          `${this.opaServerUrl}/v1/data`,
          data,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        console.log('Data uploaded successfully');
      } else {
        console.warn('data.json not found in opa/policies directory, using default data');
        // Upload default data
        await axios.put(
          `${this.opaServerUrl}/v1/data`,
          this.data,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('OPA HTTP mode initialized successfully');
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

  async checkAccess(user, resource, action, tenantId, roleId) {
    try {
      // Get the role details
      const role = await Role.findById(roleId);
      if (!role) {
        console.log('Role not found:', roleId);
        return false;
      }

      // Verify role belongs to the tenant
      if (role.tenantId.toString() !== tenantId.toString()) {
        console.log('Role does not belong to tenant:', { roleId, tenantId });
        return false;
      }

      const input = {
        user: {
          role: role.name,
          resource: resource,
          action: action,
          tenantId: tenantId
        }
      };
      console.log('Checking access with input:', JSON.stringify(input, null, 2));
      console.log('User role:', role.name);

      return this.evaluatePolicy('rbac', input);
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }
}

module.exports = new OPAService(); 