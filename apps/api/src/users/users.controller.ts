import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiResponse({ status: 200, description: 'Updated user role' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto);
  }
}
