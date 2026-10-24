import { useState } from 'react';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ShieldAlert, 
  CreditCard,
  Lock,
  X
} from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';

interface PlansPageProps {
  user: User | null;
  onOpenAuth: () => void;
  onUserUpdate: (u: User) => void;
  onShowToast: (msg: string) => void;
}

interface PlanDefinition {
  id: 'FREE' | 'PRO' | 'ELITE';
  name: string;
  badge?: string;
  desc: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  icon: typeof ShieldCheck;
  highlighted?: boolean;
  features: string[];
  ctaLabel: string;
}

const PLANS_CONFIG: PlanDefinition[] = [
  {
    id: 'FREE',
    name: 'Starter',
    desc: 'Essential discipline tools for traders building rule-based habits.',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    icon: ShieldCheck,
    features: [
      'Basic market overview & movers',
      '1 active custom watchlist (up to 5 stocks)',
      'Standard trade journal entries',
      'Basic position size calculator',
      'Daily end-of-day market brief',
      'Community discussion access'
    ],
    ctaLabel: 'Start Free'
  },
  {
    id: 'PRO',
    name: 'Pro Trader',
    badge: 'MOST POPULAR',
    desc: 'For active swing & intraday traders who need deep analytics & rapid screening.',
    monthlyPrice: 599,
    annualMonthlyPrice: 479,
    icon: Zap,
    highlighted: true,
    features: [
      'Real-time technical filters & breakout scans',
      'Unlimited custom watchlists with cloud sync',
      'Advanced Journal Analytics (win rate, setup tags)',
      'Multi-leg Risk Studio & drawdown bounds',
      'Price threshold & RSI alerts',
      'Priority Discord trading room access'
    ],
    ctaLabel: 'Upgrade to Pro'
  },
  {
    id: 'ELITE',
    name: 'Elite Institutional',
    badge: 'MAX POWER',
    desc: 'Unrestricted algorithmic screener, multi-broker bridges & custom execution tools.',
    monthlyPrice: 1499,
    annualMonthlyPrice: 1199,
    icon: Crown,
    features: [
      'Everything in Pro Trader, plus:',
      'Direct broker API webhook integration',
      'Custom scanner formulas & indicator creator',
      'Multi-account portfolio risk heatmaps',
      'Exportable tax & compliance CSV/PDF reports',
      'Dedicated 1-on-1 onboarding & SLA support'
    ],
    ctaLabel: 'Get Elite Access'
  }
];

const COMPARISON_ROWS = [
  { category: 'Watchlist & Market Data', feature: 'Simulated Real-Time NSE / BSE Feeds', free: 'Delayed 15m', pro: 'Tick-by-Tick', elite: 'Ultra Low-Latency' },
  { category: 'Watchlist & Market Data', feature: 'Custom Watchlist Limit', free: '1 (Max 5 stocks)', pro: 'Unlimited', elite: 'Unlimited + Shared' },
  { category: 'Watchlist & Market Data', feature: 'Advanced Technical Screener (RSI/MA)', free: 'Basic presets', pro: 'Full multi-criteria', elite: 'Custom Python formulas' },
  { category: 'Discipline & Journal', feature: 'Trade Journal Entries', free: 'Up to 25 trades', pro: 'Unlimited', elite: 'Unlimited + Voice notes' },
  { category: 'Discipline & Journal', feature: 'Journal Performance Analytics', free: '—', pro: 'Full analytics & tags', elite: 'AI Trade Critique Engine' },
  { category: 'Risk & Execution', feature: 'Position Sizing & R:R Studio', free: 'Standard', pro: 'Advanced Multi-Leg', elite: 'Portfolio Stress Test' },
  { category: 'Integrations & Support', feature: 'Broker Bridge (Zerodha / Upstox)', free: '—', pro: 'Manual webhook', elite: 'Direct 1-Click Connect' },
  { category: 'Integrations & Support', feature: 'Support Level', free: 'Community', pro: 'Priority Email / Discord', elite: 'Dedicated Account Manager' }
];

const FAQS = [
  {
    q: 'Can I switch or cancel my plan at any time?',
    a: 'Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time with one click. When upgrading, changes take effect immediately.'
  },
  {
    q: 'Is MarketPilot AI a SEBI registered investment advisor?',
    a: 'No. MarketPilot AI is strictly a technology platform designed for educational analysis, simulated paper-trading, risk modeling, and trade journaling. We never provide buy/sell tips or manage investor capital.'
  },
  {
    q: 'What payment options are accepted?',
    a: 'In live production mode, we support UPI (Google Pay, PhonePe, Paytm), all major Debit/Credit cards (Visa, MasterCard, RuPay), and Net Banking via secure encrypted checkout.'
  },
  {
    q: 'Can I export my journal data for tax filing?',
    a: 'Yes! Pro and Elite members can export their complete trading ledger, setup rationale, and PnL metrics to CSV or spreadsheet format anytime.'
  }
];

export function PlansPage({ user, onOpenAuth, onUserUpdate, onShowToast }: PlansPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanDefinition | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const currentPlan = (user?.subscription?.plan || 'FREE').toUpperCase();

  function handlePlanAction(plan: PlanDefinition) {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (currentPlan === plan.id) {
      onShowToast(`You are already subscribed to the ${plan.name} plan.`);
      return;
    }
    setSelectedPlanForModal(plan);
  }

  async function handleConfirmSubscription() {
    if (!selectedPlanForModal) return;
    setUpgrading(true);
    try {
      const data = await api<{ user: User; message: string }>('/auth/subscription', {
        method: 'PUT',
        body: JSON.stringify({ plan: selectedPlanForModal.id })
      });
      onUserUpdate(data.user);
      onShowToast(data.message || `Switched to ${selectedPlanForModal.name} successfully!`);
      setSelectedPlanForModal(null);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Unable to update subscription.');
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="plans-page-container">
      {/* 1. Hero Section */}
      <section className="plans-hero-section">
        <div className="plans-hero-badge">
          <Sparkles size={13} />
          <span>MARKETPILOT TIERS & PRICING</span>
        </div>
        <h1 className="plans-hero-title">
          Institutional Discipline for <span className="plans-gradient-text">Every Trader</span>
        </h1>
        <p className="plans-hero-desc">
          Choose the toolset built for your style. Eliminate emotion with disciplined sizing, real-time scans, and structured post-trade journals.
        </p>

        {/* Billing Interval Toggle */}
        <div className="billing-toggle-container">
          <span className={`billing-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Monthly</span>
          <button 
            type="button" 
            className="billing-switch-btn" 
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'annual' : 'monthly')}
            aria-label="Toggle annual or monthly billing"
          >
            <div className={`switch-pill ${billingCycle === 'annual' ? 'annual' : 'monthly'}`} />
          </button>
          <span className={`billing-label ${billingCycle === 'annual' ? 'active' : ''}`}>
            Annual
            <span className="save-badge">SAVE 20%</span>
          </span>
        </div>
      </section>

      {/* 2. Interactive Plans Pricing Grid */}
      <section className="plans-cards-grid">
        {PLANS_CONFIG.map((p) => {
          const isCurrent = currentPlan === p.id;
          const price = billingCycle === 'annual' ? p.annualMonthlyPrice : p.monthlyPrice;
          const PlanIcon = p.icon;

          return (
            <div 
              key={p.id} 
              className={`panel plan-pricing-card ${p.highlighted ? 'featured-pricing-card' : ''} ${isCurrent ? 'current-active-tier' : ''}`}
            >
              {p.badge && (
                <div className="popular-ribbon">
                  <Sparkles size={12} /> {p.badge}
                </div>
              )}

              {isCurrent && (
                <div className="active-plan-badge-pill">
                  <Check size={12} /> YOUR ACTIVE PLAN
                </div>
              )}

              <div className="plan-card-header">
                <div className="plan-icon-wrap">
                  <PlanIcon size={20} />
                </div>
                <div>
                  <h3 className="plan-title">{p.name}</h3>
                  <p className="plan-subtitle">{p.desc}</p>
                </div>
              </div>

              <div className="plan-price-block">
                <div className="price-number-row">
                  <span className="price-currency">₹</span>
                  <span className="price-figure">{price}</span>
                  <span className="price-period">/ month</span>
                </div>
                <div className="price-subnote">
                  {p.monthlyPrice === 0 
                    ? 'Free forever • No credit card required' 
                    : billingCycle === 'annual' 
                      ? `Billed annually at ₹${(p.annualMonthlyPrice * 12).toLocaleString('en-IN')}/year` 
                      : 'Billed monthly, cancel anytime'}
                </div>
              </div>

              <div className="plan-features-divider">
                <span>INCLUDED FEATURES</span>
              </div>

              <ul className="plan-features-list">
                {p.features.map((f) => (
                  <li key={f} className="plan-feature-item">
                    <div className="feature-check-icon">
                      <Check size={13} />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="plan-card-action">
                {isCurrent ? (
                  <button type="button" className="secondary-btn plan-btn is-current" disabled>
                    <Check size={14} /> Current Active Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`plan-btn ${p.highlighted ? 'primary-btn' : 'secondary-btn'}`}
                    onClick={() => handlePlanAction(p)}
                  >
                    {!user ? p.ctaLabel : `Switch to ${p.name}`} <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. Detailed Feature Comparison Matrix */}
      <section className="panel plans-comparison-section">
        <div className="comparison-header-row">
          <div className="comparison-title-block">
            <div className="section-kicker">DETAILED SPECIFICATIONS</div>
            <h2>Full Feature Matrix</h2>
            <p>Direct comparison of technical features across all MarketPilot AI tiers.</p>
          </div>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Feature Specification</th>
                <th style={{ width: '20%' }}>Starter (Free)</th>
                <th style={{ width: '20%' }} className="featured-col">Pro Trader</th>
                <th style={{ width: '20%' }}>Elite Institutional</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="comp-feature-name">{row.feature}</div>
                    <div className="comp-category-tag">{row.category}</div>
                  </td>
                  <td>{row.free}</td>
                  <td className="featured-col highlight-cell">{row.pro}</td>
                  <td>{row.elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Enterprise / Prop Desk Banner */}
      <section className="panel enterprise-banner-card">
        <div className="enterprise-banner-content">
          <div className="enterprise-icon-box">
            <Layers size={24} />
          </div>
          <div className="enterprise-text">
            <h3>Need custom seats for a Prop Desk or Family Office?</h3>
            <p>We provide white-label terminal deployments, multi-sub-account risk supervisors, and custom algorithmic backtesting nodes.</p>
          </div>
        </div>
        <button 
          type="button" 
          className="secondary-btn enterprise-contact-btn"
          onClick={() => onShowToast('Enterprise sales desk inquiry logged. Our team will contact your registered email.')}
        >
          Contact Enterprise Sales <ArrowUpRight size={14} />
        </button>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section className="panel plans-faq-section">
        <div className="faq-header">
          <HelpCircle size={18} className="accent-blue" />
          <div>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about plans, billing, and technical capabilities.</p>
          </div>
        </div>

        <div className="faq-items-list">
          {FAQS.map((faq, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <div 
                key={faq.q} 
                className={`faq-card ${isOpen ? 'open' : ''}`}
                onClick={() => setFaqOpenIndex(isOpen ? null : index)}
              >
                <div className="faq-question-row">
                  <span className="faq-q-text">{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {isOpen && (
                  <div className="faq-answer-block">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Regulatory & Risk Disclaimer Footer Note */}
      <div className="plans-regulatory-note">
        <ShieldAlert size={14} className="regulatory-icon" />
        <span>
          <strong>SEBI Compliance Notice:</strong> MarketPilot AI is a financial simulation, algorithmic screening, and trading discipline journal application. 
          MarketPilot does not solicit investments, distribute portfolio management services (PMS), or execute trades directly on public exchanges. Always conduct independent due diligence.
        </span>
      </div>

      {/* 7. Interactive Plan Upgrade / Switch Modal */}
      {selectedPlanForModal && (
        <div className="modal-backdrop" onClick={() => !upgrading && setSelectedPlanForModal(null)}>
          <div 
            className="auth-modal plan-checkout-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ width: 'min(100%, 460px)' }}
          >
            <button 
              className="modal-close" 
              onClick={() => !upgrading && setSelectedPlanForModal(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="checkout-modal-header">
              <div className="checkout-badge">
                <CreditCard size={14} /> INSTANT UPGRADE
              </div>
              <h2>Confirm Plan Switch</h2>
              <p style={{ color: '#889bb5', fontSize: '12px' }}>
                You are updating your MarketPilot cloud account to the <strong>{selectedPlanForModal.name}</strong> tier.
              </p>
            </div>

            <div className="checkout-summary-box">
              <div className="summary-row">
                <span>Selected Plan:</span>
                <strong>{selectedPlanForModal.name}</strong>
              </div>
              <div className="summary-row">
                <span>Billing Interval:</span>
                <span className="summary-tag">{billingCycle.toUpperCase()}</span>
              </div>
              <div className="summary-row">
                <span>Price:</span>
                <strong style={{ color: '#45d6a2', fontSize: '15px' }}>
                  ₹{billingCycle === 'annual' ? selectedPlanForModal.annualMonthlyPrice : selectedPlanForModal.monthlyPrice} / month
                </strong>
              </div>
              {billingCycle === 'annual' && selectedPlanForModal.monthlyPrice > 0 && (
                <div className="summary-row discount-row">
                  <span>Annual Commitment:</span>
                  <span>₹{(selectedPlanForModal.annualMonthlyPrice * 12).toLocaleString('en-IN')} / year (Saved 20%)</span>
                </div>
              )}
            </div>

            <div className="checkout-security-notice">
              <Lock size={13} />
              <span>Sandbox Instant Activation • No lock-in, switch back anytime.</span>
            </div>

            <div className="checkout-btn-group" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1 }}
                onClick={() => setSelectedPlanForModal(null)}
                disabled={upgrading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={handleConfirmSubscription}
                disabled={upgrading}
              >
                {upgrading ? 'Activating...' : `Activate ${selectedPlanForModal.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
