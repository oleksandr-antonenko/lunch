export enum OrderStatus {
  OPEN = 'OPEN',
  RECEIPT_UPLOADED = 'RECEIPT_UPLOADED',
  ITEMS_ASSIGNED = 'ITEMS_ASSIGNED',
  CLOSED = 'CLOSED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  DEFERRED = 'DEFERRED',
}

export enum ExpenseStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  RECEIPT_UPLOADED = 'RECEIPT_UPLOADED',
  REIMBURSED = 'REIMBURSED',
}

export enum UserRole {
  MEMBER = 'MEMBER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}
