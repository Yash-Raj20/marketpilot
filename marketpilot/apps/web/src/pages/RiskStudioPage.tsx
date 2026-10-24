import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function money(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function RiskStudioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL params if navigated from Scanner/Watchlist
  const initialSymbol = searchParams.get('symbol') || 'RELIANCE';
  const initialPrice = searchParams.get('price') || '1460';

  const [symbol, setSymbol] = useState(initialSymbol);
  const [capital, setCapital] = useState('200000');
  const [riskPct, setRiskPct] = useState('1.0');
  const [entryPrice, setEntryPrice] = useState(initialPrice);

  // Default stop loss 1.5% below entry, target 3% above entry (1:2 R:R)
  const defaultEntry = Number(initialPrice) || 1000;
  const [stopPrice, setStopPrice] = useState((defaultEntry * 0.985).toFixed(2));
  const [targetPrice, setTargetPrice] = useState((defaultEntry * 1.03).toFixed(2));

  // Sync if URL search params change
  useEffect(() => {
    const s = searchParams.get('symbol');
    const p = searchParams.get('price');
    if (s) setSymbol(s);
    if (p) {
      setEntryPrice(p);
      const numP = Number(p);
      if (numP > 0) {
        setStopPrice((numP * 0.985).toFixed(2));
        setTargetPrice((numP * 1.03).toFixed(2));
      }
    }
  }, [searchParams]);

  const c = Math.max(0, Number(capital) || 0);
  const r = Math.max(0, Number(riskPct) || 0);
  const entry = Math.max(0, Number(entryPrice) || 0);
  const stop = Math.max(0, Number(stopPrice) || 0);
  const target = Math.max(0, Number(targetPrice) || 0);

  // Calculations
  const maxRiskAmount = (c * r) / 100;
  const riskPerShare = Math.max(0, entry - stop);
  const rewardPerShare = Math.max(0, target - entry);

  const stopLossPct = entry > 0 ? ((entry - stop) / entry) * 100 : 0;
  const rewardPct = entry > 0 ? ((target - entry) / entry) * 100 : 0;

  const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
  const calculatedQty = riskPerShare > 0 ? Math.floor(maxRiskAmount / riskPerShare) : 0;
  const totalPositionValue = calculatedQty * entry;
  const portfolioAllocationPct = c > 0 ? (totalPositionValue / c) * 100 : 0;
  const potentialProfit = calculatedQty * rewardPerShare;

  const isHealthyRR = rrRatio >= 1.5;

  return (
    <section className="risk-studio-layout">
      {/* 1. Left Column: Input Form & Presets */}
      <div className="panel page-panel risk-input-panel">
        <div className="panel-heading" style={{ marginBottom: 14 }}>
          <div>
            <div className="section-kicker">POSITION SIZING ENGINE</div>
            <h2>Risk Studio & Calculator</h2>
            <p className="panel-description">
              Determine exact shares to buy based on your account size and maximum planned risk threshold.
            </p>
          </div>
        </div>

        {/* Quick Instrument & Capital Setup */}
        <div className="risk-inputs-grid">
          <div className="form-grid-2col">
            <label>
              Instrument Symbol
              <input
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE, INFY"
              />
            </label>

            <label>
              Trading Capital (₹)
              <input
                type="number"
                min="1000"
                step="5000"
                value={capital}
                onChange={e => setCapital(e.target.value)}
              />
            </label>
          </div>

          {/* Quick Risk Percentage Presets */}
          <div className="risk-preset-selector">
            <span className="risk-preset-label">Max Risk Per Trade:</span>
            <div className="risk-preset-pills">
              {['0.5', '1.0', '1.5', '2.0', '3.0'].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`risk-pill ${riskPct === val ? 'active' : ''}`}
                  onClick={() => setRiskPct(val)}
                >
                  {val}% {val === '1.0' && '★'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-3col">
            <label>
              Entry Price (₹)
              <input
                type="number"
                min="0.01"
                step="0.05"
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
              />
            </label>

            <label>
              Stop Loss (₹)
              <input
                type="number"
                min="0.01"
                step="0.05"
                value={stopPrice}
                onChange={e => setStopPrice(e.target.value)}
              />
            </label>

            <label>
              Target / Take Profit (₹)
              <input
                type="number"
                min="0.01"
                step="0.05"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Visual Risk-Reward Gauge */}
        <div className="rr-visual-box">
          <div className="rr-visual-header">
            <span>Risk-to-Reward Profile</span>
            <span className={`rr-badge ${isHealthyRR ? 'healthy' : 'warning'}`}>
              {isHealthyRR ? '✓ Favorable' : '⚠ Low Ratio'} 1 : {rrRatio.toFixed(2)}
            </span>
          </div>

          <div className="rr-dual-bar">
            <div 
              className="rr-bar-risk" 
              style={{ width: `${Math.max(15, Math.min(60, (1 / (1 + (rrRatio || 1))) * 100))}%` }}
              title={`Risk: ₹${money(maxRiskAmount)} (-${stopLossPct.toFixed(2)}%)`}
            >
              <span>Risk ₹{money(maxRiskAmount)}</span>
            </div>
            <div 
              className="rr-bar-reward" 
              style={{ width: `${Math.max(40, Math.min(85, ((rrRatio || 1) / (1 + (rrRatio || 1))) * 100))}%` }}
              title={`Reward: ₹${money(potentialProfit)} (+${rewardPct.toFixed(2)}%)`}
            >
              <span>Reward ₹{money(potentialProfit)}</span>
            </div>
          </div>
          <div className="rr-bar-labels">
            <span className="stop-text">Stop Loss: ₹{money(stop)} (-{stopLossPct.toFixed(2)}%)</span>
            <span className="entry-text">Entry: ₹{money(entry)}</span>
            <span className="target-text">Target: ₹{money(target)} (+{rewardPct.toFixed(2)}%)</span>
          </div>
        </div>

        {/* Institutional Risk Principles Checklist */}
        <div className="risk-checklist-card">
          <div className="checklist-heading">
            <ShieldCheck size={16} className="accent-green" />
            <strong>Institutional Capital Preservation Rules</strong>
          </div>
          <ul className="checklist-items">
            <li>
              <CheckCircle2 size={13} className="check-icon" />
              <span>
                <strong>1% Rule:</strong> Never exceed 1–2% total portfolio drawdown on any individual trade.
              </span>
            </li>
            <li>
              <CheckCircle2 size={13} className="check-icon" />
              <span>
                <strong>Asymmetric Upside:</strong> Only execute trades with minimum 1:1.5 or higher Risk-to-Reward.
              </span>
            </li>
            <li>
              <CheckCircle2 size={13} className="check-icon" />
              <span>
                <strong>Fixed Invalidation:</strong> Once position is entered, never widen your stop loss downward.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. Right Column: Sizing Blueprint Output */}
      <div className="panel risk-result-panel">
        <div className="sizing-card-header">
          <div className="ai-orb">
            <Calculator size={22} />
          </div>
          <div>
            <div className="section-kicker">SIZING BLUEPRINT</div>
            <h3>Calculated Position Allocation</h3>
          </div>
        </div>

        {/* Big Recommended Quantity Callout */}
        <div className="sizing-hero-stat">
          <div className="stat-label">Recommended Share Quantity</div>
          <div className="stat-highlight">
            {calculatedQty.toLocaleString('en-IN')} <span className="unit-tag">SHARES</span>
          </div>
          <p className="stat-note">
            Buying this quantity caps your loss at exactly ₹{money(maxRiskAmount)} if stopped out.
          </p>
        </div>

        {/* Metric Details Breakdown */}
        <div className="sizing-breakdown-list">
          <div className="breakdown-row">
            <span>Defined Capital Risk</span>
            <strong className="loss-val">-₹{money(maxRiskAmount)} ({riskPct}%)</strong>
          </div>
          <div className="breakdown-row">
            <span>Stop Distance (Per Share)</span>
            <strong>₹{money(riskPerShare)} ({stopLossPct.toFixed(2)}%)</strong>
          </div>
          <div className="breakdown-row">
            <span>Target Gain (Per Share)</span>
            <strong className="profit-val">+₹{money(rewardPerShare)} ({rewardPct.toFixed(2)}%)</strong>
          </div>
          <div className="breakdown-row">
            <span>Total Capital Deployed</span>
            <strong>₹{money(totalPositionValue)}</strong>
          </div>
          <div className="breakdown-row">
            <span>Portfolio Exposure</span>
            <span className={`exposure-tag ${portfolioAllocationPct > 50 ? 'high-exposure' : 'safe-exposure'}`}>
              {portfolioAllocationPct.toFixed(1)}% of capital
            </span>
          </div>
          <div className="breakdown-row highlight-profit">
            <span>Potential Profit at Target</span>
            <strong className="profit-val">+₹{money(potentialProfit)}</strong>
          </div>
        </div>

        {/* Scenario Analysis Matrix */}
        <div className="scenario-matrix-box">
          <div className="matrix-title">Scenario Matrix:</div>
          <div className="matrix-grid">
            <div className="matrix-cell target-3r">
              <small>3R Moonshot</small>
              <strong>+₹{money(maxRiskAmount * 3)}</strong>
            </div>
            <div className="matrix-cell target-2r">
              <small>2R Standard</small>
              <strong>+₹{money(maxRiskAmount * 2)}</strong>
            </div>
            <div className="matrix-cell target-1r">
              <small>1R Par</small>
              <strong>+₹{money(maxRiskAmount * 1)}</strong>
            </div>
            <div className="matrix-cell stop-hit">
              <small>Stop Loss</small>
              <strong>-₹{money(maxRiskAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Direct Action: Transfer Setup to Trading Journal */}
        <div className="studio-actions-footer">
          <button
            type="button"
            className="primary-btn log-to-journal-btn"
            onClick={() => {
              navigate('/journal');
            }}
          >
            <BookOpen size={16} />
            <span>Transfer Setup to Journal</span>
          </button>
          <small className="studio-disclaimer">
            *Simulation engine only. Excludes slippage, broker fees, taxes, and liquidity constraints.
          </small>
        </div>
      </div>
    </section>
  );
}
