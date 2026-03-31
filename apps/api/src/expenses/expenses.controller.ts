import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UploadExpenseReceiptDto } from './dto/upload-expense-receipt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: string;
  role: string;
}

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create expense request' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'claimedById', required: false })
  @ApiQuery({ name: 'createdById', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('claimedById') claimedById?: string,
    @Query('createdById') createdById?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAll({
      status,
      claimedById,
      createdById,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense detail' })
  @ApiResponse({ status: 200, description: 'Expense detail' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim an expense task' })
  @ApiResponse({ status: 200, description: 'Expense claimed' })
  claim(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.claim(id, user.id);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Upload receipt after purchase' })
  @ApiResponse({ status: 200, description: 'Receipt uploaded' })
  uploadReceipt(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadExpenseReceiptDto,
  ) {
    return this.expensesService.uploadReceipt(id, user.id, dto);
  }

  @Post(':id/reimburse')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Mark expense as reimbursed' })
  @ApiResponse({ status: 200, description: 'Expense reimbursed' })
  reimburse(@Param('id') id: string) {
    return this.expensesService.reimburse(id);
  }
}
