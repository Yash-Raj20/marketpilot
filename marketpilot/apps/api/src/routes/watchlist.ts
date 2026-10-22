import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
const router = Router();
router.use(requireAuth);
router.get('/', async (req: AuthRequest, res, next) => {
  try { const items = await prisma.watchlistItem.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } }); res.json({ items }); } catch (e) { next(e); }
});
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { symbol } = z.object({ symbol: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9 ._-]+$/) }).parse(req.body);
    const item = await prisma.watchlistItem.upsert({ where: { userId_symbol: { userId: req.user!.id, symbol: symbol.toUpperCase() } }, update: {}, create: { userId: req.user!.id, symbol: symbol.toUpperCase() } });
    res.status(201).json({ item });
  } catch (e) { next(e); }
});
router.delete('/:symbol', async (req: AuthRequest, res, next) => {
  try { await prisma.watchlistItem.deleteMany({ where: { userId: req.user!.id, symbol: req.params.symbol.toUpperCase() } }); res.status(204).end(); } catch (e) { next(e); }
});
export default router;
