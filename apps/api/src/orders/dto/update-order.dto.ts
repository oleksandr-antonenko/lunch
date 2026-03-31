import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum OrderStatus {
  OPEN = 'OPEN',
  RECEIPT_UPLOADED = 'RECEIPT_UPLOADED',
  ITEMS_ASSIGNED = 'ITEMS_ASSIGNED',
  CLOSED = 'CLOSED',
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
