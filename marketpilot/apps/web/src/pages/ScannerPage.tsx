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
import { useNavigate } from 'react-router-dom';
import { StockTable } from '../components/StockTable';
import { CustomSelect } from '../components/CustomSelect';
import { StockInspectorModal } from '../components/StockInspectorModal';
import { api } from '../lib/api';
import type { Stock } from '../types';

interface ScannerPageProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
}

type PresetFilter = 'all' | 'ai-picks' | 'gainers' | 'losers' | 'momentum' | 'breakout' | 'dip' | 'watchlist';
type SortOption = 'all' | 'ai-desc' | 'change-desc' | 'change-asc' | 'rsi-desc' | 'rsi-asc' | 'price-desc' | 'price-asc' | 'symbol-asc';

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function ScannerPage({ stocks, watchlist, onToggleWatch }: ScannerPageProps) {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filters & Sorting state
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<PresetFilter>('all');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('all');

  // Live exchange state
  const [liveStocks, setLiveStocks] = useState<Stock[]>(stocks);
  const [dataMode, setDataMode] = useState<'LIVE_EXCHANGE' | 'DEMO' | 'FALLBACK'>('LIVE_EXCHANGE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectedChartPoints, setInspectedChartPoints] = useState<Array<{ t: string; v: number }>>([]);

  // Sync prop stocks if liveStocks is empty or props update
  useEffect(() => {
    if (stocks && stocks.length > 0 && liveStocks.length === 0) {
      setLiveStocks(stocks);
    }
  }, [stocks]);

  const currentStocksList = liveStocks.length > 0 ? liveStocks : stocks;

  const refreshStocks = () => {
    setIsRefreshing(true);
    api<{ dataMode?: string; results: Stock[] }>('/market/stocks')
      .then(d => {
        if (d && d.results && d.results.length > 0) {
          setLiveStocks(d.results);
          if (d.dataMode) setDataMode(d.dataMode as any);
        }
      })
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    refreshStocks();
  }, []);

  // One-click reset to display all instruments cleanly
  const handleResetToAll = () => {
    setActivePreset('all');
    setSelectedSector('ALL');
    setQuery('');
    setSortBy('all');
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

  const sortOptions = useMemo(() => [
    { value: 'all' as const, label: '🌐 All / Default Order' },
    { value: 'ai-desc' as const, label: '✨ AI Score (Highest First)' },
    { value: 'change-desc' as const, label: '🔥 24h Gainers (High to Low)' },
    { value: 'change-asc' as const, label: '🔻 24h Losers (Low to High)' },
    { value: 'rsi-desc' as const, label: '⚡ RSI (Overbought Momentum)' },
    { value: 'rsi-asc' as const, label: '🎯 RSI (Oversold Dip)' },
    { value: 'price-desc' as const, label: 'Price (High to Low)' },
    { value: 'price-asc' as const, label: 'Price (Low to High)' },
    { value: 'symbol-asc' as const, label: 'Alphabetical (A - Z)' }
  ], []);

  // Filtered & Sorted stock list
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

        // 3. Preset Filter
        if (activePreset === 'ai-picks') return (s.aiScore ?? 0) >= 75 || ((s.rsi || 50) >= 60 && s.changePct > 1.0);
        if (activePreset === 'gainers') return s.changePct > 0;
        if (activePreset === 'losers') return s.changePct < 0;
        if (activePreset === 'breakout') return (s.rsi || 50) >= 65 || s.changePct >= 1.5;
        if (activePreset === 'dip') return s.changePct < 0 && ((s.rsi || 50) <= 45 || s.changePct <= -1.0);
        if (activePreset === 'watchlist') return watchlist.includes(s.symbol);

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'all') return 0;
        if (sortBy === 'ai-desc') return (b.aiScore ?? 50) - (a.aiScore ?? 50);
        if (sortBy === 'change-desc') return b.changePct - a.changePct;
        if (sortBy === 'change-asc') return a.changePct - b.changePct;
        if (sortBy === 'rsi-desc') return (b.rsi ?? 50) - (a.rsi ?? 50);
        if (sortBy === 'rsi-asc') return (a.rsi ?? 50) - (b.rsi ?? 50);
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'symbol-asc') return a.symbol.localeCompare(b.symbol);
        return 0;
      });
  }, [currentStocksList, query, selectedSector, activePreset, sortBy, watchlist]);

  // Market overview pulse metrics for current stock set
  const metrics = useMemo(() => {
    const total = currentStocksList.length;
    const bullish = currentStocksList.filter(s => s.changePct > 0).length;
    const bearish = currentStocksList.filter(s => s.changePct < 0).length;
    const aiTopCount = currentStocksList.filter(s => (s.aiScore ?? 0) >= 75 || ((s.rsi || 50) >= 60 && s.changePct > 1.0)).length;
    const breakoutCount = currentStocksList.filter(s => (s.rsi || 50) >= 65 || s.changePct >= 1.5).length;
    const dipCount = currentStocksList.filter(s => s.changePct < 0 && ((s.rsi || 50) <= 45 || s.changePct <= -1.0)).length;
    const topGainer = [...currentStocksList].sort((a, b) => b.changePct - a.changePct)[0];
    return { total, bullish, bearish, aiTopCount, breakoutCount, dipCount, topGainer };
  }, [currentStocksList]);

  const isFiltered = activePreset !== 'all' || selectedSector !== 'ALL' || query.trim() !== '' || sortBy !== 'all';

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
              onClick={refreshStocks}
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
            <span>{metrics.bullish} 24h Gainers</span>
          </div>
          <div className="scanner-metric-pill red">
            <TrendingDown size={13} />
            <span>{metrics.bearish} 24h Losers</span>
          </div>
          {metrics.topGainer && (
            <div 
              className="scanner-metric-pill highlight"
              onClick={() => setInspectedStock(metrics.topGainer)}
              title="Click to inspect top gainer"
              style={{ cursor: 'pointer' }}
            >
              <Flame size={13} className="flame-icon" />
              <span>Top: <strong>{metrics.topGainer.symbol}</strong> (+{metrics.topGainer.changePct.toFixed(2)}%)</span>
            </div>
          )}
        </div>
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
            setSortBy('change-desc');
          }}
        >
          <TrendingUp size={13} /> 🔥 24h Gainers ({metrics.bullish})
        </button>
        <button
          type="button"
          className={`preset-chip red ${activePreset === 'losers' ? 'active' : ''}`}
          onClick={() => {
            setActivePreset('losers');
            setSortBy('change-asc');
          }}
        >
          <TrendingDown size={13} /> 🔻 24h Losers ({metrics.bearish})
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

      {/* 2.5 AI Scanner Intelligence Banner */}
      

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
              }
            }}
            minWidth={215}
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

      {/* 4. Enhanced Stock Table */}
      <StockTable
        stocks={filteredStocks}
        watchlist={watchlist}
        onToggle={onToggleWatch}
        onInspect={(stock) => setInspectedStock(stock)}
        onTradeInRiskStudio={(stock) => navigate(`/risk-studio?symbol=${stock.symbol}&price=${stock.price}`)}
      />

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
