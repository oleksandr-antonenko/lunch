import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadExpenseReceiptDto {
  @ApiProperty({ example: '/uploads/receipt.jpg' })
  @IsString()
  receiptImageUrl!: string;

  @ApiProperty({ example: 2300 })
  @IsInt()
  @Min(0)
  actualAmountCents!: number;
}
