import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Bell,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Crown,
  KeyRound,
  Database,
  Server,
  Terminal,
  Shield
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { CustomSelect, Option } from '../components/CustomSelect';
import { TablePagination } from '../components/TablePagination';
import type {
  User,
  AdminStats,
  AdminUserListItem,
  AdminAuditLog,
  PlatformAlert,
  JournalEntry
} from '../types';

interface AdminPageProps {
  currentUser: User | null;
  onUserUpdate: (u: User | null) => void;
  onShowToast: (msg: string) => void;
}

type TabType = 'overview' | 'users' | 'subscriptions' | 'trades' | 'alerts' | 'audit' | 'profile';

// Select dropdown option sets
const roleFilterOptions: Option[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'USER', label: 'Standard Users', badge: 'USER' },
  { value: 'ADMIN', label: 'Administrators', badge: 'ADMIN', badgeColor: '#ffb347' }
];

const planFilterOptions: Option[] = [
  { value: 'ALL', label: 'All Plans' },
  { value: 'FREE', label: 'Community Free', badge: 'FREE' },
  { value: 'PRO', label: 'Active Trader (₹1,999)', badge: 'PRO', badgeColor: '#60a5fa' },
  { value: 'ELITE', label: 'Institutional Desk (₹4,999)', badge: 'ELITE', badgeColor: '#a78bfa' }
];

const statusFilterOptions: Option[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active', badgeColor: '#45d6a2' },
  { value: 'TRIALING', label: 'Trialing', badgeColor: '#fbbf24' },
  { value: 'PAST_DUE', label: 'Past Due', badgeColor: '#f87171' },
  { value: 'CANCELLED', label: 'Cancelled', badgeColor: '#ef4444' },
  { value: 'EXPIRED', label: 'Expired', badgeColor: '#94a3b8' }
];

const userRoleOptions: Option[] = [
  { value: 'USER', label: 'Standard Trader (User)', badge: 'USER' },
  { value: 'ADMIN', label: 'Administrator (Super Admin)', badge: 'ADMIN', badgeColor: '#ffb347' }
];

const userPlanOptions: Option[] = [
  { value: 'FREE', label: 'Community Starter Tier', badge: 'FREE' },
  { value: 'PRO', label: 'Active Trader Pro (₹1,999/mo)', badge: 'PRO', badgeColor: '#60a5fa' },
  { value: 'ELITE', label: 'Institutional Desk Elite (₹4,999/mo)', badge: 'ELITE', badgeColor: '#a78bfa' }
];

const subStatusOptions: Option[] = [
  { value: 'ACTIVE', label: 'Active Status', badgeColor: '#45d6a2' },
  { value: 'TRIALING', label: 'Trialing Status', badgeColor: '#fbbf24' },
  { value: 'PAST_DUE', label: 'Past Due', badgeColor: '#f87171' },
  { value: 'CANCELLED', label: 'Cancelled Status', badgeColor: '#ef4444' },
  { value: 'EXPIRED', label: 'Expired Status', badgeColor: '#94a3b8' }
];

const alertSeverityOptions: Option[] = [
  { value: 'info', label: 'Information (Blue)', badge: 'INFO', badgeColor: '#60a5fa' },
  { value: 'warning', label: 'Market Warning (Yellow)', badge: 'WARN', badgeColor: '#fbbf24' },
  { value: 'urgent', label: 'Urgent Platform Notice (Red)', badge: 'URGENT', badgeColor: '#ef4444' },
  { value: 'success', label: 'Feature / Positive Update (Green)', badge: 'SUCCESS', badgeColor: '#45d6a2' }
];

export function AdminPage({ currentUser, onUserUpdate, onShowToast }: AdminPageProps) {
  const navigate = useNavigate();

  // Admin login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin console states
  const { tab } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tab && ['overview', 'users', 'subscriptions', 'trades', 'alerts', 'audit', 'profile'].includes(tab)) {
      return tab as TabType;
    }
    return 'overview';
  });

  useEffect(() => {
    if (tab && ['overview', 'users', 'subscriptions', 'trades', 'alerts', 'audit', 'profile'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  const handleTabSwitch = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/admin/${newTab}`);
  };

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);

  // Users tab state & pagination
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Trades tab state & pagination
  const [allTrades, setAllTrades] = useState<JournalEntry[]>([]);
  const [tradeSearch, setTradeSearch] = useState('');
  const [tradePage, setTradePage] = useState(1);
  const [tradePageSize, setTradePageSize] = useState(10);

  // Audit tab state & pagination
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(15);

  // Admin Profile tab states
  const [adminName, setAdminName] = useState(currentUser?.name || 'Super Admin');
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminProfileBusy, setAdminProfileBusy] = useState(false);
  const [adminProfileError, setAdminProfileError] = useState('');
  const [adminPasswordBusy, setAdminPasswordBusy] = useState(false);
  const [adminPasswordError, setAdminPasswordError] = useState('');

  useEffect(() => {
    if (currentUser?.name) {
      setAdminName(currentUser.name);
    }
  }, [currentUser]);

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER', plan: 'FREE' });
  const [createLoading, setCreateLoading] = useState(false);

  const [editUserModal, setEditUserModal] = useState<AdminUserListItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER' });
  const [editLoading, setEditLoading] = useState(false);

  const [subModalUser, setSubModalUser] = useState<AdminUserListItem | null>(null);
  const [subForm, setSubForm] = useState({ plan: 'FREE', status: 'ACTIVE', daysValid: 30 });
  const [subLoading, setSubLoading] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // Alerts tab state
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [newAlert, setNewAlert] = useState<{ title: string; message: string; severity: 'info' | 'warning' | 'urgent' | 'success'; active: boolean }>({
    title: '',
    message: '',
    severity: 'info',
    active: true
  });
  const [alertLoading, setAlertLoading] = useState(false);


  const isAdmin = currentUser?.role === 'ADMIN';

  // Load Admin Data when authenticated as admin
  const fetchDashboardData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await api<{ stats: AdminStats; recentAuditLogs: AdminAuditLog[] }>('/admin/stats');
      setStats(data.stats);
      setRecentLogs(data.recentAuditLogs || []);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (planFilter !== 'ALL') params.set('plan', planFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('limit', '100');

      const data = await api<{ users: AdminUserListItem[] }>(`/admin/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const fetchTrades = async () => {
    if (!isAdmin) return;
    try {
      const data = await api<{ entries: JournalEntry[] }>('/admin/journal');
      setAllTrades(data.entries || []);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to load trades');
    }
  };

  const fetchAlerts = async () => {
    if (!isAdmin) return;
    try {
      const data = await api<{ alerts: PlatformAlert[] }>('/admin/alerts');
      setAlerts(data.alerts || []);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to load platform alerts');
    }
  };

  const fetchAuditLogs = async () => {
    if (!isAdmin) return;
    try {
      const data = await api<{ logs: AdminAuditLog[] }>('/admin/audit-logs?limit=100');
      setAuditLogs(data.logs || []);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to load audit logs');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      fetchUsers();
      fetchTrades();
      fetchAlerts();
      fetchAuditLogs();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      const timer = setTimeout(fetchUsers, 300);
      return () => clearTimeout(timer);
    }
  }, [userSearch, roleFilter, planFilter, statusFilter]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.user.role !== 'ADMIN') {
        // Logout non-admin
        await api('/auth/logout', { method: 'POST' }).catch(() => { });
        setToken(null);
        setLoginError('Access denied: Your account exists but does NOT have Administrator privileges.');
        setLoginLoading(false);
        return;
      }

      setToken(data.token);
      onUserUpdate(data.user);
      onShowToast(`Welcome to MarketPilot Admin Console, ${data.user.name}`);
      navigate('/admin/overview');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@marketpilot.local');
    setPassword('AdminPass!234');
    setLoginError('');
  };

  // Actions for Users
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api('/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      onShowToast(`User ${newUser.email} created successfully!`);
      setShowCreateUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'USER', plan: 'FREE' });
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    setEditLoading(true);
    try {
      await api(`/admin/users/${editUserModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      onShowToast(`User details updated.`);
      setEditUserModal(null);
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModalUser) return;
    setSubLoading(true);
    try {
      await api(`/admin/users/${subModalUser.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: subForm.plan,
          status: subForm.status,
          daysValid: Number(subForm.daysValid)
        })
      });
      onShowToast(`Subscription updated for ${subModalUser.email}.`);
      setSubModalUser(null);
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setDeleteLoading(true);
    try {
      await api(`/admin/users/${deleteConfirmUser.id}`, {
        method: 'DELETE'
      });
      onShowToast(`User ${deleteConfirmUser.email} has been deleted.`);
      setDeleteConfirmUser(null);
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Alerts Actions
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.message) return;
    setAlertLoading(true);
    try {
      await api('/admin/alerts', {
        method: 'POST',
        body: JSON.stringify(newAlert)
      });
      onShowToast('Platform alert published successfully!');
      setNewAlert({ title: '', message: '', severity: 'info', active: true });
      fetchAlerts();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setAlertLoading(false);
    }
  };

  const handleToggleAlert = async (alert: PlatformAlert) => {
    try {
      await api(`/admin/alerts/${alert.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !alert.active })
      });
      setAlerts(prev => prev.map(a => (a.id === alert.id ? { ...a, active: !a.active } : a)));
      onShowToast(`Alert ${!alert.active ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to toggle alert');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await api(`/admin/alerts/${id}`, { method: 'DELETE' });
      setAlerts(prev => prev.filter(a => a.id !== id));
      onShowToast('Alert removed.');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to delete alert');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch { }
    setToken(null);
    onUserUpdate(null);
    onShowToast('Admin signed out.');
  };

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (!tradeSearch) return allTrades;
    const q = tradeSearch.toLowerCase();
    return allTrades.filter(
      t =>
        t.symbol.toLowerCase().includes(q) ||
        (t.user?.email && t.user.email.toLowerCase().includes(q)) ||
        (t.user?.name && t.user.name.toLowerCase().includes(q))
    );
  }, [allTrades, tradeSearch]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      l =>
        l.action.toLowerCase().includes(q) ||
        (l.user?.email && l.user.email.toLowerCase().includes(q)) ||
        (l.user?.name && l.user.name.toLowerCase().includes(q))
    );
  }, [auditLogs, auditSearch]);

  // Paginated slices for tables
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return users.slice(start, start + userPageSize);
  }, [users, userPage, userPageSize]);

  const paginatedTrades = useMemo(() => {
    const start = (tradePage - 1) * tradePageSize;
    return filteredTrades.slice(start, start + tradePageSize);
  }, [filteredTrades, tradePage, tradePageSize]);

  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize]);

  // Admin Profile action handlers
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminProfileBusy(true);
    setAdminProfileError('');
    try {
      const data = await api<{ user: User; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: adminName })
      });
      onUserUpdate(data.user);
      onShowToast(data.message || 'Admin profile updated.');
    } catch (err) {
      setAdminProfileError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setAdminProfileBusy(false);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordError('New passwords do not match.');
      return;
    }
    setAdminPasswordBusy(true);
    setAdminPasswordError('');
    try {
      const data = await api<{ message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: adminCurrentPassword, newPassword: adminNewPassword })
      });
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      onShowToast(data.message || 'Admin password updated successfully.');
    } catch (err) {
      setAdminPasswordError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setAdminPasswordBusy(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: ADMIN LOGIN VIEW (IF NOT AUTHENTICATED AS ADMIN)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-shield-icon">
              <ShieldCheck size={36} color="#ffb347" />
            </div>
            <h2>MarketPilot Admin Portal</h2>
            <p>Restricted access for system administrators and operations staff.</p>
          </div>

          {/* {currentUser && currentUser.role !== 'ADMIN' && (
            <div className="admin-login-alert">
              <AlertTriangle size={18} color="#ff7a59" />
              <span>
                You are currently signed in as <strong>{currentUser.email}</strong> (Role: {currentUser.role || 'USER'}). This role does not have admin permissions.
              </span>
            </div>
          )} */}

          {loginError && (
            <div className="admin-login-alert error">
              <AlertTriangle size={18} color="#ff4d4f" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <div className="form-group">
              <label>Administrator Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="admin@marketpilot.local"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loginLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loginLoading}
                />
                <button
                  type="button"
                  className="show-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-primary-btn" disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Login Admin
                </>
              )}
            </button>
          </form>

          <div className="admin-demo-hint">
            <div className="hint-label">Pre-configured Admin Seed:</div>
            <div className="hint-creds">
              <code>admin@marketpilot.local</code> / <code>AdminPass!234</code>
            </div>
            <button
              type="button"
              className="quick-fill-btn"
              onClick={handleFillDemoAdmin}
            >
              Autofill Admin Credentials
            </button>
          </div>

          <div className="admin-login-footer">
            <button
              type="button"
              className="back-to-site-btn"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} /> Return to Public Market Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE
  // -------------------------------------------------------------
  return (
    <div className="admin-console-layout embedded">
      {/* Main Admin Body */}
      <div className="admin-container">

        {/* ----------------- TAB 1: OVERVIEW & ANALYTICS ----------------- */}
        {activeTab === 'overview' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>Platform Performance & Metrics</h2>
                <p>Live health, user growth, subscription breakdown, and system audit feed.</p>
              </div>
              <button className="admin-secondary-btn" onClick={fetchDashboardData} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Stats
              </button>
            </div>

            {/* KPI Cards */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-box users-icon">
                  <Users size={22} />
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">TOTAL REGISTERED USERS</span>
                  <div className="kpi-value">{stats?.totalUsers ?? 0}</div>
                  <span className="kpi-subtext">
                    <strong>{stats?.adminCount ?? 0}</strong> Admin{stats?.adminCount === 1 ? '' : 's'} · <strong>{stats?.userCount ?? 0}</strong> Standard Traders
                  </span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-box mrr-icon">
                  <DollarSign size={22} />
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">ESTIMATED MRR</span>
                  <div className="kpi-value">₹{(stats?.estimatedMRR ?? 0).toLocaleString('en-IN')}</div>
                  <span className="kpi-subtext">
                    Based on active PRO (₹1,999) & ELITE (₹4,999) plans
                  </span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-box trades-icon">
                  <TrendingUp size={22} />
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">JOURNAL TRADES PLACED</span>
                  <div className="kpi-value">{stats?.totalJournalTrades ?? 0}</div>
                  <span className="kpi-subtext">
                    Across <strong>{stats?.totalWatchlistItems ?? 0}</strong> total watched stocks
                  </span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-box audit-icon">
                  <ShieldCheck size={22} />
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">SYSTEM AUDIT EVENTS</span>
                  <div className="kpi-value">{stats?.totalAuditLogs ?? 0}</div>
                  <span className="kpi-subtext">Immutable log trail stored in database</span>
                </div>
              </div>
            </div>

            {/* Subscription Breakdown & Plan Distribution */}
            <div className="admin-two-col-grid">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>
                    <CreditCard size={18} /> Plan Distribution
                  </h3>
                  <button className="text-action-btn" onClick={() => handleTabSwitch('subscriptions')}>
                    Manage Plans <ChevronRight size={14} />
                  </button>
                </div>
                <div className="plan-stats-list">
                  <div className="plan-stat-row">
                    <div className="plan-stat-left">
                      <span className="plan-badge elite">ELITE</span>
                      <span className="plan-name">Institutional Desk (₹4,999/mo)</span>
                    </div>
                    <div className="plan-stat-right">
                      <strong>{stats?.planCounts?.ELITE ?? 0}</strong> users
                    </div>
                  </div>
                  <div className="plan-stat-row">
                    <div className="plan-stat-left">
                      <span className="plan-badge pro">PRO</span>
                      <span className="plan-name">Active Trader (₹1,999/mo)</span>
                    </div>
                    <div className="plan-stat-right">
                      <strong>{stats?.planCounts?.PRO ?? 0}</strong> users
                    </div>
                  </div>
                  <div className="plan-stat-row">
                    <div className="plan-stat-left">
                      <span className="plan-badge free">FREE</span>
                      <span className="plan-name">Community Starter</span>
                    </div>
                    <div className="plan-stat-right">
                      <strong>{stats?.planCounts?.FREE ?? 0}</strong> users
                    </div>
                  </div>
                </div>

                <div className="status-pills-row">
                  <div className="status-pill-item">
                    <span className="dot green" />
                    <span>Active: <strong>{stats?.statusCounts?.ACTIVE ?? 0}</strong></span>
                  </div>
                  <div className="status-pill-item">
                    <span className="dot yellow" />
                    <span>Trialing: <strong>{stats?.statusCounts?.TRIALING ?? 0}</strong></span>
                  </div>
                  <div className="status-pill-item">
                    <span className="dot red" />
                    <span>Cancelled: <strong>{stats?.statusCounts?.CANCELLED ?? 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Recent Audit Feed */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>
                    <Activity size={18} /> Recent Security & Platform Events
                  </h3>
                  <button className="text-action-btn" onClick={() => handleTabSwitch('audit')}>
                    View All Logs <ChevronRight size={14} />
                  </button>
                </div>
                <div className="audit-feed-list">
                  {recentLogs.length === 0 ? (
                    <div className="empty-state-text">No recent audit logs found.</div>
                  ) : (
                    recentLogs.slice(0, 6).map(log => (
                      <div key={log.id} className="audit-feed-item">
                        <div className="audit-dot" />
                        <div className="audit-info">
                          <div className="audit-action-row">
                            <span className="audit-action-tag">{log.action}</span>
                            <span className="audit-time">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="audit-user-row">
                            {log.user ? (
                              <span>
                                {log.user.name} ({log.user.email}) · <span className="role-subtle">{log.user.role}</span>
                              </span>
                            ) : (
                              <span>System Internal</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: USERS MANAGEMENT ----------------- */}
        {activeTab === 'users' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>User Directory & Access Control</h2>
                <p>Search, inspect, upgrade subscriptions, change admin roles, or remove accounts.</p>
              </div>
              <button
                className="admin-primary-btn"
                onClick={() => setShowCreateUserModal(true)}
              >
                <Plus size={16} /> Add New User
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="admin-filter-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              <div className="filters-group">
                <CustomSelect
                  value={roleFilter}
                  onChange={val => {
                    setRoleFilter(val);
                    setUserPage(1);
                  }}
                  options={roleFilterOptions}
                  className="admin-filter-select"
                />

                <CustomSelect
                  value={planFilter}
                  onChange={val => {
                    setPlanFilter(val);
                    setUserPage(1);
                  }}
                  options={planFilterOptions}
                  className="admin-filter-select"
                />

                <CustomSelect
                  value={statusFilter}
                  onChange={val => {
                    setStatusFilter(val);
                    setUserPage(1);
                  }}
                  options={statusFilterOptions}
                  className="admin-filter-select"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User / Email</th>
                    <th>Role</th>
                    <th>Subscription</th>
                    <th>Activity</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-cell">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-name-cell">
                            <strong>{u.name}</strong>
                            <span>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${u.role === 'ADMIN' ? 'admin' : 'user'}`}>
                            {u.role === 'ADMIN' ? '⚡ ADMIN' : 'USER'}
                          </span>
                        </td>
                        <td>
                          <div className="sub-cell">
                            <span className={`plan-badge ${(u.subscription?.plan || 'FREE').toLowerCase()}`}>
                              {u.subscription?.plan || 'FREE'}
                            </span>
                            <span className={`status-tag ${(u.subscription?.status || 'ACTIVE').toLowerCase()}`}>
                              {u.subscription?.status || 'ACTIVE'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="activity-stat">
                            <strong>{u._count.journal}</strong> trades · <strong>{u._count.watchlist}</strong> watched
                          </span>
                        </td>
                        <td>
                          <span className="date-cell">
                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cluster">
                            <button
                              className="action-icon-btn"
                              title="Edit User & Role"
                              onClick={() => {
                                setEditUserModal(u);
                                setEditForm({ name: u.name, email: u.email, role: u.role });
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="action-icon-btn sub-manage-btn"
                              title="Manage Subscription"
                              onClick={() => {
                                setSubModalUser(u);
                                setSubForm({
                                  plan: u.subscription?.plan || 'FREE',
                                  status: u.subscription?.status || 'ACTIVE',
                                  daysValid: 30
                                });
                              }}
                            >
                              <CreditCard size={15} />
                            </button>
                            <button
                              className="action-icon-btn delete-btn"
                              title="Delete Account"
                              disabled={u.id === currentUser.id}
                              onClick={() => setDeleteConfirmUser(u)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={userPage}
                totalItems={users.length}
                pageSize={userPageSize}
                onPageChange={setUserPage}
                onPageSizeChange={setUserPageSize}
                itemName="users"
              />
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: SUBSCRIPTIONS & BILLING ----------------- */}
        {activeTab === 'subscriptions' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>Subscription Tiers & Billing Overrides</h2>
                <p>Instantly grant Pro or Elite access, override statuses, or extend trial days.</p>
              </div>
            </div>

            <div className="pricing-tier-cards-row">
              <div className="tier-spec-card free-spec">
                <div className="tier-spec-header">
                  <span className="plan-badge free">FREE</span>
                  <h3>Community Trader</h3>
                  <div className="tier-price">₹0 <span>/ lifetime</span></div>
                </div>
                <ul className="tier-features-list">
                  <li>Up to 5 watchlist instruments</li>
                  <li>Basic simulated Indian market quotes</li>
                  <li>Single trade journal storage</li>
                  <li>Standard risk metrics</li>
                </ul>
                <div className="tier-footer-count">
                  Users on Free: <strong>{stats?.planCounts?.FREE ?? 0}</strong>
                </div>
              </div>

              <div className="tier-spec-card pro-spec featured">
                <div className="tier-spec-badge">POPULAR</div>
                <div className="tier-spec-header">
                  <span className="plan-badge pro">PRO</span>
                  <h3>Active Trader</h3>
                  <div className="tier-price">₹1,999 <span>/ month</span></div>
                </div>
                <ul className="tier-features-list">
                  <li>Unlimited watchlists</li>
                  <li>Full multi-condition scanners</li>
                  <li>Comprehensive trade analytics</li>
                  <li>Risk studio with position sizing</li>
                </ul>
                <div className="tier-footer-count">
                  Users on Pro: <strong>{stats?.planCounts?.PRO ?? 0}</strong>
                </div>
              </div>

              <div className="tier-spec-card elite-spec">
                <div className="tier-spec-header">
                  <span className="plan-badge elite">ELITE</span>
                  <h3>Institutional Desk</h3>
                  <div className="tier-price">₹4,999 <span>/ month</span></div>
                </div>
                <ul className="tier-features-list">
                  <li>Everything in Pro</li>
                  <li>Priority API bandwidth & dedicated speed</li>
                  <li>Team collaboration workspaces</li>
                  <li>Custom algorithmic webhook triggers</li>
                </ul>
                <div className="tier-footer-count">
                  Users on Elite: <strong>{stats?.planCounts?.ELITE ?? 0}</strong>
                </div>
              </div>
            </div>

            {/* Quick Subscribers Table */}
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <div className="admin-card-header">
                <h3>Subscribed Traders Overview</h3>
                <span className="header-hint">Showing all accounts with active tier assignments</span>
              </div>

              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Current Tier</th>
                      <th>Status</th>
                      <th>Expires At</th>
                      <th style={{ textAlign: 'right' }}>Quick Upgrade / Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{u.email}</div>
                        </td>
                        <td>
                          <span className={`plan-badge ${(u.subscription?.plan || 'FREE').toLowerCase()}`}>
                            {u.subscription?.plan || 'FREE'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-tag ${(u.subscription?.status || 'ACTIVE').toLowerCase()}`}>
                            {u.subscription?.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          {u.subscription?.currentPeriodEnd ? (
                            new Date(u.subscription.currentPeriodEnd).toLocaleDateString('en-IN')
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>Never (Lifetime)</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="admin-secondary-btn"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              setSubModalUser(u);
                              setSubForm({
                                plan: u.subscription?.plan || 'FREE',
                                status: u.subscription?.status || 'ACTIVE',
                                daysValid: 30
                              });
                            }}
                          >
                            <Sliders size={13} /> Change Plan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: PLATFORM TRADES ----------------- */}
        {activeTab === 'trades' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>Platform Trades & Journal Activity</h2>
                <p>Inspect simulated trades placed by all platform users across Indian indices & equities.</p>
              </div>
              <button className="admin-secondary-btn" onClick={fetchTrades}>
                <RefreshCw size={15} /> Refresh Trades
              </button>
            </div>

            <div className="admin-filter-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by symbol (e.g. RELIANCE, TCS) or user email..."
                  value={tradeSearch}
                  onChange={e => {
                    setTradeSearch(e.target.value);
                    setTradePage(1);
                  }}
                />
              </div>
            </div>

            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Trader</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Entry Price</th>
                    <th>Quantity</th>
                    <th>Total Capital</th>
                    <th>Date & Time</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-table-cell">
                        No trade journal entries found.
                      </td>
                    </tr>
                  ) : (
                    paginatedTrades.map(trade => {
                      const price = Number(trade.entryPrice);
                      const total = price * trade.quantity;
                      return (
                        <tr key={trade.id}>
                          <td>
                            <strong>{trade.user?.name || 'Anonymous'}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{trade.user?.email}</div>
                          </td>
                          <td>
                            <strong className="symbol-pill">{trade.symbol}</strong>
                          </td>
                          <td>
                            <span className={`side-badge ${trade.side.toLowerCase()}`}>
                              {trade.side}
                            </span>
                          </td>
                          <td>₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>{trade.quantity}</td>
                          <td>
                            <strong>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          </td>
                          <td>
                            {trade.tradedAt
                              ? new Date(trade.tradedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : '—'}
                          </td>
                          <td>
                            <span className="notes-cell" title={trade.notes}>
                              {trade.notes || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={tradePage}
                totalItems={filteredTrades.length}
                pageSize={tradePageSize}
                onPageChange={setTradePage}
                onPageSizeChange={setTradePageSize}
                itemName="trades"
              />
            </div>
          </div>
        )}

        {/* ----------------- TAB 5: PLATFORM ALERTS & BROADCAST ----------------- */}
        {activeTab === 'alerts' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>System Announcements & Broadcast Banners</h2>
                <p>Broadcast real-time market notices, pre-market updates, or maintenance banners to users.</p>
              </div>
            </div>

            {/* Create Alert Box */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <div className="admin-card-header">
                <h3>
                  <Bell size={18} /> Publish New Broadcast Banner
                </h3>
              </div>
              <form onSubmit={handleCreateAlert} className="create-alert-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Alert Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NSE Special Trading Session / Pre-Market Briefing"
                      value={newAlert.title}
                      onChange={e => setNewAlert({ ...newAlert, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Severity Level</label>
                    <CustomSelect
                      value={newAlert.severity}
                      onChange={val => setNewAlert({ ...newAlert, severity: val as any })}
                      options={alertSeverityOptions}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Broadcast Message Body</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter message visible to all clients visiting the website..."
                    value={newAlert.message}
                    onChange={e => setNewAlert({ ...newAlert, message: e.target.value })}
                  />
                </div>

                <div className="form-actions-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newAlert.active}
                      onChange={e => setNewAlert({ ...newAlert, active: e.target.checked })}
                    />
                    <span>Publish as Active immediately</span>
                  </label>
                  <button type="submit" className="admin-primary-btn" disabled={alertLoading}>
                    {alertLoading ? <RefreshCw size={15} className="spin" /> : <Plus size={16} />} Publish Alert
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Alerts Table */}
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Title & Content</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-table-cell">
                        No announcements or alerts published yet.
                      </td>
                    </tr>
                  ) : (
                    alerts.map(a => (
                      <tr key={a.id}>
                        <td>
                          <span className={`alert-severity-badge ${a.severity}`}>
                            {a.severity.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="alert-content-cell">
                            <strong>{a.title}</strong>
                            <p>{a.message}</p>
                          </div>
                        </td>
                        <td>
                          <button
                            className={`toggle-status-btn ${a.active ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleAlert(a)}
                          >
                            {a.active ? '● LIVE / ON' : '○ OFF'}
                          </button>
                        </td>
                        <td>
                          <span className="date-cell">
                            {new Date(a.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="action-icon-btn delete-btn"
                            title="Delete alert"
                            onClick={() => handleDeleteAlert(a.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 6: AUDIT & SECURITY LOGS ----------------- */}
        {activeTab === 'audit' && (
          <div className="admin-tab-content">
            <div className="content-header-row">
              <div>
                <h2>System Audit Logs & Security History</h2>
                <p>Track administrator actions, user sign-ins, subscription changes, and security updates.</p>
              </div>
              <button className="admin-secondary-btn" onClick={fetchAuditLogs}>
                <RefreshCw size={15} /> Refresh Audit Trail
              </button>
            </div>

            <div className="admin-filter-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by action (e.g. LOGIN, REGISTER, SUBSCRIPTION, ADMIN) or user email..."
                  value={auditSearch}
                  onChange={e => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                />
              </div>
            </div>

            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action Event</th>
                    <th>Triggered By</th>
                    <th>Role</th>
                    <th>Details / Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-table-cell">
                        No matching audit events found.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span className="date-cell">
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </td>
                        <td>
                          <code className="action-code">{log.action}</code>
                        </td>
                        <td>
                          {log.user ? (
                            <div>
                              <strong>{log.user.name}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{log.user.email}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>System / Anonymous</span>
                          )}
                        </td>
                        <td>
                          <span className={`role-badge ${(log.user?.role || 'USER').toLowerCase()}`}>
                            {log.user?.role || 'SYSTEM'}
                          </span>
                        </td>
                        <td>
                          <code className="meta-code">
                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                          </code>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={auditPage}
                totalItems={filteredAuditLogs.length}
                pageSize={auditPageSize}
                onPageChange={setAuditPage}
                onPageSizeChange={setAuditPageSize}
                itemName="audit events"
              />
            </div>
          </div>
        )}

        {/* ----------------- TAB 7: ADMIN PROFILE & SECURITY ----------------- */}
        {activeTab === 'profile' && (
          <div className="admin-tab-content">
            <div className="profile-page-wrapper" style={{ padding: 0 }}>
              {/* 1. Admin Hero Identity Card */}
              <section className="panel profile-hero-card admin-profile-hero">
                <div className="profile-hero-content">
                  <div className="profile-avatar-large admin-avatar-lg">
                    {(currentUser?.name || currentUser?.email || 'AD').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="profile-hero-info">
                    <div className="profile-name-row">
                      <h2>{currentUser?.name || 'Administrator'}</h2>
                      <span className="plan-badge-pill pro" style={{ background: 'rgba(255, 179, 71, 0.18)', color: '#ffb347', borderColor: 'rgba(255, 179, 71, 0.4)' }}>
                        <Crown size={12} /> SUPER ADMIN CONSOLE
                      </span>
                    </div>
                    <div className="profile-meta-row">
                      <span className="profile-meta-item">
                        <Mail size={13} /> {currentUser?.email}
                      </span>
                      <span className="profile-meta-item">
                        <ShieldCheck size={13} /> Root Security Clearance (Level 5)
                      </span>
                      <span className="profile-meta-item">
                        <Server size={13} /> Active Cluster: Production Node
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={() => handleTabSwitch('audit')}
                  >
                    <Activity size={14} /> View Audit Trail
                  </button>
                  <button
                    type="button"
                    className="admin-danger-btn"
                    onClick={handleAdminLogout}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </section>

              {/* 2. Two-Column Admin Settings Grid */}
              <div className="profile-settings-grid">
                {/* Column 1: Admin Account Details */}
                <div className="panel page-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">ADMINISTRATOR IDENTITY</div>
                      <h2>Account Details</h2>
                      <p className="panel-description">Manage your administrative credentials and console identity.</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateAdminProfile} className="profile-form-layout">
                    {adminProfileError && (
                      <div className="admin-login-error" style={{ marginBottom: '14px' }}>
                        <AlertTriangle size={15} /> {adminProfileError}
                      </div>
                    )}

                    <label>
                      Administrator Email (System Key)
                      <input value={currentUser?.email || ''} disabled className="disabled-input" />
                    </label>

                    <label>
                      Administrator Full Name
                      <input
                        required
                        value={adminName}
                        onChange={e => setAdminName(e.target.value)}
                        placeholder="Enter full administrator name"
                      />
                    </label>

                    <div className="preferences-divider">
                      <Sliders size={14} />
                      <span>Administrative Console Privileges</span>
                    </div>

                    <div className="form-grid-2col">
                      <label>
                        Access Role
                        <input value="ADMIN (Super Admin)" disabled className="disabled-input" />
                      </label>

                      <label>
                        Session Authority
                        <input value="Root / Full Override" disabled className="disabled-input" />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={adminProfileBusy}
                      style={{ marginTop: '10px' }}
                    >
                      {adminProfileBusy ? <RefreshCw size={14} className="spin" /> : <UserCheck size={14} />} Save Admin Profile
                    </button>
                  </form>
                </div>

                {/* Column 2: Admin Security & Password */}
                <div className="panel page-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">CREDENTIAL ACCESS & SECURITY</div>
                      <h2>Change Master Password</h2>
                      <p className="panel-description">Update the master key used to access this administrative console.</p>
                    </div>
                  </div>

                  <form onSubmit={handleChangeAdminPassword} className="profile-form-layout">
                    {adminPasswordError && (
                      <div className="admin-login-error" style={{ marginBottom: '14px' }}>
                        <AlertTriangle size={15} /> {adminPasswordError}
                      </div>
                    )}

                    <label>
                      Current Password
                      <input
                        type="password"
                        required
                        value={adminCurrentPassword}
                        onChange={e => setAdminCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </label>

                    <label>
                      New Master Password (min 8 characters)
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={adminNewPassword}
                        onChange={e => setAdminNewPassword(e.target.value)}
                        placeholder="Enter strong new password"
                      />
                    </label>

                    <label>
                      Confirm New Password
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={adminConfirmPassword}
                        onChange={e => setAdminConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </label>

                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={adminPasswordBusy}
                      style={{ marginTop: '10px' }}
                    >
                      {adminPasswordBusy ? <RefreshCw size={14} className="spin" /> : <KeyRound size={14} />} Update Master Password
                    </button>
                  </form>
                </div>
              </div>

              {/* 3. System Access Scopes & Privileges Grid */}
              <div className="panel page-panel" style={{ marginTop: '20px' }}>
                <div className="panel-heading">
                  <div>
                    <div className="section-kicker">SECURITY MATRIX</div>
                    <h2>Administrator Permissions & System Authority</h2>
                    <p className="panel-description">Active privileges granted to this root administrator account across the MarketPilot ecosystem.</p>
                  </div>
                </div>

                <div className="admin-permissions-grid">
                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <Users size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>User Governance & Access</strong>
                      <span>Provision client accounts, change access tiers, or suspend accounts platform-wide.</span>
                    </div>
                  </div>

                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <CreditCard size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>Subscription Authority</strong>
                      <span>Override subscription plans, grant Free/Pro/Elite tiers, and configure expiration.</span>
                    </div>
                  </div>

                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <Bell size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>Platform Broadcast Desk</strong>
                      <span>Broadcast real-time market notices, pre-market updates, and maintenance banners.</span>
                    </div>
                  </div>

                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <TrendingUp size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>Platform Trades Oversight</strong>
                      <span>Full read-access to journal records, executed orders, and risk limits across all users.</span>
                    </div>
                  </div>

                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <Activity size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>Tamper-Evident Audit Trail</strong>
                      <span>Review immutable security and operational audit logs for every system transaction.</span>
                    </div>
                  </div>

                  <div className="permission-card">
                    <div className="perm-icon-box">
                      <Database size={16} />
                    </div>
                    <div className="perm-meta">
                      <strong>Database & Engine Health</strong>
                      <span>Monitor Prisma ORM engine state, active connection pools, and core API metrics.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------- MODAL: CREATE USER ----------------- */}
      {showCreateUserModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateUserModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <Plus size={18} /> Provision New Account
              </h3>
              <button className="close-btn" onClick={() => setShowCreateUserModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="admin-modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Initial Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Account Role</label>
                  <CustomSelect
                    value={newUser.role}
                    onChange={val => setNewUser({ ...newUser, role: val })}
                    options={userRoleOptions}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Plan Tier</label>
                  <CustomSelect
                    value={newUser.plan}
                    onChange={val => setNewUser({ ...newUser, plan: val })}
                    options={userPlanOptions}
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowCreateUserModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn" disabled={createLoading}>
                  {createLoading ? <RefreshCw size={15} className="spin" /> : <Plus size={16} />} Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: EDIT USER & ROLE ----------------- */}
      {editUserModal && (
        <div className="admin-modal-backdrop" onClick={() => setEditUserModal(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <Edit2 size={18} /> Edit User & Privileges
              </h3>
              <button className="close-btn" onClick={() => setEditUserModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="admin-modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Role Assignment</label>
                <CustomSelect
                  value={editForm.role}
                  onChange={val => setEditForm({ ...editForm, role: val })}
                  options={userRoleOptions}
                />
                <span className="form-hint" style={{ marginTop: '6px', display: 'block' }}>
                  Admin users can access this console, manage accounts, and broadcast platform alerts.
                </span>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setEditUserModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn" disabled={editLoading}>
                  {editLoading ? <RefreshCw size={15} className="spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: MANAGE SUBSCRIPTION ----------------- */}
      {subModalUser && (
        <div className="admin-modal-backdrop" onClick={() => setSubModalUser(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <CreditCard size={18} /> Manage Subscription for {subModalUser.name}
              </h3>
              <button className="close-btn" onClick={() => setSubModalUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubscription} className="admin-modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Subscription Tier</label>
                  <CustomSelect
                    value={subForm.plan}
                    onChange={val => setSubForm({ ...subForm, plan: val })}
                    options={userPlanOptions}
                  />
                </div>

                <div className="form-group">
                  <label>Subscription Status</label>
                  <CustomSelect
                    value={subForm.status}
                    onChange={val => setSubForm({ ...subForm, status: val })}
                    options={subStatusOptions}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Validity Period (Days from Today)</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={subForm.daysValid}
                  onChange={e => setSubForm({ ...subForm, daysValid: Number(e.target.value) })}
                />
                <span className="form-hint">
                  E.g. 30 days for monthly cycle, 365 days for annual subscription.
                </span>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setSubModalUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn" disabled={subLoading}>
                  {subLoading ? <RefreshCw size={15} className="spin" /> : 'Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: DELETE CONFIRMATION ----------------- */}
      {deleteConfirmUser && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteConfirmUser(null)}>
          <div className="admin-modal-card danger" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                <AlertTriangle size={18} color="#ff4d4f" /> Confirm Account Deletion
              </h3>
              <button className="close-btn" onClick={() => setDeleteConfirmUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to permanently delete user <strong>{deleteConfirmUser.name}</strong> (
                <code>{deleteConfirmUser.email}</code>)?
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                This will cascade-delete their saved watchlist items, trade journal records, and subscription records. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions-row">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setDeleteConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-danger-btn"
                disabled={deleteLoading}
                onClick={handleDeleteUser}
              >
                {deleteLoading ? <RefreshCw size={15} className="spin" /> : <Trash2 size={15} />} Permanently Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminPage;
