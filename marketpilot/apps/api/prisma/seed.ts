import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('DemoPass!234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@marketpilot.local' },
    update: { name: 'Demo Trader', passwordHash },
    create: { name: 'Demo Trader', email: 'demo@marketpilot.local', passwordHash, subscription: { create: { plan: 'FREE', status: 'ACTIVE' } } }
  });
  const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];
  for (const symbol of symbols) {
    await prisma.watchlistItem.upsert({ where: { userId_symbol: { userId: user.id, symbol } }, update: {}, create: { userId: user.id, symbol } });
  }
  console.log(`Seeded demo user ${user.email}. Change/remove this account before production.`);
}
main().finally(() => prisma.$disconnect());
