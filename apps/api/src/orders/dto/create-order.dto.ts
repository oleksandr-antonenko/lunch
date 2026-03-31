import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Friday Pizza Order' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}
