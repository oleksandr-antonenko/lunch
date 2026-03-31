import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UploadExpenseReceiptDto } from './dto/upload-expense-receipt.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        title: dto.title,
        description: dto.description,
        estimatedAmountCents: dto.estimatedAmountCents,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: {
    status?: string;
    claimedById?: string;
    createdById?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.claimedById) where.claimedById = query.claimedById;
    if (query.createdById) where.createdById = query.createdById;

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          claimedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        claimedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async claim(id: string, userId: string) {
    const expense = await this.findById(id);
    if (expense.status !== 'OPEN') {
      throw new BadRequestException('Only OPEN expenses can be claimed');
    }
    return this.prisma.expense.update({
      where: { id },
      data: { claimedById: userId, status: 'CLAIMED' },
      include: {
        createdBy: { select: { id: true, name: true } },
        claimedBy: { select: { id: true, name: true } },
      },
    });
  }

  async uploadReceipt(
    id: string,
    userId: string,
    dto: UploadExpenseReceiptDto,
  ) {
    const expense = await this.findById(id);
    if (expense.claimedById !== userId) {
      throw new ForbiddenException('Only the claimant can upload a receipt');
    }
    if (expense.status !== 'CLAIMED') {
      throw new BadRequestException('Expense must be in CLAIMED status');
    }
    return this.prisma.expense.update({
      where: { id },
      data: {
        receiptImageUrl: dto.receiptImageUrl,
        actualAmountCents: dto.actualAmountCents,
        status: 'RECEIPT_UPLOADED',
      },
    });
  }

  async reimburse(id: string) {
    const expense = await this.findById(id);
    if (expense.status !== 'RECEIPT_UPLOADED') {
      throw new BadRequestException(
        'Expense must be in RECEIPT_UPLOADED status',
      );
    }
    return this.prisma.expense.update({
      where: { id },
      data: { status: 'REIMBURSED', reimbursedAt: new Date() },
    });
  }
}
