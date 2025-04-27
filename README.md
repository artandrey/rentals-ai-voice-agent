# VAG Microservices

A monorepo workspace using pnpm for managing multiple microservices.

## Project Structure

- `twenty-crm-api-client`: API client for Twenty CRM
- `crm-manager`: CRM management service
- `agent`: Agent service
- `call-post-processor`: Service for processing call data
- `twenty-crm`: Twenty CRM implementation

## Setup

1. Install pnpm if not already installed:

   ```
   npm install -g pnpm
   ```

2. Install all dependencies:
   ```
   pnpm install
   ```

## Development

- Run all services in development mode:

  ```
  pnpm dev
  ```

- Build all services:

  ```
  pnpm build
  ```

- Start all services:

  ```
  pnpm start
  ```

- Run a command in a specific package:
  ```
  pnpm --filter <package-name> <command>
  ```

## Adding a New Service

1. Create a new directory for your service
2. Initialize with `package.json`
3. Add the directory to `pnpm-workspace.yaml`
