# Phase 7: Polish, Testing & Deployment Prep

Goal: Harden the app — error handling, validations, tests, and production readiness.

---

## 7.1 Error Handling (Backend)

- [ ] Create global exception filter (`AllExceptionsFilter`):
  - Catches all exceptions
  - Returns consistent error shape: `{ statusCode, message, error, timestamp }`
  - Logs errors with context (request path, user id)
- [ ] Create custom exceptions:
  - `OrderNotFoundError`
  - `UnauthorizedOrderAccessError`
  - `InvalidOrderStateError` (e.g. can't finalize without items assigned)
  - `ReceiptParsingError`
- [ ] Add NestJS `HttpException` mapping for all custom errors
- [ ] Ensure 422 Unprocessable Entity for Zod validation failures from receipt parsing

## 7.2 Error Handling (Frontend)

- [ ] Create `apps/web/src/app/(app)/error.tsx` — app-level error boundary
- [ ] Create `apps/web/src/app/(app)/not-found.tsx` — 404 page
- [ ] Create `useApiError` hook:
  - Catches API errors from generated client
  - Shows toast notification with user-friendly message
  - Handles 401 → redirect to sign-in
  - Handles 403 → "Insufficient permissions" toast
  - Handles 422 → show validation errors
  - Handles 500 → "Something went wrong" toast
- [ ] Add toast provider to root layout (shadcn `Toaster`)

## 7.3 Input Validation Tightening

- [ ] Audit all DTOs — ensure all fields have proper validators:
  - Strings: `@IsString()`, `@MinLength()`, `@MaxLength()`
  - Numbers: `@IsInt()`, `@Min(0)` for money
  - UUIDs: `@IsUUID()`
  - Enums: `@IsEnum()`
  - Optional fields: `@IsOptional()`
- [ ] Add rate limiting to receipt parsing endpoint (max 10/min per user)
- [ ] Add file size validation on upload (frontend + backend)
- [ ] Sanitize user-provided strings (strip HTML)

## 7.4 Optimistic UI Updates

- [ ] Order item assignment — update UI immediately, rollback on failure
- [ ] Payment proof submission — add to list immediately with "Pending" badge
- [ ] Expense claim — button disabled immediately, "Claimed by you" shown
- [ ] Use SWR or React Query for data fetching with optimistic mutations:
  - Install `swr` or `@tanstack/react-query`
  - Create hooks: `useOrders`, `useOrder`, `useDebts`, `useExpenses`, `useDashboard`
  - Configure stale time, revalidation

## 7.5 Real-Time Considerations (Optional Enhancement)

- [ ] Decide: SSE or polling for live updates
- [ ] Minimum: polling dashboard every 30s
- [ ] Order detail page: poll every 10s when status is intermediate
- [ ] Payment proof status: poll until approved/rejected

## 7.6 Backend Testing

- [ ] Setup test environment:
  - Test database (separate PostgreSQL database or use `prisma-test-environment`)
  - Jest config in `apps/api`
  - `beforeAll`: run migrations, seed test data
  - `afterAll`: clean up
- [ ] Unit tests (service layer):
  - [ ] `OrdersService` — create, update, finalize logic, debt creation
  - [ ] `DebtsService` — balance calculation, payment proof approval
  - [ ] `ExpensesService` — state machine transitions
  - [ ] `GeminiReceiptParserService` — Zod validation, retry logic (mock Gemini API)
- [ ] Integration tests (controller layer):
  - [ ] Auth flow: sign up → sign in → access protected route
  - [ ] Order flow: create → upload receipt → parse → assign → finalize
  - [ ] Debt flow: finalize order → check balances → submit proof → approve → check balances
  - [ ] Expense flow: create → claim → receipt → reimburse
  - [ ] Role guards: MEMBER can't create expenses, MANAGER can
- [ ] Test coverage target: 80%+ for services

## 7.7 Frontend Testing

- [ ] Setup Vitest + React Testing Library in `apps/web`
- [ ] Component tests:
  - [ ] `MoneyDisplay` — correct formatting
  - [ ] `MoneyInput` — cent conversion, decimal handling
  - [ ] `StatusBadge` — correct colors per status
  - [ ] `ImageUpload` — file selection, preview display
- [ ] Page tests (with mocked API):
  - [ ] Dashboard — renders all sections
  - [ ] Order detail — shows correct UI per status
  - [ ] Debts page — shows balances correctly

## 7.8 Linting & Type Safety

- [ ] `pnpm -w run lint` passes with zero warnings
- [ ] No `any` types anywhere (including generated code — exclude or fix)
- [ ] Add `packages/api-client/src/generated` to `.eslintignore` (generated code)
- [ ] TypeScript strict mode in all tsconfigs
- [ ] No unused imports or variables

## 7.9 Environment & Configuration

- [ ] Create `.env.example` with all required variables documented
- [ ] Create `apps/api/src/config/` module:
  - Validates all required env vars on startup
  - Typed config service (no raw `process.env` elsewhere)
  - Required vars:
    - `DATABASE_URL`
    - `BETTER_AUTH_SECRET`
    - `BETTER_AUTH_URL`
    - `GEMINI_API_KEY`
    - `UPLOAD_DIR`
    - `FRONTEND_URL` (for CORS)
- [ ] Create `apps/web/.env.local.example`:
  - `NEXT_PUBLIC_API_URL`

## 7.10 Database

- [ ] Add database indexes:
  - `Order.organizerId`
  - `Order.status`
  - `OrderItem.orderId`
  - `OrderItem.assignedToId`
  - `Debt.fromUserId`, `Debt.toUserId`
  - `Expense.status`, `Expense.claimedById`
  - `PaymentProof.fromUserId`, `PaymentProof.status`
- [ ] Verify no N+1 queries in list endpoints (use Prisma `include` properly)
- [ ] Add `@@index` directives in Prisma schema

## 7.11 Production Checklist

- [ ] Dockerfile for `apps/api` (multi-stage build)
- [ ] Dockerfile for `apps/web` (standalone Next.js output)
- [ ] `docker-compose.prod.yml` with all services
- [ ] Health check endpoint: `GET /api/health`
- [ ] Graceful shutdown handling in NestJS
- [ ] Static file serving strategy for uploads (S3/Cloudflare R2 for prod, local for dev)
- [ ] README.md with:
  - Project description
  - Setup instructions
  - Architecture overview
  - Available scripts
  - Env var documentation

## 7.12 Verify Phase

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Lint passes with zero errors/warnings
- [ ] App runs from Docker Compose
- [ ] Full E2E flow works:
  1. Sign up two users
  2. User A creates order, uploads receipt
  3. AI parses receipt into items
  4. User A assigns items to User B
  5. User A finalizes order
  6. User B sees debt on dashboard
  7. User B uploads payment proof
  8. User A approves payment
  9. Debt balance is zero
  10. Manager creates expense request
  11. User B claims and submits receipt
  12. Manager marks as reimbursed
