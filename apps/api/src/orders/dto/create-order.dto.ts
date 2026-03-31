import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Friday Pizza Order' })
  @IsString()
  @MinLength(1)
  title!: string;
}
