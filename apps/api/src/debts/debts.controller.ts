import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DebtsService } from './debts.service';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { ReviewPaymentProofDto } from './dto/review-payment-proof.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: string;
  role: string;
}

@ApiTags('debts')
@Controller('debts')
@UseGuards(AuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('my-balance')
  @ApiOperation({ summary: 'Get current user net balance' })
  @ApiResponse({ status: 200, description: 'Balance summary' })
  getMyBalance(@CurrentUser() user: AuthUser) {
    return this.debtsService.getMyBalance(user.id);
  }

  @Get('team-ledger')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get full team debt matrix' })
  @ApiResponse({ status: 200, description: 'Team ledger' })
  getTeamLedger() {
    return this.debtsService.getTeamLedger();
  }

  @Get('payment-proofs')
  @ApiOperation({ summary: 'List payment proofs' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'fromUserId', required: false })
  @ApiQuery({ name: 'toUserId', required: false })
  findPaymentProofs(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('fromUserId') fromUserId?: string,
    @Query('toUserId') toUserId?: string,
  ) {
    return this.debtsService.findPaymentProofs(user.id, user.role, {
      status,
      fromUserId,
      toUserId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List debt entries' })
  @ApiQuery({ name: 'fromUserId', required: false })
  @ApiQuery({ name: 'toUserId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('fromUserId') fromUserId?: string,
    @Query('toUserId') toUserId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.debtsService.findAll(user.id, user.role, {
      fromUserId,
      toUserId,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('payment-proof')
  @ApiOperation({ summary: 'Upload payment proof' })
  @ApiResponse({ status: 201, description: 'Payment proof created' })
  createPaymentProof(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentProofDto,
  ) {
    return this.debtsService.createPaymentProof(user.id, dto);
  }

  @Patch('payment-proofs/:id/review')
  @ApiOperation({ summary: 'Approve or reject payment proof' })
  @ApiResponse({ status: 200, description: 'Payment proof reviewed' })
  reviewPaymentProof(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewPaymentProofDto,
  ) {
    return this.debtsService.reviewPaymentProof(
      id,
      user.id,
      user.role,
      dto.status,
    );
  }
}
