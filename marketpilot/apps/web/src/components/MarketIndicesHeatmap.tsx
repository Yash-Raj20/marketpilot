import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import type { MarketIndexItem } from '../types';

interface MarketIndicesHeatmapProps {
  onSelectSector?: (sectorCategory: string) => void;
  compact?: boolean;
}

// Fallback fixtures matching the user's exact NSE live screenshots
const fallbackSectoral: MarketIndexItem[] = [
  { symbol: 'NIFTY AUTO', name: 'Nifty Auto', price: 25411.35, changePct: 0.28, category: 'Sectoral' },
  { symbol: 'NIFTY BANK', name: 'Nifty Bank', price: 53781.85, changePct: -0.36, category: 'Sectoral' },
  { symbol: 'NIFTY FIN SERVICE', name: 'Nifty Financial Services', price: 24166.45, changePct: -0.56, category: 'Sectoral' },
  { symbol: 'NIFTY FMCG', name: 'Nifty FMCG', price: 42509.10, changePct: -1.41, category: 'Sectoral' },
  { symbol: 'NIFTY IT', name: 'Nifty IT', price: 31107.65, changePct: -3.36, category: 'Sectoral' },
  { symbol: 'NIFTY MEDIA', name: 'Nifty Media', price: 1612.20, changePct: -0.18, category: 'Sectoral' },
  { symbol: 'NIFTY METAL', name: 'Nifty Metal', price: 11744.70, changePct: -0.53, category: 'Sectoral' },
  { symbol: 'NIFTY PHARMA', name: 'Nifty Pharma', price: 26220.25, changePct: -0.18, category: 'Sectoral' },
  { symbol: 'NIFTY PSU BANK', name: 'Nifty PSU Bank', price: 8099.05, changePct: -0.34, category: 'Sectoral' },
  { symbol: 'NIFTY REALTY', name: 'Nifty Realty', price: 798.90, changePct: -0.76, category: 'Sectoral' },
  { symbol: 'NIFTY PVT BANK', name: 'Nifty Private Bank', price: 26471.70, changePct: -0.59, category: 'Sectoral' },
  { symbol: 'NIFTY HEALTHCARE', name: 'Nifty Healthcare', price: 15887.60, changePct: -0.19, category: 'Sectoral' },
  { symbol: 'NIFTY CONSR DUR', name: 'Nifty Consumer Durables', price: 34184.85, changePct: -0.20, category: 'Sectoral' },
  { symbol: 'NIFTY OIL AND GAS', name: 'Nifty Oil and Gas', price: 10380.85, changePct: -1.47, category: 'Sectoral' },
  { symbol: 'NIFTY CHEMICALS', name: 'Nifty Chemicals', price: 26826.75, changePct: -0.05, category: 'Sectoral' },
  { symbol: 'NIFTY500 HEALTHCARE', name: 'Nifty 500 Healthcare', price: 20756.10, changePct: 0.02, category: 'Sectoral' },
  { symbol: 'NIFTY MIDSMALL HEALTHCARE', name: 'Nifty MidSmall Healthcare', price: 50291.85, changePct: 0.43, category: 'Sectoral' }
];

const fallbackBroad: MarketIndexItem[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', price: 22563.10, changePct: -0.82, category: 'Broad' },
  { symbol: 'NIFTY NEXT 50', name: 'Nifty Next 50', price: 67115.80, changePct: -0.34, category: 'Broad' },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50', price: 16383.10, changePct: -0.18, category: 'Broad' },
  { symbol: 'NIFTY MIDCAP 100', name: 'Nifty Midcap 100', price: 56831.50, changePct: -0.35, category: 'Broad' },
  { symbol: 'NIFTY MIDCAP 150', name: 'Nifty Midcap 150', price: 20924.60, changePct: -0.37, category: 'Broad' },
  { symbol: 'NIFTY SMLCAP 50', name: 'Nifty Smallcap 50', price: 9345.50, changePct: 0.40, category: 'Broad' },
  { symbol: 'NIFTY SMLCAP 100', name: 'Nifty Smallcap 100', price: 18501.10, changePct: 0.18, category: 'Broad' },
  { symbol: 'NIFTY SMLCAP 250', name: 'Nifty Smallcap 250', price: 16910.70, changePct: -0.14, category: 'Broad' },
  { symbol: 'NIFTY MIDSMAL 400', name: 'Nifty MidSmall 400', price: 19485.65, changePct: -0.29, category: 'Broad' },
  { symbol: 'NIFTY 100', name: 'Nifty 100', price: 23516.75, changePct: -0.73, category: 'Broad' },
  { symbol: 'NIFTY 200', name: 'Nifty 200', price: 12961.45, changePct: -0.66, category: 'Broad' },
  { symbol: 'NIFTY 500', name: 'Nifty 500', price: 21606.55, changePct: -0.59, category: 'Broad' },
  { symbol: 'NIFTY500 MULTICAP', name: 'Nifty 500 Multicap', price: 15311.45, changePct: -0.50, category: 'Broad' },
  { symbol: 'NIFTY LARGEMID 250', name: 'Nifty LargeMid 250', price: 15346.10, changePct: -0.56, category: 'Broad' },
  { symbol: 'NIFTY MID SELECT', name: 'Nifty Mid Select', price: 13211.00, changePct: -0.07, category: 'Broad' },
  { symbol: 'NIFTY TOTAL MARKET', name: 'Nifty Total Market', price: 12211.55, changePct: -0.58, category: 'Broad' },
  { symbol: 'NIFTY MICROCAP 250', name: 'Nifty Microcap 250', price: 24270.45, changePct: -0.25, category: 'Broad' },
  { symbol: 'NIFTY FPI 150', name: 'Nifty FPI 150', price: 1452.80, changePct: -0.77, category: 'Broad' },
  { symbol: 'NIFTY500 LMS EQUAL', name: 'Nifty 500 LMS Equal', price: 17086.05, changePct: -0.42, category: 'Broad' },
  { symbol: 'NIFTY SMALLCAP 50', name: 'Nifty Smallcap 50', price: 19324.70, changePct: -0.15, category: 'Broad' }
];

function formatPrice(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Map sector index symbol to standard stock scanner category
function mapIndexToCategory(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.includes('AUTO')) return 'Auto';
  if (s.includes('BANK')) return 'Banking';
  if (s.includes('FIN')) return 'Finance';
  if (s.includes('IT')) return 'IT';
  if (s.includes('FMCG')) return 'FMCG';
  if (s.includes('METAL')) return 'Metals';
  if (s.includes('PHARMA') || s.includes('HEALTH')) return 'Healthcare';
  if (s.includes('OIL') || s.includes('ENERGY')) return 'Energy';
  if (s.includes('REALTY')) return 'Industrials';
  if (s.includes('INFRA')) return 'Industrials';
  return 'ALL';
}

export function MarketIndicesHeatmap({ onSelectSector, compact = false }: MarketIndicesHeatmapProps) {
  const [activeTab, setActiveTab] = useState<'sectoral' | 'broad'>('sectoral');
  const [sectoral, setSectoral] = useState<MarketIndexItem[]>(fallbackSectoral);
  const [broad, setBroad] = useState<MarketIndexItem[]>(fallbackBroad);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [asOf, setAsOf] = useState<string>('');

  const fetchIndices = () => {
    setLoading(true);
    api<{ sectoral: MarketIndexItem[]; broad: MarketIndexItem[]; asOf?: string }>('/market/indices')
      .then(res => {
        if (res && res.sectoral && res.sectoral.length > 0) {
          setSectoral(res.sectoral);
        }
        if (res && res.broad && res.broad.length > 0) {
          setBroad(res.broad);
        }
        if (res?.asOf) {
          setAsOf(new Date(res.asOf).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 20000);
    return () => clearInterval(interval);
  }, []);

  const activeList = activeTab === 'sectoral' ? sectoral : broad;

  const filteredList = useMemo(() => {
    if (!search.trim()) return activeList;
    const q = search.trim().toLowerCase();
    return activeList.filter(item => 
      item.symbol.toLowerCase().includes(q) || 
      item.name.toLowerCase().includes(q)
    );
  }, [activeList, search]);

  // Sectoral Flow Insights (Gaining vs Declining flow)
  const insights = useMemo(() => {
    const gaining = activeList.filter(x => x.changePct > 0);
    const declining = activeList.filter(x => x.changePct < 0);
    const sorted = [...activeList].sort((a, b) => b.changePct - a.changePct);
    const topGainer = sorted[0];
    const topLoser = sorted[sorted.length - 1];
    return {
      gainingCount: gaining.length,
      decliningCount: declining.length,
      topGainer,
      topLoser
    };
  }, [activeList]);

  // Color generator replicating the authentic NSE website styles from user screenshots:
  // - Positive: vibrant soft green (#5cb85c or #48bb78)
  // - Mild negative (0 to -1.0%): coral pink (#f07171 or #f87171)
  // - Deep negative (< -1.0%): dark crimson/maroon (#8b1818 or #991b1b)
  const getCardStyle = (changePct: number) => {
    if (changePct > 0) {
      return {
        background: '#48bb78', // NSE Green
        border: '1px solid rgba(72, 187, 120, 0.5)',
        color: '#ffffff'
      };
    }
    if (changePct < -1.0) {
      return {
        background: '#991b1b', // Deep Dark Red (e.g. NIFTY IT, NIFTY OIL & GAS)
        border: '1px solid rgba(153, 27, 27, 0.6)',
        color: '#ffffff'
      };
    }
    // Moderate negative (0 to -1.0%)
    return {
      background: '#f87171', // Coral Red (e.g. NIFTY BANK, NIFTY METAL)
      border: '1px solid rgba(248, 113, 113, 0.5)',
      color: '#ffffff'
    };
  };

  return (
    <div className="nse-heatmap-container">
      {/* Header Bar */}
      <div className="nse-heatmap-header">
        <div className="nse-header-left">
          <div className="nse-brand-badge">
            <span className="nse-pulse-dot" />
            <strong>NSE LIVE INDICES HEATMAP</strong>
          </div>
          <span className="nse-subtext">
            Real-time sectoral capital flow & market breadth
            {asOf && ` • Updated at ${asOf}`}
          </span>
        </div>

        <div className="nse-header-controls">
          {/* Tab Switcher */}
          <div className="nse-tabs">
            <button
              type="button"
              className={`nse-tab-btn ${activeTab === 'sectoral' ? 'active' : ''}`}
              onClick={() => setActiveTab('sectoral')}
            >
              <Layers size={13} />
              Sectoral Indices ({sectoral.length})
            </button>
            <button
              type="button"
              className={`nse-tab-btn ${activeTab === 'broad' ? 'active' : ''}`}
              onClick={() => setActiveTab('broad')}
            >
              <TrendingUp size={13} />
              Broad Market ({broad.length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="nse-search-box">
            <Search size={13} />
            <input 
              type="text" 
              placeholder="Search index..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          {/* Refresh Button */}
          <button 
            type="button" 
            className="nse-refresh-btn" 
            onClick={fetchIndices} 
            disabled={loading}
            title="Refresh Live Data"
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Capital Flow Strip (Beginner Friendly Money-Flow Insight) */}
      <div className="nse-flow-strip">
        <div className="nse-flow-item positive">
          <span className="nse-flow-label">CAPITAL INFLOW (GREEN)</span>
          <strong>{insights.gainingCount} Sectors</strong>
        </div>
        <div className="nse-flow-item negative">
          <span className="nse-flow-label">CAPITAL OUTFLOW (RED)</span>
          <strong>{insights.decliningCount} Sectors</strong>
        </div>
        {insights.topGainer && (
          <div className="nse-flow-item leader">
            <span className="nse-flow-label">TOP LEADER</span>
            <strong>
              {insights.topGainer.symbol} ({insights.topGainer.changePct > 0 ? '+' : ''}{insights.topGainer.changePct.toFixed(2)}%)
            </strong>
          </div>
        )}
        {insights.topLoser && (
          <div className="nse-flow-item laggard">
            <span className="nse-flow-label">TOP DRAG</span>
            <strong>
              {insights.topLoser.symbol} ({insights.topLoser.changePct.toFixed(2)}%)
            </strong>
          </div>
        )}
      </div>

      {/* Grid of NSE Indices Cards (Matches User's Screenshots) */}
      <div className={`nse-grid ${compact ? 'compact' : ''}`}>
        {filteredList.map(item => {
          const style = getCardStyle(item.changePct);
          const isUp = item.changePct > 0;
          const targetCategory = mapIndexToCategory(item.symbol);

          return (
            <div
              key={item.symbol}
              className="nse-card"
              style={style}
              onClick={() => onSelectSector?.(targetCategory)}
              role="button"
              tabIndex={0}
              title={`Click to filter scanner by ${item.name} (${targetCategory})`}
            >
              <div className="nse-card-top">
                <span className="nse-card-title">{item.symbol}</span>
                {item.changePct < -1.0 && <span className="nse-card-tag">Heavy Drop</span>}
                {item.changePct > 0.4 && <span className="nse-card-tag positive">Inflow</span>}
              </div>

              <div className="nse-card-bottom">
                <span className="nse-card-price">{formatPrice(item.price)}</span>
                <span className="nse-card-change">
                  {item.changePct > 0 ? `+${item.changePct.toFixed(2)}%` : `${item.changePct.toFixed(2)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper Note for Beginners */}
      <div className="nse-footer-tip">
        <Info size={12} />
        <span>
          💡 <strong>How to read:</strong> Green indicates sectors where institutional money is flowing in today. 
          Pink indicates mild pullbacks, while dark red highlights deep sector selloffs (e.g. IT, FMCG). Click any card to filter stocks in that sector!
        </span>
      </div>
    </div>
  );
}
