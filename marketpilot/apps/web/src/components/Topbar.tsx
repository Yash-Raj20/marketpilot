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
  LayoutDashboard
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface TopbarProps {
  user: User | null;
  onOpenMobileMenu: () => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string) => void;
  onLogout?: () => void;
}

const pageConfig: Record<string, { title: string; icon: any }> = {
  '/': { title: 'Home', icon: ChartNoAxesCombined },
  '/overview': { title: 'Overview', icon: LayoutDashboard },
  '/scanner': { title: 'Market scanner', icon: Search },
  '/watchlist': { title: 'Watchlist', icon: Star },
  '/journal': { title: 'Trade journal', icon: BookOpen },
  '/risk-studio': { title: 'Risk studio', icon: ShieldCheck },
  '/profile': { title: 'Profile Settings', icon: Settings },
  '/plans': { title: 'Plans & Pricing', icon: Sparkles }
};

export function Topbar({ user, onOpenMobileMenu, onOpenAuth, onShowToast, onLogout }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPage = pageConfig[location.pathname] || { title: 'Workspace', icon: LayoutDashboard };
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

  // Keyboard shortcut Ctrl+K to open scanner
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/scanner');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <header className="topbar">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className="topbar-left">
        <button className="icon-btn menu-toggle" onClick={onOpenMobileMenu} aria-label="Open navigation menu">
          <Menu size={20} />
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb-root">Workspace</span>
          <span className="slash">/</span>
          <div className="breadcrumb-current">
            <PageIcon size={14} className="breadcrumb-icon" />
            <strong>{currentPage.title}</strong>
          </div>
        </div>
      </div>

      {/* Center: Global Quick Command / Search Bar */}
      <div className="topbar-center" onClick={() => navigate('/scanner')}>
        <div className="topbar-search-pill">
          <Search size={15} />
          <span>Search stocks, sectors, or tools...</span>
          <kbd>Ctrl K</kbd>
        </div>
      </div>

      {/* Right: Live Market Indicator, Notifications & User Profile */}
      <div className="top-actions">
        {/* Pulsating Market Status */}
        <div className="market-status" title="Simulated Indian Market Feed">
          <span className="status-dot pulsing" />
          <span>NSE/BSE · Live Demo</span>
        </div>

        {/* Notifications Popover */}
        <div className="topbar-popover-container" ref={notifRef}>
          <button
            className={`icon-btn notification ${notifDropdown ? 'active-btn' : ''}`}
            onClick={() => setNotifDropdown(!notifDropdown)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <i />
          </button>

          {notifDropdown && (
            <div className="topbar-dropdown notif-menu">
              <div className="dropdown-head">
                <strong>Notifications</strong>
                <span className="notif-badge">2 New</span>
              </div>
              <div className="notif-list">
                <div className="notif-item unread">
                  <span className="notif-dot" />
                  <div>
                    <p><strong>NIFTY 50</strong> closed session at 24,872 (+0.64%).</p>
                    <small>Today, 03:30 PM</small>
                  </div>
                </div>
                <div className="notif-item">
                  <CheckCircle2 size={14} className="notif-check" />
                  <div>
                    <p>Neon Cloud Database connected successfully.</p>
                    <small>System sync active</small>
                  </div>
                </div>
              </div>
              <button 
                className="notif-footer-btn" 
                onClick={() => {
                  setNotifDropdown(false);
                  onShowToast('All notifications marked as read.');
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="topbar-popover-container" ref={profileRef}>
          {user ? (
            <button
              className={`top-user-pill ${profileDropdown ? 'active-pill' : ''}`}
              onClick={() => setProfileDropdown(!profileDropdown)}
              aria-label="User profile menu"
            >
              <div className="user-avatar-pill">
                {user.name?.slice(0, 1).toUpperCase() || 'U'}
              </div>
              <span className="user-name-label">{user.name?.split(' ')[0] || 'Trader'}</span>
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
                <div className="user-menu-avatar">
                  {user.name?.slice(0, 1).toUpperCase() || 'U'}
                </div>
                <div className="user-menu-info">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                  <span className="user-plan-badge">{user.subscription?.plan || 'Free'} Plan</span>
                </div>
              </div>

              <div className="dropdown-divider" />

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
