import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://lunch:lunch@localhost:5433/lunch_db',
});

export const prisma = new PrismaClient({ adapter });

export async function cleanDatabase() {
  await prisma.debt.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  const admin = await prisma.user.create({
    data: { email: 'admin@test.dev', name: 'Admin', role: 'ADMIN' },
  });
  const manager = await prisma.user.create({
    data: { email: 'manager@test.dev', name: 'Manager', role: 'MANAGER' },
  });
  const alice = await prisma.user.create({
    data: { email: 'alice@test.dev', name: 'Alice', role: 'MEMBER' },
  });
  const bob = await prisma.user.create({
    data: { email: 'bob@test.dev', name: 'Bob', role: 'MEMBER' },
  });

  return { admin, manager, alice, bob };
}
