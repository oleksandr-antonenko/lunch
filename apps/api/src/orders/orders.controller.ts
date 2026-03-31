import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

interface AuthUser {
  id: string;
  role: string;
}

@ApiTags('orders')
@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with pagination and filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'organizerId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('organizerId') organizerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll({
      status,
      organizerId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with items' })
  @ApiResponse({ status: 200, description: 'Order detail' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (organizer or manager+)' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, user.id, user.role, dto);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Upload receipt image URL' })
  @ApiResponse({ status: 200, description: 'Receipt uploaded' })
  uploadReceipt(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UploadReceiptDto,
  ) {
    return this.ordersService.uploadReceipt(id, user.id, dto.receiptImageUrl);
  }

  @Post(':id/parse-receipt')
  @ApiOperation({ summary: 'Parse receipt with AI' })
  @ApiResponse({ status: 200, description: 'Receipt parsed and items created' })
  parseReceipt(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.parseReceipt(id, user.id);
  }

  @Post(':id/reparse')
  @ApiOperation({ summary: 'Re-parse receipt (deletes unassigned items)' })
  @ApiResponse({ status: 200, description: 'Receipt re-parsed' })
  reparse(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.reparse(id, user.id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to order' })
  @ApiResponse({ status: 201, description: 'Item added' })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderItemDto,
  ) {
    return this.ordersService.addItem(id, user.id, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update order item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return this.ordersService.updateItem(id, itemId, user.id, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete order item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.deleteItem(id, itemId, user.id);
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize order and create debts' })
  @ApiResponse({ status: 200, description: 'Order finalized' })
  finalize(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.finalize(id, user.id);
  }
}
