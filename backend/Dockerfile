FROM node:18-alpine

# Install OPA
RUN wget -O /usr/local/bin/opa https://github.com/open-policy-agent/opa/releases/download/v1.4.2/opa_linux_amd64 && \
    chmod +x /usr/local/bin/opa

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy app source
COPY . .

# Compile policies to WASM if needed
RUN if [ "$OPA_MODE" = "wasm" ]; then \
    ./scripts/compile-policies.sh; \
    fi

# Expose port
EXPOSE 3001

# Start the app
CMD ["yarn", "start"] 