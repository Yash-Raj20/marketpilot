import { useState, useEffect } from 'react';
import { 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import type { Stock } from '../types';

interface StockTableProps {
  stocks: Stock[];
  watchlist: string[];
  onToggle: (symbol: string) => void;
  onInspect?: (stock: Stock) => void;
  onTradeInRiskStudio?: (stock: Stock) => void;
  pageSize?: number;
}

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

// Sparkline generator helper
function MiniSparkline({ changePct }: { changePct: number }) {
  const isUp = changePct >= 0;
  const strokeColor = isUp ? '#45d6a2' : '#f87171';
  // 6 points showing realistic directional wave
  const path = isUp 
    ? "M0,18 Q8,14 16,16 T32,9 T48,11 T60,2"
    : "M0,4 Q8,8 16,6 T32,13 T48,11 T60,20";

  return (
    <svg width="60" height="24" className="mini-sparkline" viewBox="0 0 60 24">
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StockTable({ 
  stocks, 
  watchlist, 
  onToggle, 
  onInspect, 
  onTradeInRiskStudio,
  pageSize = 20
}: StockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(stocks.length / pageSize));

  // Reset page to 1 when current page exceeds new totalPages (e.g. after filter change)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [stocks.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, stocks.length);
  const visibleStocks = stocks.slice(startIndex, endIndex);

  return (
    <div className="table-wrapper-container">
      <div className="table-scroll">
        <table className="scanner-table">
          <thead>
            <tr>
              <th>INSTRUMENT</th>
              <th>SECTOR</th>
              <th>PRICE</th>
              <th>24H CHANGE</th>
              <th>INTRADAY RANGE</th>
              <th>RSI & SIGNAL</th>
              <th>VOLUME</th>
              <th>TREND</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visibleStocks.map((s, i) => {
              const isWatchlisted = watchlist.includes(s.symbol);
              const isPositive = s.changePct >= 0;
              const rsiVal = s.rsi || (isPositive ? 58 + Math.round(s.changePct * 4) : 46 - Math.round(Math.abs(s.changePct) * 4));
              const signalText = rsiVal >= 70 ? 'Overbought' : rsiVal >= 60 ? 'Strong Bull' : rsiVal <= 35 ? 'Oversold' : 'Neutral';
              const signalClass = rsiVal >= 60 ? 'bull-signal' : rsiVal <= 35 ? 'bear-signal' : 'neutral-signal';
              
              // Intraday range percentage position
              const dayHigh = s.dayHigh || +(s.price * (1 + Math.abs(s.changePct) / 100 * 0.7)).toFixed(2);
              const dayLow = s.dayLow || +(s.price * (1 - Math.abs(s.changePct) / 100 * 0.8)).toFixed(2);
              const rangeSpan = dayHigh - dayLow || 1;
              const markerPos = Math.min(Math.max(((s.price - dayLow) / rangeSpan) * 100, 5), 95);

              return (
                <tr key={s.symbol} className="scanner-table-row">
                  {/* 1. Instrument Monogram & Name */}
                  <td>
                    <div 
                      className="table-stock" 
                      onClick={() => onInspect?.(s)} 
                      style={{ cursor: onInspect ? 'pointer' : 'default' }}
                    >
                      <span className={`mini-stock mini-${i % 5}`}>{s.symbol.slice(0, 1)}</span>
                      <div>
                        <div className="stock-title-row">
                          <strong>{s.symbol}</strong>
                          {s.category === 'Index' && <span className="index-pill">INDEX</span>}
                        </div>
                        <small>{s.name}</small>
                      </div>
                    </div>
                  </td>

                  {/* 2. Sector */}
                  <td>
                    <span className="scanner-sector-badge">{s.category}</span>
                  </td>

                  {/* 3. Price */}
                  <td>
                    <strong className="stock-price-text">₹{money(s.price)}</strong>
                  </td>

                  {/* 4. 24h Change */}
                  <td>
                    <span className={`scanner-change-pill ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {isPositive ? '+' : ''}{s.changePct.toFixed(2)}%
                    </span>
                  </td>

                  {/* 5. Intraday Range Bar */}
                  <td>
                    <div className="scanner-range-col" title={`Low: ₹${money(dayLow)} | High: ₹${money(dayHigh)}`}>
                      <div className="range-bar-track">
                        <div className="range-bar-marker" style={{ left: `${markerPos}%` }} />
                      </div>
                      <div className="range-labels">
                        <span>₹{money(dayLow)}</span>
                        <span>₹{money(dayHigh)}</span>
                      </div>
                    </div>
                  </td>

                  {/* 6. RSI & Technical Signal */}
                  <td>
                    <div className="scanner-rsi-cell">
                      <span className="rsi-num">RSI {rsiVal}</span>
                      <span className={`signal-badge ${signalClass}`}>{signalText}</span>
                    </div>
                  </td>

                  {/* 7. Volume */}
                  <td>
                    <span className="stock-vol-text">{s.volume || '2.4M'}</span>
                  </td>

                  {/* 8. Sparkline */}
                  <td>
                    <MiniSparkline changePct={s.changePct} />
                  </td>

                  {/* 9. Actions */}
                  <td>
                    <div className="scanner-actions-cell">
                      <button
                        className={`star-btn ${isWatchlisted ? 'selected' : ''}`}
                        onClick={() => onToggle(s.symbol)}
                        aria-label={`Toggle ${s.symbol} watchlist`}
                        title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star size={15} fill={isWatchlisted ? 'currentColor' : 'none'} />
                      </button>

                      {onInspect && (
                        <button
                          className="table-action-icon-btn"
                          onClick={() => onInspect(s)}
                          title={`Inspect ${s.symbol} interactive chart`}
                        >
                          <Eye size={15} />
                        </button>
                      )}

                      {onTradeInRiskStudio && (
                        <button
                          className="table-action-icon-btn risk-action-btn"
                          onClick={() => onTradeInRiskStudio(s)}
                          title={`Calculate Risk & Position Size for ${s.symbol}`}
                        >
                          <ShieldCheck size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!stocks.length && (
          <div className="scanner-empty-box">
            <p>No matching instruments found for your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination Bar (20 items per page) */}
      {stocks.length > 0 && (
        <div className="table-pagination-bar">
          <div className="pagination-info">
            Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{stocks.length}</strong> instruments
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
