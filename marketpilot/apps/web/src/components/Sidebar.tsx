import { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  BookOpen, 
  ChartNoAxesCombined, 
  ChevronDown, 
  CircleHelp, 
  LayoutDashboard, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  UserCheck, 
  X,
  Check,
  Plus,
  Settings,
  Users,
  CreditCard,
  TrendingUp,
  Bell,
  ExternalLink,
  Bot
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types';

interface SidebarProps {
  user: User | null;
  mobileMenu: boolean;
  setMobileMenu: (open: boolean) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

const userNavItems = [
  { name: 'Home', path: '/', icon: ChartNoAxesCombined },
  { name: 'Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Market scanner', path: '/scanner', icon: Search, isNew: true },
  { name: 'Watchlist', path: '/watchlist', icon: Star },
  { name: 'Trade journal', path: '/journal', icon: BookOpen },
  { name: 'Risk studio', path: '/risk-studio', icon: ShieldCheck },
  { name: 'Profile', path: '/profile', icon: UserCheck }
];

const adminNavItems = [
  { name: 'Overview & Analytics', path: '/admin/overview', icon: LayoutDashboard },
  { name: 'Users Management', path: '/admin/users', icon: Users },
  { name: 'Subscriptions & Billing', path: '/admin/subscriptions', icon: CreditCard },
  { name: 'Platform Trades', path: '/admin/trades', icon: TrendingUp },
  { name: 'System Alerts & Broadcast', path: '/admin/alerts', icon: Bell },
  { name: 'Audit & Security Logs', path: '/admin/audit', icon: ShieldCheck },
  { name: 'Telegram & DhanHQ', path: '/admin/integrations', icon: Bot },
  { name: 'Admin Profile', path: '/admin/profile', icon: UserCheck }
];

export function Sidebar({ user, mobileMenu, setMobileMenu, onOpenAuth, onLogout, onShowToast }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaceDropdown, setWorkspaceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isInAdminView = location.pathname.startsWith('/admin');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdown(false);
      }
    }
    if (workspaceDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workspaceDropdown]);

  return (
    <>
      <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        {/* Brand Header Row with Mobile Close Button */}
        <div className="brand-header-row">
          <div 
            className="brand-link" 
            onClick={() => { 
              navigate(isAdmin && isInAdminView ? '/admin/overview' : '/'); 
              setMobileMenu(false); 
            }}
          >
            <div className={`brand-mark ${isAdmin && isInAdminView ? 'admin-brand-mark' : ''}`}>
              {isAdmin && isInAdminView ? (
                <ShieldCheck size={22} color="#ffb347" />
              ) : (
                <Activity size={22} />
              )}
            </div>
            <span>
              market<span className="brand-accent">pilot</span>
              <sup>{isAdmin && isInAdminView ? 'ADMIN' : 'AI'}</sup>
            </span>
          </div>

          <button 
            className="mobile-close-btn" 
            onClick={(e) => { e.stopPropagation(); setMobileMenu(false); }}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Workspace Dropdown Box */}
        <div className="workspace-container" ref={dropdownRef}>
          {isAdmin && isInAdminView ? (
            <div 
              className={`workspace admin-workspace-pill ${workspaceDropdown ? 'active-workspace' : ''}`}
              onClick={() => setWorkspaceDropdown(!workspaceDropdown)}
              title="Click to switch workspace"
            >
              <div className="workspace-avatar admin-avatar-mark">AD</div>
              <div>
                <strong>Admin Console</strong>
                <small className="admin-plan-tag">SUPER ADMIN</small>
              </div>
              <ChevronDown 
                size={15} 
                className={`workspace-chevron ${workspaceDropdown ? 'rotate' : ''}`} 
              />
            </div>
          ) : (
            <div 
              className={`workspace ${workspaceDropdown ? 'active-workspace' : ''}`}
              onClick={() => setWorkspaceDropdown(!workspaceDropdown)}
              title="Click to switch workspace"
            >
              <div className="workspace-avatar">MP</div>
              <div>
                <strong>Personal workspace</strong>
                <small>{user?.subscription?.plan ? `${user.subscription.plan} plan` : 'Free plan'}</small>
              </div>
              <ChevronDown 
                size={15} 
                className={`workspace-chevron ${workspaceDropdown ? 'rotate' : ''}`} 
              />
            </div>
          )}

          {/* Dropdown Menu */}
          {workspaceDropdown && (
            <div className="workspace-dropdown-menu">
              <div className="dropdown-header">SWITCH CONSOLE / WORKSPACE</div>
              
              {isAdmin && (
                <div 
                  className={`dropdown-item ${isInAdminView ? 'active-item' : ''}`} 
                  onClick={() => {
                    setWorkspaceDropdown(false);
                    navigate('/admin/overview');
                  }}
                >
                  <div className="workspace-avatar mini-avatar" style={{ background: '#ffb347', color: '#090d16', fontWeight: 800 }}>AD</div>
                  <div className="item-text">
                    <strong>Admin Control Console</strong>
                    <small>Full Platform Access</small>
                  </div>
                  {isInAdminView && <Check size={14} className="check-icon" />}
                </div>
              )}

              <div 
                className={`dropdown-item ${!isInAdminView ? 'active-item' : ''}`} 
                onClick={() => {
                  setWorkspaceDropdown(false);
                  navigate('/overview');
                }}
              >
                <div className="workspace-avatar mini-avatar">MP</div>
                <div className="item-text">
                  <strong>Personal workspace</strong>
                  <small>{user ? 'Trader Workspace' : 'Public Markets'}</small>
                </div>
                {!isInAdminView && <Check size={14} className="check-icon" />}
              </div>

              {!isAdmin && (
                <div 
                  className="dropdown-item locked-item" 
                  onClick={() => {
                    setWorkspaceDropdown(false);
                    onShowToast('Pro team workspace requires an active Pro subscription.');
                    navigate('/plans');
                  }}
                >
                  <div className="workspace-avatar mini-avatar team-avatar">
                    <Users size={12} />
                  </div>
                  <div className="item-text">
                    <strong>Trading Desk Team</strong>
                    <small>Pro plan feature</small>
                  </div>
                  <span className="dropdown-pro-badge">PRO</span>
                </div>
              )}

              <div className="dropdown-divider" />

              {!isAdmin && (
                <button 
                  className="dropdown-action-btn"
                  onClick={() => {
                    setWorkspaceDropdown(false);
                    onShowToast('Workspace creation is available in Pro plan.');
                    navigate('/plans');
                  }}
                >
                  <Plus size={14} />
                  <span>Create new workspace</span>
                </button>
              )}

              <button 
                className="dropdown-action-btn"
                onClick={() => {
                  setWorkspaceDropdown(false);
                  navigate(isAdmin ? '/admin/audit' : '/profile');
                }}
              >
                <Settings size={14} />
                <span>{isAdmin ? 'System Audit Logs' : 'Workspace settings'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        {isAdmin && isInAdminView ? (
          <>
            <div className="nav-label" style={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={13} color="#ffb347" /> ADMINISTRATION
            </div>
            <nav>
              {adminNavItems.map((n) => (
                <NavLink
                  key={n.path}
                  to={n.path}
                  className={({ isActive }) => `nav-item admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenu(false)}
                >
                  <n.icon size={18} />
                  <span>{n.name}</span>
                </NavLink>
              ))}

              <div className="nav-label" style={{ marginTop: '22px' }}>CLIENT PORTAL</div>
              <NavLink
                to="/overview"
                className="nav-item"
                onClick={() => setMobileMenu(false)}
              >
                <ExternalLink size={18} />
                <span>View User Website</span>
              </NavLink>
            </nav>
          </>
        ) : (
          <>
            {/* {isAdmin && (
              <NavLink
                to="/admin/overview"
                className="nav-item admin-quick-nav-pill"
                onClick={() => setMobileMenu(false)}
              >
                <ShieldCheck size={18} color="#ffb347" />
                <span style={{ fontWeight: 700, color: '#ffb347' }}>Return to Admin Console</span>
                <span className="nav-new" style={{ background: '#ffb347', color: '#0b111e' }}>ADMIN</span>
              </NavLink>
            )} */}

            <div className="nav-label">WORKSPACE</div>
            <nav>
              {userNavItems.map((n) => (
                <NavLink
                  key={n.path}
                  to={n.path}
                  end={n.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenu(false)}
                >
                  <n.icon size={18} />
                  <span>{n.name}</span>
                  {n.isNew && <span className="nav-new">NEW</span>}
                </NavLink>
              ))}
            </nav>
          </>
        )}

        {/* Sidebar Bottom */}
        <div className="sidebar-bottom">
          {isAdmin && isInAdminView ? (
            <div className="admin-status-card">
              {/* <div className="admin-status-card-header">
                <span className="status-dot green" />
                <strong>Neon PostgreSQL Live</strong>
              </div>
              <p>Platform security filters, API rate limiting, and audit engine active.</p> */}
              <button 
                className="admin-status-card-btn"
                onClick={() => { navigate('/admin/audit'); setMobileMenu(false); }}
              >
                <span>Audit Logs</span>
                <span className="arrow-chip">→</span>
              </button>
            </div>
          ) : (
            <div className="upgrade-card">
              <div className="upgrade-icon">
                <Sparkles size={17} />
              </div>
              <strong>Unlock your edge</strong>
              <p>Explore advanced scanners, deeper insights and unlimited watchlists.</p>
              <button 
                className="upgrade-btn"
                onClick={() => { navigate('/plans'); setMobileMenu(false); }}
              >
                <span>Explore Pro</span>
                <span className="arrow-chip">↗</span>
              </button>
            </div>
          )}

          {!isInAdminView && (
            <button className="nav-item help-btn" onClick={() => onShowToast('Help centre is coming soon.')}>
              <CircleHelp size={18} />
              <span>Help centre</span>
            </button>
          )}

          <div className="profile-row">
            <div className={`profile-avatar ${isAdmin ? 'admin-profile-avatar' : ''}`}>
              {user?.name?.slice(0, 1).toUpperCase() || 'G'}
            </div>
            <div className="profile-copy">
              <strong>{user?.name || 'Guest trader'}</strong>
              <small>{user?.email || 'Sign in to sync data'}</small>
            </div>
            {user ? (
              <button className="icon-btn" onClick={onLogout} title="Sign out" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            ) : (
              <button className="sign-in-small" onClick={onOpenAuth}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileMenu && <div className="mobile-scrim" onClick={() => setMobileMenu(false)} />}
    </>
  );
}
