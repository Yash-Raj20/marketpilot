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
router.get('/analytics', async (req: AuthRequest, res, next) => {
  try {
    const entries = await prisma.journalEntry.findMany({ where: { userId: req.user!.id } });
    const totalTrades = entries.length;
    const buys = entries.filter(e => e.side === 'BUY').length;
    const sells = entries.filter(e => e.side === 'SELL').length;
    const totalCapitalCommitted = entries.reduce((acc, curr) => acc + (Number(curr.entryPrice) * curr.quantity), 0);
    const uniqueSymbols = Array.from(new Set(entries.map(e => e.symbol)));
    res.json({
      analytics: {
        totalTrades,
        buys,
        sells,
        totalCapitalCommitted,
        uniqueSymbolsCount: uniqueSymbols.length,
        symbols: uniqueSymbols
      }
    });
  } catch (e) { next(e); }
});
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const input = z.object({
      symbol: z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9 ._-]+$/).optional(),
      side: z.enum(['BUY','SELL']).optional(),
      entryPrice: z.number().positive().max(100000000).optional(),
      quantity: z.number().int().positive().max(10000000).optional(),
      notes: z.string().max(2000).optional()
    }).parse(req.body);

    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Journal entry not found.' });

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(input.symbol && { symbol: input.symbol.toUpperCase() }),
        ...(input.side && { side: input.side }),
        ...(input.entryPrice && { entryPrice: input.entryPrice }),
        ...(input.quantity && { quantity: input.quantity }),
        ...(input.notes !== undefined && { notes: input.notes })
      }
    });
    res.json({ entry: updated });
  } catch (e) { next(e); }
});
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const result = await prisma.journalEntry.deleteMany({ where: { id, userId: req.user!.id } });
    if (!result.count) return res.status(404).json({ error: 'Journal entry not found.' });
    res.status(204).end();
  } catch (e) { next(e); }
});
export default router;
