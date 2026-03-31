import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { prisma, cleanDatabase, seedTestData } from '../../test/setup';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let users: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    await cleanDatabase();
    users = await seedTestData();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('should create an expense', async () => {
    const expense = await service.create(users.manager.id, {
      title: 'Office Coffee',
      estimatedAmountCents: 2500,
    });
    expect(expense.title).toBe('Office Coffee');
    expect(expense.status).toBe('OPEN');
  });

  it('should claim an expense', async () => {
    const expense = await service.create(users.manager.id, {
      title: 'Paper Towels',
      estimatedAmountCents: 800,
    });
    const claimed = await service.claim(expense.id, users.alice.id);
    expect(claimed.status).toBe('CLAIMED');
    expect(claimed.claimedBy?.id).toBe(users.alice.id);
  });

  it('should not claim an already claimed expense', async () => {
    const expense = await service.create(users.manager.id, {
      title: 'Claimed Test',
      estimatedAmountCents: 500,
    });
    await service.claim(expense.id, users.alice.id);
    await expect(
      service.claim(expense.id, users.bob.id),
    ).rejects.toThrow(BadRequestException);
  });

  it('should upload receipt only by claimant', async () => {
    const expense = await service.create(users.manager.id, {
      title: 'Receipt Test',
      estimatedAmountCents: 1000,
    });
    await service.claim(expense.id, users.alice.id);

    await expect(
      service.uploadReceipt(expense.id, users.bob.id, {
        receiptImageUrl: '/receipt.jpg',
        actualAmountCents: 950,
      }),
    ).rejects.toThrow(ForbiddenException);

    const updated = await service.uploadReceipt(expense.id, users.alice.id, {
      receiptImageUrl: '/receipt.jpg',
      actualAmountCents: 950,
    });
    expect(updated.status).toBe('RECEIPT_UPLOADED');
  });

  it('should reimburse after receipt upload', async () => {
    const expense = await service.create(users.manager.id, {
      title: 'Reimburse Test',
      estimatedAmountCents: 600,
    });
    await service.claim(expense.id, users.alice.id);
    await service.uploadReceipt(expense.id, users.alice.id, {
      receiptImageUrl: '/receipt.jpg',
      actualAmountCents: 550,
    });
    const reimbursed = await service.reimburse(expense.id);
    expect(reimbursed.status).toBe('REIMBURSED');
  });
});
