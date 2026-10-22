import { Router } from 'express';
import { marketRows } from '../services/market.js';
const router = Router();
router.get('/overview', (_req, res) => {
  res.json({ dataMode: 'DEMO', asOf: new Date().toISOString(), message: 'Simulated sample data — not live market data.', indices: marketRows.filter(x => x.category === 'Index'), movers: [...marketRows.filter(x => x.category !== 'Index')].sort((a,b) => b.changePct-a.changePct).slice(0,5), marketBreadth: { advancing: 7, declining: 3, unchanged: 0 } });
});
router.get('/stocks', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const rows = marketRows.filter(x => !q || x.symbol.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || x.category.toLowerCase().includes(q));
  res.json({ dataMode: 'DEMO', results: rows });
});
export default router;
