import { z } from 'zod';

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
