/**
 * Telegram Bot Notification Service
 * Used for instant market alerts, trade journal sync, daily P&L summaries, and platform broadcasts.
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 6000;

export interface TelegramConfig {
  botToken: string;
  defaultChatId?: string;
}

export function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const defaultChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken) {
    return null;
  }

  return { botToken, defaultChatId };
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() !== null;
}

/**
 * Validates the bot token by pinging Telegram's getMe endpoint
 */
export async function getTelegramBotInfo(): Promise<{ success: boolean; bot?: Record<string, unknown>; error?: string }> {
  const config = getTelegramConfig();
  if (!config) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/getMe`, {
      method: 'GET'
    });
    const data = (await res.json()) as { ok: boolean; result?: Record<string, unknown>; description?: string };

    if (!data.ok) {
      return { success: false, error: data.description || 'Invalid Telegram bot token.' };
    }

    return { success: true, bot: data.result };
  } catch (err) {
    console.error('[TelegramService] getMe failed:', err);
    return { success: false, error: 'Could not connect to Telegram API.' };
  }
}

/**
 * Sends a message to a specific chat ID or the default configured chat ID
 */
export async function sendTelegramMessage(
  text: string,
  options: {
    chatId?: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disablePreview?: boolean;
  } = {}
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const config = getTelegramConfig();
  if (!config) {
    return { success: false, error: 'Telegram bot is not configured.' };
  }

  let targetChatId = (options.chatId || config.defaultChatId)?.trim();
  if (!targetChatId) {
    return { success: false, error: 'No Telegram Chat ID provided or configured.' };
  }

  // Telegram supergroups & channels start with -100...
  // If user entered 1003910842941 without the minus sign, auto-prefix it
  if (/^100\d{7,}$/.test(targetChatId)) {
    targetChatId = `-${targetChatId}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const payload = {
      chat_id: targetChatId,
      text,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disablePreview !== false
    };

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const result = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };

    if (!result.ok) {
      console.error('[TelegramService] Telegram error:', result.description);
      return { success: false, error: result.description || 'Telegram rejected message.' };
    }

    return { success: true, messageId: result.result?.message_id };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error('[TelegramService] Request failed:', isTimeout ? 'Timeout' : err);
    return {
      success: false,
      error: isTimeout ? 'Telegram request timed out.' : 'Failed to deliver Telegram message.'
    };
  }
}

/**
 * Sends a rich Trade Alert card to Telegram
 */
export async function sendTelegramTradeAlert(trade: {
  symbol: string;
  type: string;
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  quantity?: number;
  notes?: string;
  chatId?: string;
}) {
  const isBuy = trade.type.toUpperCase() === 'BUY';
  const icon = isBuy ? '🟢' : '🔴';

  const riskReward = trade.targetPrice && trade.stopLoss && trade.entryPrice !== trade.stopLoss
    ? ((Math.abs(trade.targetPrice - trade.entryPrice)) / Math.abs(trade.entryPrice - trade.stopLoss)).toFixed(2)
    : null;

  const html = `
<b>${icon} MarketPilot AI — Trade Alert</b>
━━━━━━━━━━━━━━━━━━━━
<b>Symbol:</b> <code>${trade.symbol.toUpperCase()}</code>
<b>Action:</b> <b>${trade.type.toUpperCase()}</b>
<b>Entry Price:</b> ₹${trade.entryPrice.toLocaleString('en-IN')}
${trade.quantity ? `<b>Quantity:</b> ${trade.quantity}\n` : ''}${trade.targetPrice ? `<b>Target:</b> ₹${trade.targetPrice.toLocaleString('en-IN')}\n` : ''}${trade.stopLoss ? `<b>Stop Loss:</b> ₹${trade.stopLoss.toLocaleString('en-IN')}\n` : ''}${riskReward ? `<b>Risk/Reward:</b> 1:${riskReward}\n` : ''}${trade.notes ? `<i>Note: ${trade.notes}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━
<i>MarketPilot AI Portfolio & Journal Engine</i>
  `.trim();

  return sendTelegramMessage(html, { chatId: trade.chatId, parseMode: 'HTML' });
}

/**
 * Sends a Daily Portfolio & P&L Summary Alert
 */
export async function sendTelegramPortfolioSummary(summary: {
  totalHoldings?: number;
  dayPnl?: number;
  availableFunds?: number;
  openPositions?: number;
  chatId?: string;
}) {
  const isProfitable = (summary.dayPnl || 0) >= 0;
  const pnlIcon = isProfitable ? '📈' : '📉';

  const html = `
<b>📊 MarketPilot AI — Daily Portfolio Snapshot</b>
━━━━━━━━━━━━━━━━━━━━
${summary.dayPnl !== undefined ? `<b>Day P&L:</b> ${pnlIcon} <b>₹${summary.dayPnl.toLocaleString('en-IN')}</b>\n` : ''}${summary.availableFunds !== undefined ? `<b>Available Balance:</b> ₹${summary.availableFunds.toLocaleString('en-IN')}\n` : ''}${summary.totalHoldings !== undefined ? `<b>Holdings Value:</b> ₹${summary.totalHoldings.toLocaleString('en-IN')}\n` : ''}${summary.openPositions !== undefined ? `<b>Open Positions:</b> ${summary.openPositions}\n` : ''}━━━━━━━━━━━━━━━━━━━━
<i>Generated at ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</i>
  `.trim();

  return sendTelegramMessage(html, { chatId: summary.chatId, parseMode: 'HTML' });
}

/**
 * Sends a system broadcast alert
 */
export async function sendTelegramBroadcast(title: string, message: string, chatId?: string) {
  const html = `
<b>📢 MarketPilot Broadcast: ${title}</b>
━━━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━━━
<i>MarketPilot System Alerts</i>
  `.trim();

  return sendTelegramMessage(html, { chatId, parseMode: 'HTML' });
}
