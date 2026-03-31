import { IsString, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Margherita Pizza' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 1200 })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
