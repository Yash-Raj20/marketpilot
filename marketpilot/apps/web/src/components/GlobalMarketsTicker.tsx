import React, { useState, useEffect } from 'react';

export interface GlobalTickerItem {
  id: string;
  name: string;
  tvSymbol: string;
  price: number;
  change: number;
  changePct: number;
  badge?: string;
  hasDot?: boolean;
  logoType: string;
  precision?: number;
}

const DEFAULT_GLOBAL_ITEMS: GlobalTickerItem[] = [
  { id: 'nikkei', name: 'NIKKEI', tvSymbol: 'INDEX-NKY', logoType: 'nikkei', price: 38540.20, change: -12.00, changePct: -0.03, precision: 2 },
  { id: 'btc', name: 'BTC/USD', tvSymbol: 'BITSTAMP-BTCUSD', logoType: 'btc', price: 80321.63, change: 249.91, changePct: 0.31, precision: 2 },
  { id: 'hsi', name: 'HSI', hasDot: true, badge: 'E', tvSymbol: 'HSI-HSI', logoType: 'hsi', price: 23211.81, change: 118.44, changePct: 0.51, precision: 2 },
  { id: 'dax', name: 'DAX', badge: 'E', tvSymbol: 'INDEX-DAX', logoType: 'dax', price: 25181.65, change: -190.10, changePct: -0.75, precision: 2 },
  { id: 'ftse', name: 'FTSE', hasDot: true, tvSymbol: 'INDEX-FTSE', logoType: 'ftse', price: 10738.80, change: 48.20, changePct: 0.45, precision: 1 },
  { id: 'sp500', name: 'S&P 500', tvSymbol: 'FOREXCOM-SPXUSD', logoType: 'sp500', price: 5864.67, change: -11.95, changePct: -0.20, precision: 2 },
  { id: 'dow', name: 'DOW JONES', tvSymbol: 'FOREXCOM-DJI', logoType: 'dow', price: 42863.86, change: -201.27, changePct: -0.47, precision: 2 },
  { id: 'nasdaq', name: 'NASDAQ', tvSymbol: 'NASDAQ-IXIC', logoType: 'nasdaq', price: 18483.87, change: 35.12, changePct: 0.19, precision: 2 },
  { id: 'nifty', name: 'NIFTY 50', tvSymbol: 'NSE-NIFTY', logoType: 'nifty', price: 24872.30, change: 158.40, changePct: 0.64, precision: 2 },
  { id: 'banknifty', name: 'BANK NIFTY', tvSymbol: 'NSE-BANKNIFTY', logoType: 'banknifty', price: 52180.40, change: 476.15, changePct: 0.92, precision: 2 },
  { id: 'sensex', name: 'SENSEX', tvSymbol: 'BSE-SENSEX', logoType: 'sensex', price: 81224.75, change: 491.30, changePct: 0.61, precision: 2 },
  { id: 'cac40', name: 'CAC 40', badge: 'E', tvSymbol: 'INDEX-CAC40', logoType: 'cac40', price: 7523.40, change: -34.80, changePct: -0.46, precision: 2 },
  { id: 'asx200', name: 'ASX 200', tvSymbol: 'ASX-XJO', logoType: 'asx', price: 8214.50, change: 28.10, changePct: 0.34, precision: 2 },
  { id: 'eth', name: 'ETH/USD', tvSymbol: 'BITSTAMP-ETHUSD', logoType: 'eth', price: 2642.15, change: 38.40, changePct: 1.47, precision: 2 },
  { id: 'crude', name: 'CRUDE OIL', tvSymbol: 'TVC-USOIL', logoType: 'oil', price: 71.48, change: -0.84, changePct: -1.16, precision: 2 },
  { id: 'brent', name: 'BRENT OIL', tvSymbol: 'TVC-UKOIL', logoType: 'oil', price: 75.12, change: -0.92, changePct: -1.21, precision: 2 },
  { id: 'gold', name: 'GOLD', tvSymbol: 'TVC-GOLD', logoType: 'gold', price: 2748.90, change: 14.60, changePct: 0.53, precision: 2 },
  { id: 'silver', name: 'SILVER', tvSymbol: 'TVC-SILVER', logoType: 'silver', price: 33.82, change: 0.45, changePct: 1.35, precision: 2 },
  { id: 'usdinr', name: 'USD/INR', tvSymbol: 'FX_IDC-USDINR', logoType: 'forex', price: 84.08, change: 0.04, changePct: 0.05, precision: 2 },
  { id: 'eurusd', name: 'EUR/USD', tvSymbol: 'FX-EURUSD', logoType: 'forex', price: 1.0825, change: -0.0018, changePct: -0.17, precision: 4 },
  { id: 'gbpusd', name: 'GBP/USD', tvSymbol: 'FX-GBPUSD', logoType: 'forex', price: 1.2995, change: 0.0012, changePct: 0.09, precision: 4 },
  { id: 'dxy', name: 'DXY INDEX', tvSymbol: 'CAPITALCOM-DXY', logoType: 'forex', price: 104.15, change: 0.18, changePct: 0.17, precision: 2 },
  { id: 'us10y', name: 'US 10Y BOND', tvSymbol: 'TVC-US10Y', logoType: 'forex', price: 4.24, change: 0.03, changePct: 0.71, precision: 2 }
];

function formatPriceNumber(num: number, precision = 2): string {
  const parts = num.toFixed(precision).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function renderLogoIcon(type: string) {
  switch (type) {
    case 'btc':
      return <span className="gm-logo-badge btc">₿</span>;
    case 'hsi':
      return <span className="gm-logo-badge hsi">爪</span>;
    case 'dax':
      return <span className="gm-logo-badge dax">✕</span>;
    case 'ftse':
      return <span className="gm-logo-badge ftse">100</span>;
    case 'sp500':
      return <span className="gm-logo-badge sp500">500</span>;
    case 'nikkei':
      return <span className="gm-logo-badge nikkei">日</span>;
    case 'dow':
      return <span className="gm-logo-badge dow">30</span>;
    case 'nasdaq':
      return <span className="gm-logo-badge nasdaq">Q</span>;
    case 'nifty':
      return <span className="gm-logo-badge nifty">50</span>;
    case 'banknifty':
      return <span className="gm-logo-badge banknifty">BN</span>;
    case 'sensex':
      return <span className="gm-logo-badge sensex">BSE</span>;
    case 'eth':
      return <span className="gm-logo-badge eth">Ξ</span>;
    case 'gold':
      return <span className="gm-logo-badge gold">AU</span>;
    case 'silver':
      return <span className="gm-logo-badge silver">AG</span>;
    case 'oil':
      return <span className="gm-logo-badge oil">🛢</span>;
    case 'cac40':
      return <span className="gm-logo-badge cac40">40</span>;
    case 'asx':
      return <span className="gm-logo-badge asx">200</span>;
    case 'forex':
    default:
      return <span className="gm-logo-badge forex">FX</span>;
  }
}

export const GlobalMarketsTicker: React.FC = () => {
  const [items, setItems] = useState<GlobalTickerItem[]>(DEFAULT_GLOBAL_ITEMS);

  useEffect(() => {
    let active = true;

    async function loadLivePrices() {
      try {
        const res = await fetch('/api/market/global-tickers');
        if (res.ok) {
          const data = await res.json();
          if (active && data?.tickers && Array.isArray(data.tickers) && data.tickers.length > 0) {
            setItems(data.tickers);
          }
        }
      } catch {
        // Fallback
      }
    }

    loadLivePrices();
    const interval = setInterval(loadLivePrices, 7500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Duplicate list for seamless infinite marquee loop
  const displayList = [...items, ...items];

  const siteDomain = typeof window !== 'undefined' && window.location.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? window.location.hostname
    : 'marketpilot.ai';

  return (
    <div className="gm-ticker-outer-container">
      <div className="gm-ticker-marquee-track">
        {displayList.map((item, idx) => {
          const isNegative = item.change < 0;
          const isPositive = item.change > 0;
          const priceColorClass = isNegative ? 'down' : isPositive ? 'up' : 'neutral';
          const changeColorClass = isNegative ? 'down' : 'up';
          const changeSign = item.change >= 0 ? '+' : '';
          const changePctSign = item.changePct >= 0 ? '+' : '';
          const precision = item.precision ?? 2;

          return (
            <a
              key={`${item.id}-${idx}`}
              href={`https://www.tradingview.com/symbols/${item.tvSymbol}/?utm_source=${siteDomain}&utm_medium=widget&utm_campaign=ticker-tape`}
              target="_blank"
              rel="noopener noreferrer"
              className="gm-ticker-column"
              title={`${item.name} - View on TradingView`}
            >
              {/* Row 1: Logo + Symbol Name */}
              <div className="gm-ticker-row-name">
                {renderLogoIcon(item.logoType)}
                <span className="gm-ticker-name-text">
                  {item.name}
                  {item.hasDot ? <span className="gm-ticker-dot">•</span> : null}
                </span>
              </div>

              {/* Row 2: Price (e.g. 80,321.63 in red or green with superscript E badge) */}
              <div className={`gm-ticker-row-price ${priceColorClass}`}>
                <span className="gm-ticker-price-number">
                  {formatPriceNumber(item.price, precision)}
                </span>
                {item.badge && <sup className="gm-ticker-sup-badge">{item.badge}</sup>}
              </div>

              {/* Row 3: Change and Change Percentage (e.g. +249.91 (+0.31%)) */}
              <div className={`gm-ticker-row-change ${changeColorClass}`}>
                <span>
                  {changeSign}{item.change.toFixed(precision)} ({changePctSign}{item.changePct.toFixed(2)}%)
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
