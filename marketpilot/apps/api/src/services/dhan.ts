/**
 * DhanHQ API v2 Client Service
 * Official Documentation: https://dhanhq.co/docs/v2/
 * 
 * Strict Read-Only Security:
 * - Order placement, modification, and exit functions are intentionally excluded.
 * - Sensitive tokens are never leaked to logs or client responses.
 * - In-memory TTL caching prevents unnecessary rate limit hits.
 */

const DHAN_BASE_URL = 'https://api.dhan.co/v2';
const DEFAULT_TIMEOUT_MS = 8000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T, ttlMs: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export interface DhanConfig {
  clientId?: string;
  accessToken: string;
}

/**
 * Retrieves Dhan credentials from environment variables.
 */
export function getDhanConfig(): DhanConfig | null {
  const accessToken = process.env.DHAN_ACCESS_TOKEN?.trim();
  const clientId = process.env.DHAN_CLIENT_ID?.trim();

  if (!accessToken) {
    return null;
  }

  return { clientId, accessToken };
}

export function isDhanConfigured(): boolean {
  return getDhanConfig() !== null;
}

/**
 * Low-level authenticated request helper for DhanHQ API v2
 */
async function dhanRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT';
    body?: unknown;
    cacheTtlMs?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const config = getDhanConfig();
  if (!config) {
    return {
      success: false,
      error: 'DhanHQ API is not configured. Please add DHAN_ACCESS_TOKEN (and optional DHAN_CLIENT_ID) to .env',
      status: 503
    };
  }

  const cacheKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;

  if (!options.forceRefresh && options.cacheTtlMs && options.cacheTtlMs > 0) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) {
      return { success: true, data: cached, status: 200 };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${DHAN_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'access-token': config.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (config.clientId) {
      headers['client-id'] = config.clientId;
    }

    console.log(`[DhanHQ v2 API] 📡 Requesting ${options.method || 'GET'} https://api.dhan.co/v2${endpoint} (Client ID: ${config.clientId})`);

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let parsed: unknown = null;

    if (contentType.includes('application/json')) {
      parsed = await res.json();
    } else {
      parsed = await res.text();
    }

    if (!res.ok) {
      const errorMsg = typeof parsed === 'object' && parsed !== null && 'errorMessage' in parsed
        ? String((parsed as Record<string, unknown>).errorMessage)
        : `DhanHQ upstream error (Status ${res.status})`;

      console.error(`[DhanHQ v2 API] ❌ Error on ${endpoint}: Status ${res.status} - ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        status: res.status
      };
    }

    console.log(`[DhanHQ v2 API] ✅ Received HTTP ${res.status} from ${endpoint} (Client ID: ${config.clientId})`);

    const data = parsed as T;
    if (options.cacheTtlMs && options.cacheTtlMs > 0) {
      setInCache(cacheKey, data, options.cacheTtlMs);
    }

    return { success: true, data, status: res.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const message = isTimeout ? 'DhanHQ API request timed out.' : 'Failed to communicate with DhanHQ API.';

    console.error(`[DhanService] Network failure on ${endpoint}:`, isTimeout ? 'Timeout' : err);
    return {
      success: false,
      error: message,
      status: 504
    };
  }
}

/**
 * A. Profile Endpoint
 * Validates credentials and fetches client details, segments, and token validity
 */
export async function getDhanProfile(forceRefresh = false) {
  return dhanRequest<Record<string, unknown>>('/profile', {
    method: 'GET',
    cacheTtlMs: 60 * 1000,
    forceRefresh
  });
}

/**
 * B. Holdings Endpoint
 * Retrieves Demat portfolio holdings
 */
export async function getDhanHoldings(forceRefresh = false) {
  return dhanRequest<Array<Record<string, unknown>>>('/holdings', {
    method: 'GET',
    cacheTtlMs: 20 * 1000,
    forceRefresh
  });
}

/**
 * C. Open Positions Endpoint
 * Retrieves current day / intraday / carry forward open positions with live P&L
 */
export async function getDhanPositions(forceRefresh = false) {
  return dhanRequest<Array<Record<string, unknown>>>('/positions', {
    method: 'GET',
    cacheTtlMs: 10 * 1000,
    forceRefresh
  });
}

/**
 * D. Fund Limits Endpoint
 * Retrieves available cash, utilized margin, collateral margin
 */
export async function getDhanFundLimits(forceRefresh = false) {
  return dhanRequest<Record<string, unknown>>('/fundlimit', {
    method: 'GET',
    cacheTtlMs: 15 * 1000,
    forceRefresh
  });
}

/**
 * E. Market Quote Endpoint
 */
export async function getDhanMarketQuotes(instruments: Array<{ securityId: string; segment: string }>) {
  return dhanRequest<Record<string, unknown>>('/marketfeed/quote', {
    method: 'POST',
    body: instruments,
    cacheTtlMs: 5 * 1000
  });
}

/**
 * F. Historical Candlestick Chart Data
 */
export async function getDhanHistoricalCharts(params: {
  securityId: string;
  exchangeSegment: string;
  instrument: string;
  expiryCode?: number;
  fromDate: string;
  toDate: string;
}) {
  return dhanRequest<Record<string, unknown>>('/charts/historical', {
    method: 'POST',
    body: params,
    cacheTtlMs: 5 * 60 * 1000
  });
}

/**
 * G. Integration Health & Status Panel
 */
export async function getDhanStatus() {
  const configured = isDhanConfigured();
  if (!configured) {
    return {
      configured: false,
      connected: false,
      message: 'DHAN_ACCESS_TOKEN is not configured in .env'
    };
  }

  const profileRes = await getDhanProfile();
  if (!profileRes.success) {
    return {
      configured: true,
      connected: false,
      error: profileRes.error,
      status: profileRes.status,
      message: 'Failed to authenticate with DhanHQ. Token may be expired or invalid.'
    };
  }

  return {
    configured: true,
    connected: true,
    data: profileRes.data,
    message: 'DhanHQ API v2 successfully authenticated and active.'
  };
}
