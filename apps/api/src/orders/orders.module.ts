import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ReceiptParserModule } from '../receipt-parser/receipt-parser.module';

@Module({
  imports: [ReceiptParserModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
