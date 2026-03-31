import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Buy coffee for the office' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Ground coffee beans, 1kg bag' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500 })
  @IsInt()
  @Min(0)
  estimatedAmountCents!: number;
}
