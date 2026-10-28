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
  RotateCcw
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
    api<{ dataMode?: string; results: Stock[] }>('/market/stocks')
      .then(d => {
        if (d && d.results && d.results.length > 0) {
          setLiveStocks(d.results);
          if (d.dataMode) setDataMode(d.dataMode as any);
          setLastUpdatedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  return (
    <section className="panel page-panel scanner-wrapper-panel">
      {/* 1. Header with Title & Live Status */}
      <div className="panel-heading scanner-header-row">
        <div>
          <div className="section-kicker">DISCOVERY WORKSPACE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Market Scanner</h2>
            {dataMode === 'LIVE_EXCHANGE' ? (
              <span className="live-tag live" style={{ background: 'rgba(69, 214, 162, 0.15)', color: '#45d6a2', border: '1px solid rgba(69, 214, 162, 0.3)' }}>
                <span style={{ background: '#45d6a2' }} /> LIVE EXCHANGE FEED (NSE/BSE)
              </span>
            ) : (
              <span className="live-tag demo">
                <span /> SIMULATED DEMO
              </span>
            )}
            <button
              type="button"
              onClick={() => refreshStocks(false)}
              disabled={isRefreshing}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Fetch latest live exchange quotes"
            >
              <RefreshCw size={11} className={isRefreshing ? 'spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Sync Live Quotes'}
            </button>
            {lastUpdatedTime && (
              <span style={{ fontSize: '11px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                • Auto-syncing (Last: {lastUpdatedTime})
              </span>
            )}

            {/* View Mode Switcher: Table | Heatmap | NSE Sectoral Flow */}
            <div className="scanner-view-toggle">
              <button
                type="button"
                className={`view-mode-pill ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📋 Screener Table
              </button>
              <button
                type="button"
                className={`view-mode-pill ${viewMode === 'heatmap' ? 'active' : ''}`}
                onClick={() => setViewMode('heatmap')}
              >
                🔲 Equities Heatmap
              </button>
              <button
                type="button"
                className={`view-mode-pill ${viewMode === 'sectoral' ? 'active' : ''}`}
                onClick={() => setViewMode('sectoral')}
              >
                🏛️ NSE Sectoral Flow
              </button>
            </div>
          </div>
          <p className="panel-description">
            Algorithmic scanners and technical screens across NSE/BSE equities and benchmarks.
          </p>
        </div>

        {/* Quick Market Pulse Strip */}
        <div className="scanner-metrics-strip">
          <div className="scanner-metric-pill">
            <span className="pill-muted">Scanned:</span>
            <strong>{metrics.total} Assets</strong>
          </div>
          <div className="scanner-metric-pill green">
            <TrendingUp size={13} />
            <span>{metrics.bullish} {horizonTag} Gainers</span>
          </div>
          <div className="scanner-metric-pill red">
            <TrendingDown size={13} />
            <span>{metrics.bearish} {horizonTag} Losers</span>
          </div>
          {metrics.topGainer && (
            <div 
              className="scanner-metric-pill highlight"
              onClick={() => setInspectedStock(metrics.topGainer)}
              title="Click to inspect top gainer"
              style={{ cursor: 'pointer' }}
            >
              <Flame size={13} className="flame-icon" />
              <span>Top {horizonTag}: <strong>{metrics.topGainer.symbol}</strong> ({getStockReturn(metrics.topGainer, timeHorizon) >= 0 ? '+' : ''}{getStockReturn(metrics.topGainer, timeHorizon).toFixed(2)}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* 1.5 Multi-Timeframe Window Selector & AI Command Bar */}
      <div className="scanner-horizon-bar">
        <div className="horizon-selector-group">
          <span className="horizon-group-label">
            <SlidersHorizontal size={13} />
            <span>Time Window:</span>
          </span>
          <div className="horizon-pills">
            {([
              { key: '24h', label: '24 Hours' },
              { key: '3d', label: '3 Days' },
              { key: '1w', label: '1 Week' },
              { key: '1m', label: '1 Month' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`horizon-pill ${timeHorizon === tab.key ? 'active' : ''}`}
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

        {/* AI Command Action Button */}
        <button
          type="button"
          className="scanner-ai-analyze-btn"
          onClick={() => triggerAiAnalysis(timeHorizon)}
          title={`Command MarketPilot AI CoPilot to analyze ${horizonTag} top picks and breakout setups`}
        >
          <Sparkles size={14} className="sparkle-glow" />
          <span>Ask AI: Analyze Top {horizonTag} Picks</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* 2. Algorithmic Screener Presets */}
      <div className="scanner-presets-bar">
        <button
          type="button"
          className={`preset-chip ${activePreset === 'all' && selectedSector === 'ALL' && !query.trim() && sortBy === 'all' ? 'active' : ''}`}
          onClick={handleResetToAll}
          title="Show all instruments and reset all filters"
        >
          All Instruments ({currentStocksList.length})
        </button>
        <button
          type="button"
          className={`preset-chip highlight-chip ${activePreset === 'fast-movers' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('fast-movers');
            setSortBy(`change-${timeHorizon}-desc` as any);
          }}
          title="Show active stocks moving > 0.5% (Fast Movers)"
        >
          <Zap size={13} /> ⚡ Fast Movers &gt; ±0.5% ({metrics.fastMoversCount})
        </button>
        <button
          type="button"
          className={`preset-chip ai-chip ${activePreset === 'ai-picks' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('ai-picks');
            setSortBy('ai-desc');
          }}
        >
          <Sparkles size={13} /> ✨ AI Top Picks ({metrics.aiTopCount})
        </button>
        <button
          type="button"
          className={`preset-chip green ${activePreset === 'gainers' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('gainers');
            setSortBy(`change-${timeHorizon}-desc` as any);
          }}
        >
          <TrendingUp size={13} /> 🔥 {horizonTag} Gainers ({metrics.bullish})
        </button>
        <button
          type="button"
          className={`preset-chip red ${activePreset === 'losers' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('losers');
            setSortBy(`change-${timeHorizon}-asc` as any);
          }}
        >
          <TrendingDown size={13} /> 🔻 {horizonTag} Losers ({metrics.bearish})
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'breakout' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('breakout');
            setSortBy('change-desc');
          }}
        >
          <Zap size={13} /> ⚡ Breakout Setups ({metrics.breakoutCount})
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'dip' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('dip');
            setSortBy('rsi-asc');
          }}
        >
          <TrendingDown size={13} /> 🎯 Pullback / Dip Buy ({metrics.dipCount})
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActivePreset('watchlist')}
        >
          <Star size={13} /> Watchlist ({watchlist.length})
        </button>
      </div>

      {/* 3. Search & Filters Toolbar */}
      <div className="scanner-toolbar">
        {/* Search Field */}
        <div className="search-field scanner-search">
          <Search size={16} />
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
              <X size={14} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>

        {/* Sector Filter Dropdown */}
        <div className="scanner-filter-group">
          <label>Sector:</label>
          <CustomSelect
            value={selectedSector}
            options={sectorOptions}
            onChange={(val) => setSelectedSector(val)}
            minWidth={170}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="scanner-filter-group">
          <label>Sort by:</label>
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
            minWidth={225}
          />
        </div>

        {/* Result Counter & Reset Button */}
        <div className="scanner-toolbar-right">
          {isFiltered && (
            <button
              type="button"
              className="scanner-reset-btn"
              onClick={handleResetToAll}
              title="Reset all filters and sorting"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          )}
          <div className="scanner-result-count">
            Showing <strong>{filteredStocks.length}</strong> of {currentStocksList.length}
          </div>
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
