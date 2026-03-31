import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum UserRole {
  MEMBER = 'MEMBER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}
