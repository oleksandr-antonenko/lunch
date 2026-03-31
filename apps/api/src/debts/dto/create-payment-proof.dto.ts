import { IsString, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentProofDto {
  @ApiProperty()
  @IsUUID()
  toUserId!: string;

  @ApiProperty({ example: 1200 })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ example: '/uploads/payment.jpg' })
  @IsString()
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
