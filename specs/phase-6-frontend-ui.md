# Phase 6: Frontend UI — Pages & Components

Goal: Build all frontend pages with shadcn/ui, mobile-first responsive design, light/dark theme.

---

## 6.1 Layout & Navigation

- [x] Create app shell layout (`apps/web/src/app/(app)/layout.tsx`):
  - Sidebar navigation (desktop) / bottom tab bar (mobile)
  - Top bar with user avatar, name, theme toggle
  - Navigation items: Dashboard, Orders, Expenses, Debts, Settings
  - Active route highlighting
- [x] Create `(auth)` route group for sign-in/sign-up (no sidebar)
- [x] Create `(app)` route group for authenticated pages (with sidebar)
- [x] Implement theme toggle:
  - Use `next-themes` with class strategy
  - shadcn/ui `Button` with sun/moon icon
  - Persist preference in localStorage
- [x] Mobile-first: sidebar collapses to bottom tabs on screens < 768px

## 6.2 shadcn/ui Components to Install

- [x] Install required shadcn components:
  ```bash
  npx shadcn@latest add button card input label badge table tabs
  npx shadcn@latest add dialog sheet dropdown-menu avatar separator
  npx shadcn@latest add form select textarea toast skeleton
  npx shadcn@latest add alert-dialog tooltip popover command
  ```
- [x] Create reusable composed components:
  - `PageHeader` — title + description + optional action button
  - `DataTable` — generic table with sorting, pagination (wraps shadcn Table)
  - `EmptyState` — icon + message + optional CTA for empty lists
  - `MoneyDisplay` — formats cents to EUR with proper locale
  - `StatusBadge` — maps status enums to colored badges
  - `ImageUpload` — drag-and-drop zone for receipt/screenshot uploads
  - `UserAvatar` — avatar with name tooltip
  - `LoadingSkeleton` — page-level loading state

## 6.3 Dashboard Page (`/dashboard`)

- [x] Create `apps/web/src/app/(app)/dashboard/page.tsx`
- [x] Layout: responsive grid
  - 2 columns on desktop, 1 on mobile
- [x] Sections (each a Card):
  - **Active Orders** — list of orders with status badges, click to view
  - **My Unpaid Items** — items assigned to me that aren't paid, with amounts
  - **My Debts** — net balance + per-person breakdown (green = they owe me, red = I owe)
  - **Open Expense Requests** — expenses with status OPEN, "Claim" button
  - **Pending Reimbursements** — expenses I claimed, awaiting reimbursement
- [x] Each section:
  - Shows up to 5 items with "View all" link
  - Loading skeleton while data fetches
  - Empty state when no items
- [x] Fetch data from `GET /api/dashboard` using api client

## 6.4 Orders Pages

### Orders List (`/orders`)

- [x] Create `apps/web/src/app/(app)/orders/page.tsx`
- [x] Tab filters: All, Open, Closed, My Orders
- [x] DataTable with columns: Title, Organizer, Date, Items, Total, Status
- [x] "New Order" button → opens create dialog
- [x] Create Order Dialog:
  - Title input
  - Submit → `POST /api/orders`
  - Redirect to order detail on success

### Order Detail (`/orders/[id]`)

- [x] Create `apps/web/src/app/(app)/orders/[id]/page.tsx`
- [x] Status flow visualization (stepper):
  ```
  OPEN → RECEIPT_UPLOADED → ITEMS_ASSIGNED → CLOSED
  ```
- [x] Sections based on status:

**When OPEN:**
- [x] Show "Upload Receipt" button → ImageUpload component
- [x] Upload flow: select image → `POST /api/uploads` → `POST /api/orders/:id/receipt`

**When RECEIPT_UPLOADED:**
- [x] Show receipt image preview (zoomable)
- [x] "Parse Receipt" button → `POST /api/orders/:id/parse-receipt`
- [x] Show loading state during AI parsing
- [x] After parse: show extracted items table

**When items exist (RECEIPT_UPLOADED or ITEMS_ASSIGNED):**
- [x] Editable items table:
  - Description | Amount | Qty | Assigned To | Actions
  - Inline editing for description, amount
  - User dropdown for assignment (searchable select)
  - Delete button per item
  - "Add Item" button for manual additions
- [x] Running total at bottom
- [x] "Finalize Order" button (disabled until all items assigned)
  - Confirmation dialog showing who owes what
  - On confirm → `POST /api/orders/:id/finalize`

**When CLOSED:**
- [x] Read-only items table with assignments
- [x] Payment status per person:
  - For each assignee: amount owed, payment status (paid/pending/deferred)
  - "Upload Payment Proof" button per person
- [x] Receipt image (view-only)

## 6.5 Debts Pages

### My Debts (`/debts`)

- [ ] Create `apps/web/src/app/(app)/debts/page.tsx`
- [ ] Top section: Net Balance Card
  - Large number showing net balance
  - Green if positive (people owe me), red if negative (I owe)
- [ ] Per-person balance list:
  - UserAvatar + name + balance amount
  - "Pay" button → opens payment dialog
  - "View History" → expand to show individual debt entries
- [ ] Payment Dialog:
  - Shows: paying [amount] to [user]
  - ImageUpload for payment screenshot
  - Amount input (pre-filled but editable)
  - Submit → `POST /api/debts/payment-proof`
- [ ] Tab: "Payment Proofs" — list of submitted proofs with status

### Team Ledger (`/debts/team`) — Manager only

- [ ] Create `apps/web/src/app/(app)/debts/team/page.tsx`
- [ ] Matrix/grid view: rows = from user, columns = to user, cells = balance
- [ ] Color-coded cells (red = owes, green = owed to)
- [ ] Clicking a cell shows debt history for that pair
- [ ] Pending payment proofs section:
  - List of proofs awaiting review
  - Approve/Reject buttons
  - Image preview on click

## 6.6 Expenses Pages

### Expenses List (`/expenses`)

- [ ] Create `apps/web/src/app/(app)/expenses/page.tsx`
- [ ] Tab filters: All, Open, My Claims, Reimbursed
- [ ] DataTable with columns: Title, Estimated, Actual, Status, Claimed By, Created By
- [ ] "New Request" button (Manager/Admin only) → create dialog
- [ ] Create Expense Dialog:
  - Title, description (optional), estimated amount (EUR input → converts to cents)
  - Submit → `POST /api/expenses`

### Expense Detail (`/expenses/[id]`)

- [ ] Create `apps/web/src/app/(app)/expenses/[id]/page.tsx`
- [ ] Status flow stepper: `OPEN → CLAIMED → RECEIPT_UPLOADED → REIMBURSED`
- [ ] Actions based on status:
  - OPEN: "Claim This" button (any member)
  - CLAIMED: "Upload Receipt" (claimant only) with actual amount input
  - RECEIPT_UPLOADED: receipt preview, "Mark Reimbursed" button (manager only)
  - REIMBURSED: read-only summary with dates

## 6.7 Settings Page (`/settings`)

- [ ] Create `apps/web/src/app/(app)/settings/page.tsx`
- [ ] Profile section:
  - Edit name
  - Upload avatar
  - View email (read-only)
- [ ] Appearance section:
  - Theme selector (light/dark/system)
- [ ] Admin section (visible to ADMIN only):
  - User management table
  - Change user roles

## 6.8 Money Input Component

- [ ] Create `MoneyInput` component:
  - Displays as EUR (e.g. "12.50")
  - Internally stores and emits cents (integer)
  - Handles comma and dot as decimal separator
  - Max 2 decimal places
  - Used everywhere amounts are entered

## 6.9 Responsive Design

- [ ] All pages work on mobile (375px+)
- [ ] Tables switch to card layout on mobile
- [ ] Dialogs become full-screen sheets on mobile
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Image uploads work with camera capture on mobile

## 6.10 Verify Phase

- [ ] Dashboard loads with all sections populated
- [ ] Full order flow: create → upload receipt → parse → assign → finalize
- [ ] Payment proof upload and review works
- [ ] Expense flow: create → claim → receipt → reimburse
- [ ] Debt balances update correctly after order finalization
- [ ] Team ledger shows correct matrix (manager view)
- [ ] Theme toggle works (light/dark/system)
- [ ] All pages responsive on mobile
- [ ] No `any` types in frontend code (ESLint passes)
- [ ] Empty states display correctly
- [ ] Loading skeletons appear during data fetching
- [ ] Error states handled (toast notifications for failures)
