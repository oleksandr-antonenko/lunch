# Phase 5: API Client Generation & Integration

Goal: Auto-generate a typed TypeScript client from the OpenAPI spec and wire it into the frontend.

---

## 5.1 OpenAPI Spec Export Script

- [x] Finalize `apps/api/src/export-openapi.ts`:
  - Bootstrap NestJS app (without listening)
  - Extract SwaggerModule document
  - Write JSON to `apps/api/openapi.json`
  - Exit process
- [x] Add script: `"openapi:export": "npx ts-node -r tsconfig-paths/register src/export-openapi.ts"`
- [x] Verify exported `openapi.json` is valid (test with Swagger Editor or validator)

## 5.2 Generator Configuration

- [x] Configure `packages/api-client/openapitools.json`:
  ```json
  {
    "$schema": "node_modules/@openapitools/openapi-generator-cli/config.schema.json",
    "spaces": 2,
    "generator-cli": {
      "version": "7.4.0",
      "generators": {
        "typescript-fetch": {
          "generatorName": "typescript-fetch",
          "inputSpec": "../../apps/api/openapi.json",
          "output": "./src/generated",
          "additionalProperties": {
            "supportsES6": true,
            "typescriptThreePlus": true,
            "npmName": "@lunch/api-client",
            "withInterfaces": true
          }
        }
      }
    }
  }
  ```
- [x] Add scripts to `packages/api-client/package.json`:
  ```json
  {
    "generate": "openapi-generator-cli generate",
    "clean": "rm -rf src/generated",
    "build": "tsc"
  }
  ```
- [x] Add `.openapi-generator-ignore` to prevent overwriting custom files

## 5.3 Client Wrapper

- [x] Create `packages/api-client/src/index.ts`:
  - Re-export all generated APIs and models
  - Export a `createApiClient(basePath: string, fetchFn?: typeof fetch)` factory:
    ```ts
    export function createApiClient(basePath: string, fetchFn?: typeof fetch) {
      const config = new Configuration({
        basePath,
        fetchApi: fetchFn,
        credentials: 'include', // send cookies for auth
      });

      return {
        users: new UsersApi(config),
        orders: new OrdersApi(config),
        debts: new DebtsApi(config),
        expenses: new ExpensesApi(config),
        dashboard: new DashboardApi(config),
        uploads: new UploadsApi(config),
      };
    }
    ```
- [x] Export types: `ApiClient` type from the factory return

## 5.4 Frontend Integration

- [x] Create `apps/web/src/lib/api.ts`:
  ```ts
  import { createApiClient } from '@lunch/api-client';

  export const api = createApiClient(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  );
  ```
- [x] Create `apps/web/src/lib/api-server.ts` (for server components):
  - Same client but with cookie forwarding from request headers
  - Uses `cookies()` from `next/headers` to pass session cookie
- [x] Verify TypeScript autocomplete works for all API methods

## 5.5 Build Pipeline Integration

- [x] Add to `apps/api/package.json`:
  ```json
  "prebuild": "pnpm run openapi:export"
  ```
- [x] Add to `packages/api-client/package.json`:
  ```json
  "prebuild": "pnpm run generate"
  ```
- [x] Add to root `package.json` build order:
  1. Build `packages/shared`
  2. Build `apps/api` (triggers OpenAPI export)
  3. Build `packages/api-client` (triggers generation from exported spec)
  4. Build `apps/web`
- [x] Add generated files to `.gitignore`:
  ```
  packages/api-client/src/generated/
  apps/api/openapi.json
  ```

## 5.6 Development Workflow Script

- [x] Create `scripts/regenerate-api-client.sh`:
  ```bash
  #!/bin/bash
  # Start API temporarily, export spec, generate client
  cd apps/api && pnpm run openapi:export
  cd ../../packages/api-client && pnpm run generate
  ```
- [x] Add root script: `"api:generate": "bash scripts/regenerate-api-client.sh"`
- [x] Document in README: run this after changing any API endpoint

## 5.7 Verify Phase

- [x] `openapi.json` exports with all endpoints
- [x] Generator produces TypeScript files without errors
- [x] Generated client compiles with `tsc`
- [x] `createApiClient` factory works in browser
- [x] API calls from Next.js pages succeed with auth cookies
- [x] Server-side API calls forward cookies correctly
- [x] `no-explicit-any` lint rule passes on generated code (or generated code is excluded from lint)
- [x] Build pipeline runs in correct order
