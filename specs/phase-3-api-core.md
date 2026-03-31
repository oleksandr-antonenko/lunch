# Phase 3: Core API — CRUD Endpoints

Goal: Build all NestJS REST endpoints with Swagger decorators, DTOs, and service logic.

---

## 3.1 Prisma Service

- [x] Create `PrismaService` extending `PrismaClient` with `onModuleInit`/`onModuleDestroy`
- [x] Create `PrismaModule` (global) exporting `PrismaService`
- [x] Register as global module so all other modules can inject it

## 3.2 File Upload Infrastructure

- [x] Install `@nestjs/platform-express` (multer)
- [x] Create `UploadModule` with file storage config:
  - Local disk storage for dev (e.g. `uploads/` dir, served statically)
  - Max file size: 10MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
- [x] Create `UploadController`:
  - `POST /api/uploads` — accepts multipart file, returns `{ url: string }`
  - Apply `AuthGuard`
- [x] Serve `uploads/` directory as static files in dev
- [x] Add `UPLOAD_DIR` env var

## 3.3 Users Module

- [x] Create `UsersModule`, `UsersController`, `UsersService`
- [x] Endpoints:
  - `GET /api/users` — list all users (for assignment dropdowns)
    - Returns: `{ id, name, email, avatarUrl, role }[]`
    - Auth: any authenticated user
  - `GET /api/users/me` — current user profile
    - Auth: `AuthGuard`
  - `PATCH /api/users/me` — update own profile (name, avatarUrl)
    - Auth: `AuthGuard`
  - `PATCH /api/users/:id/role` — change user role
    - Auth: `RolesGuard(ADMIN)`
- [x] DTOs with class-validator:
  - `UpdateProfileDto`: name (optional string), avatarUrl (optional string)
  - `UpdateRoleDto`: role (enum UserRole)
- [x] Swagger decorators on all endpoints (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)

## 3.4 Orders Module

- [x] Create `OrdersModule`, `OrdersController`, `OrdersService`
- [x] Endpoints:
  - `POST /api/orders` — create new order
    - Body: `{ title: string }`
    - Sets organizer to current user, status OPEN
    - Auth: any authenticated user
  - `GET /api/orders` — list orders with pagination + filters
    - Query: `status?`, `organizerId?`, `page`, `limit`
    - Returns: paginated list with organizer name, item count, total
    - Auth: any authenticated user
  - `GET /api/orders/:id` — order detail with items and assignments
    - Includes: items with assigned user, payment proofs
    - Auth: any authenticated user
  - `PATCH /api/orders/:id` — update order (title, status)
    - Only organizer or MANAGER+ can update
    - Auth: `AuthGuard` + ownership check
  - `POST /api/orders/:id/receipt` — upload receipt image URL
    - Sets `receiptImageUrl`, changes status to `RECEIPT_UPLOADED`
    - Auth: organizer only
  - `POST /api/orders/:id/parse-receipt` — trigger Gemini parsing
    - Calls receipt parser service (Phase 4)
    - Creates OrderItem records from parsed data
    - Changes status to `ITEMS_ASSIGNED` (or keeps RECEIPT_UPLOADED if no auto-assign)
    - Auth: organizer only
  - `POST /api/orders/:id/items` — manually add item
    - Body: `{ description, amountCents, quantity, assignedToId? }`
    - Auth: organizer only
  - `PATCH /api/orders/:id/items/:itemId` — update item (assign user, edit amount)
    - Auth: organizer only
  - `DELETE /api/orders/:id/items/:itemId` — remove item
    - Auth: organizer only
  - `POST /api/orders/:id/finalize` — finalize order and create debts
    - Validates all items are assigned
    - Groups items by assignee, calculates totals
    - Creates Debt records (CHARGE type) for each person → organizer
    - Changes status to CLOSED
    - Auth: organizer only
- [x] DTOs:
  - `CreateOrderDto`: title (string, min 1)
  - `UpdateOrderDto`: title? (string), status? (enum)
  - `CreateOrderItemDto`: description (string), amountCents (int, min 0), quantity (int, min 1), assignedToId? (uuid)
  - `UpdateOrderItemDto`: description?, amountCents?, quantity?, assignedToId?
  - `OrderResponseDto`: full order with nested items
  - `PaginatedOrdersDto`: items[], total, page, limit
- [x] Swagger decorators on all endpoints

## 3.5 Debts Module

- [x] Create `DebtsModule`, `DebtsController`, `DebtsService`
- [x] Endpoints:
  - `GET /api/debts/my-balance` — current user's net balance
    - Calculates: sum of CHARGE debts (owed) minus sum of PAYMENT debts (paid)
    - Returns: `{ totalOwed, totalOwedToMe, netBalance, perUser: [{ userId, name, balance }] }`
    - Auth: any authenticated user
  - `GET /api/debts/team-ledger` — full team debt matrix
    - Returns all user-pair balances
    - Auth: `RolesGuard(MANAGER, ADMIN)`
  - `GET /api/debts` — list debt entries with filters
    - Query: `fromUserId?`, `toUserId?`, `type?`, `page`, `limit`
    - Auth: own debts for MEMBER, all for MANAGER+
  - `POST /api/debts/payment-proof` — upload payment proof
    - Body: `{ toUserId, amountCents, imageUrl, orderId? }`
    - Creates PaymentProof with status PENDING
    - Auth: any authenticated user
  - `GET /api/debts/payment-proofs` — list payment proofs
    - Query: `status?`, `fromUserId?`, `toUserId?`
    - Auth: own for MEMBER, all for MANAGER+
  - `PATCH /api/debts/payment-proofs/:id/review` — approve/reject payment
    - Body: `{ status: APPROVED | REJECTED }`
    - If APPROVED: creates Debt entry with type PAYMENT
    - Auth: `RolesGuard(MANAGER, ADMIN)` or the toUser
- [x] DTOs:
  - `BalanceResponseDto`: totalOwed, totalOwedToMe, netBalance, perUser[]
  - `TeamLedgerResponseDto`: matrix of user-pair balances
  - `CreatePaymentProofDto`: toUserId, amountCents, imageUrl, orderId?
  - `ReviewPaymentProofDto`: status (APPROVED | REJECTED)
- [x] Swagger decorators on all endpoints
- [x] Service methods must be transactional where creating debt + updating proof status

## 3.6 Expenses Module

- [x] Create `ExpensesModule`, `ExpensesController`, `ExpensesService`
- [x] Endpoints:
  - `POST /api/expenses` — create expense request
    - Body: `{ title, description?, estimatedAmountCents }`
    - Auth: `RolesGuard(MANAGER, ADMIN)`
  - `GET /api/expenses` — list expenses with filters
    - Query: `status?`, `claimedById?`, `createdById?`, `page`, `limit`
    - Auth: any authenticated user
  - `GET /api/expenses/:id` — expense detail
    - Auth: any authenticated user
  - `POST /api/expenses/:id/claim` — claim an expense task
    - Sets `claimedById` to current user, status to CLAIMED
    - Auth: any authenticated user (only if status is OPEN)
  - `POST /api/expenses/:id/receipt` — upload receipt after purchase
    - Body: `{ receiptImageUrl, actualAmountCents }`
    - Sets status to RECEIPT_UPLOADED
    - Auth: claimant only
  - `POST /api/expenses/:id/reimburse` — mark as reimbursed
    - Sets status to REIMBURSED, sets `reimbursedAt`
    - Auth: `RolesGuard(MANAGER, ADMIN)`
- [x] DTOs:
  - `CreateExpenseDto`: title (string), description? (string), estimatedAmountCents (int, min 0)
  - `ClaimExpenseDto`: (empty body, user from session)
  - `UploadExpenseReceiptDto`: receiptImageUrl (string, url), actualAmountCents (int, min 0)
  - `ExpenseResponseDto`: full expense with creator and claimant names
  - `PaginatedExpensesDto`: items[], total, page, limit
- [x] Swagger decorators on all endpoints

## 3.7 Dashboard Aggregation

- [x] Create `DashboardModule`, `DashboardController`, `DashboardService`
- [x] Endpoint:
  - `GET /api/dashboard` — aggregated dashboard data for current user
    - Returns:
      ```ts
      {
        activeOrders: Order[]           // status != CLOSED, limit 5
        myUnpaidItems: OrderItem[]      // assigned to me, order not closed
        myDebts: BalanceSummary         // net balance + per-user
        openExpenseRequests: Expense[]  // status OPEN
        myPendingReimbursements: Expense[] // claimed by me, status RECEIPT_UPLOADED
      }
      ```
    - Auth: any authenticated user
- [x] Swagger decorators

## 3.8 OpenAPI Spec Export

- [x] Add script to `apps/api/package.json`:
  ```json
  "openapi:export": "ts-node src/export-openapi.ts"
  ```
- [x] Create `src/export-openapi.ts`:
  - Bootstraps NestJS app
  - Extracts Swagger document
  - Writes to `openapi.json` at project root
- [x] Verify exported spec is valid OpenAPI 3.0

## 3.9 Verify Phase

- [ ] All endpoints reachable and return correct status codes
- [ ] Swagger UI shows all endpoints with correct schemas
- [ ] Pagination works correctly
- [ ] Auth guards enforce access control
- [ ] Role-based access works (MEMBER vs MANAGER vs ADMIN)
- [ ] OpenAPI spec exports cleanly
- [ ] DTOs validate input (reject invalid data with 400)
