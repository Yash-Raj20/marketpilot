// Comprehensive Indian Market Universe (Sectoral Indices, Broad Indices & Top Equities)

export interface MarketIndexRecord {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAmount?: number;
  previousClose?: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  category: 'Sectoral' | 'Broad';
  volume?: string;
  rsi?: number;
  marketCap?: number;
  marketCapFormatted?: string;
  source?: 'NSE' | 'YF';
  status?: string;
}

export interface MarketRowRecord {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAmount: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  category: string;
  volume: string;
  rsi: number;
  marketCap: number; // in ₹ Crores
  marketCapFormatted: string;
  source: 'NSE' | 'YF';
  status: string;
}

export function formatMarketCap(mcapInCrores: number): string {
  if (mcapInCrores >= 100000) {
    return `₹${(mcapInCrores / 100000).toFixed(2)}L Cr`;
  }
  if (mcapInCrores >= 1000) {
    return `₹${(mcapInCrores / 1000).toFixed(1)}K Cr`;
  }
  return `₹${mcapInCrores.toFixed(0)} Cr`;
}

// Special symbols mapping between NSE and Yahoo Finance (.NS)
export const SPECIAL_SYMBOLS_MAP: Record<string, { nse: string; yf: string }> = {
  'M&M': { nse: 'M&M', yf: 'M&M.NS' },
  'BAJAJ-AUTO': { nse: 'BAJAJ-AUTO', yf: 'BAJAJ-AUTO.NS' },
  'LT': { nse: 'LT', yf: 'LT.NS' },
  'TATAMOTORS': { nse: 'TATAMOTORS', yf: 'TATAMOTORS.NS' },
  'TATASTEEL': { nse: 'TATASTEEL', yf: 'TATASTEEL.NS' },
  'HDFCBANK': { nse: 'HDFCBANK', yf: 'HDFCBANK.NS' },
  'ICICIBANK': { nse: 'ICICIBANK', yf: 'ICICIBANK.NS' },
  'SBIN': { nse: 'SBIN', yf: 'SBIN.NS' },
  'TCS': { nse: 'TCS', yf: 'TCS.NS' },
  'INFY': { nse: 'INFY', yf: 'INFY.NS' },
  'RELIANCE': { nse: 'RELIANCE', yf: 'RELIANCE.NS' },
  'BHARTIARTL': { nse: 'BHARTIARTL', yf: 'BHARTIARTL.NS' },
  'ITC': { nse: 'ITC', yf: 'ITC.NS' },
  'HINDUNILVR': { nse: 'HINDUNILVR', yf: 'HINDUNILVR.NS' },
  'KOTAKBANK': { nse: 'KOTAKBANK', yf: 'KOTAKBANK.NS' },
  'AXISBANK': { nse: 'AXISBANK', yf: 'AXISBANK.NS' },
  'NIFTY 50': { nse: 'NIFTY 50', yf: '^NSEI' },
  'BANK NIFTY': { nse: 'NIFTY BANK', yf: '^NSEBANK' },
  'SENSEX': { nse: 'SENSEX', yf: '^BSESN' }
};

// 1. Official NSE Sectoral Indices (Mirroring live NSE Heatmap)
export const sectoralIndices: MarketIndexRecord[] = [
  { symbol: 'NIFTY AUTO', name: 'Nifty Auto Index', price: 25411.35, changePct: 0.28, category: 'Sectoral', rsi: 56, source: 'NSE' },
  { symbol: 'NIFTY BANK', name: 'Nifty Bank Index', price: 53781.85, changePct: -0.36, category: 'Sectoral', rsi: 48, source: 'NSE' },
  { symbol: 'NIFTY FIN SERVICE', name: 'Nifty Financial Services', price: 24166.45, changePct: -0.56, category: 'Sectoral', rsi: 46, source: 'NSE' },
  { symbol: 'NIFTY FMCG', name: 'Nifty FMCG Index', price: 42509.10, changePct: -1.41, category: 'Sectoral', rsi: 38, source: 'NSE' },
  { symbol: 'NIFTY IT', name: 'Nifty IT Index', price: 31107.65, changePct: -3.36, category: 'Sectoral', rsi: 29, source: 'NSE' },
  { symbol: 'NIFTY MEDIA', name: 'Nifty Media Index', price: 1612.20, changePct: -0.18, category: 'Sectoral', rsi: 50, source: 'NSE' },
  { symbol: 'NIFTY METAL', name: 'Nifty Metal Index', price: 11744.70, changePct: -0.53, category: 'Sectoral', rsi: 47, source: 'NSE' },
  { symbol: 'NIFTY PHARMA', name: 'Nifty Pharma Index', price: 26220.25, changePct: -0.18, category: 'Sectoral', rsi: 52, source: 'NSE' },
  { symbol: 'NIFTY PSU BANK', name: 'Nifty PSU Bank Index', price: 8099.05, changePct: -0.34, category: 'Sectoral', rsi: 49, source: 'NSE' },
  { symbol: 'NIFTY REALTY', name: 'Nifty Realty Index', price: 798.90, changePct: -0.76, category: 'Sectoral', rsi: 44, source: 'NSE' },
  { symbol: 'NIFTY PVT BANK', name: 'Nifty Private Bank Index', price: 26471.70, changePct: -0.59, category: 'Sectoral', rsi: 45, source: 'NSE' },
  { symbol: 'NIFTY HEALTHCARE', name: 'Nifty Healthcare Index', price: 15887.60, changePct: -0.19, category: 'Sectoral', rsi: 51, source: 'NSE' },
  { symbol: 'NIFTY CONSR DUR', name: 'Nifty Consumer Durables', price: 34184.85, changePct: -0.20, category: 'Sectoral', rsi: 50, source: 'NSE' },
  { symbol: 'NIFTY OIL AND GAS', name: 'Nifty Oil & Gas Index', price: 10380.85, changePct: -1.47, category: 'Sectoral', rsi: 36, source: 'NSE' },
  { symbol: 'NIFTY CHEMICALS', name: 'Nifty Chemicals Index', price: 26826.75, changePct: -0.05, category: 'Sectoral', rsi: 50, source: 'NSE' },
  { symbol: 'NIFTY500 HEALTHCARE', name: 'Nifty 500 Healthcare', price: 20756.10, changePct: 0.02, category: 'Sectoral', rsi: 52, source: 'NSE' },
  { symbol: 'NIFTY MIDSMALL HEALTHCARE', name: 'Nifty MidSmall Healthcare', price: 50291.85, changePct: 0.43, category: 'Sectoral', rsi: 58, source: 'NSE' },
  { symbol: 'NIFTY INFRA', name: 'Nifty Infrastructure', price: 8452.10, changePct: -0.32, category: 'Sectoral', rsi: 48, source: 'NSE' }
];

// 2. Official NSE Broad Market Indices
export const broadIndices: MarketIndexRecord[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50 Benchmark', price: 22563.10, changePct: -0.82, category: 'Broad', rsi: 43, source: 'NSE' },
  { symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50', price: 67115.80, changePct: -0.34, category: 'Broad', rsi: 48, source: 'NSE' },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50', price: 16383.10, changePct: -0.18, category: 'Broad', rsi: 51, source: 'NSE' },
  { symbol: 'NIFTY MIDCAP 100', name: 'Nifty Midcap 100', price: 56831.50, changePct: -0.35, category: 'Broad', rsi: 49, source: 'NSE' },
  { symbol: 'NIFTY MIDCAP 150', name: 'Nifty Midcap 150', price: 20924.60, changePct: -0.37, category: 'Broad', rsi: 48, source: 'NSE' },
  { symbol: 'NIFTY SMLCAP 50', name: 'Nifty Smallcap 50', price: 9345.50, changePct: 0.40, category: 'Broad', rsi: 57, source: 'NSE' },
  { symbol: 'NIFTY SMLCAP 100', name: 'Nifty Smallcap 100', price: 18501.10, changePct: 0.18, category: 'Broad', rsi: 54, source: 'NSE' },
  { symbol: 'NIFTY SMLCAP 250', name: 'Nifty Smallcap 250', price: 16910.70, changePct: -0.14, category: 'Broad', rsi: 51, source: 'NSE' },
  { symbol: 'NIFTY MIDSMAL 400', name: 'Nifty MidSmallcap 400', price: 19485.65, changePct: -0.29, category: 'Broad', rsi: 49, source: 'NSE' },
  { symbol: 'NIFTY 100', name: 'Nifty 100', price: 23516.75, changePct: -0.73, category: 'Broad', rsi: 44, source: 'NSE' },
  { symbol: 'NIFTY 200', name: 'Nifty 200', price: 12961.45, changePct: -0.66, category: 'Broad', rsi: 45, source: 'NSE' },
  { symbol: 'NIFTY 500', name: 'Nifty 500', price: 21606.55, changePct: -0.59, category: 'Broad', rsi: 46, source: 'NSE' },
  { symbol: 'NIFTY500 MULTICAP', name: 'Nifty 500 Multicap 50:25:25', price: 15311.45, changePct: -0.50, category: 'Broad', rsi: 47, source: 'NSE' },
  { symbol: 'NIFTY LARGEMID 250', name: 'Nifty LargeMidcap 250', price: 15346.10, changePct: -0.56, category: 'Broad', rsi: 46, source: 'NSE' },
  { symbol: 'NIFTY MID SELECT', name: 'Nifty Midcap Select', price: 13211.00, changePct: -0.07, category: 'Broad', rsi: 51, source: 'NSE' },
  { symbol: 'NIFTY TOTAL MARKET', name: 'Nifty Total Market', price: 12211.55, changePct: -0.58, category: 'Broad', rsi: 46, source: 'NSE' },
  { symbol: 'NIFTY MICROCAP 250', name: 'Nifty Microcap 250', price: 24270.45, changePct: -0.25, category: 'Broad', rsi: 50, source: 'NSE' },
  { symbol: 'NIFTY FPI 150', name: 'Nifty FPI 150', price: 1452.80, changePct: -0.77, category: 'Broad', rsi: 44, source: 'NSE' },
  { symbol: 'NIFTY500 LMS EQUAL', name: 'Nifty 500 LargeMidSmall Equal', price: 17086.05, changePct: -0.42, category: 'Broad', rsi: 47, source: 'NSE' },
  { symbol: 'NIFTY SMALLCAP 50', name: 'Nifty Smallcap 50 Index', price: 19324.70, changePct: -0.15, category: 'Broad', rsi: 50, source: 'NSE' },
  { symbol: 'SENSEX', name: 'BSE Sensex Benchmark', price: 81450.20, changePct: 0.52, category: 'Broad', rsi: 59, source: 'NSE' },
  { symbol: 'INDIA VIX', name: 'India Volatility Index', price: 13.42, changePct: -2.10, category: 'Broad', rsi: 38, source: 'NSE' }
];

// Helper to create market row with accurate mathematical consistency
function createRow(
  symbol: string,
  name: string,
  price: number,
  changePct: number,
  category: string,
  volume: string,
  rsi: number,
  mcapCr: number,
  source: 'NSE' | 'YF' = 'NSE'
): MarketRowRecord {
  // Previous Close strictly computed: LTP / (1 + changePct / 100)
  const previousClose = +(price / (1 + changePct / 100)).toFixed(2);
  const changeAmount = +(price - previousClose).toFixed(2);
  const open = +(previousClose * (1 + (changePct > 0 ? 0.002 : -0.002))).toFixed(2);
  const dayHigh = +(Math.max(price, open) * 1.006).toFixed(2);
  const dayLow = +(Math.min(price, open) * 0.994).toFixed(2);

  return {
    symbol,
    name,
    price,
    changePct,
    changeAmount,
    previousClose,
    open,
    dayHigh,
    dayLow,
    category,
    volume,
    rsi,
    marketCap: mcapCr,
    marketCapFormatted: formatMarketCap(mcapCr),
    source,
    status: 'Active'
  };
}

// 3. Comprehensive Indian Market Universe (All major NSE/BSE sectors with authentic market caps)
export const marketRows: MarketRowRecord[] = [
  // --- Benchmark Indices (exposed in scanner) ---
  createRow('NIFTY 50', 'Nifty 50 Index', 22563.10, -0.82, 'Index', '34.2M', 43, 18500000),
  createRow('BANK NIFTY', 'Bank Nifty Index', 53781.85, -0.36, 'Index', '18.5M', 48, 4800000),
  createRow('SENSEX', 'BSE Sensex Index', 81450.2, 0.52, 'Index', '12.1M', 59, 17200000),
  createRow('NIFTY IT', 'Nifty IT Index', 31107.65, -3.36, 'Index', '8.4M', 29, 3200000),
  createRow('INDIA VIX', 'Volatility Index', 13.42, -2.10, 'Index', '4.8M', 38, 0),

  // --- Banking (8 Stocks) ---
  createRow('HDFCBANK', 'HDFC Bank Limited', 1685.25, 0.74, 'Banking', '14.2M', 58, 1285000),
  createRow('ICICIBANK', 'ICICI Bank Limited', 1378.00, -0.64, 'Banking', '8.6M', 52, 965000),
  createRow('SBIN', 'State Bank of India', 955.50, 1.10, 'Banking', '16.4M', 66, 752000),
  createRow('AXISBANK', 'Axis Bank Limited', 1215.70, 0.83, 'Banking', '4.2M', 59, 375000),
  createRow('KOTAKBANK', 'Kotak Mahindra Bank', 1780.20, 0.29, 'Banking', '2.5M', 51, 354000),
  createRow('INDUSINDBK', 'IndusInd Bank', 850.30, 2.04, 'Banking', '6.1M', 64, 82000),
  createRow('BANKBARODA', 'Bank of Baroda', 232.41, -0.65, 'Banking', '11.8M', 48, 120000),
  createRow('PNB', 'Punjab National Bank', 121.06, -0.17, 'Banking', '24.5M', 49, 133000),

  // --- Information Technology (8 Stocks) ---
  createRow('TCS', 'Tata Consultancy Services', 2451.50, -1.82, 'IT', '1.9M', 41, 1420000),
  createRow('INFY', 'Infosys Limited', 1119.60, -3.73, 'IT', '3.8M', 31, 620000),
  createRow('HCLTECH', 'HCL Technologies', 1398.80, -1.49, 'IT', '2.8M', 44, 460000),
  createRow('WIPRO', 'Wipro Limited', 185.49, -0.81, 'IT', '4.5M', 46, 280000),
  createRow('TECHM', 'Tech Mahindra Limited', 1787.20, -1.34, 'IT', '1.7M', 45, 175000),
  createRow('LTIM', 'LTIMindtree Limited', 5920.00, -1.20, 'IT', '420K', 47, 175000),
  createRow('COFORGE', 'Coforge Limited', 1969.80, -1.36, 'IT', '680K', 46, 52000),
  createRow('PERSISTENT', 'Persistent Systems', 5859.00, 0.45, 'IT', '510K', 54, 45000),

  // --- Energy, Oil & Utilities (7 Stocks) ---
  createRow('RELIANCE', 'Reliance Industries', 1462.80, 1.28, 'Energy', '5.4M', 66, 1980000),
  createRow('ONGC', 'Oil & Natural Gas Corp', 268.40, -0.85, 'Energy', '12.4M', 46, 337000),
  createRow('BPCL', 'Bharat Petroleum Corp', 312.50, 1.15, 'Energy', '8.2M', 61, 135000),
  createRow('NTPC', 'NTPC Limited', 388.20, 1.70, 'Energy', '10.5M', 69, 376000),
  createRow('POWERGRID', 'Power Grid Corporation', 324.60, 0.45, 'Energy', '7.1M', 54, 301000),
  createRow('TATAPOWER', 'Tata Power Company', 418.30, 2.80, 'Energy', '9.4M', 75, 134000),
  createRow('COALINDIA', 'Coal India Limited', 442.10, -1.65, 'Energy', '6.8M', 39, 272000),

  // --- Auto & Mobility (6 Stocks) ---
  createRow('MARUTI', 'Maruti Suzuki India', 11840.00, -0.65, 'Auto', '620K', 42, 372000),
  createRow('TATAMOTORS', 'Tata Motors Limited', 864.20, 1.95, 'Auto', '14.8M', 68, 318000),
  createRow('M&M', 'Mahindra & Mahindra', 2840.00, 2.65, 'Auto', '3.4M', 77, 353000),
  createRow('BAJAJ-AUTO', 'Bajaj Auto Limited', 9840.00, -1.40, 'Auto', '290K', 41, 276000),
  createRow('HEROMOTOCO', 'Hero MotoCorp Limited', 4680.00, 0.75, 'Auto', '410K', 55, 93500),
  createRow('EICHERMOT', 'Eicher Motors Limited', 4920.00, 1.60, 'Auto', '380K', 64, 134500),

  // --- Metals & Mining (5 Stocks) ---
  createRow('TATASTEEL', 'Tata Steel Limited', 148.50, 2.15, 'Metals', '28.4M', 73, 185000),
  createRow('JSWSTEEL', 'JSW Steel Limited', 984.60, 1.80, 'Metals', '2.6M', 67, 240000),
  createRow('HINDALCO', 'Hindalco Industries', 682.40, 2.90, 'Metals', '6.2M', 76, 153000),
  createRow('VEDL', 'Vedanta Limited', 468.20, 3.45, 'Metals', '18.1M', 79, 174000),
  createRow('JINDALSTEL', 'Jindal Steel & Power', 940.80, -1.10, 'Metals', '1.9M', 45, 96000),

  // --- Healthcare & Pharmaceuticals (5 Stocks) ---
  createRow('SUNPHARMA', 'Sun Pharma Industries', 1712.30, 0.24, 'Healthcare', '1.8M', 53, 410000),
  createRow('DRREDDY', "Dr. Reddy's Laboratories", 6540.00, -1.85, 'Healthcare', '480K', 37, 109000),
  createRow('CIPLA', 'Cipla Limited', 1540.20, 1.10, 'Healthcare', '1.6M', 62, 124000),
  createRow('APOLLOHOSP', 'Apollo Hospitals', 6980.00, 2.20, 'Healthcare', '540K', 72, 100000),
  createRow('DIVISLAB', "Divi's Laboratories", 5820.00, -0.75, 'Healthcare', '390K', 48, 154000),

  // --- Consumer Goods & FMCG (6 Stocks) ---
  createRow('ITC', 'ITC Limited', 472.40, 0.85, 'FMCG', '9.3M', 56, 589000),
  createRow('HINDUNILVR', 'Hindustan Unilever', 2380.00, -0.35, 'FMCG', '1.3M', 46, 559000),
  createRow('NESTLEIND', 'Nestle India Limited', 2240.00, -1.05, 'FMCG', '420K', 42, 216000),
  createRow('BRITANNIA', 'Britannia Industries', 5460.00, 1.45, 'FMCG', '360K', 63, 131000),
  createRow('TATACONSUM', 'Tata Consumer Products', 1040.20, 0.65, 'FMCG', '1.5M', 55, 98000),
  createRow('TITAN', 'Titan Company Limited', 3410.00, 1.45, 'Consumer', '1.1M', 63, 302000),

  // --- Financial Services & NBFC (5 Stocks) ---
  createRow('BAJFINANCE', 'Bajaj Finance Limited', 6920.00, 2.30, 'Finance', '1.4M', 69, 428000),
  createRow('BAJAJFINSV', 'Bajaj Finserv Limited', 1780.50, 1.65, 'Finance', '1.8M', 65, 283000),
  createRow('CHOLAFIN', 'Cholamandalam Inv', 1380.00, 2.75, 'Finance', '1.2M', 74, 115000),
  createRow('SHRIRAMFIN', 'Shriram Finance', 3140.00, -1.75, 'Finance', '890K', 38, 118000),
  createRow('JIOFIN', 'Jio Financial Services', 318.50, 1.80, 'Finance', '14.2M', 67, 202000),

  // --- Industrials & Infra (5 Stocks) ---
  createRow('LT', 'Larsen & Toubro', 3582.00, 1.74, 'Industrials', '2.1M', 71, 492000),
  createRow('ULTRACEMCO', 'UltraTech Cement', 11240.00, 0.95, 'Industrials', '240K', 58, 324000),
  createRow('GRASIM', 'Grasim Industries', 2640.00, -0.45, 'Industrials', '620K', 49, 178000),
  createRow('BEL', 'Bharat Electronics', 294.50, 3.10, 'Industrials', '16.5M', 78, 215000),
  createRow('HAL', 'Hindustan Aeronautics', 4480.00, 2.40, 'Industrials', '1.9M', 73, 299000),

  // --- Conglomerates & Telecom (3 Stocks) ---
  createRow('ADANIENT', 'Adani Enterprises', 2940.00, 3.10, 'Conglomerate', '4.7M', 76, 335000),
  createRow('ADANIPORTS', 'Adani Ports & SEZ', 1385.00, 1.90, 'Conglomerate', '3.6M', 68, 299000),
  createRow('BHARTIARTL', 'Bharti Airtel Limited', 1844.20, -0.18, 'Telecom', '3.1M', 49, 1080000)
];
