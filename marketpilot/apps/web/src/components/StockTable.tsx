import { useState, useMemo, useEffect } from 'react';
import { 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import type { Stock } from '../types';

interface StockTableProps {
  stocks: Stock[];
  watchlist: string[];
  onToggle: (symbol: string) => void;
  onInspect?: (stock: Stock) => void;
  onTradeInRiskStudio?: (stock: Stock) => void;
  pageSize?: number;
  timeHorizon?: '24h' | '3d' | '1w' | '1m';
}

type SortColumn = 'rank' | 'symbol' | 'name' | 'price' | 'changeAmount' | 'changePct' | 'volume' | 'marketCap';
type SortDirection = 'asc' | 'desc';

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function parseVolumeNumber(volStr?: string): number {
  if (!volStr) return 0;
  const clean = volStr.toUpperCase().trim();
  if (clean.endsWith('M')) return parseFloat(clean) * 1_000_000;
  if (clean.endsWith('K')) return parseFloat(clean) * 1_000;
  if (clean.endsWith('CR')) return parseFloat(clean) * 10_000_000;
  return parseFloat(clean) || 0;
}

// Compact Visual Progress Bar for % change (-5% to +5% range)
function PerformanceBar({ changePct }: { changePct: number }) {
  const isPositive = changePct >= 0;
  // Normalized width 0 to 100% based on max magnitude of 5%
  const widthPct = Math.min(100, Math.max(8, (Math.abs(changePct) / 4) * 100));

  return (
    <div className="table-perf-bar-wrapper" title={`Relative momentum: ${isPositive ? '+' : ''}${changePct.toFixed(2)}%`}>
      <div className="perf-bar-track">
        <div 
          className={`perf-bar-fill ${isPositive ? 'positive' : 'negative'}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

// Mini Sparkline trajectory
function MiniSparkline({ changePct, symbol }: { changePct: number; symbol: string }) {
  const isUp = changePct >= 0;
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillGradientId = `grad_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${isUp ? 'up' : 'down'}`;

  const w = 60;
  const h = 22;
  const numPoints = 6;
  const step = w / (numPoints - 1);
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + Math.abs(changePct * 7);

  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = Math.round(i * step);
    const progress = i / (numPoints - 1);
    const baseSlope = isUp ? (h - 4) - progress * (h - 8) : 4 + progress * (h - 8);
    const jitter = Math.sin(seed + i * 1.6) * 2;
    const y = Math.max(3, Math.min(h - 3, Math.round(baseSlope + jitter)));
    points.push([x, y]);
  }

  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev[0] + curr[0]) / 2;
    d += ` C ${cpx},${prev[1]} ${cpx},${curr[1]} ${curr[0]},${curr[1]}`;
  }

  const fillPath = `${d} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width={w} height={h} className="table-mini-spark" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${fillGradientId})`} />
      <path d={d} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StockTable({ 
  stocks, 
  watchlist, 
  onToggle, 
  onInspect, 
  onTradeInRiskStudio,
  pageSize = 20,
  timeHorizon = '24h'
}: StockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<SortColumn>('changePct');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [localSearch, setLocalSearch] = useState('');
  const [localSector, setLocalSector] = useState('ALL');

  // Available industry sectors for local filter
  const sectorsList = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach(s => {
      if (s.category && s.category !== 'Index') set.add(s.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [stocks]);

  // Handle column header click to toggle sorting
  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir(col === 'rank' || col === 'symbol' || col === 'name' ? 'asc' : 'desc');
    }
  };

  // Filter stocks locally by search and sector
  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      if (localSector !== 'ALL' && s.category !== localSector) return false;
      if (localSearch.trim()) {
        const q = localSearch.trim().toLowerCase();
        return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stocks, localSearch, localSector]);

  // Sort filtered stocks according to active sort column and direction
  const sortedStocks = useMemo(() => {
    const list = [...filteredStocks];
    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortCol === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortCol === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortCol === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortCol === 'changeAmount') {
        const caA = a.changeAmount ?? +(a.price - (a.previousClose || a.price));
        const caB = b.changeAmount ?? +(b.price - (b.previousClose || b.price));
        valA = caA;
        valB = caB;
      } else if (sortCol === 'changePct') {
        valA = a.changePct;
        valB = b.changePct;
      } else if (sortCol === 'volume') {
        valA = a.volumeNumeric ?? parseVolumeNumber(a.volume);
        valB = b.volumeNumeric ?? parseVolumeNumber(b.volume);
      } else if (sortCol === 'marketCap') {
        valA = a.marketCap ?? 50000;
        valB = b.marketCap ?? 50000;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list;
  }, [filteredStocks, sortCol, sortDir]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedStocks.length / pageSize));
  
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedStocks.length, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedStocks.length);
  const visibleStocks = sortedStocks.slice(startIndex, endIndex);

  // Advancing / Declining metrics
  const advancingCount = filteredStocks.filter(s => s.changePct > 0).length;
  const decliningCount = filteredStocks.filter(s => s.changePct < 0).length;

  // Render Sort Header Indicator
  const renderSortIndicator = (col: SortColumn) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="sort-idle-icon" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="sort-active-icon" /> : <ArrowDown size={12} className="sort-active-icon" />;
  };

  return (
    <div className="table-wrapper-container-v2">
      {/* 1. Table Controls Bar: Search, Sector Filter & Advance/Decline Count */}
      <div className="table-v2-controls-bar">
        <div className="table-controls-left">
          {/* Search Box */}
          <div className="table-search-input-box">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Search symbol or company name..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button type="button" onClick={() => setLocalSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sector Filter Dropdown */}
          <div className="table-sector-select-wrapper">
            <Filter size={13} />
            <select 
              value={localSector} 
              onChange={e => setLocalSector(e.target.value)}
              className="table-sector-dropdown"
            >
              {sectorsList.map(sec => (
                <option key={sec} value={sec}>
                  {sec === 'ALL' ? 'All Sectors' : sec}
                </option>
              ))}
            </select>
          </div>

          {(localSearch || localSector !== 'ALL') && (
            <button 
              type="button" 
              className="table-reset-filters-btn"
              onClick={() => { setLocalSearch(''); setLocalSector('ALL'); }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        <div className="table-controls-right">
          <div className="table-breadth-capsule">
            <span className="adv-pill">▲ {advancingCount} Advancing</span>
            <span className="dec-pill">▼ {decliningCount} Declining</span>
          </div>
          <span className="table-count-label">
            Showing <strong>{sortedStocks.length}</strong> instruments
          </span>
        </div>
      </div>

      {/* 2. Comprehensive Table with Requirement 6 Columns */}
      <div className="table-scroll">
        <table className="scanner-table-v2">
          <thead>
            <tr>
              {/* 1. Rank */}
              <th className="th-clickable" onClick={() => handleSort('rank')}>
                <div className="th-content">
                  <span>RANK</span>
                  {renderSortIndicator('rank')}
                </div>
              </th>

              {/* 2. Symbol */}
              <th className="th-clickable" onClick={() => handleSort('symbol')}>
                <div className="th-content">
                  <span>SYMBOL</span>
                  {renderSortIndicator('symbol')}
                </div>
              </th>

              {/* 3. Company */}
              <th className="th-clickable" onClick={() => handleSort('name')}>
                <div className="th-content">
                  <span>COMPANY</span>
                  {renderSortIndicator('name')}
                </div>
              </th>

              {/* 4. LTP */}
              <th className="th-clickable" onClick={() => handleSort('price')}>
                <div className="th-content">
                  <span>LTP (₹)</span>
                  {renderSortIndicator('price')}
                </div>
              </th>

              {/* 5. Change ₹ */}
              <th className="th-clickable" onClick={() => handleSort('changeAmount')}>
                <div className="th-content">
                  <span>CHANGE (₹)</span>
                  {renderSortIndicator('changeAmount')}
                </div>
              </th>

              {/* 6. Change % */}
              <th className="th-clickable" onClick={() => handleSort('changePct')}>
                <div className="th-content">
                  <span>CHANGE (%)</span>
                  {renderSortIndicator('changePct')}
                </div>
              </th>

              {/* 7. Relative Momentum & Trajectory */}
              <th>
                <div className="th-content">
                  <span>TREND &amp; MOMENTUM</span>
                </div>
              </th>

              {/* 8. Volume */}
              <th className="th-clickable" onClick={() => handleSort('volume')}>
                <div className="th-content">
                  <span>VOLUME</span>
                  {renderSortIndicator('volume')}
                </div>
              </th>

              {/* 9. Market Cap */}
              <th className="th-clickable" onClick={() => handleSort('marketCap')}>
                <div className="th-content">
                  <span>MARKET CAP</span>
                  {renderSortIndicator('marketCap')}
                </div>
              </th>

              {/* 10. Actions */}
              <th style={{ textAlign: 'center' }}>
                <span>ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleStocks.map((s, i) => {
              const rank = startIndex + i + 1;
              const isWatchlisted = watchlist.includes(s.symbol);
              const isPositive = s.changePct >= 0;
              const isFastMover = Math.abs(s.changePct) >= 0.5;

              // Calculate ₹ Change if not explicitly passed
              const prevClose = s.previousClose ?? (s.changePct !== 0 ? +(s.price / (1 + s.changePct / 100)).toFixed(2) : s.price);
              const changeAmount = s.changeAmount !== undefined ? s.changeAmount : +(s.price - prevClose).toFixed(2);
              const isAmountPositive = changeAmount >= 0;

              return (
                <tr 
                  key={s.symbol} 
                  className={`scanner-table-row-v2 ${isPositive ? 'row-gainer' : 'row-loser'}`}
                >
                  {/* 1. Rank */}
                  <td className="col-rank">
                    <span className={`rank-pill ${rank <= 3 ? 'top-three' : ''}`}>
                      #{rank}
                    </span>
                  </td>

                  {/* 2. Symbol with Monogram */}
                  <td className="col-symbol">
                    <div 
                      className="table-symbol-cell"
                      onClick={() => onInspect?.(s)}
                      style={{ cursor: onInspect ? 'pointer' : 'default' }}
                    >
                      <span className={`stock-monogram mono-${rank % 5}`}>
                        {s.symbol.slice(0, 1)}
                      </span>
                      <div className="symbol-info">
                        <strong>{s.symbol}</strong>
                        {isFastMover && (
                          <span className={`fast-mover-chip ${isPositive ? 'positive' : 'negative'}`}>
                            ⚡ Active
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 3. Company Name & Sector Pill */}
                  <td className="col-company">
                    <div className="company-info-cell">
                      <span className="company-full-name" title={s.name}>{s.name}</span>
                      <span className="company-sector-badge">{s.category}</span>
                    </div>
                  </td>

                  {/* 4. LTP */}
                  <td className="col-price">
                    <strong className="ltp-text">₹{money(s.price)}</strong>
                  </td>

                  {/* 5. Change ₹ */}
                  <td className="col-change-amt">
                    <span className={`change-amt-pill ${isAmountPositive ? 'positive' : 'negative'}`}>
                      {isAmountPositive ? '+₹' : '-₹'}{money(Math.abs(changeAmount))}
                    </span>
                  </td>

                  {/* 6. Change % */}
                  <td className="col-change-pct">
                    <span className={`change-pct-badge ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {isPositive ? '+' : ''}{s.changePct.toFixed(2)}%
                    </span>
                  </td>

                  {/* 7. Performance Visual Bar & Mini Sparkline */}
                  <td className="col-trajectory">
                    <div className="trajectory-cell">
                      <PerformanceBar changePct={s.changePct} />
                      <MiniSparkline changePct={s.changePct} symbol={s.symbol} />
                    </div>
                  </td>

                  {/* 8. Volume */}
                  <td className="col-volume">
                    <span className="vol-text">{s.volume || '1.8M'}</span>
                  </td>

                  {/* 9. Market Cap */}
                  <td className="col-mcap">
                    <span className="mcap-text">{s.marketCapFormatted || (s.marketCap ? `₹${(s.marketCap / 100000).toFixed(2)}L Cr` : '₹50,000 Cr')}</span>
                  </td>

                  {/* 10. Actions */}
                  <td className="col-actions">
                    <div className="table-actions-strip">
                      <button
                        type="button"
                        className={`star-btn ${isWatchlisted ? 'selected' : ''}`}
                        onClick={() => onToggle(s.symbol)}
                        title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star size={14} fill={isWatchlisted ? 'currentColor' : 'none'} />
                      </button>

                      {onInspect && (
                        <button
                          type="button"
                          className="action-icon-btn"
                          onClick={() => onInspect(s)}
                          title={`Inspect ${s.symbol} Technical Candlesticks`}
                        >
                          <Eye size={14} />
                        </button>
                      )}

                      {onTradeInRiskStudio && (
                        <button
                          type="button"
                          className="action-icon-btn risk-btn"
                          onClick={() => onTradeInRiskStudio(s)}
                          title={`Calculate Risk Size for ${s.symbol}`}
                        >
                          <ShieldCheck size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!sortedStocks.length && (
          <div className="scanner-empty-box">
            <p>No matching instruments found for your filter criteria.</p>
          </div>
        )}
      </div>

      {/* 3. Pagination Bar */}
      {sortedStocks.length > 0 && (
        <div className="table-pagination-bar">
          <div className="pagination-info">
            Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{sortedStocks.length}</strong> instruments
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="First page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="page-numbers-group">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc: (number | string)[], p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (item === '...') {
                      return <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>;
                    }
                    const p = item as number;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`page-num-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
