import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.debt.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lunch.dev',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@lunch.dev',
      name: 'Manager User',
      role: 'MANAGER',
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@lunch.dev',
      name: 'Alice',
      role: 'MEMBER',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@lunch.dev',
      name: 'Bob',
      role: 'MEMBER',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@lunch.dev',
      name: 'Charlie',
      role: 'MEMBER',
    },
  });

  // Create orders
  const order1 = await prisma.order.create({
    data: {
      title: 'Friday Pizza Order',
      organizerId: alice.id,
      status: 'CLOSED',
      totalAmountCents: 4500,
      items: {
        create: [
          { description: 'Margherita Pizza', amountCents: 1200, quantity: 1, assignedToId: bob.id },
          { description: 'Pepperoni Pizza', amountCents: 1400, quantity: 1, assignedToId: charlie.id },
          { description: 'Garlic Bread', amountCents: 500, quantity: 1, assignedToId: alice.id },
          { description: 'Drinks', amountCents: 1400, quantity: 2, assignedToId: bob.id },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      title: 'Monday Sushi Order',
      organizerId: manager.id,
      status: 'OPEN',
      totalAmountCents: 0,
    },
  });

  // Create debts from order1
  await prisma.debt.createMany({
    data: [
      {
        fromUserId: bob.id,
        toUserId: alice.id,
        amountCents: 2600,
        orderId: order1.id,
        reason: 'Lunch order: Friday Pizza Order',
        type: 'CHARGE',
      },
      {
        fromUserId: charlie.id,
        toUserId: alice.id,
        amountCents: 1400,
        orderId: order1.id,
        reason: 'Lunch order: Friday Pizza Order',
        type: 'CHARGE',
      },
    ],
  });

  // Create expenses
  await prisma.expense.create({
    data: {
      title: 'Buy coffee for the office',
      description: 'Ground coffee beans, 1kg bag',
      estimatedAmountCents: 2500,
      status: 'OPEN',
      createdById: manager.id,
    },
  });

  await prisma.expense.create({
    data: {
      title: 'Paper towels',
      estimatedAmountCents: 800,
      actualAmountCents: 750,
      status: 'RECEIPT_UPLOADED',
      createdById: manager.id,
      claimedById: alice.id,
    },
  });

  console.log('Seed data created successfully');
  console.log({ admin, manager, alice, bob, charlie, order1: order1.id, order2: order2.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
