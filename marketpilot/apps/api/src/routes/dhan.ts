import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
import { 
  getDhanProfile, 
  getDhanHoldings, 
  getDhanPositions, 
  getDhanFundLimits, 
  getDhanMarketQuotes,
  getDhanHistoricalCharts,
  getDhanStatus
} from '../services/dhan.js';

const router = Router();

/**
 * 0. GET /api/dhan/status
 * Returns connection health; hides private client ID if not logged in
 */
router.get('/status', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const status = await getDhanStatus();
    if (!status.connected) {
      return res.json(status);
    }

    // Authenticated users or admins see full broker connection details
    if (req.user) {
      return res.json(status);
    }

    // Public / guest visitors see generic feed confirmation without private account details
    res.json({
      configured: true,
      connected: true,
      message: 'Live Market Data Feed Active (NSE/BSE Exchange)'
    });
  } catch (e) {
    next(e);
  }
});

// Dhan endpoints are strictly read-only (safe for live workspace preview)

/**
 * 1. GET /api/dhan/profile
 * Retrieves user profile, client ID, active exchange segments (Requires Login)
 */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const refresh = req.query.refresh === 'true';
    const result = await getDhanProfile(refresh);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (e) {
    next(e);
  }
});

/**
 * 2. GET /api/dhan/holdings
 * Retrieves user's Demat stock holdings (Requires Login)
 */
router.get('/holdings', requireAuth, async (req, res, next) => {
  try {
    const refresh = req.query.refresh === 'true';
    const result = await getDhanHoldings(refresh);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json({ holdings: result.data || [] });
  } catch (e) {
    next(e);
  }
});

/**
 * 3. GET /api/dhan/positions
 * Retrieves open intraday and delivery positions with live P&L (Requires Login)
 */
router.get('/positions', requireAuth, async (req, res, next) => {
  try {
    const refresh = req.query.refresh === 'true';
    const result = await getDhanPositions(refresh);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json({ positions: result.data || [] });
  } catch (e) {
    next(e);
  }
});

/**
 * 4. GET /api/dhan/funds
 * Retrieves available funds, utilized margin, and collateral limits (Requires Login)
 */
router.get('/funds', requireAuth, async (req, res, next) => {
  try {
    const refresh = req.query.refresh === 'true';
    const result = await getDhanFundLimits(refresh);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json(result.data || {});
  } catch (e) {
    next(e);
  }
});

/**
 * 5. POST /api/dhan/quotes
 * Fetches market quotes for given instruments
 */
router.post('/quotes', async (req, res, next) => {
  try {
    const schema = z.object({
      instruments: z.array(z.object({
        securityId: z.string(),
        segment: z.string().default('NSE_EQ')
      })).min(1).max(50)
    });

    const { instruments } = schema.parse(req.body);
    const result = await getDhanMarketQuotes(instruments);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json(result.data || {});
  } catch (e) {
    next(e);
  }
});

/**
 * 6. POST /api/dhan/historical
 * Retrieves historical candlestick charts
 */
router.post('/historical', async (req, res, next) => {
  try {
    const schema = z.object({
      securityId: z.string(),
      exchangeSegment: z.string().default('NSE_EQ'),
      instrument: z.string().default('EQUITY'),
      expiryCode: z.number().optional(),
      fromDate: z.string(),
      toDate: z.string()
    });

    const params = schema.parse(req.body);
    const result = await getDhanHistoricalCharts(params);
    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    res.json(result.data || {});
  } catch (e) {
    next(e);
  }
});

export default router;
