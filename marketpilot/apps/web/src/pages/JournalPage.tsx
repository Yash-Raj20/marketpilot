import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  BookOpen, 
  Edit2, 
  Trash2, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Tag, 
  Sparkles,
  Layers,
  Coins
} from 'lucide-react';
import { api } from '../lib/api';
import type { JournalEntry, JournalAnalytics, User } from '../types';

interface JournalPageProps {
  journal: JournalEntry[];
  user: User | null;
  onOpenAuth: () => void;
  onSaveEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  onUpdateEntry: (id: string, entry: Partial<JournalEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const SETUP_PRESETS = [
  'Breakout',
  'Support Rebound',
  'Trend Continuation',
  'Moving Avg Crossover',
  'Pullback / Dip Buy',
  'Volume Spike'
];

function money(n: number | string) {
  const num = typeof n === 'number' ? n : Number(n) || 0;
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function JournalPage({ 
  journal, 
  user, 
  onOpenAuth, 
  onSaveEntry, 
  onUpdateEntry, 
  onDeleteEntry 
}: JournalPageProps) {
  const [entry, setEntry] = useState({
    symbol: 'RELIANCE',
    side: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '1462.80',
    quantity: '10',
    notes: ''
  });

  const [selectedTag, setSelectedTag] = useState('');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);

  // History filtering
  const [historySearch, setHistorySearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  useEffect(() => {
    if (user) {
      api<{ analytics: JournalAnalytics }>('/journal/analytics')
        .then(d => setAnalytics(d.analytics))
        .catch(() => {});
    }
  }, [user, journal]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const finalNotes = selectedTag 
      ? `[Setup: ${selectedTag}] ${entry.notes}`.trim()
      : entry.notes.trim();

    await onSaveEntry({
      symbol: entry.symbol.toUpperCase(),
      side: entry.side,
      entryPrice: Number(entry.entryPrice),
      quantity: Number(entry.quantity),
      notes: finalNotes
    });
    setEntry(v => ({ ...v, notes: '' }));
    setSelectedTag('');
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    await onUpdateEntry(editingEntry.id, {
      symbol: editingEntry.symbol.toUpperCase(),
      side: editingEntry.side,
      entryPrice: Number(editingEntry.entryPrice),
      quantity: Number(editingEntry.quantity),
      notes: editingEntry.notes
    });
    setEditingEntry(null);
  }

  const filteredHistory = useMemo(() => {
    return journal.filter(j => {
      const matchText = `${j.symbol} ${j.notes || ''}`.toLowerCase().includes(historySearch.toLowerCase());
      if (!matchText) return false;
      if (sideFilter !== 'ALL' && j.side !== sideFilter) return false;
      return true;
    });
  }, [journal, historySearch, sideFilter]);

  // Projected capital for currently composed trade
  const plannedValue = (Number(entry.entryPrice) || 0) * (Number(entry.quantity) || 0);

  return (
    <>
      {/* 1. Analytics Metric Grid */}
      {user && (
        <section className="metric-grid journal-analytics-grid" style={{ marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-top">
              <span>Total Recorded</span>
              <BookOpen size={14} className="accent-blue" />
            </div>
            <div className="metric-value">{analytics?.totalTrades ?? journal.length}</div>
            <div className="metric-detail">Discipline log entries</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Long vs Short</span>
              <Layers size={14} className="accent-blue" />
            </div>
            <div className="metric-value">
              <span style={{ color: '#45d6a2' }}>{analytics?.buys ?? journal.filter(j => j.side === 'BUY').length} BUY</span>
              <span style={{ color: '#475569', margin: '0 6px' }}>/</span>
              <span style={{ color: '#f87171' }}>{analytics?.sells ?? journal.filter(j => j.side === 'SELL').length} SELL</span>
            </div>
            <div className="metric-detail">Trade execution direction</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Committed Capital</span>
              <Coins size={14} className="accent-blue" />
            </div>
            <div className="metric-value">
              ₹{(analytics?.totalCapitalCommitted ?? journal.reduce((acc, j) => acc + (Number(j.entryPrice) * j.quantity), 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="metric-detail">Simulated portfolio exposure</div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Active Symbols</span>
              <Tag size={14} className="accent-blue" />
            </div>
            <div className="metric-value">
              {analytics?.uniqueSymbolsCount ?? new Set(journal.map(j => j.symbol)).size}
            </div>
            <div className="metric-detail">Distinct instruments recorded</div>
          </div>
        </section>
      )}

      {/* 2. Main Two-Column Layout */}
      <section className="journal-layout">
        {/* Left Column: Trade Entry Form */}
        <div className="panel page-panel journal-form-panel">
          <div className="section-kicker">EXECUTION LOG</div>
          <h2>Log Practice Trade</h2>
          <p className="panel-description">
            Reinforce your trade setup thesis, risk parameters, and emotional discipline.
          </p>

          <form className="journal-form" onSubmit={handleCreate}>
            <div className="journal-form-inputs-row">
              {/* Custom Side Toggle (Replaces ugly native select) */}
              <div className="form-field-row side-field">
                <label>Order Action / Side</label>
                <div className="side-toggle-group">
                  <button
                    type="button"
                    className={`side-toggle-btn buy ${entry.side === 'BUY' ? 'active' : ''}`}
                    onClick={() => setEntry({ ...entry, side: 'BUY' })}
                  >
                    <TrendingUp size={15} />
                    <span>BUY</span>
                  </button>
                  <button
                    type="button"
                    className={`side-toggle-btn sell ${entry.side === 'SELL' ? 'active' : ''}`}
                    onClick={() => setEntry({ ...entry, side: 'SELL' })}
                  >
                    <TrendingDown size={15} />
                    <span>SELL</span>
                  </button>
                </div>
              </div>

              <label>
                Instrument Symbol
                <input
                  required
                  placeholder="e.g. INFY, TCS"
                  value={entry.symbol}
                  onChange={e => setEntry({ ...entry, symbol: e.target.value.toUpperCase() })}
                />
              </label>

              <label>
                Entry Price (₹)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={entry.entryPrice}
                  onChange={e => setEntry({ ...entry, entryPrice: e.target.value })}
                />
              </label>

              <label>
                Quantity (Units)
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={entry.quantity}
                  onChange={e => setEntry({ ...entry, quantity: e.target.value })}
                />
              </label>

              <div className="notional-calc-box">
                <span className="notional-label">Notional Exposure</span>
                <strong className="notional-value">₹{money(plannedValue)}</strong>
              </div>
            </div>

            {/* Quick Setup Tag Chips */}
            <div className="setup-tags-section">
              <span className="tags-kicker"><Sparkles size={12} /> Setup Classification:</span>
              <div className="setup-chips-row">
                {SETUP_PRESETS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`setup-chip ${selectedTag === t ? 'active' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="full-label">
              Trade Rationale / Invalidation Plan
              <textarea
                rows={2}
                maxLength={2000}
                placeholder="What triggered this entry? What is your technical invalidation level and risk-reward plan?"
                value={entry.notes}
                onChange={e => setEntry({ ...entry, notes: e.target.value })}
              />
            </label>

            <button className="primary-btn submit-journal-btn" type="submit">
              <span>Save to Trading Journal</span>
              <ArrowUpRight size={16} />
            </button>
          </form>
        </div>

        {/* Right Column: Journal History */}
        <div className="panel page-panel journal-history-panel">
          <div className="panel-heading" style={{ marginBottom: 12 }}>
            <div>
              <div className="section-kicker">RECORDED SESSIONS</div>
              <h2>Journal History ({journal.length})</h2>
            </div>

            {/* Side filter pills */}
            <div className="history-filter-pills">
              <button 
                type="button"
                className={`history-pill-btn ${sideFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSideFilter('ALL')}
              >
                All
              </button>
              <button 
                type="button"
                className={`history-pill-btn ${sideFilter === 'BUY' ? 'active' : ''}`}
                onClick={() => setSideFilter('BUY')}
              >
                BUY
              </button>
              <button 
                type="button"
                className={`history-pill-btn ${sideFilter === 'SELL' ? 'active' : ''}`}
                onClick={() => setSideFilter('SELL')}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Search bar within journal */}
          {journal.length > 0 && (
            <div className="journal-search-wrap">
              <Search size={14} />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search history by symbol or thesis notes…"
              />
              {historySearch && (
                <button type="button" onClick={() => setHistorySearch('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* List of Journal Entries */}
          <div className="journal-history-list">
            {filteredHistory.length ? (
              filteredHistory.map((j) => {
                const totalVal = Number(j.entryPrice) * j.quantity;
                return (
                  <div className="journal-entry-card" key={j.id}>
                    <div className="entry-card-header">
                      <div className="entry-symbol-badge-row">
                        <span className={`side-badge ${j.side.toLowerCase()}`}>
                          {j.side === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {j.side}
                        </span>
                        <strong className="entry-sym-title">{j.symbol}</strong>
                      </div>

                      <div className="entry-actions-btn-group">
                        <button
                          className="journal-action-btn"
                          onClick={() => setEditingEntry(j)}
                          title="Edit trade entry"
                          aria-label="Edit entry"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="journal-action-btn delete"
                          onClick={() => onDeleteEntry(j.id)}
                          title="Delete trade entry"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="entry-card-numbers">
                      <div className="num-block">
                        <small>Entry Price</small>
                        <span>₹{money(j.entryPrice)}</span>
                      </div>
                      <div className="num-block">
                        <small>Quantity</small>
                        <span>{j.quantity} Units</span>
                      </div>
                      <div className="num-block">
                        <small>Notional Exposure</small>
                        <strong style={{ color: '#e2e8f0' }}>₹{money(totalVal)}</strong>
                      </div>
                    </div>

                    {j.notes && (
                      <div className="entry-notes-quote">
                        <p>{j.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state journal-empty-box">
                <BookOpen size={28} />
                <strong>{journal.length === 0 ? 'Your journal is empty' : 'No matching entries found'}</strong>
                <span>
                  {journal.length === 0 
                    ? 'Start recording your trades, setups, and post-trade reflections above.' 
                    : 'Try clearing your search query or side filter.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Sleek Edit Entry Modal (NO native selects!) */}
      {editingEntry && (
        <div className="modal-backdrop" onClick={() => setEditingEntry(null)}>
          <div 
            className="auth-modal journal-edit-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ width: 'min(100%, 460px)' }}
          >
            <button 
              className="modal-close" 
              onClick={() => setEditingEntry(null)}
              aria-label="Close edit modal"
            >
              <X size={18} />
            </button>
            <div className="inspector-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Edit Trade Entry</h2>
                <small style={{ color: '#7b8da5' }}>Update entry metrics, trade thesis, or positioning.</small>
              </div>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 14 }}>
              <div className="form-field-row">
                <label>Side</label>
                <div className="side-toggle-group">
                  <button
                    type="button"
                    className={`side-toggle-btn buy ${editingEntry.side === 'BUY' ? 'active' : ''}`}
                    onClick={() => setEditingEntry({ ...editingEntry, side: 'BUY' })}
                  >
                    <TrendingUp size={14} /> BUY
                  </button>
                  <button
                    type="button"
                    className={`side-toggle-btn sell ${editingEntry.side === 'SELL' ? 'active' : ''}`}
                    onClick={() => setEditingEntry({ ...editingEntry, side: 'SELL' })}
                  >
                    <TrendingDown size={14} /> SELL
                  </button>
                </div>
              </div>

              <div className="form-grid-2col">
                <label>
                  Symbol
                  <input
                    required
                    value={editingEntry.symbol}
                    onChange={e => setEditingEntry({ ...editingEntry, symbol: e.target.value.toUpperCase() })}
                  />
                </label>

                <label>
                  Entry Price (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editingEntry.entryPrice}
                    onChange={e => setEditingEntry({ ...editingEntry, entryPrice: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label>
                Quantity
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={editingEntry.quantity}
                  onChange={e => setEditingEntry({ ...editingEntry, quantity: Number(e.target.value) })}
                />
              </label>

              <label>
                Trade Notes / Setup Rationale
                <textarea
                  rows={3}
                  value={editingEntry.notes || ''}
                  onChange={e => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                />
              </label>

              <button className="primary-btn" type="submit" style={{ marginTop: 6 }}>
                Update Trade Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
