import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  Search, 
  ChevronDown, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Star, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ChartNoAxesCombined, 
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, PlatformAlert } from '../types';

interface TopbarProps {
  user: User | null;
  onOpenMobileMenu: () => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string) => void;
  onLogout?: () => void;
  activeAlerts?: PlatformAlert[];
  dhanConnected?: boolean;
  dhanClientId?: string;
}

const pageConfig: Record<string, { title: string; icon: any }> = {
  '/': { title: 'Home', icon: ChartNoAxesCombined },
  '/overview': { title: 'Overview', icon: LayoutDashboard },
  '/scanner': { title: 'Market scanner', icon: Search },
  '/watchlist': { title: 'Watchlist', icon: Star },
  '/journal': { title: 'Trade journal', icon: BookOpen },
  '/risk-studio': { title: 'Risk studio', icon: ShieldCheck },
  '/profile': { title: 'Profile Settings', icon: Settings },
  '/plans': { title: 'Plans & Pricing', icon: Sparkles },
  '/admin': { title: 'Platform Performance', icon: LayoutDashboard },
  '/admin/overview': { title: 'Platform Performance', icon: LayoutDashboard },
  '/admin/users': { title: 'Users Management', icon: Users },
  '/admin/subscriptions': { title: 'Subscriptions & Billing', icon: CreditCard },
  '/admin/trades': { title: 'Platform Trades', icon: TrendingUp },
  '/admin/alerts': { title: 'System Alerts & Broadcast', icon: Bell },
  '/admin/audit': { title: 'Audit & Security Logs', icon: ShieldCheck },
  '/admin/profile': { title: 'Admin Profile & Security', icon: UserCheck }
};

export function Topbar({ user, onOpenMobileMenu, onOpenAuth, onShowToast, onLogout, activeAlerts, dhanConnected, dhanClientId }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [internalAlerts, setInternalAlerts] = useState<PlatformAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isAdminPath = location.pathname.startsWith('/admin');

  // Fetch active platform broadcast alerts for the notification bell
  useEffect(() => {
    api<{ alerts: PlatformAlert[] }>('/admin/alerts/active')
      .then(d => {
        if (d.alerts) setInternalAlerts(d.alerts);
      })
      .catch(() => {});
  }, [location.pathname]);

  const currentAlerts = activeAlerts && activeAlerts.length > 0 ? activeAlerts : internalAlerts;
  const unreadAlerts = currentAlerts.filter(a => !dismissedAlertIds.includes(a.id));
  const unreadCount = unreadAlerts.length;

  const currentPage = pageConfig[location.pathname] || { 
    title: isAdminPath ? 'Platform Control' : 'Workspace', 
    icon: isAdminPath ? ShieldCheck : LayoutDashboard 
  };
  const PageIcon = currentPage.icon;

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K to open scanner / search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isAdminPath) {
          navigate('/admin/users');
        } else {
          navigate('/scanner');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isAdminPath]);

  return (
    <header className="topbar">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className="topbar-left">
        <button className="icon-btn menu-toggle" onClick={onOpenMobileMenu} aria-label="Open navigation menu">
          <Menu size={20} />
        </button>

        {isAdminPath ? (
          <div className="breadcrumb">
            <span className="breadcrumb-root admin-breadcrumb-root" style={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#ffb347" /> Admin
            </span>
            <span className="slash">/</span>
            <div className="breadcrumb-current admin-breadcrumb-current">
              <PageIcon size={14} className="breadcrumb-icon" color="#ffb347" />
              <strong>{currentPage.title}</strong>
            </div>
          </div>
        ) : (
          <div className="breadcrumb">
            <span className="breadcrumb-root">Workspace</span>
            <span className="slash">/</span>
            <div className="breadcrumb-current">
              <PageIcon size={14} className="breadcrumb-icon" />
              <strong>{currentPage.title}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Center: Global Quick Command / Search Bar */}
      <div 
        className="topbar-center" 
        onClick={() => navigate(isAdminPath ? '/admin/users' : '/scanner')}
      >
        <div className={`topbar-search-pill ${isAdminPath ? 'admin-search-pill' : ''}`}>
          <Search size={15} />
          <span>
            {isAdminPath 
              ? 'Search registered users, subscriptions, or audit events...' 
              : 'Search stocks, sectors, or tools...'}
          </span>
          <kbd>Ctrl K</kbd>
        </div>
      </div>

      {/* Right: Live Status, Switcher, Notifications & User Profile */}
      <div className="top-actions">
        {isAdminPath ? (
          <>
            {/* PostgreSQL Operational Pill */}
            {/* <div className="admin-status-pill" title="Connected to remote Neon PostgreSQL">
              <span className="status-dot green" />
              <span>Operational (Neon PostgreSQL)</span>
            </div> */}

            {/* Quick Switch to User Website */}
            {/* <button
              className="admin-link-btn"
              onClick={() => navigate('/overview')}
              title="View Client Trading Workspace"
            >
              <ExternalLink size={14} /> User Website
            </button> */}
          </>
        ) : (
          <>
            {isAdmin && (
              <button
                className="admin-quick-switch-btn"
                onClick={() => navigate('/admin/overview')}
                title="Open Administrator Console"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 179, 71, 0.15)',
                  border: '1px solid rgba(255, 179, 71, 0.4)',
                  color: '#ffb347',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ShieldCheck size={14} /> Admin
              </button>
            )}

            {/* Pulsating Market Status */}
            <div 
              className="market-status" 
              title={dhanConnected ? `Connected to DhanHQ API v2 (Client ID: ${dhanClientId})` : 'Simulated Indian Market Feed'}
              style={dhanConnected ? { borderColor: 'rgba(69, 214, 162, 0.35)', background: 'rgba(69, 214, 162, 0.08)' } : undefined}
            >
              <span 
                className="status-dot pulsing" 
                style={dhanConnected ? { background: '#45d6a2', boxShadow: '0 0 8px rgba(69, 214, 162, 0.6)' } : undefined} 
              />
              <span style={dhanConnected ? { color: '#45d6a2', fontWeight: 600 } : undefined}>
                {dhanConnected ? (user ? `DhanHQ · Live v2 (${dhanClientId || 'Active'})` : 'NSE/BSE · Live Feed') : 'NSE/BSE · Live Demo'}
              </span>
            </div>
          </>
        )}

        {/* Notifications Popover */}
        <div className="topbar-popover-container" ref={notifRef}>
          <button
            className={`icon-btn notification ${notifDropdown ? 'active-btn' : ''}`}
            onClick={() => setNotifDropdown(!notifDropdown)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="notif-count-badge">{unreadCount}</span>
            ) : (
              <i />
            )}
          </button>

          {notifDropdown && (
            <div className="topbar-dropdown notif-menu">
              <div className="dropdown-head">
                <strong>Notifications</strong>
                <span className="notif-badge">
                  {unreadCount > 0 ? `${unreadCount} Alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </span>
              </div>
              <div className="notif-list">
                {unreadAlerts.length > 0 ? (
                  unreadAlerts.map(a => (
                    <div key={a.id} className={`notif-item unread severity-${a.severity}`}>
                      <span className={`notif-dot severity-${a.severity}`} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <p><strong>{a.title}</strong></p>
                          <span className={`alert-severity-badge ${a.severity}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {a.severity.toUpperCase()}
                          </span>
                        </div>
                        <small style={{ color: '#cbd5e1', marginTop: '3px' }}>{a.message}</small>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                          {new Date(a.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty-state" style={{ textAlign: 'center', padding: '12px 6px', color: 'var(--muted)', fontSize: '12px' }}>
                    <CheckCircle2 size={20} color="#45d6a2" style={{ margin: '0 auto 6px', display: 'block' }} />
                    <div>No new platform announcements.</div>
                  </div>
                )}

                <div className="notif-item">
                  <CheckCircle2 size={14} className="notif-check" />
                  <div>
                    <p><strong>Database sync</strong>: Neon PostgreSQL operational.</p>
                    <small>Realtime pooled connection active</small>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unreadCount > 0 && (
                  <button 
                    className="notif-footer-btn" 
                    onClick={() => {
                      setDismissedAlertIds(currentAlerts.map(a => a.id));
                      onShowToast('All notifications marked as read.');
                    }}
                  >
                    Mark all as read
                  </button>
                )}
                {isAdmin && (
                  <button
                    className="notif-footer-btn"
                    style={{ borderColor: 'rgba(255, 179, 71, 0.3)', color: '#ffb347' }}
                    onClick={() => {
                      setNotifDropdown(false);
                      navigate('/admin/alerts');
                    }}
                  >
                    Broadcast & Manage Alerts
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="topbar-popover-container" ref={profileRef}>
          {user ? (
            <button
              className={`top-user-pill ${profileDropdown ? 'active-pill' : ''} ${isAdmin ? 'admin-top-pill' : ''}`}
              onClick={() => setProfileDropdown(!profileDropdown)}
              aria-label="User profile menu"
            >
              <div className={`user-avatar-pill ${isAdmin ? 'admin-avatar-glow' : ''}`}>
                {user.name?.slice(0, 1).toUpperCase() || 'U'}
              </div>
              <span className="user-name-label">{user.name?.split(' ')[0] || 'User'}</span>
              <ChevronDown size={14} className={`user-chevron ${profileDropdown ? 'rotate' : ''}`} />
            </button>
          ) : (
            <button className="primary-btn top-signin-btn" onClick={onOpenAuth}>
              Sign In
            </button>
          )}

          {/* User Menu Dropdown */}
          {user && profileDropdown && (
            <div className="topbar-dropdown user-menu">
              <div className="user-menu-header">
                <div className={`user-menu-avatar ${isAdmin ? 'admin-menu-avatar' : ''}`}>
                  {user.name?.slice(0, 1).toUpperCase() || 'U'}
                </div>
                <div className="user-menu-info">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                  <span className={`user-plan-badge ${isAdmin ? 'admin-badge-gold' : ''}`}>
                    {isAdmin ? 'SUPER ADMIN' : `${user.subscription?.plan || 'Free'} Plan`}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              {isAdmin ? (
                <>
                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/admin/overview'); }}
                  >
                    <LayoutDashboard size={15} color="#ffb347" />
                    <span>Admin Overview</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/admin/users'); }}
                  >
                    <Users size={15} color="#ffb347" />
                    <span>Users Management</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/admin/audit'); }}
                  >
                    <ShieldCheck size={15} color="#ffb347" />
                    <span>Audit & Security Logs</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/admin/profile'); }}
                  >
                    <UserCheck size={15} color="#ffb347" />
                    <span>Admin Profile & Security</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/overview'); }}
                  >
                    <ExternalLink size={15} />
                    <span>View User Website</span>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/profile'); }}
                  >
                    <Settings size={15} />
                    <span>Account & Password</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/watchlist'); }}
                  >
                    <Star size={15} />
                    <span>My Watchlist</span>
                  </div>

                  <div 
                    className="user-menu-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/journal'); }}
                  >
                    <BookOpen size={15} />
                    <span>Trade Journal</span>
                  </div>

                  <div 
                    className="user-menu-item pro-item" 
                    onClick={() => { setProfileDropdown(false); navigate('/plans'); }}
                  >
                    <Sparkles size={15} />
                    <span>Upgrade to Pro</span>
                    <span className="pro-chip">PRO</span>
                  </div>
                </>
              )}

              <div className="dropdown-divider" />

              <div 
                className="user-menu-item logout-item" 
                onClick={() => {
                  setProfileDropdown(false);
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
