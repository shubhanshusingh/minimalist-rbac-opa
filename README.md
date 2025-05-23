# Minimalist RBAC with OPA

A modern Role-Based Access Control (RBAC) system built with Next.js, Fastify, Open Policy Agent (OPA), and MongoDB, featuring multi-tenancy support.

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/          # Fastify backend server
└── opa/             # OPA policies and configurations
```

## Features

- Modern Next.js frontend for policy management
- Fastify backend with OPA integration
- MongoDB for data persistence
- Multi-tenant support
- Role-based access control
- Open Policy Agent for policy enforcement

## Prerequisites

- Node.js >= 18
- Yarn >= 4.0.0
- MongoDB >= 6.0
- Open Policy Agent (OPA)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   yarn install

   # Install backend dependencies
   cd ../backend
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables as needed

4. Start the development servers:
   ```bash
   # Start frontend
   cd frontend
   yarn dev

   # Start backend
   cd ../backend
   yarn dev
   ```

## License

MIT 