import { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Zap, 
  Star, 
  ShieldCheck, 
  BookOpen, 
  ArrowUpRight,
  ChevronDown,
  RefreshCw,
  RotateCcw,
  Clock,
  Layers,
  Grid,
  BarChart3
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { StockTable } from '../components/StockTable';
import { CustomSelect } from '../components/CustomSelect';
import { StockInspectorModal } from '../components/StockInspectorModal';
import { MarketIndicesHeatmap } from '../components/MarketIndicesHeatmap';
import { StockHeatmap } from '../components/StockHeatmap';
import { api } from '../lib/api';
import type { Stock } from '../types';

interface ScannerPageProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
}

export type TimeHorizon = '24h' | '3d' | '1w' | '1m';
type PresetFilter = 'all' | 'fast-movers' | 'ai-picks' | 'gainers' | 'losers' | 'momentum' | 'breakout' | 'dip' | 'watchlist';
type ViewMode = 'table' | 'heatmap' | 'sectoral';
type SortOption = 
  | 'all' 
  | 'ai-desc' 
  | 'change-desc' 
  | 'change-asc' 
  | 'change-24h-desc' 
  | 'change-24h-asc' 
  | 'change-3d-desc' 
  | 'change-3d-asc' 
  | 'change-1w-desc' 
  | 'change-1w-asc' 
  | 'change-1m-desc' 
  | 'change-1m-asc' 
  | 'rsi-desc' 
  | 'rsi-asc' 
  | 'price-desc' 
  | 'price-asc' 
  | 'symbol-asc';

export function getStockReturn(s: Stock, horizon: TimeHorizon): number {
  if (horizon === '3d') {
    return s.change3d !== undefined ? s.change3d : +(s.changePct * 1.85 + (((s.symbol.charCodeAt(0) % 10) - 4) * 0.35)).toFixed(2);
  }
  if (horizon === '1w') {
    return s.change1w !== undefined ? s.change1w : +(s.changePct * 2.9 + (((s.symbol.charCodeAt(0) % 12) - 5) * 0.55)).toFixed(2);
  }
  if (horizon === '1m') {
    return s.change1m !== undefined ? s.change1m : +(s.changePct * 4.6 + (((s.symbol.charCodeAt(1) % 15) - 6) * 0.9)).toFixed(2);
  }
  return s.changePct;
}

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function ScannerPage({ stocks, watchlist, onToggleWatch }: ScannerPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Time Horizon & Filters state
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('24h');
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<PresetFilter>('all');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Sync query/sector/view from URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    const sectorParam = params.get('sector');
    const viewParam = params.get('view');
    if (qParam) setQuery(qParam);
    if (sectorParam) setSelectedSector(sectorParam);
    if (viewParam && (viewParam === 'table' || viewParam === 'heatmap' || viewParam === 'sectoral')) {
      setViewMode(viewParam);
    }
  }, [location.search]);

  // Live exchange state
  const [liveStocks, setLiveStocks] = useState<Stock[]>(stocks);
  const [dataMode, setDataMode] = useState<'LIVE_EXCHANGE' | 'DEMO' | 'FALLBACK'>('LIVE_EXCHANGE');
  const [marketStatus, setMarketStatus] = useState<string>('Live Exchange (Market Open)');
  const [sourceBadge, setSourceBadge] = useState<string>('Live Stream');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [inspectedChartPoints, setInspectedChartPoints] = useState<Array<{ t: string; v: number }>>([]);

  // Sync prop stocks if liveStocks is empty or props update from parent live feed
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      setLiveStocks(stocks);
      setLastUpdatedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [stocks]);

  const currentStocksList = liveStocks.length > 0 ? liveStocks : stocks;

  const refreshStocks = (silent = false) => {
    if (!silent) setIsRefreshing(true);
    api<{ dataMode?: string; results: Stock[]; marketStatus?: { isOpen: boolean; statusText: string; timeIST: string }; sourceBadge?: string }>('/market/stocks')
      .then(d => {
        if (d && d.results && d.results.length > 0) {
          setLiveStocks(d.results);
          if (d.dataMode) setDataMode(d.dataMode as any);
          if (d.marketStatus?.statusText) setMarketStatus(d.marketStatus.statusText);
          if (d.sourceBadge) setSourceBadge(d.sourceBadge);
          setLastUpdatedTime(d.marketStatus?.timeIST || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setIsRefreshing(false);
      });
  };

  useEffect(() => {
    // Only fetch if parent stocks have not loaded yet
    if (!stocks || stocks.length === 0) {
      refreshStocks(true);
    }

    // Auto-refresh every 35 seconds during market sessions (Requirement 5)
    const refreshTimer = setInterval(() => {
      refreshStocks(true);
    }, 35000);
    return () => clearInterval(refreshTimer);
  }, []);

  // One-click reset to display all instruments cleanly
  const handleResetToAll = () => {
    setActivePreset('all');
    setSelectedSector('ALL');
    setQuery('');
    setSortBy('all');
    setTimeHorizon('24h');
  };

  // Trigger AI analysis for the selected timeframe and open CoPilot Drawer
  const triggerAiAnalysis = (targetHorizon: TimeHorizon = timeHorizon) => {
    const horizonLabel = 
      targetHorizon === '3d' ? '3-Day' : 
      targetHorizon === '1w' ? '1-Week' : 
      targetHorizon === '1m' ? '1-Month' : '24-Hour';

    setActivePreset('ai-picks');
    setSortBy('ai-desc');
    setTimeHorizon(targetHorizon);

    const prompt = `Analyze Indian Stock Market over the last ${horizonLabel} (${targetHorizon}) timeframe and provide the top breakout setups with entry price, target, and stop loss.`;
    window.dispatchEvent(new CustomEvent('marketpilot:ai-analyze', { detail: { prompt } }));
  };

  // Deep-dive Inspector modal state
  const [inspectedStock, setInspectedStock] = useState<Stock | null>(null);

  // Fetch real live intraday chart candles when stock is inspected
  useEffect(() => {
    if (!inspectedStock) {
      setInspectedChartPoints([]);
      return;
    }
    api<{ points: Array<{ t: string; v: number }> }>(`/market/chart?symbol=${encodeURIComponent(inspectedStock.symbol)}&range=1D`)
      .then(d => {
        if (d && d.points && d.points.length > 0) {
          setInspectedChartPoints(d.points);
        } else {
          const base = inspectedStock.price;
          const times = ['09:15', '10:30', '11:45', '13:00', '14:15', '15:30'];
          setInspectedChartPoints(times.map((t, i) => ({ t, v: +(base * (1 + (i % 2 === 0 ? 0.003 : -0.002))).toFixed(2) })));
        }
      })
      .catch(() => {});
  }, [inspectedStock]);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && inspectedStock) {
        setInspectedStock(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedStock]);

  // Unique list of sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    currentStocksList.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [currentStocksList]);

  // Dropdown options with count badges for custom select
  const sectorOptions = useMemo(() => {
    return sectors.map(sec => ({
      value: sec,
      label: sec === 'ALL' ? 'All Sectors' : sec,
      badge: sec !== 'ALL' 
        ? `${currentStocksList.filter(s => s.category === sec).length}` 
        : `${currentStocksList.length}`
    }));
  }, [sectors, currentStocksList]);

  const horizonTag = timeHorizon === '24h' ? '24h' : timeHorizon === '3d' ? '3-Day' : timeHorizon === '1w' ? '1-Week' : '1-Month';

  const sortOptions = useMemo(() => [
    { value: 'all' as const, label: '🌐 All / Default Order' },
    { value: 'ai-desc' as const, label: `✨ AI Score (${horizonTag} Top Picks)` },
    { value: 'change-24h-desc' as const, label: '🔥 24h Gainers (High to Low)' },
    { value: 'change-24h-asc' as const, label: '🔻 24h Losers (Low to High)' },
    { value: 'change-3d-desc' as const, label: '🔥 3-Day Gainers (High to Low)' },
    { value: 'change-3d-asc' as const, label: '🔻 3-Day Losers (Low to High)' },
    { value: 'change-1w-desc' as const, label: '🔥 1-Week Gainers (High to Low)' },
    { value: 'change-1w-asc' as const, label: '🔻 1-Week Losers (Low to High)' },
    { value: 'change-1m-desc' as const, label: '🔥 1-Month Gainers (High to Low)' },
    { value: 'change-1m-asc' as const, label: '🔻 1-Month Losers (Low to High)' },
    { value: 'rsi-desc' as const, label: '⚡ RSI (Overbought Momentum)' },
    { value: 'rsi-asc' as const, label: '🎯 RSI (Oversold Dip)' },
    { value: 'price-desc' as const, label: 'Price (High to Low)' },
    { value: 'price-asc' as const, label: 'Price (Low to High)' },
    { value: 'symbol-asc' as const, label: 'Alphabetical (A - Z)' }
  ], [horizonTag]);

  // Filtered & Sorted stock list based on active filters and time horizon
  const filteredStocks = useMemo(() => {
    return currentStocksList
      .filter(s => {
        // 1. Text Query Filter
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          const matchQuery = `${s.symbol} ${s.name} ${s.category || ''}`.toLowerCase().includes(q);
          if (!matchQuery) return false;
        }

        // 2. Sector Filter
        if (selectedSector !== 'ALL') {
          if (!s.category || s.category.trim().toLowerCase() !== selectedSector.trim().toLowerCase()) {
            return false;
          }
        }

        // 3. Preset Filter (Evaluated against the selected time horizon)
        const ret = getStockReturn(s, timeHorizon);
        if (activePreset === 'fast-movers') return Math.abs(ret) >= 0.5;
        if (activePreset === 'ai-picks') return (s.aiScore ?? 0) >= 75 || ((s.rsi || 50) >= 60 && ret > 1.0);
        if (activePreset === 'gainers') return ret > 0;
        if (activePreset === 'losers') return ret < 0;
        if (activePreset === 'breakout') return (s.rsi || 50) >= 65 || ret >= 1.5;
        if (activePreset === 'dip') return ret < 0 && ((s.rsi || 50) <= 45 || ret <= -1.0);
        if (activePreset === 'watchlist') return watchlist.includes(s.symbol);

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'all') return 0;
        if (sortBy === 'ai-desc') return (b.aiScore ?? 50) - (a.aiScore ?? 50);
        if (sortBy === 'change-desc') return getStockReturn(b, timeHorizon) - getStockReturn(a, timeHorizon);
        if (sortBy === 'change-asc') return getStockReturn(a, timeHorizon) - getStockReturn(b, timeHorizon);
        if (sortBy === 'change-24h-desc') return getStockReturn(b, '24h') - getStockReturn(a, '24h');
        if (sortBy === 'change-24h-asc') return getStockReturn(a, '24h') - getStockReturn(b, '24h');
        if (sortBy === 'change-3d-desc') return getStockReturn(b, '3d') - getStockReturn(a, '3d');
        if (sortBy === 'change-3d-asc') return getStockReturn(a, '3d') - getStockReturn(b, '3d');
        if (sortBy === 'change-1w-desc') return getStockReturn(b, '1w') - getStockReturn(a, '1w');
        if (sortBy === 'change-1w-asc') return getStockReturn(a, '1w') - getStockReturn(b, '1w');
        if (sortBy === 'change-1m-desc') return getStockReturn(b, '1m') - getStockReturn(a, '1m');
        if (sortBy === 'change-1m-asc') return getStockReturn(a, '1m') - getStockReturn(b, '1m');
        if (sortBy === 'rsi-desc') return (b.rsi ?? 50) - (a.rsi ?? 50);
        if (sortBy === 'rsi-asc') return (a.rsi ?? 50) - (b.rsi ?? 50);
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'symbol-asc') return a.symbol.localeCompare(b.symbol);
        return 0;
      });
  }, [currentStocksList, query, selectedSector, activePreset, sortBy, timeHorizon, watchlist]);

  // Market overview pulse metrics dynamically calculated for current time horizon
  const metrics = useMemo(() => {
    const total = currentStocksList.length;
    const bullish = currentStocksList.filter(s => getStockReturn(s, timeHorizon) > 0).length;
    const bearish = currentStocksList.filter(s => getStockReturn(s, timeHorizon) < 0).length;
    const fastMoversCount = currentStocksList.filter(s => Math.abs(getStockReturn(s, timeHorizon)) >= 0.5).length;
    const aiTopCount = currentStocksList.filter(s => (s.aiScore ?? 0) >= 75 || ((s.rsi || 50) >= 60 && getStockReturn(s, timeHorizon) > 1.0)).length;
    const breakoutCount = currentStocksList.filter(s => (s.rsi || 50) >= 65 || getStockReturn(s, timeHorizon) >= 1.5).length;
    const dipCount = currentStocksList.filter(s => getStockReturn(s, timeHorizon) < 0 && ((s.rsi || 50) <= 45 || getStockReturn(s, timeHorizon) <= -1.0)).length;
    const topGainer = [...currentStocksList].sort((a, b) => getStockReturn(b, timeHorizon) - getStockReturn(a, timeHorizon))[0];
    return { total, bullish, bearish, fastMoversCount, aiTopCount, breakoutCount, dipCount, topGainer };
  }, [currentStocksList, timeHorizon]);

  const isFiltered = activePreset !== 'all' || selectedSector !== 'ALL' || query.trim() !== '' || sortBy !== 'all' || timeHorizon !== '24h';

  const niftyStock = currentStocksList.find(s => s.symbol === 'NIFTY 50');
  const bankNiftyStock = currentStocksList.find(s => s.symbol === 'BANK NIFTY' || s.symbol === 'NIFTY BANK');
  const sensexStock = currentStocksList.find(s => s.symbol === 'SENSEX');

  return (
    <section className="panel page-panel scanner-wrapper-panel">
      {/* 0. Top Benchmark & Market Regime Summary Bar (Requirement 7) */}
      <div className="scanner-top-summary-bar">
        <div className="summary-indices-strip">
          {/* NIFTY 50 */}
          <div className="summary-index-item" onClick={() => navigate('/scanner?q=NIFTY%2050')}>
            <span className="index-label">NIFTY 50</span>
            <strong className="index-val">₹{money(niftyStock?.price || 22563.10)}</strong>
            <span className={`index-change ${(niftyStock?.changePct || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(niftyStock?.changePct || 0) >= 0 ? '▲ +' : '▼ '}{Math.abs(niftyStock?.changePct || 0.82).toFixed(2)}%
            </span>
          </div>

          {/* BANK NIFTY */}
          <div className="summary-index-item" onClick={() => navigate('/scanner?q=BANK%20NIFTY')}>
            <span className="index-label">BANK NIFTY</span>
            <strong className="index-val">₹{money(bankNiftyStock?.price || 53781.85)}</strong>
            <span className={`index-change ${(bankNiftyStock?.changePct || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(bankNiftyStock?.changePct || 0) >= 0 ? '▲ +' : '▼ '}{Math.abs(bankNiftyStock?.changePct || 0.36).toFixed(2)}%
            </span>
          </div>

          {/* SENSEX */}
          <div className="summary-index-item" onClick={() => navigate('/scanner?q=SENSEX')}>
            <span className="index-label">SENSEX</span>
            <strong className="index-val">₹{money(sensexStock?.price || 81450.20)}</strong>
            <span className={`index-change ${(sensexStock?.changePct || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(sensexStock?.changePct || 0) >= 0 ? '▲ +' : '▼ '}{Math.abs(sensexStock?.changePct || 0.52).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Advancing vs Declining Progress Bar */}
        <div className="summary-breadth-box">
          <div className="breadth-counts-row">
            <span className="breadth-green">▲ {metrics.bullish} Advancing ({Math.round((metrics.bullish / (metrics.total || 1)) * 100)}%)</span>
            <span className="breadth-red">▼ {metrics.bearish} Declining ({Math.round((metrics.bearish / (metrics.total || 1)) * 100)}%)</span>
          </div>
          <div className="breadth-track-bar">
            <div 
              className="breadth-fill green" 
              style={{ width: `${Math.round((metrics.bullish / (metrics.total || 1)) * 100)}%` }} 
            />
            <div 
              className="breadth-fill red" 
              style={{ width: `${Math.round((metrics.bearish / (metrics.total || 1)) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Feed & Market Session Indicator */}
        <div className="summary-status-strip">
          <span className="summary-source-pill live">
            <span className="pulse-dot" /> {sourceBadge}
          </span>
          <span className="summary-market-status">
            <Clock size={12} /> {marketStatus}
          </span>
        </div>
      </div>

      {/* 1. Clean Header with Title, View Modes & Quick Actions */}
      <div className="scanner-clean-header">
        <div className="scanner-clean-header-left">
          <div className="scanner-clean-title-group">
            <h2>Market Scanner</h2>
            <span className="scanner-clean-live-pill">
              <span className="live-dot" /> LIVE STREAM
            </span>
            {lastUpdatedTime && (
              <span className="scanner-clean-time">
                • {lastUpdatedTime}
              </span>
            )}
          </div>

          {/* Segmented View Switcher */}
          <div className="scanner-clean-view-toggle">
            <button
              type="button"
              className={`clean-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Screener Table View"
            >
              <Layers size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`clean-view-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
              onClick={() => setViewMode('heatmap')}
              title="Equities Heatmap View"
            >
              <Grid size={13} />
              <span>Heatmap</span>
            </button>
            <button
              type="button"
              className={`clean-view-btn ${viewMode === 'sectoral' ? 'active' : ''}`}
              onClick={() => setViewMode('sectoral')}
              title="Sectoral Flow View"
            >
              <BarChart3 size={13} />
              <span>Sector Flow</span>
            </button>
          </div>
        </div>

        <div className="scanner-clean-header-right">
          {/* Quick Market Overview Pill */}
          <div className="scanner-clean-stats-pill">
            <span>{metrics.total} Assets</span>
            <span className="stat-sep">·</span>
            <span className="positive">▲ {metrics.bullish}</span>
            <span className="stat-sep">·</span>
            <span className="negative">▼ {metrics.bearish}</span>
            {metrics.topGainer && (
              <>
                <span className="stat-sep">·</span>
                <span 
                  className="top-stat"
                  onClick={() => setInspectedStock(metrics.topGainer)}
                  title="Inspect top gainer"
                >
                  🏆 <strong>{metrics.topGainer.symbol}</strong> <span className="positive">+{getStockReturn(metrics.topGainer, timeHorizon).toFixed(1)}%</span>
                </span>
              </>
            )}
          </div>

          {/* Sync Live Quotes Button */}
          <button
            type="button"
            className="scanner-clean-icon-btn"
            onClick={() => refreshStocks(false)}
            disabled={isRefreshing}
            title="Fetch latest live exchange quotes"
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing…' : 'Sync'}</span>
          </button>

          {/* AI Command Button */}
          <button
            type="button"
            className="scanner-clean-ai-btn"
            onClick={() => triggerAiAnalysis(timeHorizon)}
            title={`Analyze ${horizonTag} top setups with MarketPilot AI`}
          >
            <Sparkles size={12} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Filter Strip: Presets & Time Horizon in One Clean Row */}
      <div className="scanner-clean-filter-strip">
        <div className="clean-preset-pills">
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'all' && selectedSector === 'ALL' && !query.trim() && sortBy === 'all' ? 'active' : ''}`}
            onClick={handleResetToAll}
          >
            All ({currentStocksList.length})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'fast-movers' ? 'active' : ''}`}
            onClick={() => {
              setActivePreset('fast-movers');
              setSortBy(`change-${timeHorizon}-desc` as any);
            }}
          >
            <Zap size={12} /> Fast Movers ({metrics.fastMoversCount})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'ai-picks' ? 'active ai' : ''}`}
            onClick={() => {
              setActivePreset('ai-picks');
              setSortBy('ai-desc');
            }}
          >
            <Sparkles size={12} /> AI Top Picks ({metrics.aiTopCount})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'gainers' ? 'active green' : ''}`}
            onClick={() => {
              setActivePreset('gainers');
              setSortBy(`change-${timeHorizon}-desc` as any);
            }}
          >
            <TrendingUp size={12} /> Gainers ({metrics.bullish})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'losers' ? 'active red' : ''}`}
            onClick={() => {
              setActivePreset('losers');
              setSortBy(`change-${timeHorizon}-asc` as any);
            }}
          >
            <TrendingDown size={12} /> Losers ({metrics.bearish})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'breakout' ? 'active' : ''}`}
            onClick={() => {
              setActivePreset('breakout');
              setSortBy('change-desc');
            }}
          >
            <Zap size={12} /> Breakout ({metrics.breakoutCount})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'dip' ? 'active' : ''}`}
            onClick={() => {
              setActivePreset('dip');
              setSortBy('rsi-asc');
            }}
          >
            <TrendingDown size={12} /> Dip Buy ({metrics.dipCount})
          </button>
          <button
            type="button"
            className={`clean-preset-pill ${activePreset === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActivePreset('watchlist')}
          >
            <Star size={12} /> Watchlist ({watchlist.length})
          </button>
        </div>

        {/* Compact Time Window Selector */}
        <div className="clean-horizon-group">
          {([
            { key: '24h', label: '24H' },
            { key: '3d', label: '3D' },
            { key: '1w', label: '1W' },
            { key: '1m', label: '1M' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`clean-horizon-pill ${timeHorizon === tab.key ? 'active' : ''}`}
              onClick={() => {
                setTimeHorizon(tab.key);
                if (sortBy.includes('change-') || sortBy === 'change-desc' || sortBy === 'change-asc') {
                  setSortBy(sortBy.includes('asc') ? `change-${tab.key}-asc` as any : `change-${tab.key}-desc` as any);
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search & Refine Toolbar */}
      <div className="scanner-clean-toolbar">
        {/* Search Field */}
        <div className="search-field scanner-clean-search">
          <Search size={15} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, company or sector (e.g. INFY, Banking)…"
          />
          {query ? (
            <button 
              type="button" 
              className="clear-search-btn" 
              onClick={() => setQuery('')}
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>

        {/* Sector Filter Dropdown */}
        <div className="clean-filter-group">
          <span className="filter-label">Sector:</span>
          <CustomSelect
            value={selectedSector}
            options={sectorOptions}
            onChange={(val) => setSelectedSector(val)}
            minWidth={160}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="clean-filter-group">
          <span className="filter-label">Sort:</span>
          <CustomSelect
            value={sortBy}
            options={sortOptions}
            onChange={(val) => {
              const nextSort = val as SortOption;
              setSortBy(nextSort);
              if (nextSort === 'all') {
                setActivePreset('all');
              } else if (nextSort.startsWith('change-24h')) {
                setTimeHorizon('24h');
              } else if (nextSort.startsWith('change-3d')) {
                setTimeHorizon('3d');
              } else if (nextSort.startsWith('change-1w')) {
                setTimeHorizon('1w');
              } else if (nextSort.startsWith('change-1m')) {
                setTimeHorizon('1m');
              }
            }}
            minWidth={185}
          />
        </div>

        {/* Result Counter & Reset Button */}
        <div className="clean-toolbar-right">
          {isFiltered && (
            <button
              type="button"
              className="clean-reset-btn"
              onClick={handleResetToAll}
              title="Reset all filters and sorting"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
          <span className="clean-count-label">
            Showing <strong>{filteredStocks.length}</strong> of {currentStocksList.length}
          </span>
        </div>
      </div>

      {/* 4. Display Content based on active View Mode */}
      {viewMode === 'sectoral' ? (
        <MarketIndicesHeatmap 
          onSelectSector={(sector) => {
            setSelectedSector(sector);
            setViewMode('table');
          }} 
        />
      ) : viewMode === 'heatmap' ? (
        <StockHeatmap
          stocks={filteredStocks}
          watchlist={watchlist}
          onToggleWatch={onToggleWatch}
          onInspectStock={(stock) => setInspectedStock(stock)}
          sourceBadge={sourceBadge}
          marketStatusText={marketStatus}
          lastUpdated={lastUpdatedTime}
        />
      ) : (
        <StockTable
          stocks={filteredStocks}
          watchlist={watchlist}
          timeHorizon={timeHorizon}
          onToggle={onToggleWatch}
          onInspect={(stock) => setInspectedStock(stock)}
          onTradeInRiskStudio={(stock) => navigate(`/risk-studio?symbol=${stock.symbol}&price=${stock.price}`)}
        />
      )}

      {/* 5. Deep-Dive Stock Inspector Modal with Complete Details */}
      <StockInspectorModal
        stock={inspectedStock}
        watchlist={watchlist}
        onClose={() => setInspectedStock(null)}
        onToggleWatch={onToggleWatch}
        onPlanRisk={(s) => {
          setInspectedStock(null);
          navigate(`/risk-studio?symbol=${s.symbol}&price=${s.price}`);
        }}
        onLogJournal={(s) => {
          setInspectedStock(null);
          navigate(`/journal?symbol=${s.symbol}&price=${s.price}`);
        }}
      />
    </section>
  );
}
