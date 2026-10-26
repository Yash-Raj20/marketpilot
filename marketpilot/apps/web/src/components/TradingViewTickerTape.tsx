import React, { useEffect, useRef, memo } from 'react';

interface TradingViewTickerTapeProps {
  colorTheme?: 'dark' | 'light';
}

export const TradingViewTickerTape: React.FC<TradingViewTickerTapeProps> = memo(({ colorTheme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing children to prevent duplicate scripts or duplicate widgets on re-renders
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;

    // TradingView Ticker Tape Widget Configuration (Exact 3-line regular layout: Name -> Price -> Change)
    script.innerHTML = JSON.stringify({
      symbols: [
        {
          description: "NIKKEI",
          proName: "INDEX:NKY"
        },
        {
          description: "BTC/USD",
          proName: "BITSTAMP:BTCUSD"
        },
        {
          description: "HSI",
          proName: "HSI:HSI"
        },
        {
          description: "DAX",
          proName: "INDEX:DAX"
        },
        {
          description: "FTSE",
          proName: "INDEX:FTSE"
        },
        {
          description: "S&P 500",
          proName: "FOREXCOM:SPXUSD"
        },
        {
          description: "DOW JONES",
          proName: "FOREXCOM:DJI"
        },
        {
          description: "NASDAQ",
          proName: "NASDAQ:IXIC"
        },
        {
          description: "NIFTY 50",
          proName: "NSE:NIFTY"
        },
        {
          description: "BANK NIFTY",
          proName: "NSE:BANKNIFTY"
        },
        {
          description: "SENSEX",
          proName: "BSE:SENSEX"
        },
        {
          description: "CAC 40",
          proName: "INDEX:CAC40"
        },
        {
          description: "ASX 200",
          proName: "ASX:XJO"
        },
        {
          description: "KOSPI",
          proName: "KRX:KOSPI200"
        },
        {
          description: "ETH/USD",
          proName: "BITSTAMP:ETHUSD"
        },
        {
          description: "SOL/USD",
          proName: "COINBASE:SOLUSD"
        },
        {
          description: "CRUDE OIL",
          proName: "TVC:USOIL"
        },
        {
          description: "BRENT OIL",
          proName: "TVC:UKOIL"
        },
        {
          description: "GOLD",
          proName: "TVC:GOLD"
        },
        {
          description: "SILVER",
          proName: "TVC:SILVER"
        },
        {
          description: "USD/INR",
          proName: "FX_IDC:USDINR"
        },
        {
          description: "EUR/USD",
          proName: "FX:EURUSD"
        },
        {
          description: "GBP/USD",
          proName: "FX:GBPUSD"
        },
        {
          description: "USD/JPY",
          proName: "FX:USDJPY"
        },
        {
          description: "DXY INDEX",
          proName: "CAPITALCOM:DXY"
        },
        {
          description: "US 10Y BOND",
          proName: "TVC:US10Y"
        }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",
      colorTheme: colorTheme,
      locale: "en"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [colorTheme]);

  return (
    <div className="tradingview-ticker-outer-wrap">
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
});
