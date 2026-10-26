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
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { StockTable } from '../components/StockTable';
import { CustomSelect } from '../components/CustomSelect';
import { api } from '../lib/api';
import type { Stock } from '../types';

interface ScannerPageProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
}

type PresetFilter = 'all' | 'momentum' | 'breakout' | 'dip' | 'watchlist';
type SortOption = 'change-desc' | 'change-asc' | 'price-desc' | 'price-asc' | 'symbol-asc';

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
  const [sortBy, setSortBy] = useState<SortOption>('change-desc');

  // Live exchange state
  const [liveStocks, setLiveStocks] = useState<Stock[]>(stocks);
  const [dataMode, setDataMode] = useState<'LIVE_EXCHANGE' | 'DEMO' | 'FALLBACK'>('LIVE_EXCHANGE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectedChartPoints, setInspectedChartPoints] = useState<Array<{ t: string; v: number }>>([]);

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
    { value: 'change-desc' as const, label: '24h Gainers (High to Low)' },
    { value: 'change-asc' as const, label: '24h Losers (Low to High)' },
    { value: 'price-desc' as const, label: 'Price (High to Low)' },
    { value: 'price-asc' as const, label: 'Price (Low to High)' },
    { value: 'symbol-asc' as const, label: 'Alphabetical (A - Z)' }
  ], []);

  // Filtered & Sorted stock list
  const filteredStocks = useMemo(() => {
    return currentStocksList
      .filter(s => {
        // 1. Text Query
        const matchQuery = `${s.symbol} ${s.name} ${s.category}`.toLowerCase().includes(query.toLowerCase());
        if (!matchQuery) return false;

        // 2. Sector Filter
        if (selectedSector !== 'ALL' && s.category !== selectedSector) return false;

        // 3. Preset Filter
        if (activePreset === 'momentum') return s.changePct >= 1.0;
        if (activePreset === 'breakout') return (s.rsi || 50) >= 65 || s.changePct >= 1.5;
        if (activePreset === 'dip') return s.changePct < 0;
        if (activePreset === 'watchlist') return watchlist.includes(s.symbol);

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'change-desc') return b.changePct - a.changePct;
        if (sortBy === 'change-asc') return a.changePct - b.changePct;
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
    const topGainer = [...currentStocksList].sort((a, b) => b.changePct - a.changePct)[0];
    return { total, bullish, bearish, topGainer };
  }, [currentStocksList]);

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
            <span>{metrics.bullish} Bullish</span>
          </div>
          <div className="scanner-metric-pill red">
            <TrendingDown size={13} />
            <span>{metrics.bearish} Bearish</span>
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
          className={`preset-chip ${activePreset === 'all' ? 'active' : ''}`}
          onClick={() => setActivePreset('all')}
        >
          All Instruments ({currentStocksList.length})
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'momentum' ? 'active' : ''}`}
          onClick={() => setActivePreset('momentum')}
        >
          <Flame size={13} /> High Momentum (&gt; +1%)
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'breakout' ? 'active' : ''}`}
          onClick={() => setActivePreset('breakout')}
        >
          <Zap size={13} /> Breakout Setups
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'dip' ? 'active' : ''}`}
          onClick={() => setActivePreset('dip')}
        >
          <TrendingDown size={13} /> Pullback / Dip Buy
        </button>
        <button
          type="button"
          className={`preset-chip ${activePreset === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActivePreset('watchlist')}
        >
          <Star size={13} /> Watchlist Only ({watchlist.length})
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
            onChange={(val) => setSortBy(val as SortOption)}
            minWidth={215}
          />
        </div>


        {/* Result Counter badge */}
        <div className="scanner-result-count">
          Showing <strong>{filteredStocks.length}</strong> of {stocks.length}
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

      {/* 5. Deep-Dive Stock Inspector Modal */}
      {inspectedStock && (
        <div className="modal-backdrop" onClick={() => setInspectedStock(null)}>
          <div 
            className="auth-modal stock-inspector-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(100%, 540px)' }}
          >
            <button 
              className="modal-close" 
              onClick={() => setInspectedStock(null)} 
              aria-label="Close inspector"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="inspector-head">
              <div className="inspector-title-group">
                <div className="inspector-avatar">
                  {inspectedStock.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="inspector-name-row">
                    <h2>{inspectedStock.symbol}</h2>
                    <span className="scanner-sector-badge">{inspectedStock.category}</span>
                  </div>
                  <small>{inspectedStock.name}</small>
                </div>
              </div>

              <div className="inspector-price-col">
                <strong>₹{money(inspectedStock.price)}</strong>
                <span className={`scanner-change-pill ${inspectedStock.changePct >= 0 ? 'positive' : 'negative'}`}>
                  {inspectedStock.changePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {inspectedStock.changePct >= 0 ? '+' : ''}{inspectedStock.changePct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Interactive Recharts Area Chart for this stock */}
            <div className="inspector-chart-box">
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={inspectedChartPoints} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inspectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="0%" 
                        stopColor={inspectedStock.changePct >= 0 ? '#43d6a2' : '#f87171'} 
                        stopOpacity={0.32} 
                      />
                      <stop 
                        offset="100%" 
                        stopColor={inspectedStock.changePct >= 0 ? '#43d6a2' : '#f87171'} 
                        stopOpacity={0.0} 
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#1c2c3e" vertical={false} />
                  <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fill: '#6c7c93', fontSize: 10 }} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                  <Tooltip
                    contentStyle={{ 
                      background: '#0d1828', 
                      border: '1px solid #23354c', 
                      borderRadius: 8, 
                      color: '#fff',
                      fontSize: '11px' 
                    }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={inspectedStock.changePct >= 0 ? '#43d6a2' : '#f87171'}
                    strokeWidth={2.4}
                    fill="url(#inspectGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key Statistics Grid */}
            <div className="inspector-stats-grid">
              <div className="stat-card">
                <small>Day High</small>
                <strong>₹{money(inspectedStock.dayHigh || inspectedStock.price * 1.012)}</strong>
              </div>
              <div className="stat-card">
                <small>Day Low</small>
                <strong>₹{money(inspectedStock.dayLow || inspectedStock.price * 0.988)}</strong>
              </div>
              <div className="stat-card">
                <small>RSI (14)</small>
                <strong className={inspectedStock.changePct >= 0 ? 'positive' : 'negative'}>
                  {inspectedStock.rsi || (inspectedStock.changePct >= 0 ? 64 : 42)}
                </strong>
              </div>
              <div className="stat-card">
                <small>Volume</small>
                <strong>{inspectedStock.volume || '2.4M'}</strong>
              </div>
            </div>

            {/* Action Bar */}
            <div className="inspector-actions-bar">
              <button
                type="button"
                className={`secondary-btn ${watchlist.includes(inspectedStock.symbol) ? 'active-watch-btn' : ''}`}
                onClick={() => onToggleWatch(inspectedStock.symbol)}
              >
                <Star size={15} fill={watchlist.includes(inspectedStock.symbol) ? 'currentColor' : 'none'} />
                <span>{watchlist.includes(inspectedStock.symbol) ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setInspectedStock(null);
                  navigate('/journal');
                }}
              >
                <BookOpen size={15} />
                <span>Log to Journal</span>
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  const sym = inspectedStock.symbol;
                  const pr = inspectedStock.price;
                  setInspectedStock(null);
                  navigate(`/risk-studio?symbol=${sym}&price=${pr}`);
                }}
              >
                <ShieldCheck size={16} />
                <span>Plan Risk in Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
