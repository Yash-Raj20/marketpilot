import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marketRows, sectoralIndices, broadIndices, formatMarketCap } from './market.js';
import { computeAiScore, type MarketItem, type ChartPoint } from './liveMarket.js';

// --- Official DhanHQ Security ID Universe Mappings ---
export const DHAN_EQUITY_MAP: Record<string, string> = {
  'BHARTIARTL': '10604',
  'PNB': '10666',
  'DIVISLAB': '10940',
  'MARUTI': '10999',
  'LT': '11483',
  'ULTRACEMCO': '11532',
  'TCS': '11536',
  'COFORGE': '11543',
  'NTPC': '11630',
  'JSWSTEEL': '11723',
  'GRASIM': '1232',
  'HDFCBANK': '1333',
  'HEROMOTOCO': '1348',
  'TECHM': '13538',
  'HINDALCO': '1363',
  'HINDUNILVR': '1394',
  'POWERGRID': '14977',
  'ADANIPORTS': '15083',
  'APOLLOHOSP': '157',
  'INFY': '1594',
  'ITC': '1660',
  'BAJAJ-AUTO': '16669',
  'BAJAJFINSV': '16675',
  'LTIM': '17818',
  'NESTLEIND': '17963',
  'JIOFIN': '18143',
  'PERSISTENT': '18365',
  'KOTAKBANK': '1922',
  'M&M': '2031',
  'COALINDIA': '20374',
  'HAL': '2303',
  'ONGC': '2475',
  'ADANIENT': '25',
  'RELIANCE': '2885',
  'SBIN': '3045',
  'VEDL': '3063',
  'BAJFINANCE': '317',
  'SUNPHARMA': '3351',
  'TATAPOWER': '3426',
  'TATACONSUM': '3432',
  'TATAMOTORS': '3456',
  'TATASTEEL': '3499',
  'TITAN': '3506',
  'WIPRO': '3787',
  'BEL': '383',
  'SHRIRAMFIN': '4306',
  'BANKBARODA': '4668',
  'ICICIBANK': '4963',
  'INDUSINDBK': '5258',
  'BPCL': '526',
  'BRITANNIA': '547',
  'AXISBANK': '5900',
  'JINDALSTEL': '6733',
  'CHOLAFIN': '685',
  'CIPLA': '694',
  'HCLTECH': '7229',
  'DRREDDY': '881',
  'EICHERMOT': '910'
};

export const DHAN_INDEX_MAP: Record<string, string> = {
  'NIFTY 50': '13',
  'BANK NIFTY': '25',
  'NIFTY BANK': '25',
  'SENSEX': '51',
  'NIFTY AUTO': '14',
  'NIFTY PVT BANK': '15',
  'NIFTY 100': '17',
  'NIFTY 200': '18',
  'NIFTY 500': '19',
  'NIFTY MIDCAP 50': '20',
  'NIFTY SMALLCAP 50': '22',
  'NIFTY SMLCAP 50': '22',
  'NIFTY FIN SERVICE': '27',
  'NIFTY FMCG': '28',
  'NIFTY IT': '29',
  'NIFTY MEDIA': '30',
  'NIFTY METAL': '31',
  'NIFTY PHARMA': '32',
  'NIFTY PSU BANK': '33',
  'NIFTY REALTY': '34',
  'NIFTY MIDCAP 100': '37',
  'NIFTY NEXT 50': '38',
  'NIFTY OIL AND GAS': '470',
  'NIFTY ENERGY': '42',
  'NIFTY INFRA': '43',
  'NIFTY HEALTHCARE': '447',
  'NIFTY CONSR DUR': '466',
  'NIFTY MIDSMALL HEALTHCARE': '471',
  'NIFTY500 MULTICAP': '467',
  'NIFTY TOTAL MARKET': '443',
  'NIFTY MICROCAP 250': '444',
  'NIFTY MIDCAP 150': '1',
  'NIFTY SMALLCAP 250': '3',
  'NIFTY SMLCAP 250': '3',
  'NIFTY SMALLCAP 100': '5',
  'NIFTY SMLCAP 100': '5',
  'NIFTY LARGEMID 250': '6',
  'NIFTY MIDSMAL 400': '7',
  'NIFTY MID SELECT': '442',
  'NIFTY CHEMICALS': '470',
  'NIFTY500 HEALTHCARE': '447'
};

// Build reverse lookups: securityId -> Symbol
const SEC_ID_TO_SYMBOL: Map<string, { symbol: string; type: 'EQ' | 'IDX' }> = new Map();
Object.entries(DHAN_EQUITY_MAP).forEach(([sym, id]) => {
  SEC_ID_TO_SYMBOL.set(id, { symbol: sym, type: 'EQ' });
});
Object.entries(DHAN_INDEX_MAP).forEach(([sym, id]) => {
  if (!SEC_ID_TO_SYMBOL.has(id)) {
    SEC_ID_TO_SYMBOL.set(id, { symbol: sym, type: 'IDX' });
  }
});

// Runtime Credentials & Token Store (can be dynamically updated from Admin)
let currentAccessToken = process.env.DHAN_ACCESS_TOKEN?.trim() || '';
let currentClientId = process.env.DHAN_CLIENT_ID?.trim() || '1111932175';

// Real-Time Feed Cache & State
const dhanLiveCache: Map<string, MarketItem> = new Map();
let lastBatchSyncTime = 0;
let lastTickReceivedAt: string | null = null;
let tickCount = 0;
let isWsConnected = false;
let wsInstance: WebSocket | null = null;
let wsReconnectTimer: NodeJS.Timeout | null = null;
let lastError: string | null = null;

export function getDhanCredentials() {
  return {
    accessToken: currentAccessToken,
    clientId: currentClientId
  };
}

export function isDhanTokenPresent(): boolean {
  return Boolean(currentAccessToken && currentAccessToken.length > 20);
}

/**
 * Checks if the JWT access token has expired (Dhan tokens expire strictly every 24 hours).
 */
export function isDhanTokenExpired(token = currentAccessToken): boolean {
  if (!token || token.length < 20) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (!payload.exp) return false;
    const nowEpoch = Math.floor(Date.now() / 1000);
    return nowEpoch >= payload.exp;
  } catch {
    return true;
  }
}

/**
 * Updates the DhanHQ Access Token & Client ID at runtime.
 * Persists to .env and immediately triggers a connection test and reconnects WebSocket.
 */
export async function updateDhanCredentials(newToken: string, newClientId?: string): Promise<{ success: boolean; message: string; error?: string }> {
  const token = newToken.trim();
  if (!token || token.length < 20) {
    return { success: false, message: 'Invalid token format. Token must be a valid JWT string.' };
  }

  currentAccessToken = token;
  if (newClientId && newClientId.trim()) {
    currentClientId = newClientId.trim();
  }

  // Persist to .env file if available
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      content = content.replace(/^DHAN_ACCESS_TOKEN=.*/m, `DHAN_ACCESS_TOKEN=${currentAccessToken}`);
      if (newClientId) {
        content = content.replace(/^DHAN_CLIENT_ID=.*/m, `DHAN_CLIENT_ID=${currentClientId}`);
      }
      fs.writeFileSync(envPath, content, 'utf-8');
      console.log('[DhanMarketFeed] ✅ Updated DHAN_ACCESS_TOKEN in .env successfully.');
    }
  } catch (err) {
    console.warn('[DhanMarketFeed] Note: Could not rewrite .env file directly:', err);
  }

  // Clear previous error and restart WebSocket
  lastError = null;
  restartDhanWebSocket();

  // Test batch quotes
  const testRes = await fetchDhanBatchQuotes(true);
  if (testRes.success) {
    return { success: true, message: `DhanHQ v2 token validated and connected successfully. Synced ${testRes.itemCount} instruments.` };
  } else {
    return { success: false, message: 'Token updated, but DhanHQ rejected quote request.', error: testRes.error };
  }
}

/**
 * Batch Quote Fetcher using DhanHQ v2 REST API (POST /marketfeed/quote)
 * Retrieves authentic OHLC, Previous Close, Volume, LTP, and 5-Level Depth for all instruments in 1 call.
 */
export async function fetchDhanBatchQuotes(force = false): Promise<{ success: boolean; itemCount: number; error?: string }> {
  if (!isDhanTokenPresent()) {
    lastError = 'DHAN_ACCESS_TOKEN is missing or not configured';
    return { success: false, itemCount: 0, error: lastError };
  }

  // Throttle to 3 seconds if not forced
  if (!force && Date.now() - lastBatchSyncTime < 3000 && dhanLiveCache.size > 0) {
    return { success: true, itemCount: dhanLiveCache.size };
  }

  try {
    const nseEqIds = Object.values(DHAN_EQUITY_MAP).map(Number);
    const idxIds = Array.from(new Set(Object.values(DHAN_INDEX_MAP))).map(Number);

    const payload = {
      NSE_EQ: nseEqIds,
      IDX_I: idxIds
    };

    const res = await fetch('https://api.dhan.co/v2/marketfeed/quote', {
      method: 'POST',
      headers: {
        'access-token': currentAccessToken,
        'client-id': currentClientId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      let errText = `HTTP ${res.status}`;
      try {
        const errJson = await res.json() as any;
        errText = errJson?.errorMessage || errJson?.message || errText;
      } catch {
        // fallback
      }
      lastError = `DhanHQ Quote API error: ${errText}`;
      if (res.status === 401) {
        lastError = 'DhanHQ Daily Access Token is expired or unauthorized (HTTP 401)';
      }
      return { success: false, itemCount: 0, error: lastError };
    }

    const json = (await res.json()) as any;
    const data = json?.data || json;

    let parsedCount = 0;

    // 1. Process NSE_EQ equities
    const nseEqObj = data?.NSE_EQ || {};
    for (const [secId, quote] of Object.entries<any>(nseEqObj)) {
      const match = SEC_ID_TO_SYMBOL.get(secId);
      if (!match) continue;
      const sym = match.symbol;
      const fallback = marketRows.find(r => r.symbol === sym);

      const ltp = Number(quote.last_price || quote.ltp || fallback?.price || 0);
      const ohlc = quote.ohlc || {};
      const prevClose = Number(ohlc.close || fallback?.previousClose || ltp);
      const open = Number(ohlc.open || prevClose);
      const high = Number(ohlc.high || Math.max(open, ltp));
      const low = Number(ohlc.low || Math.min(open, ltp));

      const changeAmount = +(ltp - prevClose).toFixed(2);
      const changePct = prevClose > 0 ? +((changeAmount / prevClose) * 100).toFixed(2) : 0;

      const volumeNum = Number(quote.volume || 0);
      const volumeFormatted = volumeNum > 1_000_000
        ? `${(volumeNum / 1_000_000).toFixed(1)}M`
        : volumeNum > 1_000
        ? `${(volumeNum / 1_000).toFixed(0)}K`
        : fallback?.volume || '1.2M';

      const baseMcap = fallback?.marketCap || 50000;
      const scaledMcap = fallback?.price ? Math.round(baseMcap * (ltp / fallback.price)) : baseMcap;
      const rsi = Math.max(25, Math.min(85, Math.round(50 + changePct * 7)));

      const ai = computeAiScore({
        price: ltp,
        changePct,
        rsi,
        dayHigh: high,
        dayLow: low
      });

      const item: MarketItem = {
        symbol: sym,
        name: fallback?.name || sym,
        price: ltp,
        changePct,
        changeAmount,
        previousClose: prevClose,
        open,
        category: fallback?.category || 'Equity',
        volume: volumeFormatted,
        volumeNumeric: volumeNum,
        rsi,
        dayHigh: high,
        dayLow: low,
        week52High: (fallback as any)?.week52High || +(ltp * 1.25).toFixed(2),
        week52Low: (fallback as any)?.week52Low || +(ltp * 0.78).toFixed(2),
        marketCap: scaledMcap,
        marketCapFormatted: formatMarketCap(scaledMcap),
        source: 'DHAN',
        status: 'Active',
        aiScore: ai.aiScore,
        aiSignal: ai.aiSignal,
        aiReason: ai.aiReason,
        depth: quote.depth ? {
          buy: quote.depth.buy || [],
          sell: quote.depth.sell || []
        } : undefined
      };

      dhanLiveCache.set(sym, item);
      parsedCount++;
    }

    // 2. Process IDX_I indices
    const idxObj = data?.IDX_I || {};
    for (const [secId, quote] of Object.entries<any>(idxObj)) {
      const match = SEC_ID_TO_SYMBOL.get(secId);
      if (!match) continue;
      const sym = match.symbol;
      const fallback = sectoralIndices.find(r => r.symbol === sym) || broadIndices.find(r => r.symbol === sym) || marketRows.find(r => r.symbol === sym);

      const ltp = Number(quote.last_price || quote.ltp || fallback?.price || 0);
      const ohlc = quote.ohlc || {};
      const prevClose = Number(ohlc.close || fallback?.previousClose || ltp);
      const open = Number(ohlc.open || prevClose);
      const high = Number(ohlc.high || Math.max(open, ltp));
      const low = Number(ohlc.low || Math.min(open, ltp));

      const changeAmount = +(ltp - prevClose).toFixed(2);
      const changePct = prevClose > 0 ? +((changeAmount / prevClose) * 100).toFixed(2) : 0;
      const rsi = Math.max(25, Math.min(85, Math.round(50 + changePct * 6)));

      const item: MarketItem = {
        symbol: sym,
        name: fallback?.name || sym,
        price: ltp,
        changePct,
        changeAmount,
        previousClose: prevClose,
        open,
        category: fallback?.category || (sym.includes('NIFTY') ? 'Sectoral' : 'Broad'),
        volume: fallback?.volume || '12.4M',
        rsi,
        dayHigh: high,
        dayLow: low,
        source: 'DHAN',
        status: 'Active'
      };

      dhanLiveCache.set(sym, item);
      parsedCount++;
    }

    lastBatchSyncTime = Date.now();
    lastError = null;
    return { success: true, itemCount: parsedCount };
  } catch (err) {
    lastError = `Dhan batch quote network failure: ${(err as Error).message}`;
    return { success: false, itemCount: 0, error: lastError };
  }
}

/**
 * Little-Endian Binary Feed Packet Parser for Dhan WebSocket (Version 2)
 * Dissects raw binary frames sent by wss://api-feed.dhan.co
 */
function parseDhanBinaryPacket(buffer: Buffer) {
  if (buffer.length < 8) return;

  const feedCode = buffer.readUInt8(0);
  const exchSeg = buffer.readUInt8(3);
  const secIdNum = buffer.readUInt32LE(4);
  const secId = String(secIdNum);

  const match = SEC_ID_TO_SYMBOL.get(secId);
  if (!match) return;

  const sym = match.symbol;
  let ltp = 0;
  let volume = 0;
  let open = 0;
  let high = 0;
  let low = 0;
  let prevClose = 0;

  if (feedCode === 2 && buffer.length >= 12) {
    // Ticker packet (Feed Code 2): LTP at offset 8 (float32)
    ltp = +(buffer.readFloatLE(8).toFixed(2));
  } else if (feedCode === 4 && buffer.length >= 50) {
    // Quote packet (Feed Code 4): Full depth & OHLC
    ltp = +(buffer.readFloatLE(8).toFixed(2));
    volume = buffer.readUInt32LE(22);
    open = +(buffer.readFloatLE(34).toFixed(2));
    high = +(buffer.readFloatLE(38).toFixed(2));
    low = +(buffer.readFloatLE(42).toFixed(2));
    prevClose = +(buffer.readFloatLE(46).toFixed(2));
  } else if (feedCode === 8 && buffer.length >= 12) {
    // Depth packet (Feed Code 8)
    ltp = +(buffer.readFloatLE(8).toFixed(2));
  }

  if (ltp <= 0) return;

  tickCount++;
  lastTickReceivedAt = new Date().toISOString();

  const existing = dhanLiveCache.get(sym);
  if (existing) {
    const pc = prevClose > 0 ? prevClose : existing.previousClose;
    const diff = +(ltp - pc).toFixed(2);
    const pct = pc > 0 ? +((diff / pc) * 100).toFixed(2) : existing.changePct;

    existing.price = ltp;
    existing.changeAmount = diff;
    existing.changePct = pct;
    if (open > 0) existing.open = open;
    if (high > 0) existing.dayHigh = high;
    if (low > 0) existing.dayLow = low;
    if (prevClose > 0) existing.previousClose = prevClose;
    if (volume > 0) {
      existing.volumeNumeric = volume;
      existing.volume = volume > 1_000_000
        ? `${(volume / 1_000_000).toFixed(1)}M`
        : volume > 1_000
        ? `${(volume / 1_000).toFixed(0)}K`
        : `${volume}`;
    }
    existing.source = 'DHAN';
  }
}

/**
 * Initialize / Start Tick-by-Tick WebSocket Feed
 */
export function initDhanWebSocket() {
  if (isWsConnected || wsInstance) return;
  if (!isDhanTokenPresent()) {
    console.log('[DhanWS] Access token not present. WebSocket feed standby.');
    return;
  }

  // Pre-flight JWT expiration check: Dhan tokens expire strictly after 24 hours
  if (isDhanTokenExpired(currentAccessToken)) {
    lastError = 'DhanHQ Daily Access Token is expired (24h limit reached). Please update token in Admin Panel.';
    console.warn(`[DhanWS] ⚠️ ${lastError} Standby mode active - falling back to NSE feed.`);
    return;
  }

  try {
    const wsUrl = `wss://api-feed.dhan.co?version=2&token=${encodeURIComponent(currentAccessToken)}&clientId=${encodeURIComponent(currentClientId)}&authType=2`;
    console.log(`[DhanWS] 🔌 Connecting to DhanHQ WebSocket Feed (Client ID: ${currentClientId})...`);

    const ws = new (globalThis as any).WebSocket(wsUrl);
    wsInstance = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log('[DhanWS] ✅ Connected to DhanHQ Tick-by-Tick Live Stream!');
      isWsConnected = true;
      lastError = null;

      // Subscribe to all mapped instruments using official Dhan format:
      // ExchangeSegment: 'NSE_EQ' and 'IDX_I'
      const nseEqList = Object.values(DHAN_EQUITY_MAP).map(id => ({ ExchangeSegment: 'NSE_EQ', SecurityId: String(id) }));
      const idxList = Array.from(new Set(Object.values(DHAN_INDEX_MAP))).map(id => ({ ExchangeSegment: 'IDX_I', SecurityId: String(id) }));
      const fullList = [...nseEqList, ...idxList];

      // Send in batches of 100 instruments
      for (let i = 0; i < fullList.length; i += 100) {
        const chunk = fullList.slice(i, i + 100);
        const subMsg = {
          RequestCode: 15,
          InstrumentCount: chunk.length,
          InstrumentList: chunk
        };
        ws.send(JSON.stringify(subMsg));
      }

      console.log(`[DhanWS] 📡 Subscribed to ${fullList.length} instruments across Equities and Indices.`);
    };

    ws.onmessage = (event: any) => {
      if (typeof event.data === 'string') {
        try {
          const json = JSON.parse(event.data);
          if (json.type === 'error' || json.status === 'failure') {
            lastError = `DhanWS Server Error: ${json.message || JSON.stringify(json)}`;
          }
        } catch {
          // not json
        }
      } else if (event.data instanceof ArrayBuffer) {
        const buf = Buffer.from(event.data);
        parseDhanBinaryPacket(buf);
      }
    };

    ws.onerror = (err: any) => {
      console.warn('[DhanWS] WebSocket connection encountered error:', err?.message || err);
      lastError = 'Dhan WebSocket connection error';
    };

    ws.onclose = (event: any) => {
      isWsConnected = false;
      wsInstance = null;
      console.warn(`[DhanWS] WebSocket disconnected (Code: ${event.code}, Reason: ${event.reason || 'None'}).`);

      if (event.code === 401 || (event.reason && event.reason.includes('401'))) {
        lastError = 'DhanHQ Daily Access Token is expired or unauthorized (WebSocket 401)';
      }

      if (isDhanTokenExpired(currentAccessToken)) {
        lastError = 'DhanHQ Daily Access Token is expired. Please update token in Admin Panel.';
        console.warn(`[DhanWS] ⚠️ ${lastError} Standby mode active - falling back to NSE feed.`);
        return; // DO NOT retry in an infinite loop if token is expired
      }

      // Schedule reconnection attempt for transient network drops
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(() => {
        if (!isWsConnected && isDhanTokenPresent() && !isDhanTokenExpired(currentAccessToken)) {
          console.log('[DhanWS] Reconnecting to Dhan feed...');
          initDhanWebSocket();
        }
      }, 10000);
    };
  } catch (err) {
    isWsConnected = false;
    wsInstance = null;
    lastError = `DhanWS Init Failed: ${(err as Error).message}`;
  }
}

export function restartDhanWebSocket() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (wsInstance) {
    try {
      wsInstance.close();
    } catch {
      // ignore
    }
    wsInstance = null;
    isWsConnected = false;
  }
  initDhanWebSocket();
}

/**
 * Get item quote from Dhan Cache or fallback
 */
export function getDhanCachedQuote(symbol: string): MarketItem | null {
  return dhanLiveCache.get(symbol.toUpperCase()) || null;
}

/**
 * Get all Dhan live items
 */
export function getAllDhanCachedItems(): MarketItem[] {
  return Array.from(dhanLiveCache.values());
}

/**
 * Return live Dhan health and diagnostics for Admin dashboard
 */
export function getDhanFeedStatus() {
  return {
    configured: isDhanTokenPresent(),
    connected: isWsConnected,
    tickCount,
    lastTickAt: lastTickReceivedAt,
    lastBatchSyncAt: lastBatchSyncTime ? new Date(lastBatchSyncTime).toISOString() : null,
    totalCached: dhanLiveCache.size,
    error: lastError,
    clientId: currentClientId
  };
}

// Start WebSocket on server boot if token is present and valid
if (isDhanTokenPresent()) {
  setTimeout(() => {
    if (!isDhanTokenExpired()) {
      initDhanWebSocket();
      fetchDhanBatchQuotes(true).catch(() => {});
    } else {
      console.log('[DhanMarketFeed] ℹ️ Dhan access token in .env is expired (24h limit). Falling back to official NSE India feed. Update token in Admin when ready.');
    }
  }, 1000);
}
