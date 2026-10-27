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
  ChevronsRight,
  Sparkles
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

// Upgraded Dynamic Sparkline with authentic contour, area gradient fill, and end pulse dot
function MiniSparkline({ changePct, symbol }: { changePct: number; symbol: string }) {
  const isUp = changePct >= 0;
  const strokeColor = isUp ? '#00c087' : '#f23645';
  const fillGradientId = `grad_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${isUp ? 'up' : 'down'}`;

  const w = 70;
  const h = 26;
  const numPoints = 7;
  const step = w / (numPoints - 1);

  // Deterministic seed derived from symbol name and change
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + Math.abs(changePct * 7);

  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = Math.round(i * step);
    const progress = i / (numPoints - 1);
    const baseSlope = isUp ? (h - 6) - progress * (h - 10) : 6 + progress * (h - 12);
    const jitter = Math.sin(seed + i * 1.6) * 3;
    const y = Math.max(3, Math.min(h - 3, Math.round(baseSlope + jitter)));
    points.push([x, y]);
  }

  // Anchor final point to trend direction
  if (isUp) {
    points[points.length - 1][1] = Math.min(points[points.length - 1][1], 5);
  } else {
    points[points.length - 1][1] = Math.max(points[points.length - 1][1], h - 5);
  }

  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev[0] + curr[0]) / 2;
    d += ` C ${cpx},${prev[1]} ${cpx},${curr[1]} ${curr[0]},${curr[1]}`;
  }

  const fillPath = `${d} L ${w},${h} L 0,${h} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="sparkline-wrapper" title={`24h Trajectory: ${isUp ? '+' : ''}${changePct.toFixed(2)}%`}>
      <svg width={w} height={h} className="mini-sparkline" viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${fillGradientId})`} />
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={strokeColor} />
      </svg>
    </div>
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

  // Reset page to 1 whenever stocks change or current page exceeds totalPages
  useEffect(() => {
    setCurrentPage(1);
  }, [stocks]);

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
              <th>AI SCORE & SETUP</th>
              <th>INTRADAY RANGE</th>
              <th>RSI & SIGNAL</th>
              <th>VOLUME</th>
              <th>24H TREND</th>
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

              // Compute fallback AI score if not attached
              const score = s.aiScore ?? Math.min(96, Math.max(30, Math.round(50 + s.changePct * 6 + (rsiVal > 55 && rsiVal < 70 ? 15 : 0))));
              const aiScoreBadgeClass = score >= 80 ? 'high' : score >= 65 ? 'med' : 'low';
              const aiSignalText = s.aiSignal ?? (score >= 80 ? 'AI Strong Buy' : score >= 70 ? 'Breakout Watch' : s.changePct < -1.2 ? 'Bearish Flow' : 'Neutral Hold');
              const aiReasonText = s.aiReason ?? `Momentum: ${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}% | RSI: ${rsiVal} | Score: ${score}/100`;

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

                  {/* 5. AI Score & Setup Badge */}
                  <td>
                    <div className="table-ai-score-cell" title={aiReasonText}>
                      <div className={`ai-score-pill ${aiScoreBadgeClass}`}>
                        <Sparkles size={11} className="ai-spark-icon" />
                        <strong>{score}</strong>
                        <small>/100</small>
                      </div>
                      <span className={`ai-signal-label ${aiScoreBadgeClass}`}>
                        {aiSignalText}
                      </span>
                    </div>
                  </td>

                  {/* 6. Intraday Range Bar */}
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

                  {/* 7. RSI & Technical Signal */}
                  <td>
                    <div className="scanner-rsi-cell">
                      <span className="rsi-num">RSI {rsiVal}</span>
                      <span className={`signal-badge ${signalClass}`}>{signalText}</span>
                    </div>
                  </td>

                  {/* 8. Volume */}
                  <td>
                    <span className="stock-vol-text">{s.volume || '2.4M'}</span>
                  </td>

                  {/* 9. Upgraded Dynamic Trend Sparkline */}
                  <td>
                    <MiniSparkline changePct={s.changePct} symbol={s.symbol} />
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
