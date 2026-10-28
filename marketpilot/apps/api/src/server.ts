import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import watchlistRoutes from './routes/watchlist.js';
import journalRoutes from './routes/journal.js';
import adminRoutes from './routes/admin.js';
import dhanRoutes from './routes/dhan.js';
import telegramRoutes from './routes/telegram.js';
import aiRoutes from './routes/ai.js';
import { prisma } from './db.js';
const app = express();
const port = Number(process.env.PORT || 4000);
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());

const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      configuredOrigins.includes(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin rejected'));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

// Dedicated high-capacity rate limiter for real-time market data polling (NSE/BSE tickers, indices, heatmaps)
const marketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000, // Generous limit (10,000 requests / 15 min) for active multi-component live market polling
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Market data rate limit reached, please retry shortly.' }
});

// General API limiter for auth/mutations - skips read-heavy market data polling
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl?.startsWith('/api/market') || req.baseUrl === '/api/market',
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/market', marketLimiter);
app.use('/api', apiLimiter);
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected', service: 'marketpilot-api' }); }
  catch { res.status(503).json({ status: 'degraded', database: 'unavailable' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dhan', dhanRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/ai', aiRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Please check the submitted fields.', details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) });
  console.error(err);
  return res.status(500).json({ error: 'Unexpected server error.' });
});
const server = app.listen(port, () => console.log(`MarketPilot API listening on http://localhost:${port}`));
async function shutdown() { server.close(); await prisma.$disconnect(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
