import { Router } from 'express';
import { z } from 'zod';
import { generateAiChatResponse, BOUNDARY_REJECTION_MESSAGE } from '../services/ai.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long (max 1000 chars)'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model', 'assistant']),
      content: z.string().max(2000)
    })
  ).optional()
});

/**
 * POST /api/ai/chat
 * Generates an AI response powered by Gemini 1.5 Flash with strict financial boundary enforcement
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parseResult.error.issues.map(i => i.message)
      });
    }

    const { message, history } = parseResult.data;
    const response = await generateAiChatResponse(message, history || []);

    return res.json({
      success: true,
      reply: response.reply,
      domainBlocked: response.domainBlocked,
      source: response.source,
      model: response.model,
      contextUsed: response.contextUsed
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to process AI chat request',
      details: error?.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/ai/status
 * Returns current configuration status of Gemini API and guardrails
 */
router.get('/status', (_req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  res.json({
    configured: hasGeminiKey,
    model: hasGeminiKey ? 'gemini-2.5-flash' : 'marketpilot-analyst-engine',
    mode: hasGeminiKey ? 'GEMINI_CLOUD' : 'LOCAL_EXCHANGE_ANALYST',
    boundaryPolicy: 'STRICT_FINANCIAL_ONLY',
    message: hasGeminiKey
      ? 'Google Gemini 2.5 Flash Active with Strict Financial Guardrails'
      : 'MarketPilot Real-time Financial Analyst Active (Provide GEMINI_API_KEY in .env to activate Google Gemini Cloud)'
  });
});

/**
 * GET /api/ai/suggestions
 * Returns recommended quick prompt starter chips
 */
router.get('/suggestions', (_req, res) => {
  res.json({
    suggestions: [
      { id: 'nifty-outlook', label: '📊 NIFTY 50 Live Outlook', prompt: 'NIFTY 50 ka current trend aur intraday key support & resistance levels kya hain?' },
      { id: 'banknifty-setup', label: '⚡ Bank Nifty Setup', prompt: 'BANK NIFTY me trade plan aur critical breakout levels batao' },
      { id: 'risk-calc', label: '⚖️ 1% Risk Formula', prompt: 'Trading me 1% risk rule aur position sizing kaise calculate karein?' },
      { id: 'breakout-scanner', label: '🚀 Breakout Screening', prompt: 'Aaj ke top movers aur momentum breakout stocks ka analysis do' },
      { id: 'discipline-rules', label: '🛡️ Stop Loss Rules', prompt: 'Hard Stop Loss aur Risk-to-Reward minimum 1:2 maintain karne ke golden rules kya hain?' }
    ]
  });
});

export default router;
