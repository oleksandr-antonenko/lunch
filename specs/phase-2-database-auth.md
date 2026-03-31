# Phase 2: Database Schema & Authentication

Goal: Design the full Prisma schema and set up better-auth for self-hosted authentication.

---

## 2.1 Prisma Setup

- [x] Install Prisma in `apps/api`: `prisma`, `@prisma/client`
- [x] Run `npx prisma init` — creates `prisma/schema.prisma` and `.env`
- [x] Configure datasource for PostgreSQL
- [x] Set `DATABASE_URL` in `.env` (local Postgres or Docker Compose)

## 2.2 Docker Compose (Dev Database)

- [x] Create `docker-compose.yml` at repo root:
  - PostgreSQL 16 service on port `5432`
  - Volume for data persistence
  - Default credentials: `lunch` / `lunch` / `lunch_db`
- [x] Add `db:up` and `db:down` scripts to root `package.json`

## 2.3 Prisma Schema — Core Models

All money fields stored as `Int` (cents). All tables use `uuid` primary keys.

- [x] **User** model:
  - `id` (uuid, default cuid)
  - `email` (unique)
  - `name`
  - `avatarUrl` (optional)
  - `role` (enum: MEMBER, MANAGER, ADMIN)
  - `createdAt`, `updatedAt`
  - Relations: orders, orderItems, debtsOwed, debtsOwedTo, expenses, paymentProofs

- [x] **better-auth tables** (managed by better-auth, must exist in schema):
  - `Session` — id, userId, expiresAt, token, ipAddress, userAgent
  - `Account` — id, userId, accountId, providerId, accessToken, refreshToken, etc.
  - `Verification` — id, identifier, value, expiresAt

- [x] **Order** model (a lunch order event):
  - `id` (uuid)
  - `title` (e.g. "Friday Pizza Order")
  - `organizerId` (FK → User)
  - `status` (enum: OPEN, RECEIPT_UPLOADED, ITEMS_ASSIGNED, CLOSED)
  - `receiptImageUrl` (optional, set after upload)
  - `rawReceiptData` (Json, optional — raw Gemini response for audit)
  - `totalAmountCents` (Int)
  - `createdAt`, `updatedAt`
  - Relations: items[], paymentProofs[]

- [x] **OrderItem** model (a line item on a receipt):
  - `id` (uuid)
  - `orderId` (FK → Order)
  - `assignedToId` (FK → User, optional until assigned)
  - `description` (String — item name from receipt)
  - `amountCents` (Int)
  - `quantity` (Int, default 1)
  - `createdAt`
  - Relations: order, assignedTo

- [x] **Debt** model (append-only ledger):
  - `id` (uuid)
  - `fromUserId` (FK → User — who owes)
  - `toUserId` (FK → User — who is owed)
  - `amountCents` (Int)
  - `orderId` (FK → Order, optional — source order)
  - `reason` (String — "Lunch order: Friday Pizza" or "Payment received")
  - `type` (enum: CHARGE, PAYMENT)
  - `createdAt`
  - Note: NEVER deleted. Payments create a PAYMENT entry that offsets the CHARGE.

- [x] **PaymentProof** model:
  - `id` (uuid)
  - `fromUserId` (FK → User — who paid)
  - `toUserId` (FK → User — who received)
  - `orderId` (FK → Order, optional)
  - `amountCents` (Int)
  - `imageUrl` (String — screenshot)
  - `status` (enum: PENDING, APPROVED, REJECTED)
  - `reviewedById` (FK → User, optional)
  - `createdAt`

- [x] **Expense** model (office purchases):
  - `id` (uuid)
  - `title` (String — "Buy milk")
  - `description` (String, optional)
  - `estimatedAmountCents` (Int)
  - `actualAmountCents` (Int, optional — set after purchase)
  - `status` (enum: OPEN, CLAIMED, RECEIPT_UPLOADED, REIMBURSED)
  - `createdById` (FK → User — manager who created request)
  - `claimedById` (FK → User, optional — who took the task)
  - `receiptImageUrl` (String, optional)
  - `reimbursedAt` (DateTime, optional)
  - `createdAt`, `updatedAt`

- [x] **Enums** in Prisma schema:
  - `UserRole`, `OrderStatus`, `PaymentStatus`, `ExpenseStatus`, `DebtType`, `PaymentProofStatus`
  - Keep in sync with `packages/shared` enums

## 2.4 Prisma Migrations

- [ ] Run `npx prisma migrate dev --name init` to create initial migration
- [ ] Verify all tables created in PostgreSQL
- [ ] Run `npx prisma generate` to generate client
- [ ] Create seed script (`prisma/seed.ts`):
  - 5 test users (1 admin, 1 manager, 3 members)
  - 2 sample orders with items
  - Sample debts and expenses
- [ ] Add `prisma.seed` config to `apps/api/package.json`

## 2.5 Authentication — better-auth

- [ ] Install better-auth in `apps/api`: `better-auth`
- [ ] Install better-auth client in `apps/web`: `@better-auth/react` (or relevant client pkg)
- [ ] Create `apps/api/src/auth/auth.ts` — better-auth server config:
  - Database: Prisma adapter (use existing Prisma client)
  - Email + password provider
  - Session strategy: cookie-based (httpOnly, secure, sameSite)
  - Secret from `BETTER_AUTH_SECRET` env var
- [ ] Create auth NestJS module (`AuthModule`):
  - Mount better-auth handler at `/api/auth/*` (catch-all route)
  - Middleware to extract session and attach `user` to request
- [ ] Create `AuthGuard` (NestJS guard):
  - Reads session from request (cookie)
  - Validates session via better-auth
  - Attaches user to `request.user`
  - Returns 401 if no valid session
- [ ] Create `RolesGuard` + `@Roles()` decorator:
  - Checks `request.user.role` against allowed roles
  - Returns 403 if insufficient role
- [ ] Create `@CurrentUser()` param decorator to extract user from request

## 2.6 Auth — Frontend Client

- [ ] Create `apps/web/src/lib/auth-client.ts`:
  - Initialize better-auth client pointing to API URL
  - Export typed `signIn`, `signUp`, `signOut`, `useSession` hooks
- [ ] Create `apps/web/src/components/providers/auth-provider.tsx`:
  - Wraps app with session provider
- [ ] Add auth provider to root layout

## 2.7 Auth — Pages (Basic)

- [ ] Create `/sign-in` page:
  - Email + password form
  - Link to sign-up
  - Redirect to dashboard on success
- [ ] Create `/sign-up` page:
  - Name, email, password form
  - Redirect to dashboard on success
- [ ] Create auth middleware/guard on frontend:
  - Protect all routes except `/sign-in`, `/sign-up`
  - Redirect unauthenticated users to `/sign-in`

## 2.8 Verify Phase

- [ ] Database migrations run cleanly
- [ ] Seed data populates correctly
- [ ] Sign up creates user in DB
- [ ] Sign in returns valid session
- [ ] Protected API routes return 401 without session
- [ ] Protected API routes return data with valid session
- [ ] Frontend redirects unauthenticated users
