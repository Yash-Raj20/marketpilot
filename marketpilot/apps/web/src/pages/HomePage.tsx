import { useState } from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  BookOpen, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  CandlestickChart,
  AreaChart as AreaIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GlobalMarketsTicker } from '../components/GlobalMarketsTicker';
import type { Stock, User } from '../types';

interface HomePageProps {
  user: User | null;
  stocks?: Stock[];
  onOpenAuth: () => void;
}

type IndexKey = 'nifty' | 'banknifty' | 'sensex';
type Timeframe = '1D' | '1W' | '1M';
type ChartMode = 'area' | 'candles';

interface CandlePoint {
  t: string;
  v: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface IndexMeta {
  name: string;
  value: string;
  change: string;
  positive: boolean;
  high: string;
  low: string;
  color: string;
  gradientId: string;
}

const indicesMeta: Record<IndexKey, IndexMeta> = {
  nifty: {
    name: 'NIFTY 50',
    value: '24,872.30',
    change: '+0.64%',
    positive: true,
    high: '24,915.40',
    low: '24,670.00',
    color: '#45d6a2',
    gradientId: 'niftyGradient'
  },
  banknifty: {
    name: 'BANK NIFTY',
    value: '52,180.40',
    change: '+0.92%',
    positive: true,
    high: '52,240.00',
    low: '51,710.00',
    color: '#60a5fa',
    gradientId: 'bankniftyGradient'
  },
  sensex: {
    name: 'SENSEX',
    value: '81,450.20',
    change: '+0.52%',
    positive: true,
    high: '81,590.10',
    low: '80,940.00',
    color: '#a78bfa',
    gradientId: 'sensexGradient'
  }
};

const timeframeData: Record<IndexKey, Record<Timeframe, CandlePoint[]>> = {
  nifty: {
    '1D': [
      { t: '09:15', v: 24715, open: 24710, high: 24740, low: 24690, close: 24715 },
      { t: '09:45', v: 24680, open: 24715, high: 24725, low: 24670, close: 24680 },
      { t: '10:30', v: 24745, open: 24680, high: 24760, low: 24675, close: 24745 },
      { t: '11:15', v: 24790, open: 24745, high: 24805, low: 24730, close: 24790 },
      { t: '12:00', v: 24765, open: 24790, high: 24800, low: 24750, close: 24765 },
      { t: '12:45', v: 24820, open: 24765, high: 24835, low: 24760, close: 24820 },
      { t: '13:30', v: 24805, open: 24820, high: 24830, low: 24790, close: 24805 },
      { t: '14:15', v: 24860, open: 24805, high: 24875, low: 24800, close: 24860 },
      { t: '15:00', v: 24885, open: 24860, high: 24915, low: 24855, close: 24885 },
      { t: '15:30', v: 24872, open: 24885, high: 24895, low: 24865, close: 24872 }
    ],
    '1W': [
      { t: 'Mon', v: 24520, open: 24480, high: 24550, low: 24450, close: 24520 },
      { t: 'Tue', v: 24640, open: 24520, high: 24670, low: 24510, close: 24640 },
      { t: 'Wed', v: 24590, open: 24640, high: 24660, low: 24560, close: 24590 },
      { t: 'Thu', v: 24760, open: 24590, high: 24790, low: 24580, close: 24760 },
      { t: 'Fri', v: 24872, open: 24760, high: 24915, low: 24750, close: 24872 }
    ],
    '1M': [
      { t: 'Week 1', v: 24150, open: 24050, high: 24220, low: 24010, close: 24150 },
      { t: 'Week 2', v: 24380, open: 24150, high: 24450, low: 24120, close: 24380 },
      { t: 'Week 3', v: 24590, open: 24380, high: 24650, low: 24340, close: 24590 },
      { t: 'Week 4', v: 24872, open: 24590, high: 24915, low: 24550, close: 24872 }
    ]
  },
  banknifty: {
    '1D': [
      { t: '09:15', v: 51820, open: 51800, high: 51880, low: 51760, close: 51820 },
      { t: '09:45', v: 51750, open: 51820, high: 51840, low: 51710, close: 51750 },
      { t: '10:30', v: 51920, open: 51750, high: 51960, low: 51740, close: 51920 },
      { t: '11:15', v: 52040, open: 51920, high: 52070, low: 51900, close: 52040 },
      { t: '12:00', v: 51980, open: 52040, high: 52060, low: 51950, close: 51980 },
      { t: '12:45', v: 52090, open: 51980, high: 52120, low: 51960, close: 52090 },
      { t: '13:30', v: 52050, open: 52090, high: 52110, low: 52020, close: 52050 },
      { t: '14:15', v: 52140, open: 52050, high: 52180, low: 52030, close: 52140 },
      { t: '15:00', v: 52210, open: 52140, high: 52240, low: 52120, close: 52210 },
      { t: '15:30', v: 52180, open: 52210, high: 52230, low: 52160, close: 52180 }
    ],
    '1W': [
      { t: 'Mon', v: 51200, open: 51100, high: 51320, low: 51050, close: 51200 },
      { t: 'Tue', v: 51540, open: 51200, high: 51620, low: 51180, close: 51540 },
      { t: 'Wed', v: 51460, open: 51540, high: 51600, low: 51400, close: 51460 },
      { t: 'Thu', v: 51880, open: 51460, high: 51950, low: 51420, close: 51880 },
      { t: 'Fri', v: 52180, open: 51880, high: 52240, low: 51810, close: 52180 }
    ],
    '1M': [
      { t: 'Week 1', v: 50400, open: 50200, high: 50600, low: 50100, close: 50400 },
      { t: 'Week 2', v: 50950, open: 50400, high: 51100, low: 50350, close: 50950 },
      { t: 'Week 3', v: 51420, open: 50950, high: 51550, low: 50880, close: 51420 },
      { t: 'Week 4', v: 52180, open: 51420, high: 52240, low: 51350, close: 52180 }
    ]
  },
  sensex: {
    '1D': [
      { t: '09:15', v: 81050, open: 81010, high: 81120, low: 80980, close: 81050 },
      { t: '09:45', v: 80980, open: 81050, high: 81080, low: 80940, close: 80980 },
      { t: '10:30', v: 81160, open: 80980, high: 81190, low: 80960, close: 81160 },
      { t: '11:15', v: 81280, open: 81160, high: 81320, low: 81140, close: 81280 },
      { t: '12:00', v: 81220, open: 81280, high: 81300, low: 81190, close: 81220 },
      { t: '12:45', v: 81340, open: 81220, high: 81380, low: 81200, close: 81340 },
      { t: '13:30', v: 81310, open: 81340, high: 81360, low: 81280, close: 81310 },
      { t: '14:15', v: 81410, open: 81310, high: 81450, low: 81290, close: 81410 },
      { t: '15:00', v: 81490, open: 81410, high: 81590, low: 81380, close: 81490 },
      { t: '15:30', v: 81450, open: 81490, high: 81510, low: 81420, close: 81450 }
    ],
    '1W': [
      { t: 'Mon', v: 80200, open: 80050, high: 80350, low: 79980, close: 80200 },
      { t: 'Tue', v: 80680, open: 80200, high: 80780, low: 80150, close: 80680 },
      { t: 'Wed', v: 80550, open: 80680, high: 80720, low: 80450, close: 80550 },
      { t: 'Thu', v: 81120, open: 80550, high: 81250, low: 80500, close: 81120 },
      { t: 'Fri', v: 81450, open: 81120, high: 81590, low: 81020, close: 81450 }
    ],
    '1M': [
      { t: 'Week 1', v: 79400, open: 79100, high: 79600, low: 79050, close: 79400 },
      { t: 'Week 2', v: 80150, open: 79400, high: 80350, low: 79350, close: 80150 },
      { t: 'Week 3', v: 80800, open: 80150, high: 80950, low: 80020, close: 80800 },
      { t: 'Week 4', v: 81450, open: 80800, high: 81590, low: 80750, close: 81450 }
    ]
  }
};

const defaultTopMovers: Stock[] = [
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3582, changePct: 1.74, category: 'Industrials' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1462.8, changePct: 1.28, category: 'Energy' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1288.6, changePct: 1.02, category: 'Banking' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3214.5, changePct: -0.42, category: 'IT' }
];

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const val = Number(payload[0].value);
    return (
      <div className="hero-chart-tooltip">
        <span className="tooltip-time">{label}</span>
        <strong className="tooltip-price">
          {val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
      </div>
    );
  }
  return null;
}

// Custom Candle SVG Renderer for rich trading view
function CandlestickView({ data }: { data: CandlePoint[] }) {
  const minVal = Math.min(...data.map(d => d.low)) - 15;
  const maxVal = Math.max(...data.map(d => d.high)) + 15;
  const range = maxVal - minVal || 1;
  const height = 150;
  const width = 420;
  const step = width / (data.length || 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="candle-svg-chart">
      {/* Horizontal subtle guide lines */}
      <line x1="0" y1="35" x2={width} y2="35" stroke="#1c2c3e" strokeDasharray="3 4" />
      <line x1="0" y1="80" x2={width} y2="80" stroke="#1c2c3e" strokeDasharray="3 4" />
      <line x1="0" y1="125" x2={width} y2="125" stroke="#1c2c3e" strokeDasharray="3 4" />

      {data.map((candle, idx) => {
        const xCenter = idx * step + step / 2;
        const yHigh = height - ((candle.high - minVal) / range) * (height - 30) - 15;
        const yLow = height - ((candle.low - minVal) / range) * (height - 30) - 15;
        const yOpen = height - ((candle.open - minVal) / range) * (height - 30) - 15;
        const yClose = height - ((candle.close - minVal) / range) * (height - 30) - 15;

        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#34d399' : '#f87171';
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(Math.abs(yClose - yOpen), 3);
        const bodyWidth = Math.max(step * 0.45, 8);

        return (
          <g key={candle.t} className="candle-group">
            {/* Wick */}
            <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.5" />
            {/* Real Candle Body */}
            <rect
              x={xCenter - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={color}
              rx="1.5"
            />
            {/* X label */}
            <text
              x={xCenter}
              y={height - 2}
              fill="#6b7d94"
              fontSize="9"
              textAnchor="middle"
            >
              {candle.t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HomePage({ user, stocks = [], onOpenAuth }: HomePageProps) {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState<IndexKey>('nifty');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartMode, setChartMode] = useState<ChartMode>('area');

  const currentMeta = indicesMeta[selectedIndex];
  const currentData = timeframeData[selectedIndex][timeframe];
  const moversToDisplay = stocks.length > 0 
    ? [...stocks].filter(s => !['NIFTY 50', 'SENSEX'].includes(s.symbol)).sort((a, b) => b.changePct - a.changePct).slice(0, 4)
    : defaultTopMovers;

  return (
    <section className="landing-page">
      {/* 1. Global Markets Live Section (Real-Time TradingView Feed at Top) */}
      <div className="global-markets-container top-ticker">
        <div className="global-markets-header">
          <h2>Global Markets</h2>
          <p>
            Global stock market movements impact investor sentiment and confidence in the Indian stock market. Positive trends in major global indices often lead to increased investor optimism, driving up demand for Indian stocks and vice versa.
          </p>
        </div>
        <div className="global-markets-ticker-card">
          <GlobalMarketsTicker />
        </div>
      </div>

      {/* 2. Hero Section */}
      <div className="landing-hero">
        <div className="landing-copy">
          <div className="hero-chip">
            <Sparkles size={13} /> A smarter market workflow
          </div>
          <h2>
            See the market.<br />
            <span>Think with clarity.</span>
          </h2>
          <p>
            Bring market discovery, risk planning and trading review into one calm, focused workspace. Built for traders who value process over noise.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => navigate('/overview')}>
              Explore dashboard <ArrowUpRight size={16} />
            </button>
            <button className="secondary-btn" onClick={() => navigate('/scanner')}>
              Open market scanner
            </button>
          </div>
          <div className="hero-proof">
            <span><ShieldCheck size={15} /> Risk-first workflow</span>
            <span><Activity size={15} /> Research tools</span>
            <span><BookOpen size={15} /> Learning-led</span>
          </div>
        </div>

        {/* Hero Interactive Recharts Mock Window */}
        <div className="hero-visual">
          <div className="visual-glow" />
          <div className="mock-window">
            {/* Window Top Controls with Index Tabs + Chart Mode + Timeframe */}
            <div className="mock-top">
              <div className="window-dots">
                <span /><span /><span />
              </div>

              {/* Index Switcher Tabs */}
              <div className="hero-chart-tabs" role="tablist">
                {(['nifty', 'banknifty', 'sensex'] as IndexKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`chart-tab-btn ${selectedIndex === key ? 'active' : ''}`}
                    onClick={() => setSelectedIndex(key)}
                  >
                    {indicesMeta[key].name}
                  </button>
                ))}
              </div>

              {/* Chart Style Toggle (Area / Candles) */}
              <div className="chart-mode-picker" title="Toggle Chart Style">
                <button
                  type="button"
                  className={`mode-btn ${chartMode === 'area' ? 'active' : ''}`}
                  onClick={() => setChartMode('area')}
                  title="Smooth Area Chart"
                >
                  <AreaIcon size={12} />
                </button>
                <button
                  type="button"
                  className={`mode-btn ${chartMode === 'candles' ? 'active' : ''}`}
                  onClick={() => setChartMode('candles')}
                  title="Candlestick Chart"
                >
                  <CandlestickChart size={12} />
                </button>
              </div>

              {/* Timeframe Picker */}
              <div className="hero-timeframe-picker">
                {(['1D', '1W', '1M'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat Row */}
            <div className="mock-stat">
              <div>
                <small>{currentMeta.name} · {timeframe} {chartMode === 'candles' ? 'CANDLES' : 'TREND'}</small>
                <strong>{currentMeta.value}</strong>
              </div>
              <div className="mock-stat-right">
                <span className="index-change-chip">
                  <TrendingUp size={13} /> {currentMeta.change}
                </span>
                <span className="range-detail">H: {currentMeta.high} · L: {currentMeta.low}</span>
              </div>
            </div>

            {/* Chart Area: Area Chart or Candlestick View */}
            <div className="hero-recharts-box">
              {chartMode === 'area' ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={currentData} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
                    <defs>
                      <linearGradient id={currentMeta.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={currentMeta.color} stopOpacity={0.32} />
                        <stop offset="85%" stopColor={currentMeta.color} stopOpacity={0.03} />
                        <stop offset="100%" stopColor={currentMeta.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="#1b2a3d" vertical={false} />
                    <XAxis 
                      dataKey="t" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6c7c93', fontSize: 10 }}
                      interval={timeframe === '1D' ? 1 : 0}
                    />
                    {/* YAxis domain prevents the flat horizontal line and reveals real price fluctuations */}
                    <YAxis domain={['dataMin - 35', 'dataMax + 25']} hide />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={currentMeta.color}
                      strokeWidth={2.4}
                      fill={`url(#${currentMeta.gradientId})`}
                      activeDot={{ r: 4, fill: currentMeta.color, stroke: '#0d1725', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <CandlestickView data={currentData} />
              )}
            </div>

            {/* Bottom info bar */}
            <div className="mock-bottom">
              <span>
                <i /> {chartMode === 'area' ? 'Interactive Area Wave' : 'Real Candlestick Action'} · Hover to inspect
              </span>
              <span>{timeframe} view</span>
            </div>

            {/* Floating Badge (Repositioned neatly below the window so it never blocks the chart) */}
            <div className="floating-card">
              <div className="float-icon">
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong>Risk-aware by design</strong>
                <small>Plan position size before entering</small>
              </div>
              <span className="float-check">✓</span>
            </div>
          </div>
        </div>
      </div>


      {/* 3. Minimal Trading Intelligence Dashboard Preview */}
      <div className="home-intel-section">
        <div className="home-intel-grid">
          {/* Market Breadth & Sentiment Card */}
          <div className="intel-card">
            <div className="intel-card-header">
              <div>
                <span className="intel-tag">MARKET REGIME</span>
                <h3>Breadth & Flow Indicator</h3>
              </div>
              <span className="regime-pill bullish">
                <span className="pulse-circle" /> Bullish Flow
              </span>
            </div>
            <p className="intel-card-desc">
              Advancers leading across large & mid-cap sectors. Volatility remains compressed below 14.
            </p>

            {/* Visual Breadth Progress Bar */}
            <div className="breadth-widget">
              <div className="breadth-widget-header">
                <span className="breadth-stat green">32 Advancing (64%)</span>
                <span className="breadth-stat red">18 Declining (36%)</span>
              </div>
              <div className="breadth-track">
                <div className="breadth-fill green" style={{ width: '64%' }} />
                <div className="breadth-fill red" style={{ width: '36%' }} />
              </div>
            </div>

            <div className="intel-stats-row">
              <div className="intel-stat-box">
                <small>FII Net (Simulated)</small>
                <strong className="positive">+₹1,420 Cr</strong>
              </div>
              <div className="intel-stat-box">
                <small>DII Net (Simulated)</small>
                <strong className="positive">+₹890 Cr</strong>
              </div>
              <div className="intel-stat-box">
                <small>PCR Vol. Ratio</small>
                <strong>1.18</strong>
              </div>
            </div>
          </div>

          {/* Active Setups & Movers Card */}
          <div className="intel-card">
            <div className="intel-card-header">
              <div>
                <span className="intel-tag">MARKET SCANNER</span>
                <h3>Notable Setups & Movers</h3>
              </div>
              <button 
                type="button" 
                className="intel-link-btn" 
                onClick={() => navigate('/scanner')}
              >
                Scan 50+ stocks <ArrowUpRight size={13} />
              </button>
            </div>
            <p className="intel-card-desc">
              High volume breakouts and momentum leaders identified by the automated scanner.
            </p>

            <div className="intel-movers-list">
              {moversToDisplay.map((stock) => (
                <div 
                  key={stock.symbol}
                  className="intel-mover-row"
                  onClick={() => navigate('/scanner')}
                  title={`Open scanner for ${stock.symbol}`}
                >
                  <div className="mover-identity">
                    <strong>{stock.symbol}</strong>
                    <small>{stock.name}</small>
                  </div>
                  <span className="mover-category">{stock.category}</span>
                  <div className="mover-numbers">
                    <strong>₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    <small className={stock.changePct >= 0 ? 'positive' : 'negative'}>
                      {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </small>
                  </div>
                  <ChevronRight size={14} className="mover-arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Core Capabilities Section */}
      <div className="landing-section-head">
        <div className="section-kicker">BUILT FOR BETTER DECISIONS</div>
        <h2>Your market toolkit, in one place.</h2>
        <p>Start with the essentials. Add depth as your process matures.</p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon blue-feature">
            <Search size={20} />
          </div>
          <h3>Discover</h3>
          <p>Explore instruments and market patterns with searchable, structured scanning tools.</p>
          <button onClick={() => navigate('/scanner')}>Explore scanner <ArrowUpRight size={14} /></button>
        </div>
        <div className="feature-card">
          <div className="feature-icon green-feature">
            <ShieldCheck size={20} />
          </div>
          <h3>Manage risk</h3>
          <p>Calculate position sizing from your own assumptions and define risk before a trade.</p>
          <button onClick={() => navigate('/risk-studio')}>Open Risk Studio <ArrowUpRight size={14} /></button>
        </div>
        <div className="feature-card">
          <div className="feature-icon purple-feature">
            <BookOpen size={20} />
          </div>
          <h3>Learn & review</h3>
          <p>Record the thesis behind your decisions and build a repeatable review habit.</p>
          <button onClick={() => navigate('/journal')}>Open journal <ArrowUpRight size={14} /></button>
        </div>
      </div>

      {/* 5. Bottom Call to Action */}
      <div className="landing-bottom">
        <div>
          <div className="section-kicker">START WITH A CLEARER PROCESS</div>
          <h2>Less noise. More structure.</h2>
          <p>MarketPilot brings your research habits and personal tracking into one workspace.</p>
        </div>
        <button className="primary-btn" onClick={() => user ? navigate('/overview') : onOpenAuth()}>
          {user ? 'Go to workspace' : 'Create your free account'} <ArrowUpRight size={15} />
        </button>
      </div>
      <p className="landing-disclaimer">
        MarketPilot is a software concept. Sample prices are simulated and not live market data. The platform does not provide guaranteed returns or place trades.
      </p>
    </section>
  );
}
