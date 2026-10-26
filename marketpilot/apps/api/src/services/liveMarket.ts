import { marketRows } from './market.js';

export interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  category: string;
  volume: string;
  rsi: number;
  dayHigh?: number;
  dayLow?: number;
  week52High?: number;
  week52Low?: number;
}

export interface ChartPoint {
  t: string;
  v: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Live Exchange Ticker Mapping for Indian Markets
const TICKER_MAP: Record<string, string> = {
  'NIFTY 50': '^NSEI',
  'BANK NIFTY': '^NSEBANK',
  'SENSEX': '^BSESN',
  'INDIA VIX': '^INDIAVIX',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'AXISBANK': 'AXISBANK.NS',
  'KOTAKBANK': 'KOTAKBANK.NS',
  'LT': 'LT.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'SUNPHARMA': 'SUNPHARMA.NS',
  'MARUTI': 'MARUTI.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'TITAN': 'TITAN.NS',
  'ITC': 'ITC.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
  'ADANIENT': 'ADANIENT.NS',
  'WIPRO': 'WIPRO.NS'
};

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const quotesCache: Map<string, CacheEntry<MarketItem>> = new Map();
const chartCache: Map<string, CacheEntry<ChartPoint[]>> = new Map();

const QUOTE_CACHE_TTL_MS = 10 * 1000; // 10 seconds
const CHART_CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Fetch a single live quote from the live exchange gateway
 */
export async function fetchLiveQuote(symbol: string): Promise<MarketItem | null> {
  const sym = symbol.toUpperCase().trim();
  const ticker = TICKER_MAP[sym];
  const fallback = marketRows.find(x => x.symbol.toUpperCase() === sym);

  if (!ticker) {
    return fallback ? { ...fallback } : null;
  }

  const cached = quotesCache.get(sym);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = (await res.json()) as any;
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No chart result');

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
    const changePct = +(((currentPrice - prevClose) / prevClose) * 100).toFixed(2);

    const dayHigh = meta.regularMarketDayHigh || currentPrice;
    const dayLow = meta.regularMarketDayLow || currentPrice;
    const week52High = meta.fiftyTwoWeekHigh;
    const week52Low = meta.fiftyTwoWeekLow;

    const volumeNum = meta.regularMarketVolume || 0;
    const volumeFormatted = volumeNum > 1_000_000
      ? `${(volumeNum / 1_000_000).toFixed(1)}M`
      : volumeNum > 1_000
      ? `${(volumeNum / 1_000).toFixed(0)}K`
      : `${volumeNum}`;

    const baseName = fallback?.name || meta.shortName || meta.longName || sym;
    const category = fallback?.category || (sym.includes('NIFTY') || sym.includes('SENSEX') || sym.includes('VIX') ? 'Index' : 'Equity');

    // Approximate RSI based on change momentum
    const rsi = Math.max(25, Math.min(85, Math.round(50 + changePct * 7)));

    const item: MarketItem = {
      symbol: sym,
      name: baseName,
      price: +currentPrice.toFixed(2),
      changePct,
      category,
      volume: volumeFormatted,
      rsi,
      dayHigh: +dayHigh.toFixed(2),
      dayLow: +dayLow.toFixed(2),
      week52High: week52High ? +week52High.toFixed(2) : undefined,
      week52Low: week52Low ? +week52Low.toFixed(2) : undefined
    };

    quotesCache.set(sym, { data: item, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS });
    return item;
  } catch (err) {
    // If upstream fetch fails, use fallback fixture
    if (fallback) {
      return { ...fallback };
    }
    return null;
  }
}

/**
 * Fetch all stocks and indices with live quotes in parallel
 */
export async function fetchAllLiveMarketRows(): Promise<MarketItem[]> {
  const promises = marketRows.map(async row => {
    const live = await fetchLiveQuote(row.symbol);
    return live || row;
  });

  return Promise.all(promises);
}

/**
 * Fetch live candlestick chart points for a symbol and timeframe
 */
export async function fetchLiveChartPoints(symbol: string, timeframe: string): Promise<ChartPoint[]> {
  const sym = symbol.toUpperCase().trim();
  const ticker = TICKER_MAP[sym] || '^NSEI';
  const tf = timeframe.toUpperCase().trim();
  const cacheKey = `${sym}_${tf}`;

  const cached = chartCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  let range = '1d';
  let interval = '15m';

  if (tf === '1W') {
    range = '5d';
    interval = '60m';
  } else if (tf === '1M') {
    range = '1mo';
    interval = '1d';
  } else if (tf === '1Y') {
    range = '1y';
    interval = '1wk';
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = (await res.json()) as any;
    const result = json?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error('Invalid chart data');
    }

    const timestamps: number[] = result.timestamp;
    const quote = result.indicators.quote[0];
    const opens: (number | null)[] = quote.open || [];
    const highs: (number | null)[] = quote.high || [];
    const lows: (number | null)[] = quote.low || [];
    const closes: (number | null)[] = quote.close || [];
    const volumes: (number | null)[] = quote.volume || [];

    const points: ChartPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c === null || c === undefined || isNaN(c)) continue;

      const date = new Date(timestamps[i] * 1000);
      let label = '';

      if (tf === '1D') {
        label = date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        });
      } else if (tf === '1W') {
        label = date.toLocaleDateString('en-IN', {
          weekday: 'short',
          timeZone: 'Asia/Kolkata'
        });
      } else if (tf === '1M') {
        label = `D${date.getDate()}`;
      } else {
        label = date.toLocaleDateString('en-IN', {
          month: 'short',
          timeZone: 'Asia/Kolkata'
        });
      }

      const closeVal = +c.toFixed(2);
      const openVal = +(opens[i] ?? closeVal).toFixed(2);
      const highVal = +(highs[i] ?? Math.max(openVal, closeVal)).toFixed(2);
      const lowVal = +(lows[i] ?? Math.min(openVal, closeVal)).toFixed(2);
      const vol = Math.round(volumes[i] || 15000);

      points.push({
        t: label,
        v: closeVal,
        open: openVal,
        high: highVal,
        low: lowVal,
        close: closeVal,
        volume: vol
      });
    }

    if (points.length > 0) {
      chartCache.set(cacheKey, { data: points, expiresAt: Date.now() + CHART_CACHE_TTL_MS });
      return points;
    }
  } catch (err) {
    console.warn(`[LiveMarket] Failed to fetch live candles for ${ticker}:`, (err as Error).message);
  }

  return [];
}
