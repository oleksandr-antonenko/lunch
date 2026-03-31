import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  async getMyBalance(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    let totalOwed = 0;
    let totalOwedToMe = 0;
    const perUserMap = new Map<string, { userId: string; name: string; balance: number }>();

    for (const debt of debts) {
      const amount = debt.type === 'CHARGE' ? debt.amountCents : -debt.amountCents;

      if (debt.fromUserId === userId) {
        // I owe someone
        totalOwed += debt.type === 'CHARGE' ? debt.amountCents : 0;
        totalOwedToMe += debt.type === 'PAYMENT' ? debt.amountCents : 0;
        const other = debt.toUser;
        const entry = perUserMap.get(other.id) || { userId: other.id, name: other.name, balance: 0 };
        entry.balance -= amount; // negative means I owe them
        perUserMap.set(other.id, entry);
      } else {
        // Someone owes me
        totalOwedToMe += debt.type === 'CHARGE' ? debt.amountCents : 0;
        totalOwed += debt.type === 'PAYMENT' ? debt.amountCents : 0;
        const other = debt.fromUser;
        const entry = perUserMap.get(other.id) || { userId: other.id, name: other.name, balance: 0 };
        entry.balance += amount; // positive means they owe me
        perUserMap.set(other.id, entry);
      }
    }

    return {
      totalOwed,
      totalOwedToMe,
      netBalance: totalOwedToMe - totalOwed,
      perUser: Array.from(perUserMap.values()),
    };
  }

  async getTeamLedger() {
    const debts = await this.prisma.debt.findMany({
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    const balances = new Map<string, Map<string, number>>();
    const users = new Map<string, string>();

    for (const debt of debts) {
      users.set(debt.fromUser.id, debt.fromUser.name);
      users.set(debt.toUser.id, debt.toUser.name);

      const amount = debt.type === 'CHARGE' ? debt.amountCents : -debt.amountCents;

      // fromUser owes toUser
      if (!balances.has(debt.fromUserId)) balances.set(debt.fromUserId, new Map());
      const fromMap = balances.get(debt.fromUserId)!;
      fromMap.set(debt.toUserId, (fromMap.get(debt.toUserId) || 0) + amount);
    }

    const matrix = Array.from(balances.entries()).flatMap(([fromId, toMap]) =>
      Array.from(toMap.entries()).map(([toId, balance]) => ({
        fromUserId: fromId,
        fromUserName: users.get(fromId)!,
        toUserId: toId,
        toUserName: users.get(toId)!,
        balance,
      })),
    );

    return { users: Array.from(users.entries()).map(([id, name]) => ({ id, name })), matrix };
  }

  async findAll(
    userId: string,
    userRole: string,
    query: { fromUserId?: string; toUserId?: string; type?: string; page?: number; limit?: number },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;

    if (!['MANAGER', 'ADMIN'].includes(userRole)) {
      where.OR = [{ fromUserId: userId }, { toUserId: userId }];
    } else {
      if (query.fromUserId) where.fromUserId = query.fromUserId;
      if (query.toUserId) where.toUserId = query.toUserId;
    }

    const [items, total] = await Promise.all([
      this.prisma.debt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      }),
      this.prisma.debt.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createPaymentProof(userId: string, dto: CreatePaymentProofDto) {
    return this.prisma.paymentProof.create({
      data: {
        fromUserId: userId,
        toUserId: dto.toUserId,
        amountCents: dto.amountCents,
        imageUrl: dto.imageUrl,
        orderId: dto.orderId,
      },
    });
  }

  async findPaymentProofs(
    userId: string,
    userRole: string,
    query: { status?: string; fromUserId?: string; toUserId?: string },
  ) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    if (!['MANAGER', 'ADMIN'].includes(userRole)) {
      where.OR = [{ fromUserId: userId }, { toUserId: userId }];
    } else {
      if (query.fromUserId) where.fromUserId = query.fromUserId;
      if (query.toUserId) where.toUserId = query.toUserId;
    }

    return this.prisma.paymentProof.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });
  }

  async reviewPaymentProof(
    proofId: string,
    reviewerId: string,
    reviewerRole: string,
    status: string,
  ) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { id: proofId } });
    if (!proof) throw new NotFoundException('Payment proof not found');

    // Only MANAGER/ADMIN or the recipient can review
    if (!['MANAGER', 'ADMIN'].includes(reviewerRole) && proof.toUserId !== reviewerId) {
      throw new ForbiddenException('Not authorized to review this payment proof');
    }

    if (status === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.paymentProof.update({
          where: { id: proofId },
          data: { status: 'APPROVED', reviewedById: reviewerId },
        });
        await tx.debt.create({
          data: {
            fromUserId: proof.fromUserId,
            toUserId: proof.toUserId,
            amountCents: proof.amountCents,
            orderId: proof.orderId,
            reason: 'Payment received',
            type: 'PAYMENT',
          },
        });
      });
    } else {
      await this.prisma.paymentProof.update({
        where: { id: proofId },
        data: { status: 'REJECTED', reviewedById: reviewerId },
      });
    }

    return this.prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });
  }
}
