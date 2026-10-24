export interface Stock {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  category: string;
  volume?: string;
  rsi?: number;
  dayHigh?: number;
  dayLow?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string | Date;
  subscription?: {
    plan: string;
    status: string;
  };
}

export interface JournalEntry {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number | string;
  quantity: number;
  notes?: string;
  tradedAt?: string;
  createdAt?: string;
}

export interface JournalAnalytics {
  totalTrades: number;
  buys: number;
  sells: number;
  totalCapitalCommitted: number;
  uniqueSymbolsCount: number;
  symbols: string[];
}
