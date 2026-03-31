import { Module } from '@nestjs/common';
import { RECEIPT_PARSER } from './receipt-parser.interface';
import { GeminiReceiptParserService } from './gemini-receipt-parser.service';
import { MockReceiptParserService } from './mock-receipt-parser.service';

@Module({
  providers: [
    {
      provide: RECEIPT_PARSER,
      useClass:
        process.env.RECEIPT_PARSER_PROVIDER === 'mock'
          ? MockReceiptParserService
          : GeminiReceiptParserService,
    },
  ],
  exports: [RECEIPT_PARSER],
})
export class ReceiptParserModule {}
