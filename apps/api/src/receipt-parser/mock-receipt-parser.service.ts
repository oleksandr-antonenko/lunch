import { Injectable } from '@nestjs/common';
import type { IReceiptParser, ParsedReceipt } from './receipt-parser.interface';

@Injectable()
export class MockReceiptParserService implements IReceiptParser {
  // eslint-disable-next-line @typescript-eslint/require-await
  async parseReceipt(_imageUrl: string): Promise<ParsedReceipt> {
    return {
      items: [
        { description: 'Margherita Pizza', amountCents: 1200, quantity: 1 },
        { description: 'Pepperoni Pizza', amountCents: 1400, quantity: 1 },
        { description: 'Coca Cola', amountCents: 350, quantity: 2 },
        { description: 'Garlic Bread', amountCents: 500, quantity: 1 },
      ],
      totalAmountCents: 3800,
      currency: 'EUR',
      restaurantName: 'Mock Pizza Place',
      date: new Date().toISOString().split('T')[0],
    };
  }
}
