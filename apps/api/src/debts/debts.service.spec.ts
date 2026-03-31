import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { PrismaService } from '../prisma/prisma.service';
import { prisma, cleanDatabase, seedTestData } from '../../test/setup';

describe('DebtsService', () => {
  let service: DebtsService;
  let users: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    await cleanDatabase();
    users = await seedTestData();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('should return zero balance for user with no debts', async () => {
    const balance = await service.getMyBalance(users.alice.id);
    expect(balance.totalOwed).toBe(0);
    expect(balance.totalOwedToMe).toBe(0);
    expect(balance.netBalance).toBe(0);
  });

  it('should calculate balance after charge', async () => {
    await prisma.debt.create({
      data: {
        fromUserId: users.bob.id,
        toUserId: users.alice.id,
        amountCents: 2000,
        reason: 'Test charge',
        type: 'CHARGE',
      },
    });

    const aliceBalance = await service.getMyBalance(users.alice.id);
    expect(aliceBalance.totalOwedToMe).toBe(2000);

    const bobBalance = await service.getMyBalance(users.bob.id);
    expect(bobBalance.totalOwed).toBe(2000);
  });

  it('should create and approve payment proof', async () => {
    const proof = await service.createPaymentProof(users.bob.id, {
      toUserId: users.alice.id,
      amountCents: 2000,
      imageUrl: '/test-payment.jpg',
    });
    expect(proof.status).toBe('PENDING');

    await service.reviewPaymentProof(proof.id, users.alice.id, 'MEMBER', 'APPROVED');

    // Should have a PAYMENT debt now
    const debts = await prisma.debt.findMany({
      where: { fromUserId: users.bob.id, type: 'PAYMENT' },
    });
    expect(debts.length).toBe(1);
    expect(debts[0].amountCents).toBe(2000);
  });
});
