export interface Stock {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAmount?: number;
  previousClose?: number;
  open?: number;
  change3d?: number;
  change1w?: number;
  change1m?: number;
  category: string;
  volume?: string;
  volumeNumeric?: number;
  rsi?: number;
  dayHigh?: number;
  dayLow?: number;
  week52High?: number;
  week52Low?: number;
  marketCap?: number;
  marketCapFormatted?: string;
  source?: 'NSE' | 'YF';
  status?: string;
  peRatio?: number;
  aiScore?: number;
  aiSignal?: string;
  aiReason?: string;
  sparkline?: number[];
}

export interface MarketIndexItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  category: 'Sectoral' | 'Broad' | 'Index' | string;
  dayHigh?: number;
  dayLow?: number;
  volume?: string;
  rsi?: number;
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

export interface DhanStatus {
  configured: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  data?: {
    dhanClientId?: string;
    tokenValidity?: string;
    activeSegment?: string;
    ddpi?: string;
    mtf?: string;
    dataPlan?: string;
    dataValidity?: string;
  };
}

export interface DhanFundLimit {
  dhanClientId?: string;
  availabelBalance?: number;
  sodLimit?: number;
  collateralAmount?: number;
  utilizedAmount?: number;
  withdrawableBalance?: number;
}

export interface DhanHolding {
  tradingSymbol: string;
  securityId: string;
  exchange: string;
  totalQty: number;
  availableQty: number;
  avgCostPrice: number;
  lastTradedPrice?: number;
}

export interface DhanPosition {
  tradingSymbol: string;
  securityId: string;
  exchangeSegment: string;
  productType: string;
  positionType: string;
  buyQty: number;
  sellQty: number;
  netQty: number;
  buyAvg: number;
  sellAvg: number;
  realizedProfit: number;
  unrealizedProfit: number;
}

export interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  bot?: {
    id: number;
    first_name: string;
    username: string;
  };
  chatId?: string;
}

export interface IntegrationsStatus {
  useMockData: boolean;
  dhan: DhanStatus;
  telegram: TelegramStatus;
}

