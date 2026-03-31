import { IsString, IsInt, Min, Max, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Margherita Pizza' })
  @IsString()
  @MaxLength(300)
  description!: string;

  @ApiProperty({ example: 1200 })
  @IsInt()
  @Min(0)
  @Max(10000000)
  amountCents!: number;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
