# Phase 1: Project Setup & Monorepo Structure

Goal: Bootstrap the pnpm monorepo with all workspaces, tooling, and base configs.

---

## 1.1 Monorepo Init

- [x] Initialize git repo, create `.gitignore` (node_modules, dist, .env*.local, .next, .turbo)
- [x] Create `pnpm-workspace.yaml` with workspaces: `apps/*`, `packages/*`
- [x] Create root `package.json` with `"private": true`, shared scripts
- [x] Create root `tsconfig.base.json` with strict mode, path aliases
- [x] Create root `.npmrc` with `shamefully-hoist=true` (needed for Prisma/NestJS)

## 1.2 Apps — Next.js Frontend (`apps/web`)

- [x] Scaffold Next.js 15 app with App Router, TypeScript, Tailwind CSS
  ```bash
  pnpm create next-app apps/web --ts --tailwind --app --src-dir --use-pnpm
  ```
- [x] Configure `tsconfig.json` extending `../../tsconfig.base.json`
- [x] Install and init shadcn/ui (`npx shadcn@latest init`)
- [x] Set default theme (zinc, dark mode via class strategy)
- [x] Add Geist font via `next/font`
- [x] Create base layout with dark/light toggle placeholder
- [x] Add path alias `@web/*` pointing to `src/*`

## 1.3 Apps — NestJS Backend (`apps/api`)

- [x] Scaffold NestJS project:
  ```bash
  pnpm create nest apps/api --package-manager pnpm --strict
  ```
- [x] Configure `tsconfig.json` extending `../../tsconfig.base.json`
- [x] Install Swagger: `@nestjs/swagger`
- [x] Install class-validator, class-transformer
- [x] Configure Swagger in `main.ts`:
  - Title: "Office Lunch Tracker API"
  - Version: "1.0"
  - Output OpenAPI JSON at `/api/docs-json`
  - Swagger UI at `/api/docs`
- [x] Add CORS config (allow `localhost:3000` in dev)
- [x] Add global validation pipe with `whitelist: true, transform: true`
- [x] Add path alias `@api/*` pointing to `src/*`

## 1.4 Packages — Shared (`packages/shared`)

- [x] Create `package.json` with name `@lunch/shared`
- [x] Create `tsconfig.json` extending base
- [x] Create `src/index.ts` as barrel export
- [x] Create `src/enums/` directory with placeholder enums:
  - `OrderStatus`: `OPEN`, `RECEIPT_UPLOADED`, `ITEMS_ASSIGNED`, `CLOSED`
  - `PaymentStatus`: `PENDING`, `PAID`, `DEFERRED`
  - `ExpenseStatus`: `OPEN`, `CLAIMED`, `RECEIPT_UPLOADED`, `REIMBURSED`
  - `UserRole`: `MEMBER`, `MANAGER`, `ADMIN`
- [x] Create `src/schemas/` directory for shared Zod schemas (receipt parsing output)
- [x] Install `zod` as dependency

## 1.5 Packages — API Client (`packages/api-client`)

- [x] Create `package.json` with name `@lunch/api-client`
- [x] Install `openapi-generator-cli` as devDependency
- [x] Create `openapitools.json` config:
  - Generator: `typescript-fetch`
  - Input: `apps/api/openapi.json` (exported spec)
  - Output: `packages/api-client/src/generated`
- [x] Add `generate` script: fetches spec from running API and generates client
- [x] Add `prebuild` script in `apps/web` that runs api-client generation
- [x] Create `src/index.ts` barrel re-exporting generated client

## 1.6 Shared Tooling

- [ ] Install ESLint at root with `@typescript-eslint/eslint-plugin`
- [ ] Configure `@typescript-eslint/no-explicit-any: "error"` in root ESLint config
- [ ] Create `.eslintrc.js` (or `eslint.config.mjs`) at root
- [ ] Create per-workspace ESLint configs extending root
- [ ] Add root scripts:
  - `dev`: run `apps/web` and `apps/api` concurrently
  - `build`: build all packages then apps
  - `lint`: lint all workspaces
  - `format`: prettier all workspaces
- [ ] Install `concurrently` for parallel dev script
- [ ] Create `.env.example` with all required env vars documented:
  ```
  DATABASE_URL=postgresql://...
  GEMINI_API_KEY=...
  BETTER_AUTH_SECRET=...
  BETTER_AUTH_URL=http://localhost:3001
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

## 1.7 Verify Setup

- [ ] `pnpm install` succeeds from root
- [ ] `pnpm -w run dev` starts both apps without errors
- [ ] Next.js serves on `localhost:3000`
- [ ] NestJS serves on `localhost:3001` with Swagger UI at `/api/docs`
- [ ] `pnpm -w run lint` passes
- [ ] Shared package is importable from both apps
