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
  Users
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface SidebarProps {
  user: User | null;
  mobileMenu: boolean;
  setMobileMenu: (open: boolean) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

const navItems = [
  { name: 'Home', path: '/', icon: ChartNoAxesCombined },
  { name: 'Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Market scanner', path: '/scanner', icon: Search, isNew: true },
  { name: 'Watchlist', path: '/watchlist', icon: Star },
  { name: 'Trade journal', path: '/journal', icon: BookOpen },
  { name: 'Risk studio', path: '/risk-studio', icon: ShieldCheck },
  { name: 'Profile', path: '/profile', icon: UserCheck }
];

export function Sidebar({ user, mobileMenu, setMobileMenu, onOpenAuth, onLogout, onShowToast }: SidebarProps) {
  const navigate = useNavigate();
  const [workspaceDropdown, setWorkspaceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <div className="brand-link" onClick={() => { navigate('/'); setMobileMenu(false); }}>
            <div className="brand-mark">
              <Activity size={22} />
            </div>
            <span>
              market<span className="brand-accent">pilot</span><sup>AI</sup>
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

          {/* Dropdown Menu */}
          {workspaceDropdown && (
            <div className="workspace-dropdown-menu">
              <div className="dropdown-header">SWITCH WORKSPACE</div>
              
              <div className="dropdown-item active-item" onClick={() => setWorkspaceDropdown(false)}>
                <div className="workspace-avatar mini-avatar">MP</div>
                <div className="item-text">
                  <strong>Personal workspace</strong>
                  <small>Active (Free)</small>
                </div>
                <Check size={14} className="check-icon" />
              </div>

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

              <div className="dropdown-divider" />

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

              <button 
                className="dropdown-action-btn"
                onClick={() => {
                  setWorkspaceDropdown(false);
                  navigate('/profile');
                }}
              >
                <Settings size={14} />
                <span>Workspace settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map((n) => (
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

        {/* Sidebar Bottom / Pro Plan Card & User Profile */}
        <div className="sidebar-bottom">
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

          <button className="nav-item help-btn" onClick={() => onShowToast('Help centre is coming soon.')}>
            <CircleHelp size={18} />
            <span>Help centre</span>
          </button>

          <div className="profile-row">
            <div className="profile-avatar">
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
