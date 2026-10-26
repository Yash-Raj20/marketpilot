import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
  getTelegramBotInfo, 
  sendTelegramMessage, 
  sendTelegramTradeAlert, 
  sendTelegramBroadcast,
  isTelegramConfigured 
} from '../services/telegram.js';


const router = Router();

// 1. GET /api/telegram/status (Check bot connection & username)
router.get('/status', async (_req, res, next) => {
  try {
    const configured = isTelegramConfigured();
    if (!configured) {
      return res.json({
        configured: false,
        connected: false,
        message: 'Telegram Bot is not configured. Please set TELEGRAM_BOT_TOKEN in .env'
      });
    }

    const botInfo = await getTelegramBotInfo();
    if (!botInfo.success) {
      return res.json({
        configured: true,
        connected: false,
        error: botInfo.error,
        message: 'Telegram Bot Token is configured, but failed to connect to Telegram.'
      });
    }

    res.json({
      configured: true,
      connected: true,
      bot: botInfo.bot,
      message: 'Telegram Bot connected successfully!'
    });
  } catch (e) {
    next(e);
  }
});

// 2. POST /api/telegram/test-alert (Send a quick test message)
router.post('/test-alert', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      chatId: z.string().optional()
    });

    const { chatId } = schema.parse(req.body);

    const testText = `
<b>🤖 MarketPilot AI — Telegram Bot Connected!</b>
━━━━━━━━━━━━━━━━━━━━
Your Telegram alert notifications are active and ready.
• <b>Status:</b> ✅ Operational
• <b>Time:</b> ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
━━━━━━━━━━━━━━━━━━━━
<i>MarketPilot AI Trade & Risk Engine</i>
    `.trim();

    const result = await sendTelegramMessage(testText, { chatId });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Test alert sent successfully to Telegram!'
    });
  } catch (e) {
    next(e);
  }
});

// 3. POST /api/telegram/trade-alert (Dispatches trade alert card)
router.post('/trade-alert', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      symbol: z.string().min(1),
      type: z.enum(['BUY', 'SELL']),
      entryPrice: z.number().positive(),
      targetPrice: z.number().positive().optional(),
      stopLoss: z.number().positive().optional(),
      quantity: z.number().positive().optional(),
      notes: z.string().optional(),
      chatId: z.string().optional()
    });

    const trade = schema.parse(req.body);
    const result = await sendTelegramTradeAlert(trade);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: 'Trade alert sent to Telegram.' });
  } catch (e) {
    next(e);
  }
});

// 4. POST /api/telegram/broadcast (Admin system announcement)
router.post('/broadcast', requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2),
      message: z.string().min(2),
      chatId: z.string().optional()
    });

    const { title, message, chatId } = schema.parse(req.body);
    const result = await sendTelegramBroadcast(title, message, chatId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: 'Broadcast published to Telegram.' });
  } catch (e) {
    next(e);
  }
});

export default router;
