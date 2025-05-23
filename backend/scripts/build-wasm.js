const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REGO_DIR = path.join(__dirname, '../src/policies');
const WASM_DIR = path.join(__dirname, '../src/policies/wasm');
const DATA_FILE = path.join(REGO_DIR, 'data.json');

// Ensure WASM directory exists
if (!fs.existsSync(WASM_DIR)) {
  fs.mkdirSync(WASM_DIR, { recursive: true });
}

// Build WASM for each Rego file
const regoFiles = fs.readdirSync(REGO_DIR)
  .filter(file => file.endsWith('.rego'));

regoFiles.forEach(regoFile => {
  const regoPath = path.join(REGO_DIR, regoFile);
  const wasmPath = path.join(WASM_DIR, `${path.basename(regoFile, '.rego')}.wasm`);
  
  try {
    console.log(`Building WASM for ${regoFile}...`);
    execSync(`opa build -t wasm -e rbac/allow ${regoPath} -o ${wasmPath}`);
    console.log(`Successfully built ${wasmPath}`);
    
    // Decompress the WASM file manually
    const wasmBuffer = fs.readFileSync(wasmPath);
    const decompressedBuffer = require('zlib').gunzipSync(wasmBuffer);
    fs.writeFileSync(wasmPath, decompressedBuffer);
    console.log(`Decompressed ${wasmPath}`);
  } catch (error) {
    console.error(`Error building WASM for ${regoFile}:`, error.message);
    process.exit(1);
  }
}); 