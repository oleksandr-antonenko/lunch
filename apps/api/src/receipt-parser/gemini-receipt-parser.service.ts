import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ParsedReceiptSchema } from '@lunch/shared';
import type { IReceiptParser, ParsedReceipt } from './receipt-parser.interface';

const PROMPT = `Analyze this receipt image and extract all line items.
For each item, provide:
- description: the item name as written on the receipt
- amountCents: the price in cents (e.g. 12.50€ = 1250)
- quantity: number of this item (default 1)

Also provide:
- totalAmountCents: the total amount on the receipt in cents
- currency: the currency code (e.g. "EUR")
- restaurantName: the restaurant/store name if visible
- date: the date on the receipt if visible (ISO format)

Return ONLY valid JSON matching this exact structure, no markdown:
{
  "items": [{ "description": "...", "amountCents": 0, "quantity": 1 }],
  "totalAmountCents": 0,
  "currency": "EUR",
  "restaurantName": "...",
  "date": "..."
}`;

@Injectable()
export class GeminiReceiptParserService implements IReceiptParser {
  private readonly logger = new Logger(GeminiReceiptParserService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async parseReceipt(imageUrl: string): Promise<ParsedReceipt> {
    const imageData = this.loadImage(imageUrl);
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let lastError: Error | null = null;
    let prompt = PROMPT;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.base64,
            },
          },
        ]);

        const text = result.response.text();
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const parsed: unknown = JSON.parse(cleaned);
        const validated = ParsedReceiptSchema.parse(parsed);
        return validated;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Receipt parsing attempt ${attempt + 1} failed: ${lastError.message}`,
        );

        if (lastError.name === 'SyntaxError') {
          prompt = `${PROMPT}\n\nYour previous response was not valid JSON. Please return ONLY valid JSON, no markdown or extra text.`;
        } else if (lastError.name === 'ZodError') {
          prompt = `${PROMPT}\n\nYour previous response had validation errors: ${lastError.message}. Please fix and return valid JSON.`;
        } else {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('Receipt parsing failed after retries');
  }

  private loadImage(imageUrl: string): { base64: string; mimeType: string } {
    // Handle local upload paths
    const filePath = imageUrl.startsWith('/')
      ? join(process.cwd(), imageUrl)
      : imageUrl;

    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');

    let mimeType = 'image/jpeg';
    if (imageUrl.endsWith('.png')) mimeType = 'image/png';
    else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';

    return { base64, mimeType };
  }
}
