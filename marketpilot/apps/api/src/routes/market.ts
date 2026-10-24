import { Router } from 'express';
import { marketRows } from '../services/market.js';

const router = Router();

router.get('/overview', (_req, res) => {
  const nonIndices = marketRows.filter(x => x.category !== 'Index');
  res.json({
    dataMode: 'DEMO',
    asOf: new Date().toISOString(),
    message: 'Simulated sample data — not live market data.',
    indices: marketRows.filter(x => x.category === 'Index'),
    movers: [...nonIndices].sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    losers: [...nonIndices].sort((a, b) => a.changePct - b.changePct).slice(0, 5),
    marketBreadth: {
      advancing: 32,
      declining: 18,
      unchanged: 2,
      ratio: '1.78 : 1',
      sentiment: 'Bullish Flow',
      niftyPcr: 1.18,
      indiaVix: 13.42
    },
    institutionalFlow: {
      fiiNet: 1420.5,
      diiNet: 890.2,
      fiiTrend: 'Net Buyers',
      currency: 'INR Cr'
    },
    sectorHeatmap: [
      { name: 'Banking', changePct: 1.35, count: 12 },
      { name: 'Metals', changePct: 1.20, count: 8 },
      { name: 'Energy', changePct: 0.95, count: 6 },
      { name: 'Industrials', changePct: 0.82, count: 9 },
      { name: 'Healthcare', changePct: 0.24, count: 7 },
      { name: 'IT', changePct: -0.38, count: 10 },
      { name: 'Auto', changePct: -0.65, count: 8 }
    ]
  });
});

router.get('/chart', (req, res) => {
  const symbol = String(req.query.symbol || 'NIFTY 50').trim().toUpperCase();
  const range = String(req.query.range || '1D').trim().toUpperCase();

  const stock = marketRows.find(x => x.symbol.toUpperCase() === symbol) || marketRows[0];
  const basePrice = stock.price;

  let points: { t: string; v: number; open: number; high: number; low: number; close: number; volume: number }[] = [];

  if (range === '1W') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const multipliers = [0.985, 0.992, 0.988, 0.996, 1.0];
    points = days.map((day, i) => {
      const close = +(basePrice * multipliers[i]).toFixed(2);
      const open = +(close * 0.997).toFixed(2);
      const high = +(Math.max(open, close) * 1.004).toFixed(2);
      const low = +(Math.min(open, close) * 0.995).toFixed(2);
      return { t: day, v: close, open, high, low, close, volume: Math.round(180000 + i * 25000) };
    });
  } else if (range === '1M') {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const multipliers = [0.972, 0.983, 0.991, 1.0];
    points = weeks.map((w, i) => {
      const close = +(basePrice * multipliers[i]).toFixed(2);
      const open = +(close * 0.995).toFixed(2);
      const high = +(Math.max(open, close) * 1.006).toFixed(2);
      const low = +(Math.min(open, close) * 0.992).toFixed(2);
      return { t: w, v: close, open, high, low, close, volume: Math.round(820000 + i * 95000) };
    });
  } else if (range === '1Y') {
    const months = ['Q1', 'Q2', 'Q3', 'Q4'];
    const multipliers = [0.92, 0.95, 0.97, 1.0];
    points = months.map((m, i) => {
      const close = +(basePrice * multipliers[i]).toFixed(2);
      const open = +(close * 0.99).toFixed(2);
      const high = +(Math.max(open, close) * 1.01).toFixed(2);
      const low = +(Math.min(open, close) * 0.98).toFixed(2);
      return { t: m, v: close, open, high, low, close, volume: Math.round(3500000 + i * 400000) };
    });
  } else {
    // 1D Intraday default
    const times = ['09:15', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30', '14:15', '15:00', '15:30'];
    const variations = [-0.006, -0.008, -0.002, 0.001, -0.001, 0.003, 0.002, 0.005, 0.007, stock.changePct / 100];
    points = times.map((time, i) => {
      const close = +(basePrice * (1 + variations[i])).toFixed(2);
      const open = +(close * (1 - (i % 2 === 0 ? 0.0015 : -0.0015))).toFixed(2);
      const high = +(Math.max(open, close) * 1.002).toFixed(2);
      const low = +(Math.min(open, close) * 0.998).toFixed(2);
      return { t: time, v: close, open, high, low, close, volume: Math.round(35000 + Math.abs(variations[i]) * 1000000) };
    });
  }

  const prices = points.map(p => p.v);
  const dayHigh = Math.max(...prices);
  const dayLow = Math.min(...prices);

  res.json({
    dataMode: 'DEMO',
    symbol: stock.symbol,
    range,
    currentPrice: stock.price,
    changePct: stock.changePct,
    high: dayHigh,
    low: dayLow,
    points
  });
});

router.get('/stocks', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const rows = marketRows.filter(x => !q || x.symbol.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || x.category.toLowerCase().includes(q));
  res.json({ dataMode: 'DEMO', results: rows });
});

router.get('/stocks/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stock = marketRows.find(x => x.symbol.toUpperCase() === symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  const dayHigh = +(stock.price * (1 + Math.abs(stock.changePct) / 100 * 0.8)).toFixed(2);
  const dayLow = +(stock.price * (1 - Math.abs(stock.changePct) / 100 * 0.9)).toFixed(2);
  const week52High = +(stock.price * 1.25).toFixed(2);
  const week52Low = +(stock.price * 0.78).toFixed(2);
  res.json({
    dataMode: 'DEMO',
    stock: {
      ...stock,
      dayHigh,
      dayLow,
      week52High,
      week52Low,
      volume: '1.42M',
      peRatio: 28.4
    }
  });
});

export default router;
