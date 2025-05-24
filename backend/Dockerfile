FROM node:18-alpine

# Install OPA
RUN wget -O /usr/local/bin/opa https://github.com/open-policy-agent/opa/releases/download/v1.4.2/opa_linux_amd64 && \
    chmod +x /usr/local/bin/opa

# Create app directory
WORKDIR /app

# Enable Corepack and install dependencies
RUN corepack enable && \
    corepack prepare yarn@4.9.1 --activate

# Install app dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install

# Copy app source and OPA policies
COPY . .

# Create OPA directories if they don't exist
RUN mkdir -p opa/policies

# Compile policies to WASM if needed
RUN if [ "$OPA_MODE" = "wasm" ]; then \
    ./scripts/compile-policies.sh; \
    fi

# Expose port
EXPOSE 3001

# Set environment variables
ENV OPA_MODE=http
ENV OPA_HOST=host.docker.internal
ENV MONGODB_URI=mongodb://host.docker.internal:27017/rbac-db
ENV NODE_ENV=production

# Start the app
CMD ["yarn", "start"] 