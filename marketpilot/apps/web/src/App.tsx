import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Command, X } from 'lucide-react';
import { api, setToken } from './lib/api';
import type { Stock, User, JournalEntry, PlatformAlert } from './types';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AuthModal } from './components/AuthModal';
import { AlertStack } from './components/AlertStack';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';

import { HomePage } from './pages/HomePage';
import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { JournalPage } from './pages/JournalPage';
import { RiskStudioPage } from './pages/RiskStudioPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlansPage } from './pages/PlansPage';
import { AdminPage } from './pages/AdminPage';

const fallbackStocks: Stock[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50 Index', price: 24872.3, changePct: 0.64, category: 'Index', volume: '34.2M', rsi: 62 },
  { symbol: 'BANK NIFTY', name: 'Bank Nifty Index', price: 52180.4, changePct: 0.92, category: 'Index', volume: '18.5M', rsi: 65 },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', price: 81450.2, changePct: 0.52, category: 'Index', volume: '12.1M', rsi: 59 },
  { symbol: 'INDIA VIX', name: 'Volatility Index', price: 13.42, changePct: -2.10, category: 'Index', volume: '4.8M', rsi: 38 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1462.8, changePct: 1.28, category: 'Energy', volume: '5.4M', rsi: 66 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3214.5, changePct: -0.42, category: 'IT', volume: '1.9M', rsi: 44 },
  { symbol: 'INFY', name: 'Infosys Limited', price: 1518.4, changePct: 0.86, category: 'IT', volume: '3.8M', rsi: 58 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 967.25, changePct: 0.31, category: 'Banking', volume: '14.2M', rsi: 52 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 1288.6, changePct: 1.02, category: 'Banking', volume: '8.6M', rsi: 64 },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', price: 1165.5, changePct: 0.72, category: 'Banking', volume: '4.2M', rsi: 57 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1780.2, changePct: -0.15, category: 'Banking', volume: '2.5M', rsi: 48 },
  { symbol: 'LT', name: 'Larsen & Toubro', price: 3582.0, changePct: 1.74, category: 'Industrials', volume: '2.1M', rsi: 71 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', price: 148.5, changePct: 2.15, category: 'Metals', volume: '28.4M', rsi: 73 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', price: 1844.2, changePct: -0.18, category: 'Telecom', volume: '3.1M', rsi: 49 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', price: 1712.3, changePct: 0.24, category: 'Healthcare', volume: '1.8M', rsi: 53 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', price: 11840.0, changePct: -0.65, category: 'Auto', volume: '620K', rsi: 42 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', price: 6920.0, changePct: 2.30, category: 'Finance', volume: '1.4M', rsi: 69 },
  { symbol: 'TITAN', name: 'Titan Company Limited', price: 3410.0, changePct: 1.45, category: 'Consumer', volume: '1.1M', rsi: 63 },
  { symbol: 'ITC', name: 'ITC Limited', price: 472.4, changePct: 0.85, category: 'FMCG', volume: '9.3M', rsi: 56 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2380.0, changePct: -0.35, category: 'FMCG', volume: '1.3M', rsi: 46 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2940.0, changePct: 3.10, category: 'Conglomerate', volume: '4.7M', rsi: 76 },
  { symbol: 'WIPRO', name: 'Wipro Limited', price: 542.8, changePct: -0.90, category: 'IT', volume: '4.5M', rsi: 40 }
];

function AppLayout() {
  const [stocks, setStocks] = useState<Stock[]>(fallbackStocks);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'INFY', 'HDFCBANK']);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PlatformAlert[]>([]);
  const [dhanConnected, setDhanConnected] = useState(false);
  const [dhanClientId, setDhanClientId] = useState('');
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 0. Check live DhanHQ broker status
    api<{ configured: boolean; connected: boolean; data?: { dhanClientId?: string } }>('/dhan/status')
      .then(res => {
        if (res.connected) {
          setDhanConnected(true);
          if (res.data?.dhanClientId) setDhanClientId(res.data.dhanClientId);
        }
      })
      .catch(() => {});

    // 1. Fetch market stocks from API
    api<{ results: Stock[] }>('/market/stocks')
      .then(d => setStocks(d.results))
      .catch(() => {});

    // 2. Fetch active platform announcements/alerts
    api<{ alerts: PlatformAlert[] }>('/admin/alerts/active')
      .then(d => setActiveAlerts(d.alerts || []))
      .catch(() => {});

    // 3. Fetch authenticated user data using httpOnly cookie session
    api<{ user: User }>('/auth/me')
      .then(d => {
        setUser(d.user);
        api<{ items: { symbol: string }[] }>('/watchlist')
          .then(w => setWatchlist(w.items.map(i => i.symbol)))
          .catch(() => {});
        api<{ entries: JournalEntry[] }>('/journal')
          .then(j => setJournal(j.entries))
          .catch(() => {});
      })
      .catch(() => {
        setUser(null);
        setToken(null);
      });
  }, []);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function toggleWatch(symbol: string) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      if (watchlist.includes(symbol)) {
        await api(`/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
        setWatchlist(v => v.filter(s => s !== symbol));
      } else {
        await api('/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) });
        setWatchlist(v => [...v, symbol]);
      }
      setToast('Watchlist updated');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not update watchlist');
    }
  }

  async function saveJournal(newEntry: Omit<JournalEntry, 'id'>) {
    try {
      const data = await api<{ entry: JournalEntry }>('/journal', {
        method: 'POST',
        body: JSON.stringify(newEntry)
      });
      setJournal(v => [data.entry, ...v]);
      setToast('Journal entry saved successfully');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to save entry');
    }
  }

  async function updateJournal(id: string, updatedFields: Partial<JournalEntry>) {
    try {
      const data = await api<{ entry: JournalEntry }>(`/journal/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      setJournal(v => v.map(j => (j.id === id ? data.entry : j)));
      setToast('Journal entry updated');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to update entry');
    }
  }

  async function deleteJournal(id: string) {
    try {
      await api(`/journal/${id}`, { method: 'DELETE' });
      setJournal(v => v.filter(j => j.id !== id));
      setToast('Journal entry deleted');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to delete entry');
    }
  }

  async function handleLogout() {
    setToken(null);
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setWatchlist(['RELIANCE', 'INFY', 'HDFCBANK']);
    setJournal([]);
    setToast('Signed out successfully');
    navigate('/');
  }

  // Titles for page banner
  const path = location.pathname;
  const isHome = path === '/';
  const heading =
    path === '/' ? 'Market intelligence, made clearer' :
    path === '/overview' ? 'Good afternoon' :
    path === '/scanner' ? 'Market scanner' :
    path === '/watchlist' ? 'Your watchlist' :
    path === '/journal' ? 'Trade journal' :
    path === '/risk-studio' ? 'Risk studio' :
    path === '/profile' ? 'Profile settings' : 'Plans & Pricing';

  const subhead =
    path === '/' ? 'Research tools, risk insights and trading discipline in one workspace.' :
    path === '/overview' ? 'A clearer view of the market. A more disciplined way to trade.' :
    path === '/scanner' ? 'Find patterns and opportunities with structured market filters.' :
    path === '/watchlist' ? 'Keep the instruments you care about close.' :
    path === '/profile' ? 'Manage your account credentials and personal preferences.' :
    path === '/plans' ? 'Choose the tier that matches your trading workflow.' :
    'Build better habits with a repeatable trading process.';

  const isAdmin = user?.role === 'ADMIN';
  const isAdminPath = location.pathname.startsWith('/admin');

  // When visiting /admin without being an authenticated Admin,
  // render ONLY the Admin Login form (no sidebar, no topbar, no main dashboard shell)
  if (isAdminPath && !isAdmin) {
    return (
      <div className="admin-login-fullscreen">
        <AdminPage
          currentUser={user}
          onUserUpdate={(u) => {
            setUser(u);
            if (u?.role === 'ADMIN') {
              navigate('/admin/overview');
            }
          }}
          onShowToast={setToast}
        />
        {toast && (
          <div className="toast">
            <span className="toast-check">✓</span>
            {toast}
            <button onClick={() => setToast('')} aria-label="Dismiss toast">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onShowToast={setToast}
      />

      <main className="main-area">
        <Topbar
          user={user}
          onOpenMobileMenu={() => setMobileMenu(true)}
          onOpenAuth={() => setAuthOpen(true)}
          onShowToast={setToast}
          onLogout={handleLogout}
          activeAlerts={activeAlerts}
          dhanConnected={dhanConnected}
          dhanClientId={dhanClientId}
        />

        <div className="content-wrap">
          {/* Active Platform Broadcast Alert Stack (Layered Deck) */}
          <AlertStack
            alerts={activeAlerts}
            onDismiss={(id) => setActiveAlerts(prev => prev.filter(a => a.id !== id))}
          />

          {!path.startsWith('/admin') && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> YOUR MARKET COMMAND CENTRE
                  </div>
                  <h1>
                    {heading}<span className="heading-period">.</span>
                    {(isHome || path === '/overview') && <span className="wave"> ✦</span>}
                  </h1>
                  <p className="subhead">{subhead}</p>
                </div>
                <div className="date-pill">
                  <Command size={15} /> Live Workspace <span className="date-sep" /> <span>Market session</span>
                </div>
              </div>

              <div 
                className="demo-alert"
                style={dhanConnected ? { 
                  background: 'rgba(13, 31, 30, 0.75)', 
                  borderColor: 'rgba(69, 214, 162, 0.35)' 
                } : undefined}
              >
                <div 
                  className="alert-symbol"
                  style={dhanConnected ? { background: '#45d6a2', color: '#091312', fontWeight: 800 } : undefined}
                >
                  {dhanConnected ? '✓' : 'i'}
                </div>
                <div>
                  <strong style={dhanConnected ? { color: '#45d6a2' } : undefined}>
                    {dhanConnected 
                      ? (user ? `Live DhanHQ Feed (Client ID: ${dhanClientId})` : 'Live Exchange Market Feed Active') 
                      : 'Preview environment'}
                  </strong>
                  <span>
                    {dhanConnected 
                      ? (user 
                          ? ' Direct broker connection active. Real-time balance and broker portfolio synced in read-only mode.'
                          : ' Real-time market prices synced directly from exchange via DhanHQ.')
                      : ' All stock prices and charts are simulated sample data, not live exchange quotes.'}
                  </span>
                </div>
                <button 
                  onClick={() => setToast(dhanConnected ? `Connected to DhanHQ API v2 (Client: ${dhanClientId}). Safe read-only mode.` : 'Connect a licensed market data provider before production launch.')}
                  style={dhanConnected ? { color: '#45d6a2', borderColor: 'rgba(69, 214, 162, 0.3)' } : undefined}
                >
                  {dhanConnected ? 'Broker Info' : 'Learn more'} <ArrowUpRight size={13} />
                </button>
              </div>
            </>
          )}

          <Routes>
            <Route path="/" element={<HomePage user={user} stocks={stocks} onOpenAuth={() => setAuthOpen(true)} />} />
            <Route
              path="/overview"
              element={
                <OverviewPage
                  stocks={stocks}
                  watchlist={watchlist}
                  user={user}
                  onToggleWatch={toggleWatch}
                  onShowToast={setToast}
                />
              }
            />
            <Route
              path="/scanner"
              element={
                <ScannerPage
                  stocks={stocks}
                  watchlist={watchlist}
                  onToggleWatch={toggleWatch}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <WatchlistPage
                  stocks={stocks}
                  watchlist={watchlist}
                  user={user}
                  onToggleWatch={toggleWatch}
                />
              }
            />
            <Route
              path="/journal"
              element={
                <JournalPage
                  journal={journal}
                  user={user}
                  onOpenAuth={() => setAuthOpen(true)}
                  onSaveEntry={saveJournal}
                  onUpdateEntry={updateJournal}
                  onDeleteEntry={deleteJournal}
                />
              }
            />
            <Route path="/risk-studio" element={<RiskStudioPage />} />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  user={user}
                  onOpenAuth={() => setAuthOpen(true)}
                  onUserUpdate={setUser}
                  onShowToast={setToast}
                />
              }
            />
            <Route
              path="/plans"
              element={
                <PlansPage
                  user={user}
                  onOpenAuth={() => setAuthOpen(true)}
                  onUserUpdate={setUser}
                  onShowToast={setToast}
                />
              }
            />
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route
              path="/admin/:tab"
              element={
                <AdminPage
                  currentUser={user}
                  onUserUpdate={setUser}
                  onShowToast={setToast}
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="footer">
            <span>© 2026 MarketPilot AI</span>
            <span><span className="footer-dot" /> Designed for clarity, built for discipline.</span>
            <span>Not investment advice</span>
          </footer>
        </div>
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setToast(`Welcome back, ${u.name}!`);
          if (u.role === 'ADMIN') {
            navigate('/admin/overview');
          }
          api<{ items: { symbol: string }[] }>('/watchlist')
            .then(d => setWatchlist(d.items.map(i => i.symbol)))
            .catch(() => {});
          api<{ entries: JournalEntry[] }>('/journal')
            .then(d => setJournal(d.entries))
            .catch(() => {});
        }}
      />

      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
          <button onClick={() => setToast('')} aria-label="Dismiss toast">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Floating AI Co-Pilot Drawer */}
      <AiCopilotDrawer
        isOpen={aiCopilotOpen}
        onClose={() => setAiCopilotOpen(false)}
        onOpen={() => setAiCopilotOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
