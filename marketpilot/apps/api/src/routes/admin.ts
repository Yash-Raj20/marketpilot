import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
import { getDhanStatus, getDhanFundLimits, getDhanHoldings, getDhanPositions } from '../services/dhan.js';
import { getTelegramBotInfo, getTelegramConfig, sendTelegramMessage, sendTelegramBroadcast } from '../services/telegram.js';

const router = Router();

// 0. Active alerts for both users and admin
router.get('/alerts/active', async (_req, res, next) => {
  try {
    const alerts = await prisma.platformAlert.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ alerts });
  } catch (e) {
    next(e);
  }
});

// All routes below require Admin privileges
router.use(requireAdmin);

// 1. STATS / OVERVIEW
router.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      adminCount,
      subscriptions,
      totalJournalTrades,
      totalWatchlistItems,
      totalAuditLogs,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.subscription.findMany({
        select: { plan: true, status: true }
      }),
      prisma.journalEntry.count(),
      prisma.watchlistItem.count(),
      prisma.auditEvent.count(),
      prisma.auditEvent.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })
    ]);

    // Breakdown subscriptions
    const planCounts: Record<string, number> = { FREE: 0, PRO: 0, ELITE: 0 };
    const statusCounts: Record<string, number> = { ACTIVE: 0, TRIALING: 0, PAST_DUE: 0, CANCELLED: 0, EXPIRED: 0 };

    let estimatedMRR = 0;
    for (const sub of subscriptions) {
      planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
      if (sub.status === 'ACTIVE') {
        if (sub.plan === 'PRO') estimatedMRR += 1999;
        if (sub.plan === 'ELITE') estimatedMRR += 4999;
      }
    }

    res.json({
      stats: {
        totalUsers,
        adminCount,
        userCount: totalUsers - adminCount,
        planCounts,
        statusCounts,
        estimatedMRR,
        totalJournalTrades,
        totalWatchlistItems,
        totalAuditLogs
      },
      recentAuditLogs
    });
  } catch (e) {
    next(e);
  }
});

// 2. USERS LIST WITH FILTERS & PAGINATION
router.get('/users', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const roleFilter = typeof req.query.role === 'string' && req.query.role !== 'ALL' ? req.query.role : undefined;
    const planFilter = typeof req.query.plan === 'string' && req.query.plan !== 'ALL' ? req.query.plan : undefined;
    const statusFilter = typeof req.query.status === 'string' && req.query.status !== 'ALL' ? req.query.status : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (roleFilter && (roleFilter === 'USER' || roleFilter === 'ADMIN')) {
      where.role = roleFilter;
    }
    if (planFilter || statusFilter) {
      where.subscription = {};
      if (planFilter) where.subscription.plan = planFilter;
      if (statusFilter) where.subscription.status = statusFilter;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              id: true,
              plan: true,
              status: true,
              currentPeriodEnd: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              watchlist: true,
              journal: true
            }
          }
        }
      })
    ]);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

// 3. CREATE USER DIRECTLY (ADMIN)
router.post('/users', async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(254),
      password: z.string().min(8).max(128),
      role: z.enum(['USER', 'ADMIN']).default('USER'),
      plan: z.enum(['FREE', 'PRO', 'ELITE']).default('FREE')
    }).parse(req.body);

    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        role: input.role,
        subscription: {
          create: {
            plan: input.plan,
            status: 'ACTIVE',
            currentPeriodEnd: input.plan !== 'FREE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: true
      }
    });

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'ADMIN_CREATED_USER',
        metadata: { createdUserId: user.id, email: user.email, role: user.role }
      }
    });

    res.status(201).json({ user, message: 'User created successfully.' });
  } catch (e) {
    next(e);
  }
});

// 4. GET SINGLE USER DETAILS
router.get('/users/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        watchlist: {
          orderBy: { createdAt: 'desc' }
        },
        journal: {
          take: 20,
          orderBy: { tradedAt: 'desc' }
        },
        auditEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e) {
    next(e);
  }
});

// 5. UPDATE USER DETAILS & ROLE
router.patch('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const input = z.object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.string().trim().email().max(254).optional(),
      role: z.enum(['USER', 'ADMIN']).optional()
    }).parse(req.body);

    // Prevent removing the last admin
    if (input.role === 'USER') {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last remaining Administrator.' });
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        ...(input.role ? { role: input.role } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
        subscription: true
      }
    });

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'ADMIN_UPDATED_USER',
        metadata: { updatedUserId: id, updates: input }
      }
    });

    res.json({ user: updated, message: 'User updated successfully.' });
  } catch (e) {
    next(e);
  }
});

// 6. UPDATE USER SUBSCRIPTION (PLAN, STATUS, EXPIRY)
router.patch('/users/:id/subscription', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const input = z.object({
      plan: z.enum(['FREE', 'PRO', 'ELITE']).optional(),
      status: z.enum(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED']).optional(),
      daysValid: z.number().int().min(1).max(3650).optional()
    }).parse(req.body);

    const updateData: any = {};
    if (input.plan) updateData.plan = input.plan;
    if (input.status) updateData.status = input.status;
    if (input.daysValid) {
      updateData.currentPeriodEnd = new Date(Date.now() + input.daysValid * 24 * 60 * 60 * 1000);
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: id },
      create: {
        userId: id,
        plan: input.plan || 'FREE',
        status: input.status || 'ACTIVE',
        currentPeriodEnd: input.daysValid ? new Date(Date.now() + input.daysValid * 24 * 60 * 60 * 1000) : null
      },
      update: updateData
    });

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'ADMIN_MODIFIED_SUBSCRIPTION',
        metadata: { targetUserId: id, plan: subscription.plan, status: subscription.status }
      }
    });

    res.json({ subscription, message: 'Subscription updated successfully.' });
  } catch (e) {
    next(e);
  }
});

// 7. DELETE USER
router.delete('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);

    if (req.user?.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only remaining admin.' });
      }
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'ADMIN_DELETED_USER',
        metadata: { deletedEmail: user.email, deletedUserId: id }
      }
    });

    res.json({ message: `User ${user.email} has been deleted successfully.` });
  } catch (e) {
    next(e);
  }
});

// 8. PLATFORM-WIDE TRADES & ACTIVITY
router.get('/journal', async (_req, res, next) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      take: 50,
      orderBy: { tradedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

// 9. AUDIT LOGS
router.get('/audit-logs', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const logs = await prisma.auditEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
    res.json({ logs });
  } catch (e) {
    next(e);
  }
});

// 10. ALERTS MANAGEMENT
router.get('/alerts', async (_req, res, next) => {
  try {
    const alerts = await prisma.platformAlert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ alerts });
  } catch (e) {
    next(e);
  }
});

router.post('/alerts', async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      title: z.string().trim().min(3).max(120),
      message: z.string().trim().min(5).max(500),
      severity: z.enum(['info', 'warning', 'urgent', 'success']).default('info'),
      active: z.boolean().default(true)
    }).parse(req.body);

    const alert = await prisma.platformAlert.create({
      data: input
    });

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'ADMIN_CREATED_ALERT',
        metadata: { alertId: alert.id, title: alert.title }
      }
    });

    res.status(201).json({ alert, message: 'Platform alert published.' });
  } catch (e) {
    next(e);
  }
});

router.patch('/alerts/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const input = z.object({
      title: z.string().trim().min(3).max(120).optional(),
      message: z.string().trim().min(5).max(500).optional(),
      severity: z.enum(['info', 'warning', 'urgent', 'success']).optional(),
      active: z.boolean().optional()
    }).parse(req.body);

    const alert = await prisma.platformAlert.update({
      where: { id },
      data: input
    });

    res.json({ alert, message: 'Alert updated.' });
  } catch (e) {
    next(e);
  }
});

router.delete('/alerts/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    await prisma.platformAlert.delete({ where: { id } });
    res.json({ message: 'Alert removed.' });
  } catch (e) {
    next(e);
  }
});

// 7. INTEGRATIONS MONITOR & MANAGEMENT (DHAN & TELEGRAM)
router.get('/integrations/status', async (_req, res, next) => {
  try {
    const [dhanStatus, telegramBot] = await Promise.all([
      getDhanStatus(),
      getTelegramBotInfo()
    ]);

    const telegramConfig = getTelegramConfig();

    res.json({
      useMockData: process.env.USE_MOCK_DATA === 'true',
      dhan: dhanStatus,
      telegram: {
        configured: Boolean(telegramConfig?.botToken),
        connected: telegramBot.success,
        bot: telegramBot.bot,
        chatId: telegramConfig?.defaultChatId,
        error: telegramBot.error
      }
    });
  } catch (e) {
    next(e);
  }
});

router.post('/integrations/toggle-mock', async (req: AuthRequest, res, next) => {
  try {
    const current = process.env.USE_MOCK_DATA === 'true';
    process.env.USE_MOCK_DATA = (!current).toString();
    const newStatus = process.env.USE_MOCK_DATA === 'true';

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: `DATA_MODE_TOGGLED_${newStatus ? 'MOCK' : 'LIVE_DHAN'}`
      }
    });

    res.json({
      useMockData: newStatus,
      message: `Data mode switched to: ${newStatus ? 'Mock / Demo Data' : 'Live DhanHQ Broker Data'}`
    });
  } catch (e) {
    next(e);
  }
});

router.post('/integrations/telegram-test', async (req: AuthRequest, res, next) => {
  try {
    const { chatId } = z.object({
      chatId: z.string().optional()
    }).parse(req.body);

    const testMsg = `
<b>🤖 MarketPilot AI — Admin Dispatch Test</b>
━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> ✅ Operational
<b>Admin:</b> ${req.user?.name || req.user?.email || 'Platform Admin'}
<b>Time:</b> ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
<b>Integration:</b> Telegram Bot Connected
━━━━━━━━━━━━━━━━━━━━
<i>MarketPilot AI System Control</i>
    `.trim();

    const result = await sendTelegramMessage(testMsg, { chatId });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: 'TELEGRAM_TEST_ALERT_SENT'
      }
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Test message delivered to Telegram!'
    });
  } catch (e) {
    next(e);
  }
});

router.post('/integrations/telegram-broadcast', async (req: AuthRequest, res, next) => {
  try {
    const { title, message, chatId } = z.object({
      title: z.string().min(2),
      message: z.string().min(5),
      chatId: z.string().optional()
    }).parse(req.body);

    const result = await sendTelegramBroadcast(title, message, chatId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await prisma.auditEvent.create({
      data: {
        userId: req.user!.id,
        action: `TELEGRAM_BROADCAST: ${title.slice(0, 40)}`
      }
    });

    res.json({
      success: true,
      message: 'Broadcast sent to Telegram channel!'
    });
  } catch (e) {
    next(e);
  }
});

export default router;
