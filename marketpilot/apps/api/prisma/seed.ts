import process from 'node:process';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Seed Admin User
  const adminPasswordHash = await bcrypt.hash('AdminPass!234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@marketpilot.local' },
    update: { name: 'Super Admin', role: 'ADMIN', passwordHash: adminPasswordHash },
    create: {
      name: 'Super Admin',
      email: 'admin@marketpilot.local',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      subscription: {
        create: {
          plan: 'ELITE',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      }
    }
  });

  // 2. Seed Demo User
  const demoPasswordHash = await bcrypt.hash('DemoPass!234', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@marketpilot.local' },
    update: { name: 'Demo Trader', role: 'USER', passwordHash: demoPasswordHash },
    create: {
      name: 'Demo Trader',
      email: 'demo@marketpilot.local',
      role: 'USER',
      passwordHash: demoPasswordHash,
      subscription: {
        create: { plan: 'FREE', status: 'ACTIVE' }
      }
    }
  });

  // 3. Seed additional sample traders for realistic analytics
  const traders = [
    { name: 'Rajesh Sharma', email: 'rajesh.trader@example.com', plan: 'PRO', status: 'ACTIVE' as const },
    { name: 'Priya Patel', email: 'priya.investor@example.com', plan: 'ELITE', status: 'ACTIVE' as const },
    { name: 'Amit Verma', email: 'amit.quant@example.com', plan: 'FREE', status: 'TRIALING' as const }
  ];

  for (const t of traders) {
    const hash = await bcrypt.hash('Pass123456!', 12);
    const u = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, role: 'USER' },
      create: {
        name: t.name,
        email: t.email,
        role: 'USER',
        passwordHash: hash,
        subscription: {
          create: {
            plan: t.plan,
            status: t.status,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }
    });

    // Seed some watchlist items
    const sampleSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BAJFINANCE'];
    for (const symbol of sampleSymbols.slice(0, 3)) {
      await prisma.watchlistItem.upsert({
        where: { userId_symbol: { userId: u.id, symbol } },
        update: {},
        create: { userId: u.id, symbol }
      });
    }

    // Seed a journal trade
    await prisma.journalEntry.create({
      data: {
        userId: u.id,
        symbol: 'RELIANCE',
        side: 'BUY',
        entryPrice: 1450.5,
        quantity: 10,
        notes: 'Breakout above 20 EMA on 15m chart'
      }
    }).catch(() => {});
  }

  // 4. Seed Watchlist for Demo User
  const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];
  for (const symbol of symbols) {
    await prisma.watchlistItem.upsert({
      where: { userId_symbol: { userId: demoUser.id, symbol } },
      update: {},
      create: { userId: demoUser.id, symbol }
    });
  }

  // 5. Seed a sample journal entry for Demo User
  await prisma.journalEntry.create({
    data: {
      userId: demoUser.id,
      symbol: 'TCS',
      side: 'BUY',
      entryPrice: 3200.0,
      quantity: 5,
      notes: 'Initial test position on quarterly earnings dip'
    }
  }).catch(() => {});

  // 6. Seed Sample Platform Alert / System Announcement
  await prisma.platformAlert.upsert({
    where: { id: 'alert-sample-1' },
    update: {},
    create: {
      id: 'alert-sample-1',
      title: 'NSE Pre-Market Update',
      message: 'Gift Nifty indicates positive opening (+65 pts). Bank Nifty weekly expiry volatility expected.',
      severity: 'info',
      active: true
    }
  }).catch(() => {});

  // 7. Seed System Audit Events
  await prisma.auditEvent.createMany({
    data: [
      { userId: adminUser.id, action: 'ADMIN_SYSTEM_INITIALIZED', metadata: { initializedAt: new Date().toISOString() } },
      { userId: demoUser.id, action: 'USER_LOGIN', metadata: { ip: '127.0.0.1', device: 'Desktop' } },
      { userId: adminUser.id, action: 'PLATFORM_ALERT_CREATED', metadata: { title: 'NSE Pre-Market Update' } }
    ]
  }).catch(() => {});

  console.log(`\n========================================`);
  console.log(`✓ Seeded Admin User: ${adminUser.email} / AdminPass!234 (Role: ADMIN)`);
  console.log(`✓ Seeded Demo User:  ${demoUser.email} / DemoPass!234 (Role: USER)`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
