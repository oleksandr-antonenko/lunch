import { z } from 'zod';

// ── Enums as const objects (Node.js 24 TS strip mode compatible) ──

export const OrderStatus = {
  OPEN: 'OPEN',
  RECEIPT_UPLOADED: 'RECEIPT_UPLOADED',
  ITEMS_ASSIGNED: 'ITEMS_ASSIGNED',
  CLOSED: 'CLOSED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  DEFERRED: 'DEFERRED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ExpenseStatus = {
  OPEN: 'OPEN',
  CLAIMED: 'CLAIMED',
  RECEIPT_UPLOADED: 'RECEIPT_UPLOADED',
  REIMBURSED: 'REIMBURSED',
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const UserRole = {
  MEMBER: 'MEMBER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ── Zod Schemas ────────────────────────────────────────

export const ParsedReceiptItemSchema = z.object({
  description: z.string().min(1),
  amountCents: z.number().int().min(0),
  quantity: z.number().int().min(1),
});

export const ParsedReceiptSchema = z.object({
  items: z.array(ParsedReceiptItemSchema).min(1),
  totalAmountCents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  restaurantName: z.string().optional(),
  date: z.string().optional(),
});

export type ParsedReceiptItem = z.infer<typeof ParsedReceiptItemSchema>;
export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
