import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebtsService } from '../debts/debts.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private debtsService: DebtsService,
  ) {}

  async getDashboard(userId: string) {
    const [activeOrders, myUnpaidItems, myDebts, openExpenseRequests, myPendingReimbursements] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { status: { not: 'CLOSED' } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: { select: { id: true, name: true } },
            _count: { select: { items: true } },
          },
        }),
        this.prisma.orderItem.findMany({
          where: {
            assignedToId: userId,
            order: { status: { not: 'CLOSED' } },
          },
          include: {
            order: { select: { id: true, title: true, status: true } },
          },
        }),
        this.debtsService.getMyBalance(userId),
        this.prisma.expense.findMany({
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        }),
        this.prisma.expense.findMany({
          where: {
            claimedById: userId,
            status: 'RECEIPT_UPLOADED',
          },
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        }),
      ]);

    return {
      activeOrders,
      myUnpaidItems,
      myDebts,
      openExpenseRequests,
      myPendingReimbursements,
    };
  }
}
