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
  role?: 'USER' | 'ADMIN';
  createdAt?: string | Date;
  subscription?: {
    id?: string;
    plan: string;
    status: string;
    currentPeriodEnd?: string | Date | null;
    createdAt?: string | Date;
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
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface JournalAnalytics {
  totalTrades: number;
  buys: number;
  sells: number;
  totalCapitalCommitted: number;
  uniqueSymbolsCount: number;
  symbols: string[];
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  planCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  estimatedMRR: number;
  totalJournalTrades: number;
  totalWatchlistItems: number;
  totalAuditLogs: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id?: string;
    plan: 'FREE' | 'PRO' | 'ELITE' | string;
    status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | string;
    currentPeriodEnd?: string | null;
  } | null;
  _count: {
    watchlist: number;
    journal: number;
  };
}

export interface AdminAuditLog {
  id: string;
  userId?: string | null;
  action: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface PlatformAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent' | 'success';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
