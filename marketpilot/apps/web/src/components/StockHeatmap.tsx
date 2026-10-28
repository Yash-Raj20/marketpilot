import { useState, useMemo } from 'react';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  Grid, 
  Star, 
  Eye, 
  Zap,
  Info,
  Search
} from 'lucide-react';
import type { Stock } from '../types';

interface StockHeatmapProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
  onInspectStock?: (stock: Stock) => void;
}

type HeatmapFilter = 'all' | 'fast-movers' | 'gainers' | 'losers' | 'ai-picks';
type GroupMode = 'sector' | 'grid';

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function StockHeatmap({ stocks, watchlist, onToggleWatch, onInspectStock }: StockHeatmapProps) {
  const [filter, setFilter] = useState<HeatmapFilter>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('sector');
  const [search, setSearch] = useState('');

  // Exclude standalone index benchmarks from stock heatmap so equities shine
  const equitiesOnly = useMemo(() => {
    return stocks.filter(s => s.category !== 'Index');
  }, [stocks]);

  // Filtered stocks based on active filter and search
  const filteredStocks = useMemo(() => {
    return equitiesOnly.filter(s => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (filter === 'fast-movers') {
        // Specifically requested in audio: movement >= 0.5% highlighted
        return Math.abs(s.changePct) >= 0.5;
      }
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

  // Group stocks by sector
  const sectorsMap = useMemo(() => {
    const map: Record<string, Stock[]> = {};
    filteredStocks.forEach(s => {
      const cat = s.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    // Sort stocks in each sector by changePct desc
    Object.keys(map).forEach(cat => {
      map[cat].sort((a, b) => b.changePct - a.changePct);
    });
    return map;
  }, [filteredStocks]);

  // Color generator for stock box based on performance
  const getBoxStyle = (changePct: number, isFastMover: boolean) => {
    let bg = 'rgba(255, 255, 255, 0.05)';
    let border = '1px solid rgba(255, 255, 255, 0.1)';
    let glow = 'none';

    if (changePct >= 2.5) {
      bg = 'linear-gradient(135deg, rgba(34, 197, 94, 0.35) 0%, rgba(22, 163, 74, 0.45) 100%)';
      border = '1px solid rgba(74, 222, 128, 0.6)';
      if (isFastMover) glow = '0 0 16px rgba(74, 222, 128, 0.35)';
    } else if (changePct >= 0.5) {
      bg = 'linear-gradient(135deg, rgba(34, 197, 94, 0.22) 0%, rgba(21, 128, 61, 0.32) 100%)';
      border = '1px solid rgba(74, 222, 128, 0.45)';
      if (isFastMover) glow = '0 0 12px rgba(74, 222, 128, 0.25)';
    } else if (changePct > 0) {
      bg = 'rgba(34, 197, 94, 0.12)';
      border = '1px solid rgba(74, 222, 128, 0.25)';
    } else if (changePct <= -2.0) {
      bg = 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(185, 28, 28, 0.45) 100%)';
      border = '1px solid rgba(248, 113, 113, 0.6)';
      if (isFastMover) glow = '0 0 16px rgba(248, 113, 113, 0.35)';
    } else if (changePct <= -0.5) {
      bg = 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.3) 100%)';
      border = '1px solid rgba(248, 113, 113, 0.45)';
      if (isFastMover) glow = '0 0 12px rgba(248, 113, 113, 0.25)';
    } else {
      bg = 'rgba(239, 68, 68, 0.1)';
      border = '1px solid rgba(248, 113, 113, 0.22)';
    }

    return { background: bg, border, boxShadow: glow };
  };

  const renderStockBox = (s: Stock) => {
    const isWatchlisted = watchlist.includes(s.symbol);
    const isPositive = s.changePct >= 0;
    const isFastMover = Math.abs(s.changePct) >= 0.5;
    const boxStyle = getBoxStyle(s.changePct, isFastMover);

    return (
      <div 
        key={s.symbol}
        className={`stock-heatmap-box ${isFastMover ? 'fast-mover-highlight' : ''}`}
        style={boxStyle}
        onClick={() => onInspectStock?.(s)}
      >
        {/* Top Tag: Fast Mover Indicator or AI Score */}
        <div className="box-top-tag">
          {isFastMover ? (
            <span className={`fast-mover-pill ${isPositive ? 'positive' : 'negative'}`}>
              <Zap size={10} className="pulse-icon" />
              {s.changePct >= 0 ? `+${s.changePct.toFixed(2)}%` : `${s.changePct.toFixed(2)}%`}
            </span>
          ) : (
            <span className="box-sector-label">{s.category}</span>
          )}

          <button
            type="button"
            className={`box-star-btn ${isWatchlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch(s.symbol);
            }}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star size={12} fill={isWatchlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Central Symbol & Name */}
        <div className="box-content">
          <strong className="box-symbol">{s.symbol}</strong>
          <span className="box-name" title={s.name}>{s.name}</span>
        </div>

        {/* Bottom Price & Change */}
        <div className="box-footer">
          <span className="box-price">₹{money(s.price)}</span>
          <span className={`box-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? `+${s.changePct.toFixed(2)}%` : `${s.changePct.toFixed(2)}%`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="stock-heatmap-wrapper">
      {/* Heatmap Control Toolbar */}
      <div className="stock-heatmap-toolbar">
        <div className="toolbar-left">
          <div className="heatmap-title-row">
            <Flame size={18} className="flame-icon" />
            <h3>Market Equities Heatmap</h3>
            <span className="fast-movers-badge">
              <Zap size={12} /> {fastMoversCount} Fast Movers (&gt; ±0.5%)
            </span>
          </div>
          <p className="heatmap-desc">
            Visual box-view of market momentum. Stocks moving &gt;0.5% are highlighted with active glowing indicators.
          </p>
        </div>

        <div className="toolbar-right">
          {/* Quick Search */}
          <div className="heatmap-search-box">
            <Search size={13} />
            <input 
              type="text" 
              placeholder="Search stock..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          {/* Group View Toggle */}
          <div className="heatmap-group-toggle">
            <button
              type="button"
              className={`toggle-btn ${groupMode === 'sector' ? 'active' : ''}`}
              onClick={() => setGroupMode('sector')}
              title="Group by Industry Sectors"
            >
              <Layers size={13} /> Sectors
            </button>
            <button
              type="button"
              className={`toggle-btn ${groupMode === 'grid' ? 'active' : ''}`}
              onClick={() => setGroupMode('grid')}
              title="Unified Grid View"
            >
              <Grid size={13} /> Grid
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="heatmap-filter-bar">
        <button
          type="button"
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Equities ({equitiesOnly.length})
        </button>

        <button
          type="button"
          className={`filter-chip highlight-chip ${filter === 'fast-movers' ? 'active' : ''}`}
          onClick={() => setFilter('fast-movers')}
        >
          <Zap size={12} /> Fast Movers &gt; ±0.5% ({fastMoversCount})
        </button>

        <button
          type="button"
          className={`filter-chip ${filter === 'gainers' ? 'active' : ''}`}
          onClick={() => setFilter('gainers')}
        >
          <TrendingUp size={12} /> Gainers ({equitiesOnly.filter(s => s.changePct > 0).length})
        </button>

        <button
          type="button"
          className={`filter-chip ${filter === 'losers' ? 'active' : ''}`}
          onClick={() => setFilter('losers')}
        >
          <TrendingDown size={12} /> Losers ({equitiesOnly.filter(s => s.changePct < 0).length})
        </button>

        <button
          type="button"
          className={`filter-chip ${filter === 'ai-picks' ? 'active' : ''}`}
          onClick={() => setFilter('ai-picks')}
        >
          <Sparkles size={12} /> Top AI Momentum
        </button>
      </div>

      {/* Boxes Container */}
      {groupMode === 'sector' ? (
        <div className="heatmap-sectors-container">
          {Object.entries(sectorsMap).map(([sectorName, sectorStocks]) => {
            if (sectorStocks.length === 0) return null;
            const avgChange = +(
              sectorStocks.reduce((acc, s) => acc + s.changePct, 0) / sectorStocks.length
            ).toFixed(2);
            const isAvgPositive = avgChange >= 0;

            return (
              <div key={sectorName} className="heatmap-sector-group">
                <div className="sector-group-header">
                  <div className="sector-info">
                    <span className="sector-name">{sectorName}</span>
                    <span className="sector-count">{sectorStocks.length} Stocks</span>
                  </div>
                  <span className={`sector-avg-badge ${isAvgPositive ? 'positive' : 'negative'}`}>
                    Avg: {isAvgPositive ? `+${avgChange}%` : `${avgChange}%`}
                  </span>
                </div>

                <div className="sector-boxes-grid">
                  {sectorStocks.map(s => renderStockBox(s))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="heatmap-unified-grid">
          {filteredStocks.map(s => renderStockBox(s))}
        </div>
      )}

      {/* Empty State */}
      {filteredStocks.length === 0 && (
        <div className="heatmap-empty-state">
          <Info size={24} />
          <p>No stocks match your active filter.</p>
          <button type="button" onClick={() => { setFilter('all'); setSearch(''); }}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

