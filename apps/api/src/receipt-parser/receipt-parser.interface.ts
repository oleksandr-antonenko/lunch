export interface ParsedReceiptItem {
  description: string;
  amountCents: number;
  quantity: number;
}

export interface ParsedReceipt {
  items: ParsedReceiptItem[];
  totalAmountCents: number;
  currency: string;
  restaurantName?: string;
  date?: string;
}

export interface IReceiptParser {
  parseReceipt(imageUrl: string): Promise<ParsedReceipt>;
}

export const RECEIPT_PARSER = Symbol('RECEIPT_PARSER');
