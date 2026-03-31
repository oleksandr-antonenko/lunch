import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RECEIPT_PARSER, type IReceiptParser } from '../receipt-parser/receipt-parser.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(RECEIPT_PARSER) private receiptParser: IReceiptParser,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        title: dto.title,
        organizerId: userId,
      },
      include: { organizer: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: {
    status?: string;
    organizerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.organizerId) where.organizerId = query.organizerId;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        },
        paymentProofs: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.organizerId !== userId && !['MANAGER', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Only the organizer or managers can update this order');
    }
    return this.prisma.order.update({
      where: { id },
      data: dto,
    });
  }

  async uploadReceipt(id: string, userId: string, receiptImageUrl: string) {
    const order = await this.ensureOrganizer(id, userId);
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        receiptImageUrl,
        status: 'RECEIPT_UPLOADED',
      },
    });
  }

  async parseReceipt(orderId: string, userId: string) {
    const order = await this.ensureOrganizer(orderId, userId);
    if (!order.receiptImageUrl) {
      throw new BadRequestException('Order does not have a receipt image');
    }

    const parsed = await this.receiptParser.parseReceipt(order.receiptImageUrl);

    // Store raw response for audit
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        rawReceiptData: JSON.parse(JSON.stringify(parsed)),
        totalAmountCents: parsed.totalAmountCents,
      },
    });

    // Create OrderItem records from parsed items
    const items = await Promise.all(
      parsed.items.map((item) =>
        this.prisma.orderItem.create({
          data: {
            orderId,
            description: item.description,
            amountCents: item.amountCents,
            quantity: item.quantity,
          },
        }),
      ),
    );

    return { parsed, items };
  }

  async addItem(orderId: string, userId: string, dto: CreateOrderItemDto) {
    await this.ensureOrganizer(orderId, userId);
    return this.prisma.orderItem.create({
      data: {
        orderId,
        description: dto.description,
        amountCents: dto.amountCents,
        quantity: dto.quantity,
        assignedToId: dto.assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async updateItem(orderId: string, itemId: string, userId: string, dto: UpdateOrderItemDto) {
    await this.ensureOrganizer(orderId, userId);
    return this.prisma.orderItem.update({
      where: { id: itemId, orderId },
      data: dto,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async deleteItem(orderId: string, itemId: string, userId: string) {
    await this.ensureOrganizer(orderId, userId);
    return this.prisma.orderItem.delete({
      where: { id: itemId, orderId },
    });
  }

  async finalize(orderId: string, userId: string) {
    const order = await this.ensureOrganizer(orderId, userId);

    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    if (items.length === 0) {
      throw new BadRequestException('Cannot finalize an order with no items');
    }

    const unassigned = items.filter((item) => !item.assignedToId);
    if (unassigned.length > 0) {
      throw new BadRequestException('All items must be assigned before finalizing');
    }

    // Group items by assignee and calculate totals
    const debtsByUser = new Map<string, number>();
    for (const item of items) {
      if (item.assignedToId === order.organizerId) continue; // organizer doesn't owe themselves
      const current = debtsByUser.get(item.assignedToId!) || 0;
      debtsByUser.set(item.assignedToId!, current + item.amountCents * item.quantity);
    }

    const totalAmountCents = items.reduce(
      (sum, item) => sum + item.amountCents * item.quantity,
      0,
    );

    // Create debts and update order in a transaction
    const debts = Array.from(debtsByUser.entries()).map(([fromUserId, amountCents]) => ({
      fromUserId,
      toUserId: order.organizerId,
      amountCents,
      orderId,
      reason: `Lunch order: ${order.title}`,
      type: 'CHARGE' as const,
    }));

    await this.prisma.$transaction(async (tx) => {
      if (debts.length > 0) {
        await tx.debt.createMany({ data: debts });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CLOSED', totalAmountCents },
      });
    });

    return this.findById(orderId);
  }

  private async ensureOrganizer(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can perform this action');
    }
    return order;
  }
}
