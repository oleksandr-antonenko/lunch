# Office Lunch Tracker

A full-stack office lunch order tracker with AI-powered receipt parsing, debt management, and expense tracking.

## Architecture

```
lunch/
├── apps/
│   ├── api/          # NestJS REST API (port 3001)
│   └── web/          # Next.js 16 frontend (port 3000)
├── packages/
│   ├── shared/       # Shared types, enums, Zod schemas
│   └── api-client/   # Typed API client factory
├── docker-compose.yml      # Dev database (PostgreSQL)
└── docker-compose.prod.yml # Full production stack
```

**Tech stack:** NestJS, Next.js 16, Prisma, PostgreSQL, better-auth, shadcn/ui, Tailwind CSS, Google Gemini (receipt parsing)

## Prerequisites

- Node.js >= 20
- pnpm
- Docker (for PostgreSQL)

## Local Development Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
pnpm db:up
```

This starts PostgreSQL on port 5433 with credentials `lunch/lunch/lunch_db`.

### 3. Configure environment

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and set:
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `GEMINI_API_KEY` — your Google Gemini API key (or set `RECEIPT_PARSER_PROVIDER=mock` to skip)

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

### 5. Start development servers

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger UI: http://localhost:3001/api/docs

### Test accounts (from seed)

| Email | Role |
|---|---|
| admin@lunch.dev | ADMIN |
| manager@lunch.dev | MANAGER |
| alice@lunch.dev | MEMBER |
| bob@lunch.dev | MEMBER |
| charlie@lunch.dev | MEMBER |

Sign up a new account via the UI, or use the seeded users (note: seeded users don't have passwords — sign up fresh accounts for testing).

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start both apps concurrently |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all workspaces |
| `pnpm format` | Format with Prettier |
| `pnpm db:up` | Start PostgreSQL (Docker) |
| `pnpm db:down` | Stop PostgreSQL |
| `pnpm api:generate` | Regenerate API client from OpenAPI spec |

### API-specific scripts (run from `apps/api/`)

| Script | Description |
|---|---|
| `pnpm test` | Run backend tests |
| `pnpm start:dev` | Start API in watch mode |
| `pnpm openapi:export` | Export OpenAPI spec to `openapi.json` |

### Web-specific scripts (run from `apps/web/`)

| Script | Description |
|---|---|
| `pnpm test` | Run frontend tests (Vitest) |
| `pnpm dev` | Start Next.js dev server |

## Production Deployment

### Option 1: Docker Compose

```bash
# Set required environment variables
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
export GEMINI_API_KEY=your-key-here

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

This starts:
- PostgreSQL on port 5433
- API on port 3001
- Web on port 3000

### Option 2: Manual deployment

#### API (NestJS)

```bash
cd apps/api
pnpm build
node dist/main.js
```

Required env vars:
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Auth secret (min 32 chars)
- `BETTER_AUTH_URL` — Public URL of the API
- `FRONTEND_URL` — Frontend URL (for CORS)
- `GEMINI_API_KEY` — Google Gemini API key
- `PORT` — Server port (default: 3001)

#### Web (Next.js)

```bash
cd apps/web
pnpm build
pnpm start
```

Required env vars:
- `NEXT_PUBLIC_API_URL` — Full API URL (e.g. `https://api.example.com/api`)

### Database migrations (production)

```bash
cd apps/api
npx prisma migrate deploy
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | — | Public API URL |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `RECEIPT_PARSER_PROVIDER` | No | `gemini` | `gemini` or `mock` |
| `UPLOAD_DIR` | No | `./uploads` | File upload directory |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL (CORS) |
| `PORT` | No | `3001` | API server port |
| `NEXT_PUBLIC_API_URL` | Yes (web) | — | API URL for frontend |

## Features

- **Order Management** — Create lunch orders, upload receipts, assign items to team members
- **AI Receipt Parsing** — Gemini-powered receipt image parsing extracts line items automatically
- **Debt Tracking** — Automatic debt calculation when orders are finalized, per-user balance tracking
- **Payment Proofs** — Upload payment screenshots, manager approval workflow
- **Expense Requests** — Managers create expense requests, members claim and submit receipts
- **Team Ledger** — Manager view of all team debts in a matrix
- **Dark Mode** — System/light/dark theme toggle
- **Mobile Responsive** — Bottom tab navigation, responsive tables

## Testing

```bash
# Backend tests (requires running PostgreSQL)
cd apps/api && pnpm test

# Frontend tests
cd apps/web && pnpm test

# Lint everything
pnpm lint
```
