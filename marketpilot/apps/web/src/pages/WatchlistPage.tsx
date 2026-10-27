import { useState, useMemo } from 'react';
import { 
  Plus, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Search, 
  X, 
  ArrowUpRight, 
  SlidersHorizontal,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StockTable } from '../components/StockTable';
import { CustomSelect } from '../components/CustomSelect';
import { StockInspectorModal } from '../components/StockInspectorModal';
import type { Stock, User } from '../types';

interface WatchlistPageProps {
  stocks: Stock[];
  watchlist: string[];
  user: User | null;
  onToggleWatch: (symbol: string) => void;
}

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

const POPULAR_SUGGESTIONS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS'];

export function WatchlistPage({ stocks, watchlist, user, onToggleWatch }: WatchlistPageProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH'>('ALL');
  const [inspectedStock, setInspectedStock] = useState<Stock | null>(null);

  // All stocks currently in the user's watchlist
  const watchedStocks = useMemo(() => {
    return stocks.filter(s => watchlist.includes(s.symbol));
  }, [stocks, watchlist]);

  // Unique sectors within the watchlist
  const sectors = useMemo(() => {
    const s = new Set<string>();
    watchedStocks.forEach(st => {
      if (st.category) s.add(st.category);
    });
    return ['ALL', ...Array.from(s)];
  }, [watchedStocks]);

  const sectorOptions = useMemo(() => {
    return sectors.map(sec => ({
      value: sec,
      label: sec === 'ALL' ? 'All Sectors' : sec,
      badge: sec !== 'ALL' 
        ? `${watchedStocks.filter(st => st.category === sec).length}`
        : `${watchedStocks.length}`
    }));
  }, [sectors, watchedStocks]);

  // Filtered watchlist
  const filteredWatchlist = useMemo(() => {
    return watchedStocks.filter(s => {
      const matchQuery = `${s.symbol} ${s.name} ${s.category}`.toLowerCase().includes(query.toLowerCase());
      if (!matchQuery) return false;

      if (sectorFilter !== 'ALL' && s.category !== sectorFilter) return false;

      if (trendFilter === 'BULLISH' && s.changePct <= 0) return false;
      if (trendFilter === 'BEARISH' && s.changePct >= 0) return false;

      return true;
    });
  }, [watchedStocks, query, sectorFilter, trendFilter]);

  // Watchlist Pulse metrics
  const metrics = useMemo(() => {
    const total = watchedStocks.length;
    const bullish = watchedStocks.filter(s => s.changePct > 0).length;
    const bearish = watchedStocks.filter(s => s.changePct < 0).length;
    const avgChange = total > 0 
      ? watchedStocks.reduce((acc, s) => acc + s.changePct, 0) / total 
      : 0;
    const topGainer = [...watchedStocks].sort((a, b) => b.changePct - a.changePct)[0];
    return { total, bullish, bearish, avgChange, topGainer };
  }, [watchedStocks]);

  // Synthetic mini chart data for inspected stock
  const inspectedChartPoints = useMemo(() => {
    if (!inspectedStock) return [];
    const base = inspectedStock.price;
    const times = ['09:15', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30', '14:15', '15:00', '15:30'];
    const variations = [-0.011, -0.014, -0.006, 0.003, -0.001, 0.007, 0.005, 0.008, 0.012, inspectedStock.changePct / 100];
    return times.map((t, i) => ({
      t,
      v: +(base * (1 + variations[i])).toFixed(2)
    }));
  }, [inspectedStock]);

  return (
    <section className="panel page-panel scanner-wrapper-panel">
      {/* 1. Header with Stats & Actions */}
      <div className="panel-heading scanner-header-row">
        <div>
          <div className="section-kicker">PORTFOLIO SURVEILLANCE</div>
          <h2>
            Personal Watchlist{' '}
            <span className="live-tag"><span /> LIVE MONITOR</span>
          </h2>
          <p className="panel-description">
            {user 
              ? 'Real-time quotes, technical health and risk setups synced across your devices.' 
              : 'Keep track of target setups. Sign in to sync your watchlist across cloud sessions.'}
          </p>
        </div>

        <div className="header-actions-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="primary-btn" onClick={() => navigate('/scanner')}>
            <Plus size={16} /> Explore Scanner
          </button>
        </div>
      </div>

      {/* 2. Watchlist Metrics Pulse */}
      {watchedStocks.length > 0 && (
        <div className="watchlist-overview-grid">
          <div className="metric-card">
            <div className="metric-top"><span>Tracking</span><Star size={14} className="accent-star" /></div>
            <div className="metric-value">{metrics.total} <small>Assets</small></div>
            <div className="metric-detail">NSE / BSE Instruments</div>
          </div>

          <div className="metric-card">
            <div className="metric-top"><span>Market Sentiment</span></div>
            <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="positive-text" style={{ fontSize: 18, color: '#45d6a2' }}>{metrics.bullish} ▲</span>
              <span style={{ color: '#4a5b73', fontSize: 13 }}>/</span>
              <span className="negative-text" style={{ fontSize: 18, color: '#f87171' }}>{metrics.bearish} ▼</span>
            </div>
            <div className="sentiment-ratio-bar">
              <div 
                className="ratio-green" 
                style={{ width: `${metrics.total ? (metrics.bullish / metrics.total) * 100 : 50}%` }} 
              />
              <div 
                className="ratio-red" 
                style={{ width: `${metrics.total ? (metrics.bearish / metrics.total) * 100 : 50}%` }} 
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-top"><span>Average Change</span></div>
            <div className={`metric-value ${metrics.avgChange >= 0 ? 'positive-val' : 'negative-val'}`}>
              {metrics.avgChange >= 0 ? '+' : ''}{metrics.avgChange.toFixed(2)}%
            </div>
            <div className="metric-detail">Weighted 24h movement</div>
          </div>

          {metrics.topGainer && (
            <div 
              className="metric-card top-performer-card"
              onClick={() => setInspectedStock(metrics.topGainer)}
              style={{ cursor: 'pointer' }}
              title="Click to inspect top performer"
            >
              <div className="metric-top">
                <span>Top Gainer</span>
                <Flame size={14} style={{ color: '#fb923c' }} />
              </div>
              <div className="metric-value" style={{ color: '#60a5fa' }}>
                {metrics.topGainer.symbol}
              </div>
              <div className="metric-detail" style={{ color: '#45d6a2', fontWeight: 700 }}>
                +{metrics.topGainer.changePct.toFixed(2)}% (₹{money(metrics.topGainer.price)})
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Toolbar: Search, Trend Chips, Sector Filter */}
      {watchedStocks.length > 0 && (
        <div className="scanner-toolbar">
          <div className="scanner-search">
            <Search size={16} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter your watchlist by name or symbol…"
            />
            {query && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => setQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="watchlist-filter-chips">
            <button 
              type="button"
              className={`preset-chip ${trendFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTrendFilter('ALL')}
            >
              All ({watchedStocks.length})
            </button>
            <button 
              type="button"
              className={`preset-chip ${trendFilter === 'BULLISH' ? 'active' : ''}`}
              onClick={() => setTrendFilter('BULLISH')}
            >
              <TrendingUp size={13} style={{ color: '#45d6a2' }} /> Gainers ({metrics.bullish})
            </button>
            <button 
              type="button"
              className={`preset-chip ${trendFilter === 'BEARISH' ? 'active' : ''}`}
              onClick={() => setTrendFilter('BEARISH')}
            >
              <TrendingDown size={13} style={{ color: '#f87171' }} /> Losers ({metrics.bearish})
            </button>
          </div>

          {sectors.length > 2 && (
            <div className="scanner-filter-group">
              <label>Sector:</label>
              <CustomSelect
                value={sectorFilter}
                options={sectorOptions}
                onChange={setSectorFilter}
                minWidth={160}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Table with 20-item Pagination */}
      {watchedStocks.length > 0 ? (
        <StockTable 
          stocks={filteredWatchlist} 
          watchlist={watchlist} 
          onToggle={onToggleWatch}
          onInspect={stock => setInspectedStock(stock)}
          onTradeInRiskStudio={stock => navigate(`/risk-studio?symbol=${stock.symbol}&price=${stock.price}`)}
          pageSize={20}
        />
      ) : (
        <div className="empty-state watchlist-empty-state">
          <div className="empty-star-ring">
            <Star size={32} />
          </div>
          <h3>Your Watchlist is Ready to Track</h3>
          <p>
            Build your personal surveillance radar. Click any star icon across the platform or quickly add Indian market leaders below:
          </p>
          <div className="quick-suggestions-wrap">
            <span>Quick add heavyweights:</span>
            <div className="suggestions-pills">
              {POPULAR_SUGGESTIONS.map(sym => (
                <button
                  key={sym}
                  type="button"
                  className="suggestion-pill-btn"
                  onClick={() => onToggleWatch(sym)}
                >
                  <Plus size={12} /> {sym}
                </button>
              ))}
            </div>
          </div>
          <button 
            type="button" 
            className="primary-btn" 
            onClick={() => navigate('/scanner')}
            style={{ marginTop: 12 }}
          >
            Launch Market Scanner <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      {/* 5. Deep-Dive Inspection Modal with Full Details */}
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
