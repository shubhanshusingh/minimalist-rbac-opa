#!/bin/bash

# Create wasm directory if it doesn't exist
mkdir -p ../opa/wasm

# Compile Rego policy to a bundle (tar.gz)
echo "Compiling policies..."
opa build --target wasm -e rbac/allow -o ../opa/wasm/rbac_bundle.tar.gz ../opa/policies/rbac.rego

# Extract the raw WASM file from the bundle
tar -xzf ../opa/wasm/rbac_bundle.tar.gz -C ../opa/wasm /policy.wasm
mv ../opa/wasm/policy.wasm ../opa/wasm/rbac.wasm

echo "Policies compiled successfully!" 