import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
const router = Router();
router.use(requireAuth);
router.get('/', async (req: AuthRequest, res, next) => {
  try { const entries = await prisma.journalEntry.findMany({ where: { userId: req.user!.id }, orderBy: { tradedAt: 'desc' }, take: 100 }); res.json({ entries }); } catch (e) { next(e); }
});
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ symbol: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9 ._-]+$/), side: z.enum(['BUY','SELL']), entryPrice: z.number().positive().max(100000000), quantity: z.number().int().positive().max(10000000), notes: z.string().max(2000).optional() }).parse(req.body);
    const entry = await prisma.journalEntry.create({ data: { ...input, symbol: input.symbol.toUpperCase(), userId: req.user!.id } });
    res.status(201).json({ entry });
  } catch (e) { next(e); }
});
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try { const result = await prisma.journalEntry.deleteMany({ where: { id: req.params.id, userId: req.user!.id } }); if (!result.count) return res.status(404).json({ error: 'Journal entry not found.' }); res.status(204).end(); } catch (e) { next(e); }
});
export default router;
