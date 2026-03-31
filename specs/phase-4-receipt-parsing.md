# Phase 4: Receipt Parsing with Gemini

Goal: Implement AI-powered receipt parsing using Google Gemini 2.0 Flash vision capabilities.

---

## 4.1 Receipt Parser Interface

- [x] Create `IReceiptParser` interface in `apps/api/src/receipt-parser/`:
  ```ts
  interface ParsedReceiptItem {
    description: string;
    amountCents: number;
    quantity: number;
  }

  interface ParsedReceipt {
    items: ParsedReceiptItem[];
    totalAmountCents: number;
    currency: string;
    restaurantName?: string;
    date?: string;
  }

  interface IReceiptParser {
    parseReceipt(imageUrl: string): Promise<ParsedReceipt>;
  }
  ```
- [x] Create DI token: `RECEIPT_PARSER` (injection token for swappability)
- [x] Add `ParsedReceipt` and `ParsedReceiptItem` Zod schemas in `packages/shared`:
  ```ts
  const ParsedReceiptItemSchema = z.object({
    description: z.string().min(1),
    amountCents: z.number().int().min(0),
    quantity: z.number().int().min(1),
  });

  const ParsedReceiptSchema = z.object({
    items: z.array(ParsedReceiptItemSchema).min(1),
    totalAmountCents: z.number().int().min(0),
    currency: z.string().default("EUR"),
    restaurantName: z.string().optional(),
    date: z.string().optional(),
  });
  ```

## 4.2 Gemini Service Implementation

- [x] Install Google Generative AI SDK: `@google/generative-ai`
- [x] Create `GeminiReceiptParserService` implementing `IReceiptParser`:
  - Reads `GEMINI_API_KEY` from env
  - Uses model `gemini-2.0-flash`
  - Sends image as inline data (base64) or file URL
- [x] Implement `parseReceipt(imageUrl: string)`:
  1. Fetch image from URL (local upload path), convert to base64
  2. Construct prompt:
     ```
     Analyze this receipt image and extract all line items.
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
     }
     ```
  3. Parse Gemini response as JSON
  4. Validate with Zod `ParsedReceiptSchema`
  5. If validation fails, retry once with error feedback to Gemini
  6. Return validated `ParsedReceipt`
- [x] Handle errors:
  - Image fetch failure → throw specific error
  - Gemini API error → throw with original message
  - JSON parse failure → retry with "your response was not valid JSON"
  - Zod validation failure → retry with validation error details
  - Max 2 retries total

## 4.3 Receipt Parser Module

- [x] Create `ReceiptParserModule`:
  - Provides `RECEIPT_PARSER` token with `GeminiReceiptParserService`
  - Exports the token for other modules to use
- [x] Register in `OrdersModule` imports
- [x] Inject `RECEIPT_PARSER` in `OrdersService` for the parse-receipt endpoint

## 4.4 Integration with Orders

- [x] Update `POST /api/orders/:id/parse-receipt` implementation:
  1. Verify order exists and has `receiptImageUrl`
  2. Call `receiptParser.parseReceipt(order.receiptImageUrl)`
  3. Store raw Gemini response in `order.rawReceiptData` (for audit)
  4. Create `OrderItem` records from parsed items
  5. Update `order.totalAmountCents` from parsed total
  6. Return parsed items for frontend to display
- [x] Handle partial failures:
  - If parsing succeeds but some items look wrong, still save all — organizer can edit
  - Store raw response so parsing can be re-evaluated later

## 4.5 Manual Fallback

- [x] Ensure `POST /api/orders/:id/items` (manual add) works independently
- [x] Add `POST /api/orders/:id/reparse` endpoint:
  - Deletes existing unassigned items
  - Re-runs Gemini parsing
  - Auth: organizer only

## 4.6 Mock Parser for Testing

- [ ] Create `MockReceiptParserService` implementing `IReceiptParser`:
  - Returns hardcoded receipt data
  - Useful for tests and development without Gemini API key
- [ ] Allow swapping via env var: `RECEIPT_PARSER_PROVIDER=gemini|mock`
- [ ] Wire in module:
  ```ts
  providers: [{
    provide: RECEIPT_PARSER,
    useClass: process.env.RECEIPT_PARSER_PROVIDER === 'mock'
      ? MockReceiptParserService
      : GeminiReceiptParserService,
  }]
  ```

## 4.7 Verify Phase

- [ ] Mock parser returns valid data matching Zod schema
- [ ] Gemini parser sends correct prompt with image
- [ ] Zod validation catches malformed Gemini responses
- [ ] Retry logic works (invalid JSON → retry → success)
- [ ] Parsed items appear as OrderItems in database
- [ ] Raw Gemini response stored in order.rawReceiptData
- [ ] Re-parse endpoint clears old items and creates new ones
- [ ] DI token swap works (mock vs gemini based on env)
