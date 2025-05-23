#!/bin/bash

# Create wasm directory if it doesn't exist
mkdir -p src/policies/wasm

# Compile Rego policy to a bundle (tar.gz)
echo "Compiling policies..."
opa build --target wasm -e rbac/allow -o src/policies/wasm/rbac_bundle.tar.gz src/policies/rbac.rego

# Extract the raw WASM file from the bundle
tar -xzf src/policies/wasm/rbac_bundle.tar.gz -C src/policies/wasm /policy.wasm
mv src/policies/wasm/policy.wasm src/policies/wasm/rbac.wasm

echo "Policies compiled successfully!" 