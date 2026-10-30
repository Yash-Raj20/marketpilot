import { useState, useMemo, useEffect } from 'react';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  Grid, 
  Star, 
  Zap,
  Info,
  Search,
  Award,
  AlertTriangle,
  Clock,
  Radio,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Stock } from '../types';

interface StockHeatmapProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
  onInspectStock?: (stock: Stock) => void;
  sourceBadge?: string;
  marketStatusText?: string;
  lastUpdated?: string;
}

type HeatmapFilter = 'all' | 'fast-movers' | 'gainers' | 'losers' | 'ai-picks';
type GroupMode = 'sector' | 'unified';

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function formatMcap(mcapInCrores?: number): string {
  if (!mcapInCrores) return '₹50,000 Cr';
  if (mcapInCrores >= 100000) return `₹${(mcapInCrores / 100000).toFixed(2)}L Cr`;
  if (mcapInCrores >= 1000) return `₹${(mcapInCrores / 1000).toFixed(1)}K Cr`;
  return `₹${mcapInCrores.toLocaleString('en-IN')} Cr`;
}

// 5-Color System: Dark Green (>+3%), Light Green (0 to +3%), Grey (~0%), Light Red (0 to -3%), Dark Red (<-3%)
function getHeatmapColor(changePct: number): {
  bg: string;
  border: string;
  textColor: string;
  changeColor: string;
} {
  if (changePct >= 3.0) {
    // Dark green = strong gain (+3% se upar)
    return {
      bg: 'linear-gradient(135deg, rgba(4, 120, 87, 0.92) 0%, rgba(6, 95, 70, 0.98) 100%)',
      border: 'rgba(52, 211, 153, 0.65)',
      textColor: '#ffffff',
      changeColor: '#a7f3d0'
    };
  }
  if (changePct > 0.2) {
    // Light green = halka gain (0% to +3%)
    return {
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.45) 100%)',
      border: 'rgba(52, 211, 153, 0.45)',
      textColor: '#ffffff',
      changeColor: '#6ee7b7'
    };
  }
  if (changePct >= -0.2 && changePct <= 0.2) {
    // Grey/neutral = ~0%
    return {
      bg: 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.8) 100%)',
      border: 'rgba(100, 116, 139, 0.4)',
      textColor: '#f1f5f9',
      changeColor: '#cbd5e1'
    };
  }
  if (changePct > -3.0) {
    // Light red = halka loss (-0.2% to -3%)
    return {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.32) 0%, rgba(185, 28, 28, 0.42) 100%)',
      border: 'rgba(248, 113, 113, 0.45)',
      textColor: '#ffffff',
      changeColor: '#fca5a5'
    };
  }
  // Dark red = strong loss (-3% se neeche)
  return {
    bg: 'linear-gradient(135deg, rgba(185, 28, 28, 0.92) 0%, rgba(127, 29, 29, 0.98) 100%)',
    border: 'rgba(248, 113, 113, 0.7)',
    textColor: '#ffffff',
    changeColor: '#fecaca'
  };
}

export function StockHeatmap({ 
  stocks, 
  watchlist, 
  onToggleWatch, 
  onInspectStock,
  sourceBadge = 'Live Stream',
  marketStatusText = 'Live Exchange (Market Open)',
  lastUpdated
}: StockHeatmapProps) {
  const [filter, setFilter] = useState<HeatmapFilter>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('sector');
  const [search, setSearch] = useState('');
  const [hoveredStock, setHoveredStock] = useState<Stock | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; placement: 'top' | 'bottom' }>({
    x: 0,
    y: 0,
    placement: 'top'
  });
  const [showTopMoversDrawer, setShowTopMoversDrawer] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Equities only (indices benchmarks handled separately in sectoral ribbon)
  const equitiesOnly = useMemo(() => {
    return stocks.filter(s => s.category !== 'Index');
  }, [stocks]);

  // Overall Top 10 Gainers & Top 10 Losers across the entire market
  const top10Gainers = useMemo(() => {
    return [...equitiesOnly].sort((a, b) => b.changePct - a.changePct).slice(0, 10);
  }, [equitiesOnly]);

  const top10Losers = useMemo(() => {
    return [...equitiesOnly].sort((a, b) => a.changePct - b.changePct).slice(0, 10);
  }, [equitiesOnly]);

  // Filtered equities based on user filter chips and search
  const filteredStocks = useMemo(() => {
    return equitiesOnly.filter(s => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filter === 'fast-movers') return Math.abs(s.changePct) >= 0.5;
      if (filter === 'gainers') return s.changePct > 0;
      if (filter === 'losers') return s.changePct < 0;
      if (filter === 'ai-picks') return (s.aiScore ?? 0) >= 75 || s.changePct >= 1.5;
      return true;
    });
  }, [equitiesOnly, filter, search]);

  // Fast movers count for header badge
  const fastMoversCount = useMemo(() => {
    return equitiesOnly.filter(s => Math.abs(s.changePct) >= 0.5).length;
  }, [equitiesOnly]);

  // Group stocks by industry sector with ALL companies inside and sorted % change (best to worst)
  const sectorsData = useMemo(() => {
    const map: Record<string, {
      name: string;
      stocks: Stock[];
      totalMcap: number;
      weightedSum: number;
      simpleSum: number;
      advancing: number;
      declining: number;
    }> = {};

    filteredStocks.forEach(s => {
      const cat = s.category || 'Other';
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          stocks: [],
          totalMcap: 0,
          weightedSum: 0,
          simpleSum: 0,
          advancing: 0,
          declining: 0
        };
      }
      const mcap = s.marketCap || 50000;
      map[cat].stocks.push(s);
      map[cat].totalMcap += mcap;
      map[cat].weightedSum += s.changePct * mcap;
      map[cat].simpleSum += s.changePct;
      if (s.changePct > 0) map[cat].advancing += 1;
      else if (s.changePct < 0) map[cat].declining += 1;
    });

    // Sort companies within each sector descending by changePct (best to worst)
    Object.values(map).forEach(sec => {
      sec.stocks.sort((a, b) => b.changePct - a.changePct);
    });

    // Return sectors sorted by market-cap weighted performance
    return Object.values(map).sort((a, b) => {
      const aWeighted = a.weightedSum / (a.totalMcap || 1);
      const bWeighted = b.weightedSum / (b.totalMcap || 1);
      return bWeighted - aWeighted;
    });
  }, [filteredStocks]);

  // Tooltip handler with automatic up/down positioning based on viewport space
  const handleMouseEnter = (e: React.MouseEvent, s: Stock) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tooltipEstimatedHeight = 240;
    const tooltipWidth = 270;

    // Check available vertical space
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Auto-flip: if space above is insufficient, show below
    const showBelow = spaceAbove < (tooltipEstimatedHeight + 15) && spaceBelow >= 160;
    const placement: 'top' | 'bottom' = showBelow ? 'bottom' : 'top';

    const y = placement === 'bottom' ? Math.round(rect.bottom + 8) : Math.round(rect.top - 8);

    // Center tooltip horizontally relative to box, clamp inside viewport
    const centerX = rect.left + rect.width / 2;
    const x = Math.min(window.innerWidth - tooltipWidth - 16, Math.max(16, Math.round(centerX - tooltipWidth / 2)));

    setTooltipPos({ x, y, placement });
    setHoveredStock(s);
  };

  const handleMouseLeave = () => {
    setHoveredStock(null);
  };

  // Render individual Treemap-style Stock Box
  const renderStockBox = (
    s: Stock, 
    isTopInSector = false, 
    isLowInSector = false
  ) => {
    const isWatchlisted = watchlist.includes(s.symbol);
    const isPositive = s.changePct >= 0;
    const isNeutral = Math.abs(s.changePct) <= 0.2;
    const isFastMover = Math.abs(s.changePct) >= 0.5;
    const colorStyle = getHeatmapColor(s.changePct);

    // Box size weight proportional to Market Cap (Treemap sizing)
    const mcapWeight = Math.max(1, Math.min(8, Math.round((s.marketCap || 50000) / 120000)));
    const flexBasis = mcapWeight >= 6 ? '200px' : mcapWeight >= 3 ? '160px' : '125px';

    // Best performer glowing gold highlight, Worst performer red highlight
    let borderCss = colorStyle.border;
    let boxShadowCss = 'none';

    if (isTopInSector && s.changePct > 0) {
      borderCss = '#fbbf24';
      boxShadowCss = '0 0 16px rgba(251, 191, 36, 0.45)';
    } else if (isLowInSector && s.changePct < 0) {
      borderCss = '#ef4444';
      boxShadowCss = '0 0 14px rgba(239, 68, 68, 0.35)';
    } else if (isFastMover) {
      boxShadowCss = isPositive ? '0 0 10px rgba(52, 211, 153, 0.25)' : '0 0 10px rgba(248, 113, 113, 0.25)';
    }

    // Precise Change representation: + and ▲ for positive, ▼ for negative
    const changeSymbol = isNeutral ? '' : isPositive ? '▲ +' : '▼ ';
    const changeText = `${changeSymbol}${s.changePct.toFixed(2)}%`;

    return (
      <div 
        key={s.symbol}
        className={`stock-treemap-box ${isTopInSector ? 'sector-top-highlight' : ''} ${isLowInSector ? 'sector-low-highlight' : ''}`}
        style={{
          flex: `${mcapWeight} 1 ${flexBasis}`,
          minHeight: mcapWeight >= 5 ? '108px' : '92px',
          background: colorStyle.bg,
          border: `1.5px solid ${borderCss}`,
          boxShadow: boxShadowCss
        }}
        onClick={() => onInspectStock?.(s)}
        onMouseEnter={(e) => handleMouseEnter(e, s)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Tag Row: Top Performer Badge or Watchlist Star */}
        <div className="treemap-box-top">
          <div className="box-badges-left">
            {isTopInSector && s.changePct > 0 ? (
              <span className="treemap-top-badge" title="Top Performer in Sector">
                <Award size={10} /> 🏆 Top
              </span>
            ) : isLowInSector && s.changePct < 0 ? (
              <span className="treemap-low-badge" title="Lowest Performer in Sector">
                <AlertTriangle size={10} /> ⚠ Low
              </span>
            ) : isFastMover ? (
              <span className={`treemap-fast-chip ${isPositive ? 'positive' : 'negative'}`}>
                <Zap size={9} /> ⚡ Active
              </span>
            ) : (
              <span className="treemap-mcap-pill">{s.marketCapFormatted || formatMcap(s.marketCap)}</span>
            )}
          </div>

          <button
            type="button"
            className={`treemap-star-btn ${isWatchlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch(s.symbol);
            }}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star size={11} fill={isWatchlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Central Symbol (Bold) */}
        <div className="treemap-symbol-row">
          <strong className="treemap-symbol">{s.symbol}</strong>
        </div>

        {/* % Change (Bada) & Price (Chhota) */}
        <div className="treemap-footer">
          <span className="treemap-change" style={{ color: colorStyle.changeColor }}>
            {changeText}
          </span>
          <span className="treemap-price">
            ₹{money(s.price)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="stock-heatmap-container-v2">
      {/* 1. Header Toolbar with Live Feed Status & Legend */}
      <div className="heatmap-v2-header">
        <div className="header-meta-group">
          <div className="heatmap-headline-row">
            <Flame size={20} className="flame-icon" />
            <h2>Equities Market Heatmap</h2>
            
            {/* Live Exchange Feed Badge */}
            <span className="live-feed-badge live-badge">
              <Radio size={12} className="pulse-dot" />
              {sourceBadge}
            </span>

            {/* Market Open / Closed Status */}
            <span className="market-session-status">
              <Clock size={12} />
              {marketStatusText}
            </span>

            {/* Last Updated Timestamp */}
            <span className="last-updated-pill">
              Updated: {lastUpdated || currentTimeStr}
            </span>
          </div>
          <p className="heatmap-subtitle">
            Treemap layout weighted by Market Capitalization. Color scale represents net percentage change from official Previous Close.
          </p>
        </div>

        {/* Right Action: Search & Top 10 Movers Button */}
        <div className="header-actions-group">
          {/* Quick Search */}
          <div className="heatmap-search-pill">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Search symbol, sector (e.g. RELIANCE, Banking)..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          {/* Toggle Top 10 Gainers / Losers Drawer */}
          <button
            type="button"
            className={`top-movers-toggle-btn ${showTopMoversDrawer ? 'active' : ''}`}
            onClick={() => setShowTopMoversDrawer(!showTopMoversDrawer)}
            title="Toggle Top 10 Market Gainers & Losers panel"
          >
            <Award size={14} />
            <span>Top 10 Leaders</span>
            {showTopMoversDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Group View Mode */}
          <div className="heatmap-view-tabs">
            <button
              type="button"
              className={`view-tab-btn ${groupMode === 'sector' ? 'active' : ''}`}
              onClick={() => setGroupMode('sector')}
              title="Organized by Industry Sectors"
            >
              <Layers size={13} /> Sectors
            </button>
            <button
              type="button"
              className={`view-tab-btn ${groupMode === 'unified' ? 'active' : ''}`}
              onClick={() => setGroupMode('unified')}
              title="Full Market Unified Treemap"
            >
              <Grid size={13} /> Unified Grid
            </button>
          </div>
        </div>
      </div>

      {/* 2. Color Scale Legend Strip */}
      <div className="heatmap-color-legend-bar">
        <span className="legend-label">Performance Color Scale:</span>
        <div className="legend-swatches">
          <div className="legend-item">
            <span className="legend-swatch dark-red" />
            <span>&lt; -3.0% (Strong Drop)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch light-red" />
            <span>-3.0% to -0.2%</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch neutral-grey" />
            <span>~0% Neutral</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch light-green" />
            <span>+0.2% to +3.0%</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch dark-green" />
            <span>&gt; +3.0% (Strong Gain)</span>
          </div>
        </div>

        <div className="legend-performer-cues">
          <span className="cue-gold"><span className="cue-dot gold" /> 🏆 Top Gainer in Sector</span>
          <span className="cue-red"><span className="cue-dot red" /> ⚠ Top Loser in Sector</span>
        </div>
      </div>

      {/* 3. Top 10 Gainers & Losers Drawer (Requirement 3) */}
      {showTopMoversDrawer && (
        <div className="heatmap-top-movers-drawer">
          {/* Top 10 Gainers Column */}
          <div className="movers-column gainers-col">
            <div className="movers-col-header">
              <TrendingUp size={15} className="gain-icon" />
              <h3>🏆 Top 10 Market Gainers</h3>
              <span className="badge-green">{top10Gainers.length} Leading</span>
            </div>
            <div className="movers-col-list">
              {top10Gainers.map((s, idx) => (
                <div 
                  key={s.symbol} 
                  className="mover-pill-row"
                  onClick={() => onInspectStock?.(s)}
                  title={`Inspect ${s.symbol}`}
                >
                  <span className="mover-rank">#{idx + 1}</span>
                  <div className="mover-sym-info">
                    <strong>{s.symbol}</strong>
                    <small>{s.category}</small>
                  </div>
                  <div className="mover-price-info">
                    <span className="price-val">₹{money(s.price)}</span>
                    <span className="change-val positive">▲ +{s.changePct.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Losers Column */}
          <div className="movers-column losers-col">
            <div className="movers-col-header">
              <TrendingDown size={15} className="loss-icon" />
              <h3>🔻 Top 10 Market Losers</h3>
              <span className="badge-red">{top10Losers.length} Lagging</span>
            </div>
            <div className="movers-col-list">
              {top10Losers.map((s, idx) => (
                <div 
                  key={s.symbol} 
                  className="mover-pill-row"
                  onClick={() => onInspectStock?.(s)}
                  title={`Inspect ${s.symbol}`}
                >
                  <span className="mover-rank">#{idx + 1}</span>
                  <div className="mover-sym-info">
                    <strong>{s.symbol}</strong>
                    <small>{s.category}</small>
                  </div>
                  <div className="mover-price-info">
                    <span className="price-val">₹{money(s.price)}</span>
                    <span className="change-val negative">▼ {s.changePct.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Chips Bar */}
      <div className="heatmap-filter-chips-row">
        <button
          type="button"
          className={`h-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Equities ({equitiesOnly.length})
        </button>

        <button
          type="button"
          className={`h-chip highlight-chip ${filter === 'fast-movers' ? 'active' : ''}`}
          onClick={() => setFilter('fast-movers')}
        >
          <Zap size={12} /> ⚡ Fast Movers &gt; ±0.5% ({fastMoversCount})
        </button>

        <button
          type="button"
          className={`h-chip green-chip ${filter === 'gainers' ? 'active' : ''}`}
          onClick={() => setFilter('gainers')}
        >
          <TrendingUp size={12} /> Gainers ({equitiesOnly.filter(s => s.changePct > 0).length})
        </button>

        <button
          type="button"
          className={`h-chip red-chip ${filter === 'losers' ? 'active' : ''}`}
          onClick={() => setFilter('losers')}
        >
          <TrendingDown size={12} /> Losers ({equitiesOnly.filter(s => s.changePct < 0).length})
        </button>

        <button
          type="button"
          className={`h-chip ai-chip ${filter === 'ai-picks' ? 'active' : ''}`}
          onClick={() => setFilter('ai-picks')}
        >
          <Sparkles size={12} /> AI Top Momentum
        </button>
      </div>

      {/* 5. Treemap Main Canvas (Full width, min-height 650px) */}
      <div className="heatmap-canvas-wrapper" style={{ minHeight: '650px' }}>
        {groupMode === 'sector' ? (
          <div className="heatmap-sectors-grid">
            {sectorsData.map(sector => {
              if (sector.stocks.length === 0) return null;

              const simpleAvg = +(sector.simpleSum / (sector.stocks.length || 1)).toFixed(2);
              const weightedAvg = +(sector.weightedSum / (sector.totalMcap || 1)).toFixed(2);
              const isWeightedPositive = weightedAvg >= 0;

              // Top and lowest performer in this sector
              const topPerformer = sector.stocks[0];
              const lowPerformer = sector.stocks[sector.stocks.length - 1];

              return (
                <div key={sector.name} className="heatmap-sector-card">
                  {/* Sector Header with Weighted & Simple Average + Advance/Decline */}
                  <div className="sector-card-header">
                    <div className="sector-title-left">
                      <strong className="sector-heading">{sector.name}</strong>
                      <span className="sector-stock-count">{sector.stocks.length} Companies</span>
                    </div>

                    <div className="sector-stats-right">
                      {/* Advance / Decline Counts */}
                      <span className="sector-breadth-indicator">
                        <span className="green-adv">▲ {sector.advancing}</span>
                        <span className="slash">/</span>
                        <span className="red-dec">▼ {sector.declining}</span>
                      </span>

                      {/* Sector Averages (Weighted + Simple) */}
                      <div className="sector-averages-pill">
                        <span className="weighted-stat" title="Market-Cap Weighted Sector Average">
                          Wtd: <strong className={isWeightedPositive ? 'positive' : 'negative'}>
                            {isWeightedPositive ? `▲ +${weightedAvg}%` : `▼ ${weightedAvg}%`}
                          </strong>
                        </span>
                        <span className="simple-stat" title="Arithmetic Simple Average">
                          (Simp: {simpleAvg >= 0 ? `+${simpleAvg}%` : `${simpleAvg}%`})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sector Treemap Boxes */}
                  <div className="sector-treemap-flex">
                    {sector.stocks.map(s => {
                      const isTop = s.symbol === topPerformer.symbol && sector.stocks.length > 1;
                      const isLow = s.symbol === lowPerformer.symbol && sector.stocks.length > 1;
                      return renderStockBox(s, isTop, isLow);
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Unified Full Market Grid */
          <div className="heatmap-unified-treemap">
            {filteredStocks.map(s => renderStockBox(s))}
          </div>
        )}

        {/* Empty state */}
        {filteredStocks.length === 0 && (
          <div className="heatmap-empty-card">
            <Info size={28} />
            <p>No equities found matching active filter: <strong>{search || filter}</strong></p>
            <button type="button" onClick={() => { setFilter('all'); setSearch(''); }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 6. Hover / Tap Rich Floating Tooltip (Requirement 1 & 5) */}
      {hoveredStock && (
        <div 
          className={`treemap-floating-tooltip tt-placement-${tooltipPos.placement}`}
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: tooltipPos.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div className="tt-header">
            <div>
              <strong className="tt-symbol">{hoveredStock.symbol}</strong>
              <span className="tt-name">{hoveredStock.name}</span>
            </div>
            <span className="tt-source-pill live">
              ⚡ Real-Time Feed
            </span>
          </div>

          <div className="tt-price-strip">
            <div className="tt-price-main">
              <strong>₹{money(hoveredStock.price)}</strong>
              <span className={`tt-change ${hoveredStock.changePct >= 0 ? 'positive' : 'negative'}`}>
                {hoveredStock.changePct >= 0 ? '▲ +' : '▼ '}
                {hoveredStock.changeAmount !== undefined ? `₹${money(Math.abs(hoveredStock.changeAmount))} (` : ''}
                {hoveredStock.changePct >= 0 ? '+' : ''}{hoveredStock.changePct.toFixed(2)}%
                {hoveredStock.changeAmount !== undefined ? ')' : ''}
              </span>
            </div>
            <span className="tt-sector-tag">{hoveredStock.category}</span>
          </div>

          <div className="tt-grid">
            <div className="tt-cell">
              <small>Open</small>
              <strong>₹{money(hoveredStock.open || hoveredStock.previousClose || hoveredStock.price)}</strong>
            </div>
            <div className="tt-cell">
              <small>Prev Close</small>
              <strong>₹{money(hoveredStock.previousClose || hoveredStock.price)}</strong>
            </div>
            <div className="tt-cell">
              <small>Intraday High</small>
              <strong>₹{money(hoveredStock.dayHigh || hoveredStock.price)}</strong>
            </div>
            <div className="tt-cell">
              <small>Intraday Low</small>
              <strong>₹{money(hoveredStock.dayLow || hoveredStock.price)}</strong>
            </div>
            <div className="tt-cell">
              <small>Volume</small>
              <strong>{hoveredStock.volume || '1.8M'}</strong>
            </div>
            <div className="tt-cell">
              <small>Market Cap</small>
              <strong>{hoveredStock.marketCapFormatted || formatMcap(hoveredStock.marketCap)}</strong>
            </div>
          </div>

          {hoveredStock.aiSignal && (
            <div className="tt-ai-summary">
              <Sparkles size={11} className="ai-icon" />
              <span>{hoveredStock.aiSignal}: {hoveredStock.aiReason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
