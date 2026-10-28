// Comprehensive Indian Market Universe (Sectoral Indices, Broad Indices & Top Equities)

export interface MarketIndexRecord {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  category: 'Sectoral' | 'Broad';
  volume?: string;
  rsi?: number;
}

// 1. Official NSE Sectoral Indices (Mirroring live NSE Heatmap)
export const sectoralIndices: MarketIndexRecord[] = [
  { symbol: 'NIFTY AUTO', name: 'Nifty Auto Index', price: 25411.35, changePct: 0.28, category: 'Sectoral', rsi: 56 },
  { symbol: 'NIFTY BANK', name: 'Nifty Bank Index', price: 53781.85, changePct: -0.36, category: 'Sectoral', rsi: 48 },
  { symbol: 'NIFTY FIN SERVICE', name: 'Nifty Financial Services', price: 24166.45, changePct: -0.56, category: 'Sectoral', rsi: 46 },
  { symbol: 'NIFTY FMCG', name: 'Nifty FMCG Index', price: 42509.10, changePct: -1.41, category: 'Sectoral', rsi: 38 },
  { symbol: 'NIFTY IT', name: 'Nifty IT Index', price: 31107.65, changePct: -3.36, category: 'Sectoral', rsi: 29 },
  { symbol: 'NIFTY MEDIA', name: 'Nifty Media Index', price: 1612.20, changePct: -0.18, category: 'Sectoral', rsi: 50 },
  { symbol: 'NIFTY METAL', name: 'Nifty Metal Index', price: 11744.70, changePct: -0.53, category: 'Sectoral', rsi: 47 },
  { symbol: 'NIFTY PHARMA', name: 'Nifty Pharma Index', price: 26220.25, changePct: -0.18, category: 'Sectoral', rsi: 52 },
  { symbol: 'NIFTY PSU BANK', name: 'Nifty PSU Bank Index', price: 8099.05, changePct: -0.34, category: 'Sectoral', rsi: 49 },
  { symbol: 'NIFTY REALTY', name: 'Nifty Realty Index', price: 798.90, changePct: -0.76, category: 'Sectoral', rsi: 44 },
  { symbol: 'NIFTY PVT BANK', name: 'Nifty Private Bank Index', price: 26471.70, changePct: -0.59, category: 'Sectoral', rsi: 45 },
  { symbol: 'NIFTY HEALTHCARE', name: 'Nifty Healthcare Index', price: 15887.60, changePct: -0.19, category: 'Sectoral', rsi: 51 },
  { symbol: 'NIFTY CONSR DUR', name: 'Nifty Consumer Durables', price: 34184.85, changePct: -0.20, category: 'Sectoral', rsi: 50 },
  { symbol: 'NIFTY OIL AND GAS', name: 'Nifty Oil & Gas Index', price: 10380.85, changePct: -1.47, category: 'Sectoral', rsi: 36 },
  { symbol: 'NIFTY CHEMICALS', name: 'Nifty Chemicals Index', price: 26826.75, changePct: -0.05, category: 'Sectoral', rsi: 50 },
  { symbol: 'NIFTY500 HEALTHCARE', name: 'Nifty 500 Healthcare', price: 20756.10, changePct: 0.02, category: 'Sectoral', rsi: 52 },
  { symbol: 'NIFTY MIDSMALL HEALTHCARE', name: 'Nifty MidSmall Healthcare', price: 50291.85, changePct: 0.43, category: 'Sectoral', rsi: 58 },
  { symbol: 'NIFTY INFRA', name: 'Nifty Infrastructure', price: 8452.10, changePct: -0.32, category: 'Sectoral', rsi: 48 }
];

// 2. Official NSE Broad Market Indices (Mirroring live NSE Broad Indices Heatmap)
export const broadIndices: MarketIndexRecord[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50 Benchmark', price: 22563.10, changePct: -0.82, category: 'Broad', rsi: 43 },
  { symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50', price: 67115.80, changePct: -0.34, category: 'Broad', rsi: 48 },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50', price: 16383.10, changePct: -0.18, category: 'Broad', rsi: 51 },
  { symbol: 'NIFTY MIDCAP 100', name: 'Nifty Midcap 100', price: 56831.50, changePct: -0.35, category: 'Broad', rsi: 49 },
  { symbol: 'NIFTY MIDCAP 150', name: 'Nifty Midcap 150', price: 20924.60, changePct: -0.37, category: 'Broad', rsi: 48 },
  { symbol: 'NIFTY SMLCAP 50', name: 'Nifty Smallcap 50', price: 9345.50, changePct: 0.40, category: 'Broad', rsi: 57 },
  { symbol: 'NIFTY SMLCAP 100', name: 'Nifty Smallcap 100', price: 18501.10, changePct: 0.18, category: 'Broad', rsi: 54 },
  { symbol: 'NIFTY SMLCAP 250', name: 'Nifty Smallcap 250', price: 16910.70, changePct: -0.14, category: 'Broad', rsi: 51 },
  { symbol: 'NIFTY MIDSMAL 400', name: 'Nifty MidSmallcap 400', price: 19485.65, changePct: -0.29, category: 'Broad', rsi: 49 },
  { symbol: 'NIFTY 100', name: 'Nifty 100', price: 23516.75, changePct: -0.73, category: 'Broad', rsi: 44 },
  { symbol: 'NIFTY 200', name: 'Nifty 200', price: 12961.45, changePct: -0.66, category: 'Broad', rsi: 45 },
  { symbol: 'NIFTY 500', name: 'Nifty 500', price: 21606.55, changePct: -0.59, category: 'Broad', rsi: 46 },
  { symbol: 'NIFTY500 MULTICAP', name: 'Nifty 500 Multicap 50:25:25', price: 15311.45, changePct: -0.50, category: 'Broad', rsi: 47 },
  { symbol: 'NIFTY LARGEMID 250', name: 'Nifty LargeMidcap 250', price: 15346.10, changePct: -0.56, category: 'Broad', rsi: 46 },
  { symbol: 'NIFTY MID SELECT', name: 'Nifty Midcap Select', price: 13211.00, changePct: -0.07, category: 'Broad', rsi: 51 },
  { symbol: 'NIFTY TOTAL MARKET', name: 'Nifty Total Market', price: 12211.55, changePct: -0.58, category: 'Broad', rsi: 46 },
  { symbol: 'NIFTY MICROCAP 250', name: 'Nifty Microcap 250', price: 24270.45, changePct: -0.25, category: 'Broad', rsi: 50 },
  { symbol: 'NIFTY FPI 150', name: 'Nifty FPI 150', price: 1452.80, changePct: -0.77, category: 'Broad', rsi: 44 },
  { symbol: 'NIFTY500 LMS EQUAL', name: 'Nifty 500 LargeMidSmall Equal', price: 17086.05, changePct: -0.42, category: 'Broad', rsi: 47 },
  { symbol: 'NIFTY SMALLCAP 50', name: 'Nifty Smallcap 50 Index', price: 19324.70, changePct: -0.15, category: 'Broad', rsi: 50 },
  { symbol: 'SENSEX', name: 'BSE Sensex Benchmark', price: 81450.20, changePct: 0.52, category: 'Broad', rsi: 59 },
  { symbol: 'INDIA VIX', name: 'India Volatility Index', price: 13.42, changePct: -2.10, category: 'Broad', rsi: 38 }
];

// 3. Comprehensive Indian Market Universe (55+ Instruments across all major NSE/BSE sectors)
export const marketRows = [
  // --- Benchmark Indices (also exposed in stock scanner) ---
  { symbol: 'NIFTY 50', name: 'Nifty 50 Index', price: 22563.10, changePct: -0.82, category: 'Index', volume: '34.2M', rsi: 43 },
  { symbol: 'BANK NIFTY', name: 'Bank Nifty Index', price: 53781.85, changePct: -0.36, category: 'Index', volume: '18.5M', rsi: 48 },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', price: 81450.2, changePct: 0.52, category: 'Index', volume: '12.1M', rsi: 59 },
  { symbol: 'NIFTY IT', name: 'Nifty IT Index', price: 31107.65, changePct: -3.36, category: 'Index', volume: '8.4M', rsi: 29 },
  { symbol: 'INDIA VIX', name: 'Volatility Index', price: 13.42, changePct: -2.10, category: 'Index', volume: '4.8M', rsi: 38 },

  // --- Banking & Financials ---
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 967.25, changePct: 0.31, category: 'Banking', volume: '14.2M', rsi: 52 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 1288.6, changePct: 1.02, category: 'Banking', volume: '8.6M', rsi: 64 },
  { symbol: 'SBIN', name: 'State Bank of India', price: 824.50, changePct: 1.85, category: 'Banking', volume: '16.4M', rsi: 70 },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', price: 1165.5, changePct: 0.72, category: 'Banking', volume: '4.2M', rsi: 57 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1780.2, changePct: -0.15, category: 'Banking', volume: '2.5M', rsi: 48 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', price: 1042.80, changePct: -2.45, category: 'Banking', volume: '6.1M', rsi: 34 },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', price: 248.60, changePct: 2.10, category: 'Banking', volume: '11.8M', rsi: 72 },
  { symbol: 'PNB', name: 'Punjab National Bank', price: 106.40, changePct: 1.40, category: 'Banking', volume: '24.5M', rsi: 66 },

  // --- Information Technology ---
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3214.5, changePct: -0.42, category: 'IT', volume: '1.9M', rsi: 44 },
  { symbol: 'INFY', name: 'Infosys Limited', price: 1518.4, changePct: 0.86, category: 'IT', volume: '3.8M', rsi: 58 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', price: 1742.30, changePct: 2.45, category: 'IT', volume: '2.8M', rsi: 74 },
  { symbol: 'WIPRO', name: 'Wipro Limited', price: 542.8, changePct: -0.90, category: 'IT', volume: '4.5M', rsi: 40 },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited', price: 1684.00, changePct: 1.35, category: 'IT', volume: '1.7M', rsi: 63 },
  { symbol: 'LTIM', name: 'LTIMindtree Limited', price: 5920.00, changePct: -1.20, category: 'IT', volume: '420K', rsi: 43 },
  { symbol: 'COFORGE', name: 'Coforge Limited', price: 7840.50, changePct: 3.25, category: 'IT', volume: '680K', rsi: 78 },
  { symbol: 'PERSISTENT', name: 'Persistent Systems', price: 5480.00, changePct: 2.15, category: 'IT', volume: '510K', rsi: 71 },

  // --- Energy, Oil & Utilities ---
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1462.8, changePct: 1.28, category: 'Energy', volume: '5.4M', rsi: 66 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', price: 268.40, changePct: -0.85, category: 'Energy', volume: '12.4M', rsi: 46 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', price: 312.50, changePct: 1.15, category: 'Energy', volume: '8.2M', rsi: 61 },
  { symbol: 'NTPC', name: 'NTPC Limited', price: 388.20, changePct: 1.70, category: 'Energy', volume: '10.5M', rsi: 69 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', price: 324.60, changePct: 0.45, category: 'Energy', volume: '7.1M', rsi: 54 },
  { symbol: 'TATAPOWER', name: 'Tata Power Company', price: 418.30, changePct: 2.80, category: 'Energy', volume: '9.4M', rsi: 75 },
  { symbol: 'COALINDIA', name: 'Coal India Limited', price: 442.10, changePct: -1.65, category: 'Energy', volume: '6.8M', rsi: 39 },

  // --- Auto & Mobility ---
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', price: 11840.0, changePct: -0.65, category: 'Auto', volume: '620K', rsi: 42 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', price: 864.20, changePct: 1.95, category: 'Auto', volume: '14.8M', rsi: 68 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', price: 2840.00, changePct: 2.65, category: 'Auto', volume: '3.4M', rsi: 77 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Limited', price: 9840.00, changePct: -1.40, category: 'Auto', volume: '290K', rsi: 41 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited', price: 4680.00, changePct: 0.75, category: 'Auto', volume: '410K', rsi: 55 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited', price: 4920.00, changePct: 1.60, category: 'Auto', volume: '380K', rsi: 64 },

  // --- Metals & Mining ---
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', price: 148.5, changePct: 2.15, category: 'Metals', volume: '28.4M', rsi: 73 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', price: 984.60, changePct: 1.80, category: 'Metals', volume: '2.6M', rsi: 67 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', price: 682.40, changePct: 2.90, category: 'Metals', volume: '6.2M', rsi: 76 },
  { symbol: 'VEDL', name: 'Vedanta Limited', price: 468.20, changePct: 3.45, category: 'Metals', volume: '18.1M', rsi: 79 },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', price: 940.80, changePct: -1.10, category: 'Metals', volume: '1.9M', rsi: 45 },

  // --- Healthcare & Pharmaceuticals ---
  { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', price: 1712.3, changePct: 0.24, category: 'Healthcare', volume: '1.8M', rsi: 53 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", price: 6540.00, changePct: -1.85, category: 'Healthcare', volume: '480K', rsi: 37 },
  { symbol: 'CIPLA', name: 'Cipla Limited', price: 1540.20, changePct: 1.10, category: 'Healthcare', volume: '1.6M', rsi: 62 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', price: 6980.00, changePct: 2.20, category: 'Healthcare', volume: '540K', rsi: 72 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", price: 5820.00, changePct: -0.75, category: 'Healthcare', volume: '390K', rsi: 48 },

  // --- Consumer Goods & FMCG ---
  { symbol: 'ITC', name: 'ITC Limited', price: 472.4, changePct: 0.85, category: 'FMCG', volume: '9.3M', rsi: 56 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2380.0, changePct: -0.35, category: 'FMCG', volume: '1.3M', rsi: 46 },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', price: 2240.00, changePct: -1.05, category: 'FMCG', volume: '420K', rsi: 42 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', price: 5460.00, changePct: 1.45, category: 'FMCG', volume: '360K', rsi: 63 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', price: 1040.20, changePct: 0.65, category: 'FMCG', volume: '1.5M', rsi: 55 },
  { symbol: 'TITAN', name: 'Titan Company Limited', price: 3410.0, changePct: 1.45, category: 'Consumer', volume: '1.1M', rsi: 63 },

  // --- Financial Services & NBFC ---
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', price: 6920.0, changePct: 2.30, category: 'Finance', volume: '1.4M', rsi: 69 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', price: 1780.50, changePct: 1.65, category: 'Finance', volume: '1.8M', rsi: 65 },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Inv', price: 1380.00, changePct: 2.75, category: 'Finance', volume: '1.2M', rsi: 74 },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance', price: 3140.00, changePct: -1.75, category: 'Finance', volume: '890K', rsi: 38 },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', price: 318.50, changePct: 1.80, category: 'Finance', volume: '14.2M', rsi: 67 },

  // --- Industrials & Infra ---
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3582.0, changePct: 1.74, category: 'Industrials', volume: '2.1M', rsi: 71 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', price: 11240.00, changePct: 0.95, category: 'Industrials', volume: '240K', rsi: 58 },
  { symbol: 'GRASIM', name: 'Grasim Industries', price: 2640.00, changePct: -0.45, category: 'Industrials', volume: '620K', rsi: 49 },
  { symbol: 'BEL', name: 'Bharat Electronics', price: 294.50, changePct: 3.10, category: 'Industrials', volume: '16.5M', rsi: 78 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics', price: 4480.00, changePct: 2.40, category: 'Industrials', volume: '1.9M', rsi: 73 },

  // --- Conglomerates & Telecom ---
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2940.0, changePct: 3.10, category: 'Conglomerate', volume: '4.7M', rsi: 76 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', price: 1385.00, changePct: 1.90, category: 'Conglomerate', volume: '3.6M', rsi: 68 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', price: 1844.2, changePct: -0.18, category: 'Telecom', volume: '3.1M', rsi: 49 }
];
