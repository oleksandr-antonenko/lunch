import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadReceiptDto {
  @ApiProperty({ example: '/uploads/receipt.jpg' })
  @IsString()
  receiptImageUrl!: string;
}
