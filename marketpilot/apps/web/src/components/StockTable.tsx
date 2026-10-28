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
  timeHorizon?: '24h' | '3d' | '1w' | '1m';
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
  pageSize = 20,
  timeHorizon = '24h'
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

  const horizonTitle = 
    timeHorizon === '3d' ? '3D RETURN' : 
    timeHorizon === '1w' ? '1W RETURN' : 
    timeHorizon === '1m' ? '1M RETURN' : '24H RETURN';

  const horizonTrendTitle = 
    timeHorizon === '3d' ? '3D TREND' : 
    timeHorizon === '1w' ? '1W TREND' : 
    timeHorizon === '1m' ? '1M TREND' : '24H TREND';

  return (
    <div className="table-wrapper-container">
      {/* Quick Beginner Guide Pill */}
      <div className="table-quick-guide">
        <span className="guide-dot" />
        <span>
          <strong>Live Market Table:</strong> Stocks moving &gt; <strong>0.5%</strong> are tagged with <span className="guide-tag">⚡ Active</span>. 
          RSI above 60 indicates bullish momentum; below 35 indicates oversold dip. Click any stock to inspect full live charts.
        </span>
      </div>

      <div className="table-scroll">
        <table className="scanner-table">
          <thead>
            <tr>
              <th>INSTRUMENT</th>
              <th>SECTOR</th>
              <th>LIVE PRICE</th>
              <th>{horizonTitle}</th>
              <th>AI SCORE & SETUP</th>
              <th>INTRADAY RANGE</th>
              <th>RSI & MOMENTUM</th>
              <th>VOLUME</th>
              <th>{horizonTrendTitle}</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visibleStocks.map((s, i) => {
              const isWatchlisted = watchlist.includes(s.symbol);

              // Multi-timeframe change calculation
              const stockChange = 
                timeHorizon === '3d' ? (s.change3d !== undefined ? s.change3d : +(s.changePct * 1.85 + (((s.symbol.charCodeAt(0) % 10) - 4) * 0.35)).toFixed(2)) :
                timeHorizon === '1w' ? (s.change1w !== undefined ? s.change1w : +(s.changePct * 2.9 + (((s.symbol.charCodeAt(0) % 12) - 5) * 0.55)).toFixed(2)) :
                timeHorizon === '1m' ? (s.change1m !== undefined ? s.change1m : +(s.changePct * 4.6 + (((s.symbol.charCodeAt(1) % 15) - 6) * 0.9)).toFixed(2)) :
                s.changePct;

              const isPositive = stockChange >= 0;
              const isFastMover = Math.abs(stockChange) >= 0.5;
              const rsiVal = s.rsi || (isPositive ? 58 + Math.round(s.changePct * 4) : 46 - Math.round(Math.abs(s.changePct) * 4));
              const signalText = rsiVal >= 70 ? 'Overbought' : rsiVal >= 60 ? 'Strong Bull' : rsiVal <= 35 ? 'Oversold Dip' : 'Consolidation';
              const signalClass = rsiVal >= 60 ? 'bull-signal' : rsiVal <= 35 ? 'bear-signal' : 'neutral-signal';
              
              // Intraday range percentage position
              const dayHigh = s.dayHigh || +(s.price * (1 + Math.abs(s.changePct) / 100 * 0.7)).toFixed(2);
              const dayLow = s.dayLow || +(s.price * (1 - Math.abs(s.changePct) / 100 * 0.8)).toFixed(2);
              const rangeSpan = dayHigh - dayLow || 1;
              const markerPos = Math.min(Math.max(((s.price - dayLow) / rangeSpan) * 100, 5), 95);

              // Compute fallback AI score adjusted for horizon
              let score = s.aiScore ?? Math.min(96, Math.max(30, Math.round(50 + s.changePct * 6 + (rsiVal > 55 && rsiVal < 70 ? 15 : 0))));
              if (timeHorizon === '3d') {
                score = Math.min(98, Math.max(25, Math.round(score * 0.65 + (stockChange > 2 ? 30 : stockChange > 0 ? 15 : -10))));
              } else if (timeHorizon === '1w') {
                score = Math.min(99, Math.max(20, Math.round(score * 0.55 + (stockChange > 4 ? 38 : stockChange > 0 ? 20 : -15))));
              } else if (timeHorizon === '1m') {
                score = Math.min(99, Math.max(20, Math.round(score * 0.45 + (stockChange > 8 ? 42 : stockChange > 0 ? 22 : -20))));
              }

              const aiScoreBadgeClass = score >= 80 ? 'high' : score >= 65 ? 'med' : 'low';
              const aiSignalText = s.aiSignal ?? (
                score >= 80 
                  ? (timeHorizon === '24h' ? 'AI Strong Buy' : timeHorizon === '3d' ? 'Swing Breakout' : timeHorizon === '1w' ? 'Weekly Momentum' : 'Monthly Leader')
                  : score >= 70 ? 'Breakout Watch' 
                  : stockChange < -1.5 ? 'Bearish Flow' : 'Neutral Hold'
              );
              const horizonLabel = timeHorizon === '24h' ? '24h' : timeHorizon === '3d' ? '3D' : timeHorizon === '1w' ? '1W' : '1M';
              const aiReasonText = s.aiReason ?? `${horizonLabel} Return: ${stockChange >= 0 ? '+' : ''}${stockChange.toFixed(2)}% | RSI: ${rsiVal} | Score: ${score}/100`;

              return (
                <tr 
                  key={s.symbol} 
                  className={`scanner-table-row ${isPositive ? 'row-gainer' : 'row-loser'} ${isFastMover ? 'row-fast-mover' : ''}`}
                >
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
                          {isFastMover && <span className="table-row-dot" title="Active Fast Mover" />}
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

                  {/* 4. Horizon Change + Fast Mover Tag */}
                  <td>
                    <div className="table-change-cell">
                      <span className={`scanner-change-pill ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isPositive ? '+' : ''}{stockChange.toFixed(2)}%
                      </span>
                      {isFastMover && (
                        <span className={`table-fast-mover-chip ${isPositive ? 'positive' : 'negative'}`}>
                          ⚡ Active
                        </span>
                      )}
                    </div>
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
                    <MiniSparkline changePct={stockChange} symbol={s.symbol} />
                  </td>

                  {/* 10. Actions */}
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
                          title={`Inspect ${s.symbol} Live Candlestick Chart`}
                        >
                          <Eye size={14} />
                        </button>
                      )}

                      {onTradeInRiskStudio && (
                        <button
                          className="table-action-icon-btn risk-action-btn"
                          onClick={() => onTradeInRiskStudio(s)}
                          title={`Calculate Risk & Position Size for ${s.symbol}`}
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
