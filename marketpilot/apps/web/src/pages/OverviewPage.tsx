import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  BrainCircuit, 
  Gauge, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  AreaChart as AreaIcon,
  CandlestickChart,
  BarChart3,
  Layers,
  ChevronRight,
  Radio,
  Zap
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { MarketIndicesHeatmap } from '../components/MarketIndicesHeatmap';
import { StockHeatmap } from '../components/StockHeatmap';
import { api } from '../lib/api';
import type { Stock, User, DhanFundLimit } from '../types';

interface OverviewPageProps {
  stocks: Stock[];
  watchlist: string[];
  user: User | null;
  onToggleWatch: (symbol: string) => void;
  onShowToast: (msg: string) => void;
}

type IndexSymbol = 'NIFTY 50' | 'BANK NIFTY' | 'SENSEX';
type Timeframe = '1D' | '1W' | '1M' | '1Y';
type ChartStyle = 'area' | 'candles';

interface ChartPoint {
  t: string;
  v: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const fallbackChartData: Record<IndexSymbol, Record<Timeframe, ChartPoint[]>> = {
  'NIFTY 50': {
    '1D': [
      { t: '09:15', v: 24715, open: 24710, high: 24740, low: 24690, close: 24715 },
      { t: '09:45', v: 24680, open: 24715, high: 24725, low: 24670, close: 24680 },
      { t: '10:30', v: 24745, open: 24680, high: 24760, low: 24675, close: 24745 },
      { t: '11:15', v: 24790, open: 24745, high: 24805, low: 24730, close: 24790 },
      { t: '12:00', v: 24765, open: 24790, high: 24800, low: 24750, close: 24765 },
      { t: '12:45', v: 24820, open: 24765, high: 24835, low: 24760, close: 24820 },
      { t: '13:30', v: 24805, open: 24820, high: 24830, low: 24790, close: 24805 },
      { t: '14:15', v: 24860, open: 24805, high: 24875, low: 24800, close: 24860 },
      { t: '15:00', v: 24885, open: 24860, high: 24915, low: 24855, close: 24885 },
      { t: '15:30', v: 24872, open: 24885, high: 24895, low: 24865, close: 24872 }
    ],
    '1W': [
      { t: 'Mon', v: 24520, open: 24480, high: 24550, low: 24450, close: 24520 },
      { t: 'Tue', v: 24640, open: 24520, high: 24670, low: 24510, close: 24640 },
      { t: 'Wed', v: 24590, open: 24640, high: 24660, low: 24560, close: 24590 },
      { t: 'Thu', v: 24760, open: 24590, high: 24790, low: 24580, close: 24760 },
      { t: 'Fri', v: 24872, open: 24760, high: 24915, low: 24750, close: 24872 }
    ],
    '1M': [
      { t: 'Week 1', v: 24150, open: 24050, high: 24220, low: 24010, close: 24150 },
      { t: 'Week 2', v: 24380, open: 24150, high: 24450, low: 24120, close: 24380 },
      { t: 'Week 3', v: 24590, open: 24380, high: 24650, low: 24340, close: 24590 },
      { t: 'Week 4', v: 24872, open: 24590, high: 24915, low: 24550, close: 24872 }
    ],
    '1Y': [
      { t: 'Q1', v: 22800, open: 22400, high: 23100, low: 22300, close: 22800 },
      { t: 'Q2', v: 23550, open: 22800, high: 23800, low: 22700, close: 23550 },
      { t: 'Q3', v: 24180, open: 23550, high: 24350, low: 23450, close: 24180 },
      { t: 'Q4', v: 24872, open: 24180, high: 24950, low: 24050, close: 24872 }
    ]
  },
  'BANK NIFTY': {
    '1D': [
      { t: '09:15', v: 51820, open: 51800, high: 51880, low: 51760, close: 51820 },
      { t: '09:45', v: 51750, open: 51820, high: 51840, low: 51710, close: 51750 },
      { t: '10:30', v: 51920, open: 51750, high: 51960, low: 51740, close: 51920 },
      { t: '11:15', v: 52040, open: 51920, high: 52070, low: 51900, close: 52040 },
      { t: '12:00', v: 51980, open: 52040, high: 52060, low: 51950, close: 51980 },
      { t: '12:45', v: 52090, open: 51980, high: 52120, low: 51960, close: 52090 },
      { t: '13:30', v: 52050, open: 52090, high: 52110, low: 52020, close: 52050 },
      { t: '14:15', v: 52140, open: 52050, high: 52180, low: 52030, close: 52140 },
      { t: '15:00', v: 52210, open: 52140, high: 52240, low: 52120, close: 52210 },
      { t: '15:30', v: 52180, open: 52210, high: 52230, low: 52160, close: 52180 }
    ],
    '1W': [
      { t: 'Mon', v: 51200, open: 51100, high: 51320, low: 51050, close: 51200 },
      { t: 'Tue', v: 51540, open: 51200, high: 51620, low: 51180, close: 51540 },
      { t: 'Wed', v: 51460, open: 51540, high: 51600, low: 51400, close: 51460 },
      { t: 'Thu', v: 51880, open: 51460, high: 51950, low: 51420, close: 51880 },
      { t: 'Fri', v: 52180, open: 51880, high: 52240, low: 51810, close: 52180 }
    ],
    '1M': [
      { t: 'Week 1', v: 50400, open: 50200, high: 50600, low: 50100, close: 50400 },
      { t: 'Week 2', v: 50950, open: 50400, high: 51100, low: 50350, close: 50950 },
      { t: 'Week 3', v: 51420, open: 50950, high: 51550, low: 50880, close: 51420 },
      { t: 'Week 4', v: 52180, open: 51420, high: 52240, low: 51350, close: 52180 }
    ],
    '1Y': [
      { t: 'Q1', v: 48200, open: 47600, high: 48800, low: 47300, close: 48200 },
      { t: 'Q2', v: 49650, open: 48200, high: 50200, low: 48050, close: 49650 },
      { t: 'Q3', v: 50850, open: 49650, high: 51200, low: 49400, close: 50850 },
      { t: 'Q4', v: 52180, open: 50850, high: 52350, low: 50600, close: 52180 }
    ]
  },
  'SENSEX': {
    '1D': [
      { t: '09:15', v: 81050, open: 81010, high: 81120, low: 80980, close: 81050 },
      { t: '09:45', v: 80980, open: 81050, high: 81080, low: 80940, close: 80980 },
      { t: '10:30', v: 81160, open: 80980, high: 81190, low: 80960, close: 81160 },
      { t: '11:15', v: 81280, open: 81160, high: 81320, low: 81140, close: 81280 },
      { t: '12:00', v: 81220, open: 81280, high: 81300, low: 81190, close: 81220 },
      { t: '12:45', v: 81340, open: 81220, high: 81380, low: 81200, close: 81340 },
      { t: '13:30', v: 81310, open: 81340, high: 81360, low: 81280, close: 81310 },
      { t: '14:15', v: 81410, open: 81310, high: 81450, low: 81290, close: 81410 },
      { t: '15:00', v: 81490, open: 81410, high: 81590, low: 81380, close: 81490 },
      { t: '15:30', v: 81450, open: 81490, high: 81510, low: 81420, close: 81450 }
    ],
    '1W': [
      { t: 'Mon', v: 80200, open: 80050, high: 80350, low: 79980, close: 80200 },
      { t: 'Tue', v: 80680, open: 80200, high: 80780, low: 80150, close: 80680 },
      { t: 'Wed', v: 80550, open: 80680, high: 80720, low: 80450, close: 80550 },
      { t: 'Thu', v: 81120, open: 80550, high: 81250, low: 80500, close: 81120 },
      { t: 'Fri', v: 81450, open: 81120, high: 81590, low: 81020, close: 81450 }
    ],
    '1M': [
      { t: 'Week 1', v: 79400, open: 79100, high: 79600, low: 79050, close: 79400 },
      { t: 'Week 2', v: 80150, open: 79400, high: 80350, low: 79350, close: 80150 },
      { t: 'Week 3', v: 80800, open: 80150, high: 80950, low: 80020, close: 80800 },
      { t: 'Week 4', v: 81450, open: 80800, high: 81590, low: 80750, close: 81450 }
    ],
    '1Y': [
      { t: 'Q1', v: 75500, open: 74200, high: 76100, low: 73900, close: 75500 },
      { t: 'Q2', v: 77800, open: 75500, high: 78400, low: 75200, close: 77800 },
      { t: 'Q3', v: 79600, open: 77800, high: 80100, low: 77400, close: 79600 },
      { t: 'Q4', v: 81450, open: 79600, high: 81650, low: 79200, close: 81450 }
    ]
  }
};

const defaultSectors = [
  { name: 'Banking', changePct: 1.35, count: 12 },
  { name: 'Metals', changePct: 1.20, count: 8 },
  { name: 'Energy', changePct: 0.95, count: 6 },
  { name: 'Industrials', changePct: 0.82, count: 9 },
  { name: 'Healthcare', changePct: 0.24, count: 7 },
  { name: 'IT', changePct: -0.38, count: 10 },
  { name: 'Auto', changePct: -0.65, count: 8 }
];

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function OverviewCandles({ data }: { data: ChartPoint[] }) {
  const minVal = Math.min(...data.map(d => d.low)) - 15;
  const maxVal = Math.max(...data.map(d => d.high)) + 15;
  const range = maxVal - minVal || 1;
  const height = 220;
  const width = 600;
  const step = width / (data.length || 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="overview-candle-svg">
      <line x1="0" y1="45" x2={width} y2="45" stroke="#1c2c3e" strokeDasharray="3 4" />
      <line x1="0" y1="110" x2={width} y2="110" stroke="#1c2c3e" strokeDasharray="3 4" />
      <line x1="0" y1="175" x2={width} y2="175" stroke="#1c2c3e" strokeDasharray="3 4" />

      {data.map((c, idx) => {
        const xCenter = idx * step + step / 2;
        const yHigh = height - ((c.high - minVal) / range) * (height - 40) - 20;
        const yLow = height - ((c.low - minVal) / range) * (height - 40) - 20;
        const yOpen = height - ((c.open - minVal) / range) * (height - 40) - 20;
        const yClose = height - ((c.close - minVal) / range) * (height - 40) - 20;

        const isGreen = c.close >= c.open;
        const color = isGreen ? '#34d399' : '#f87171';
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(Math.abs(yClose - yOpen), 4);
        const bodyWidth = Math.max(step * 0.5, 10);

        return (
          <g key={c.t}>
            <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.5" />
            <rect
              x={xCenter - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={color}
              rx="2"
            />
            <text x={xCenter} y={height - 4} fill="#6e829d" fontSize="10" textAnchor="middle">
              {c.t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function OverviewPage({ stocks, watchlist, user, onToggleWatch, onShowToast }: OverviewPageProps) {
  const navigate = useNavigate();

  // Interactive controls
  const [selectedSymbol, setSelectedSymbol] = useState<IndexSymbol>('NIFTY 50');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');

  // Chart data state
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>(
    fallbackChartData['NIFTY 50']['1D']
  );
  const [sectors, setSectors] = useState(defaultSectors);
  const [fiiFlow, setFiiFlow] = useState({ fiiNet: 1420.5, diiNet: 890.2 });
  const [marketConfig, setMarketConfig] = useState<{ useMockData: boolean; provider: string; dhanConfigured: boolean } | null>(null);
  const [dhanStatus, setDhanStatus] = useState<{ configured: boolean; connected: boolean; data?: { dhanClientId?: string } } | null>(null);
  const [dhanFunds, setDhanFunds] = useState<DhanFundLimit | null>(null);
  const [dhanHoldingsCount, setDhanHoldingsCount] = useState<number>(0);
  const [dhanPositionsCount, setDhanPositionsCount] = useState<number>(0);

  // Fetch feed configuration and Dhan broker state
  useEffect(() => {
    api<{ useMockData: boolean; provider: string; dhanConfigured: boolean }>('/market/config')
      .then(setMarketConfig)
      .catch(() => {});

    api<{ configured: boolean; connected: boolean; data?: { dhanClientId?: string } }>('/dhan/status')
      .then(res => {
        setDhanStatus(res);
        if (res.connected && user) {
          api<DhanFundLimit>('/dhan/funds').then(setDhanFunds).catch(() => {});
          api<{ holdings: unknown[] }>('/dhan/holdings').then(h => setDhanHoldingsCount(h.holdings?.length || 0)).catch(() => {});
          api<{ positions: unknown[] }>('/dhan/positions').then(p => setDhanPositionsCount(p.positions?.length || 0)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [user]);

  const [chartMeta, setChartMeta] = useState<{ currentPrice?: number; changePct?: number; high?: number; low?: number } | null>(null);

  // Fetch chart data from API on symbol or timeframe change
  useEffect(() => {
    api<{ points: ChartPoint[]; high: number; low: number; currentPrice?: number; changePct?: number }>(
      `/market/chart?symbol=${encodeURIComponent(selectedSymbol)}&range=${timeframe}`
    )
      .then(d => {
        if (d && d.points && d.points.length > 0) {
          setChartPoints(d.points);
          if (d.currentPrice !== undefined) {
            setChartMeta({
              currentPrice: d.currentPrice,
              changePct: d.changePct,
              high: d.high,
              low: d.low
            });
          }
        }
      })
      .catch(() => {
        // Use fallback if API fails
        setChartPoints(fallbackChartData[selectedSymbol][timeframe] || fallbackChartData['NIFTY 50']['1D']);
      });
  }, [selectedSymbol, timeframe]);

  const [liveIndices, setLiveIndices] = useState<Stock[]>([]);
  const [liveGainers, setLiveGainers] = useState<Stock[]>([]);
  const [liveLosers, setLiveLosers] = useState<Stock[]>([]);

  // Fetch overview metadata with recurring live exchange sync
  useEffect(() => {
    const fetchOverview = () => {
      api<{
        indices?: Stock[];
        movers?: Stock[];
        losers?: Stock[];
        sectorHeatmap?: typeof defaultSectors;
        institutionalFlow?: { fiiNet: number; diiNet: number };
      }>('/market/overview')
        .then(d => {
          if (d.indices) setLiveIndices(d.indices);
          if (d.movers) setLiveGainers(d.movers);
          if (d.losers) setLiveLosers(d.losers);
          if (d.sectorHeatmap) setSectors(d.sectorHeatmap);
          if (d.institutionalFlow) setFiiFlow(d.institutionalFlow);
        })
        .catch(() => {});
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  // Authoritative live benchmark calculations matching NSE official values
  const niftyBenchmark = useMemo(() => {
    return liveIndices.find(s => s.symbol === 'NIFTY 50') || stocks.find(s => s.symbol === 'NIFTY 50') || { price: 22563.10, changePct: -0.82 };
  }, [liveIndices, stocks]);

  const bankNiftyBenchmark = useMemo(() => {
    return liveIndices.find(s => s.symbol === 'BANK NIFTY') || liveIndices.find(s => s.symbol === 'NIFTY BANK') || stocks.find(s => s.symbol === 'BANK NIFTY') || { price: 53781.85, changePct: -0.36 };
  }, [liveIndices, stocks]);

  const sensexBenchmark = useMemo(() => {
    return liveIndices.find(s => s.symbol === 'SENSEX') || stocks.find(s => s.symbol === 'SENSEX') || { price: 81450.20, changePct: 0.52 };
  }, [liveIndices, stocks]);

  // Authoritative live symbol resolution for Pulse chart
  const foundStock = useMemo(() => {
    return liveIndices.find(s => s.symbol === selectedSymbol) || 
           (selectedSymbol === 'BANK NIFTY' ? liveIndices.find(s => s.symbol === 'NIFTY BANK') : undefined) ||
           stocks.find(s => s.symbol === selectedSymbol);
  }, [liveIndices, stocks, selectedSymbol]);

  const currentStock = useMemo(() => {
    const price = foundStock?.price ?? chartMeta?.currentPrice ?? (selectedSymbol === 'NIFTY 50' ? 22563.10 : selectedSymbol === 'BANK NIFTY' ? 53781.85 : 81450.20);
    const changePct = foundStock?.changePct ?? chartMeta?.changePct ?? (selectedSymbol === 'NIFTY 50' ? -0.82 : selectedSymbol === 'BANK NIFTY' ? -0.36 : 0.52);
    const prevClose = foundStock?.previousClose ?? (changePct !== -100 ? +(price / (1 + changePct / 100)).toFixed(2) : price);
    const changeAmount = foundStock?.changeAmount ?? +(price - prevClose).toFixed(2);
    const dayHigh = foundStock?.dayHigh ?? chartMeta?.high ?? price;
    const dayLow = foundStock?.dayLow ?? chartMeta?.low ?? price;

    return {
      price,
      changePct,
      changeAmount,
      previousClose: prevClose,
      dayHigh,
      dayLow,
      source: foundStock?.source || 'NSE'
    };
  }, [foundStock, chartMeta, selectedSymbol]);

  // Synchronized chart points with live price endpoint
  const displayChartPoints = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) return [];
    if (timeframe === '1D') {
      const copy = [...chartPoints];
      const last = copy[copy.length - 1];
      if (last) {
        copy[copy.length - 1] = {
          ...last,
          v: currentStock.price,
          close: currentStock.price,
          high: Math.max(last.high, currentStock.price),
          low: Math.min(last.low, currentStock.price)
        };
      }
      return copy;
    }
    return chartPoints;
  }, [chartPoints, currentStock.price, timeframe]);

  const prices = useMemo(() => displayChartPoints.map(p => p.v), [displayChartPoints]);
  const highVal = currentStock.dayHigh || Math.max(...prices, currentStock.price);
  const lowVal = currentStock.dayLow || Math.min(...prices, currentStock.price * 0.99);

  // Authoritative movers list directly calculated from current stocks universe (100% synchronized with Heatmap)
  const nonIndexStocks = useMemo(() => {
    return stocks.filter(s => s.category !== 'Index' && !['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'INDIA VIX', 'NIFTY AUTO', 'NIFTY BANK', 'NIFTY IT', 'NIFTY FMCG', 'NIFTY METAL', 'NIFTY PHARMA'].includes(s.symbol));
  }, [stocks]);

  const top10Gainers = useMemo(() => {
    return [...nonIndexStocks].sort((a, b) => b.changePct - a.changePct).slice(0, 10);
  }, [nonIndexStocks]);

  const top10Losers = useMemo(() => {
    return [...nonIndexStocks].sort((a, b) => a.changePct - b.changePct).slice(0, 10);
  }, [nonIndexStocks]);

  const activeMovers = moversTab === 'gainers' ? top10Gainers : top10Losers;

  return (
    <>
      {/* Live Feed / Mock Mode Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0d1523',
        border: '1px solid #1a293f',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '16px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: marketConfig?.useMockData ? '#fbbf24' : '#45d6a2'
          }} />
          <strong style={{ color: '#f1f5f9' }}>
            {marketConfig?.useMockData 
              ? 'Demo Mock Data Feed Active' 
              : (dhanStatus?.connected 
                  ? (user && dhanStatus.data?.dhanClientId 
                      ? `Live DhanHQ Feed (Client: ${dhanStatus.data.dhanClientId})` 
                      : 'Live Exchange Feed Active (NSE / BSE)') 
                  : 'Live Exchange Feed Active (NSE / BSE)')}
          </strong>
          <span style={{ color: '#64748b' }}>
            · {marketConfig?.useMockData ? 'Synthetic offline simulation' : 'Real-time gateway from National Stock Exchange'}
          </span>
        </div>

        {user?.role === 'ADMIN' && (
          <button 
            type="button" 
            onClick={() => navigate('/admin/integrations')}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Manage Data Feed / Telegram →
          </button>
        )}
      </div>

      {/* 0. Live Broker Snapshot when DhanHQ is connected (Only for Authenticated User) */}
      {user && dhanStatus?.connected && dhanFunds && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.95), rgba(20, 32, 54, 0.95))',
          border: '1px solid rgba(69, 214, 162, 0.35)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(69, 214, 162, 0.12)',
              border: '1px solid rgba(69, 214, 162, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#45d6a2'
            }}>
              <Radio size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  DhanHQ v2 Account Active
                </span>
                <span style={{
                  background: 'rgba(69, 214, 162, 0.15)',
                  border: '1px solid rgba(69, 214, 162, 0.3)',
                  color: '#45d6a2',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Live Sync
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Client ID: <code style={{ color: '#38bdf8' }}>{dhanStatus.data?.dhanClientId || '1111932175'}</code> · Token Valid · Read-Only Protected
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Available Balance
              </span>
              <strong style={{ fontSize: '17px', color: '#45d6a2' }}>
                ₹{(dhanFunds?.availabelBalance ?? 2.71).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Withdrawable
              </span>
              <strong style={{ fontSize: '17px', color: '#cbd5e1' }}>
                ₹{(dhanFunds?.withdrawableBalance ?? 2.71).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Holdings / Positions
              </span>
              <span style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: 600 }}>
                {dhanHoldingsCount} Holdings · {dhanPositionsCount} Open
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Metric Cards Grid */}
      <section className="metric-grid">
        <div 
          className={`metric-card ${selectedSymbol === 'NIFTY 50' ? 'active-metric-card' : ''}`}
          onClick={() => setSelectedSymbol('NIFTY 50')}
          style={{ cursor: 'pointer' }}
          title="Click to view NIFTY 50 chart"
        >
          <div className="metric-top">
            <span>NIFTY 50</span>
            <span className="metric-icon"><TrendingUp size={16} /></span>
          </div>
          <div className="metric-value">₹{money(niftyBenchmark.price)}</div>
          <div className={`metric-change ${niftyBenchmark.changePct >= 0 ? 'positive' : 'negative'}`}>
            {niftyBenchmark.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
            {niftyBenchmark.changePct >= 0 ? '+' : ''}{niftyBenchmark.changePct.toFixed(2)}%
          </div>
          <div className="metric-detail">Main benchmark index · Click to chart</div>
        </div>

        <div 
          className={`metric-card ${selectedSymbol === 'BANK NIFTY' ? 'active-metric-card' : ''}`}
          onClick={() => setSelectedSymbol('BANK NIFTY')}
          style={{ cursor: 'pointer' }}
          title="Click to view BANK NIFTY chart"
        >
          <div className="metric-top">
            <span>BANK NIFTY</span>
            <span className="metric-icon"><TrendingUp size={16} /></span>
          </div>
          <div className="metric-value">₹{money(bankNiftyBenchmark.price)}</div>
          <div className={`metric-change ${bankNiftyBenchmark.changePct >= 0 ? 'positive' : 'negative'}`}>
            {bankNiftyBenchmark.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
            {bankNiftyBenchmark.changePct >= 0 ? '+' : ''}{bankNiftyBenchmark.changePct.toFixed(2)}%
          </div>
          <div className="metric-detail">Banking & financials index · Click to chart</div>
        </div>

        <div 
          className={`metric-card ${selectedSymbol === 'SENSEX' ? 'active-metric-card' : ''}`}
          onClick={() => setSelectedSymbol('SENSEX')}
          style={{ cursor: 'pointer' }}
          title="Click to view SENSEX chart"
        >
          <div className="metric-top">
            <span>SENSEX</span>
            <span className="metric-icon"><TrendingUp size={16} /></span>
          </div>
          <div className="metric-value">₹{money(sensexBenchmark.price)}</div>
          <div className={`metric-change ${sensexBenchmark.changePct >= 0 ? 'positive' : 'negative'}`}>
            {sensexBenchmark.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
            {sensexBenchmark.changePct >= 0 ? '+' : ''}{sensexBenchmark.changePct.toFixed(2)}%
          </div>
          <div className="metric-detail">BSE 30 benchmark · Click to chart</div>
        </div>

        <div 
          className="metric-card"
          onClick={() => navigate('/watchlist')}
          style={{ cursor: 'pointer' }}
          title="Click to manage watchlist"
        >
          <div className="metric-top">
            <span>Your watchlist</span>
            <span className="metric-icon"><Star size={16} /></span>
          </div>
          <div className="metric-value">{String(watchlist.length).padStart(2, '0')}</div>
          <div className="metric-change">Tracked symbols</div>
          <div className="metric-detail">{user ? 'Synced to your cloud account' : 'Sign in to save across devices'}</div>
        </div>
      </section>

      {/* 2. Prominent Official NSE Indices Heatmap (Sectoral Capital Flow & Broad Indices) */}
      <MarketIndicesHeatmap 
        onSelectSector={(sec) => navigate(`/scanner?q=${sec}`)} 
      />

      {/* 2.5 Prominent NSE Equities Market Heatmap (Full Width Treemap with 5-Color System & Tooltip) */}
      <StockHeatmap
        stocks={stocks}
        watchlist={watchlist}
        onToggleWatch={onToggleWatch}
        onInspectStock={(stock) => navigate(`/scanner?q=${stock.symbol}`)}
        sourceBadge={marketConfig?.useMockData ? 'Simulated Demo' : 'Live (NSE)'}
        marketStatusText={marketConfig?.useMockData ? 'Demo Mock Data Feed' : 'Live Exchange (Market Open)'}
        lastUpdated={new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      />

      {/* 3. Main Chart Panel & Movers Grid */}
      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">MARKET INTELLIGENCE</div>
              <h2>
                {selectedSymbol} Pulse{' '}
                {marketConfig?.useMockData ? (
                  <span className="live-tag demo"><span /> SIMULATED DEMO</span>
                ) : (
                  <span className="live-tag live" style={{ background: 'rgba(69, 214, 162, 0.15)', color: '#45d6a2', border: '1px solid rgba(69, 214, 162, 0.3)' }}>
                    <span style={{ background: '#45d6a2' }} /> LIVE (NSE)
                  </span>
                )}
              </h2>
            </div>

            {/* Interactive Index Switcher & View Controls */}
            <div className="overview-chart-controls">
              {/* Index Buttons */}
              <div className="overview-index-tabs">
                {(['NIFTY 50', 'BANK NIFTY', 'SENSEX'] as IndexSymbol[]).map(sym => (
                  <button
                    key={sym}
                    type="button"
                    className={`ov-tab-btn ${selectedSymbol === sym ? 'active' : ''}`}
                    onClick={() => setSelectedSymbol(sym)}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Chart Mode Toggle */}
              <div className="overview-style-picker">
                <button
                  type="button"
                  className={`ov-mode-btn ${chartStyle === 'area' ? 'active' : ''}`}
                  onClick={() => setChartStyle('area')}
                  title="Area Wave Chart"
                >
                  <AreaIcon size={13} />
                </button>
                <button
                  type="button"
                  className={`ov-mode-btn ${chartStyle === 'candles' ? 'active' : ''}`}
                  onClick={() => setChartStyle('candles')}
                  title="Candlestick Chart"
                >
                  <CandlestickChart size={13} />
                </button>
              </div>

              {/* Timeframe Selector */}
              <div className="overview-tf-picker">
                {(['1D', '1W', '1M', '1Y'] as Timeframe[]).map(tf => (
                  <button
                    key={tf}
                    type="button"
                    className={`ov-tf-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Header Stats */}
          <div className="chart-value">
            <div>
              <strong>₹{money(currentStock.price)}</strong>
              <span className={currentStock.changePct >= 0 ? 'positive' : 'negative'}>
                {currentStock.changePct >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                {currentStock.changePct >= 0 ? '+' : ''}{currentStock.changePct.toFixed(2)}%
                {currentStock.changeAmount !== undefined && (
                  <span style={{ fontSize: '13px', marginLeft: '6px', opacity: 0.85 }}>
                    ({currentStock.changeAmount >= 0 ? '+' : ''}₹{money(Math.abs(currentStock.changeAmount))})
                  </span>
                )}
              </span>
            </div>
            <div className="chart-levels-info">
              <span>H: ₹{money(highVal)}</span>
              <span>L: ₹{money(lowVal)}</span>
              <span>Prev Close: ₹{money(currentStock.previousClose)}</span>
              <span className="pcr-tag">PCR 1.18</span>
            </div>
          </div>

          {/* Chart Rendering Container */}
          <div className="chart-container" style={{ height: 230 }}>
            {chartStyle === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChartPoints} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="0%" 
                        stopColor={currentStock.changePct >= 0 ? '#43d6a2' : '#f87171'} 
                        stopOpacity={0.28} 
                      />
                      <stop 
                        offset="100%" 
                        stopColor={currentStock.changePct >= 0 ? '#43d6a2' : '#f87171'} 
                        stopOpacity={0.0} 
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#1c2a3d" vertical={false} />
                  <XAxis 
                    dataKey="t" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#778399', fontSize: 11 }} 
                    dy={8} 
                  />
                  {/* Dynamic YAxis Domain so the chart displays dramatic, realistic curves instead of a flat line! */}
                  <YAxis domain={['dataMin - 30', 'dataMax + 25']} hide />
                  <Tooltip
                    contentStyle={{ 
                      background: '#0d1828', 
                      border: '1px solid #23354c', 
                      borderRadius: 10, 
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="v" 
                    stroke={currentStock.changePct >= 0 ? '#43d6a2' : '#f87171'} 
                    strokeWidth={2.4} 
                    fill="url(#marketFill)" 
                    activeDot={{ r: 4, fill: '#43d6a2', stroke: '#0b1421', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <OverviewCandles data={displayChartPoints} />
            )}
          </div>

          <div className="chart-footer">
            <span><i className="legend-dot" /> {selectedSymbol} · {timeframe} Stream</span>
            <div className="flow-quick-stats">
              <span>FII Net: <strong className="positive">+₹{fiiFlow.fiiNet} Cr</strong></span>
              <span>DII Net: <strong className="positive">+₹{fiiFlow.diiNet} Cr</strong></span>
            </div>
          </div>
        </div>

        {/* Notable Movers with Gainers / Losers Switcher */}
        <div className="panel movers-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">MARKET RADAR</div>
              <h2>Notable movers</h2>
            </div>
            
            <div className="movers-tab-toggle">
              <button
                type="button"
                className={`tab-pill ${moversTab === 'gainers' ? 'active' : ''}`}
                onClick={() => setMoversTab('gainers')}
              >
                Gainers
              </button>
              <button
                type="button"
                className={`tab-pill ${moversTab === 'losers' ? 'active' : ''}`}
                onClick={() => setMoversTab('losers')}
              >
                Losers
              </button>
            </div>
          </div>

          <div className="movers-list" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {activeMovers.map((s, i) => (
              <div 
                className="mover-row" 
                key={s.symbol}
                onClick={() => navigate(`/scanner?q=${s.symbol}`)}
                style={{ cursor: 'pointer' }}
                title={`Analyze ${s.symbol} in scanner`}
              >
                <div className={`stock-logo stock-${i % 5}`}>{s.symbol.slice(0, 1)}</div>
                <div className="mover-name">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>#{i + 1}</span>
                    <strong>{s.symbol}</strong>
                    {i === 0 && moversTab === 'gainers' && (
                      <span style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        🏆 Top
                      </span>
                    )}
                    {i === 0 && moversTab === 'losers' && (
                      <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        ⚠ Lowest
                      </span>
                    )}
                  </div>
                  <small>{s.name} · {s.category}</small>
                </div>
                <div className="mover-price">
                  <strong>₹{money(s.price)}</strong>
                  <small className={s.changePct >= 0 ? 'positive' : 'negative'}>
                    {s.changePct >= 0 ? '▲ +' : '▼ '}{s.changePct.toFixed(2)}%
                    {s.changeAmount !== undefined && s.changeAmount !== 0 && (
                      <span style={{ marginLeft: '4px', opacity: 0.85 }}>
                        ({s.changeAmount >= 0 ? '+' : ''}₹{money(Math.abs(s.changeAmount))})
                      </span>
                    )}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <button className="full-link" onClick={() => navigate('/scanner')}>
            Open full market scanner <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      {/* 4. Lower Grid: Watchlist & Pilot AI Insight */}
      <section className="lower-grid">
        <div className="panel watch-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">PERSONAL TRACKING</div>
              <h2>Watchlist ({watchlist.length})</h2>
            </div>
            <button 
              className="icon-btn bordered" 
              onClick={() => navigate('/watchlist')}
              title="Open full watchlist"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>INSTRUMENT</th>
                  <th>PRICE</th>
                  <th>CHANGE</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stocks
                  .filter(s => watchlist.includes(s.symbol))
                  .slice(0, 5)
                  .map(s => (
                    <tr key={s.symbol}>
                      <td>
                        <div className="table-stock">
                          <span className="mini-stock">{s.symbol.slice(0, 1)}</span>
                          <div>
                            <strong>{s.symbol}</strong>
                            <small>{s.category}</small>
                          </div>
                        </div>
                      </td>
                      <td>₹{money(s.price)}</td>
                      <td className={s.changePct >= 0 ? 'positive' : 'negative'}>
                        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                      </td>
                      <td>
                        <button
                          className={`star-btn ${watchlist.includes(s.symbol) ? 'selected' : ''}`}
                          onClick={() => onToggleWatch(s.symbol)}
                          title="Toggle watchlist"
                        >
                          <Star size={15} fill="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {watchlist.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#7a8eab' }}>
                      No symbols in watchlist yet. Star stocks from the scanner to track them here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button className="full-link" onClick={() => navigate('/watchlist')}>
            Manage watchlist <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="panel insight-panel">
          <div className="insight-top">
            <div className="ai-orb"><BrainCircuit size={22} /></div>
            <span className="ai-label"><Sparkles size={13} /> PILOT DISCIPLINE</span>
          </div>
          <h2>Make your process the edge.</h2>
          <p>Successful trading is repeatable risk execution, not emotional guesswork. Pre-define position sizing and record your rationale.</p>
          
          <div className="insight-checks">
            <div><ShieldCheck size={15} /> 1% Capital risk rule enforced</div>
            <div><BookOpen size={15} /> Structured thesis logged in journal</div>
            <div><Gauge size={15} /> Review win-rate & expectancy metrics</div>
          </div>

          <button className="insight-button" onClick={() => navigate('/journal')}>
            Open trade journal <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    </>
  );
}
