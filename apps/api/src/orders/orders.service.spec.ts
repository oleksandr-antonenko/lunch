import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { RECEIPT_PARSER } from '../receipt-parser/receipt-parser.interface';
import { MockReceiptParserService } from '../receipt-parser/mock-receipt-parser.service';
import { prisma, cleanDatabase, seedTestData } from '../../test/setup';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let users: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    await cleanDatabase();
    users = await seedTestData();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RECEIPT_PARSER, useClass: MockReceiptParserService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('should create an order', async () => {
    const order = await service.create(users.alice.id, { title: 'Test Order' });
    expect(order.title).toBe('Test Order');
    expect(order.organizerId).toBe(users.alice.id);
  });

  it('should list orders with pagination', async () => {
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should not allow non-organizer to upload receipt', async () => {
    const order = await service.create(users.alice.id, { title: 'Receipt Test' });
    await expect(
      service.uploadReceipt(order.id, users.bob.id, '/test.jpg'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should add and delete items', async () => {
    const order = await service.create(users.alice.id, { title: 'Items Test' });
    const item = await service.addItem(order.id, users.alice.id, {
      description: 'Pizza',
      amountCents: 1200,
      quantity: 1,
    });
    expect(item.description).toBe('Pizza');

    await service.deleteItem(order.id, item.id, users.alice.id);
    const detail = await service.findById(order.id);
    expect(detail.items.length).toBe(0);
  });

  it('should finalize order and create debts', async () => {
    const order = await service.create(users.alice.id, { title: 'Finalize Test' });
    await service.addItem(order.id, users.alice.id, {
      description: 'Item A',
      amountCents: 1000,
      quantity: 1,
      assignedToId: users.bob.id,
    });
    await service.addItem(order.id, users.alice.id, {
      description: 'Item B',
      amountCents: 500,
      quantity: 2,
      assignedToId: users.alice.id,
    });

    const finalized = await service.finalize(order.id, users.alice.id);
    expect(finalized.status).toBe('CLOSED');

    // Bob should owe Alice 1000 cents
    const debts = await prisma.debt.findMany({
      where: { orderId: order.id },
    });
    expect(debts.length).toBe(1);
    expect(debts[0].fromUserId).toBe(users.bob.id);
    expect(debts[0].toUserId).toBe(users.alice.id);
    expect(debts[0].amountCents).toBe(1000);
  });

  it('should reject finalization without all items assigned', async () => {
    const order = await service.create(users.alice.id, { title: 'Unassigned Test' });
    await service.addItem(order.id, users.alice.id, {
      description: 'Unassigned',
      amountCents: 500,
      quantity: 1,
    });
    await expect(
      service.finalize(order.id, users.alice.id),
    ).rejects.toThrow(BadRequestException);
  });
});
