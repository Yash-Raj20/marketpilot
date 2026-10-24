import { useState } from 'react';
import { 
  KeyRound, 
  Shield, 
  User as UserIcon, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  Sliders, 
  Clock, 
  ArrowUpRight,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User } from '../types';

interface ProfilePageProps {
  user: User | null;
  onOpenAuth: () => void;
  onUserUpdate: (user: User) => void;
  onShowToast: (msg: string) => void;
}

export function ProfilePage({ user, onOpenAuth, onUserUpdate, onShowToast }: ProfilePageProps) {
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Preference mock states for customizable trader experience
  const [defaultRisk, setDefaultRisk] = useState('1.0%');
  const [defaultExchange, setDefaultExchange] = useState('NSE (National Stock Exchange)');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  if (!user) {
    return (
      <section className="panel page-panel">
        <div className="empty-state" style={{ minHeight: 320, padding: 30 }}>
          <div className="empty-star-ring">
            <UserIcon size={34} />
          </div>
          <h3>Trader Identity & Account Required</h3>
          <p>
            Please sign in to access your personal trading preferences, workspace plan, and security settings.
          </p>
          <button className="primary-btn" onClick={onOpenAuth} style={{ marginTop: 15 }}>
            Sign In to MarketPilot <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    );
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api<{ user: User; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      onUserUpdate(data.user);
      onShowToast(data.message || 'Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api<{ message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast(data.message || 'Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setBusy(false);
    }
  }

  const planName = user.subscription?.plan || 'FREE';
  const avatarInitials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="profile-page-wrapper">
      {/* 1. Profile Hero Identity Card */}
      <section className="panel profile-hero-card">
        <div className="profile-hero-content">
          <div className="profile-avatar-large">
            {avatarInitials}
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h2>{user.name || 'Active Trader'}</h2>
              <span className={`plan-badge-pill ${planName.toLowerCase()}`}>
                <Crown size={12} /> {planName} PLAN
              </span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={13} /> {user.email}
              </span>
              <span className="profile-meta-item">
                <Shield size={13} /> Cloud Account Active
              </span>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          className="secondary-btn manage-plan-btn"
          onClick={() => navigate('/plans')}
        >
          <Sparkles size={14} /> Upgrade / Plans
        </button>
      </section>

      {/* 2. Two-Column Settings Grid */}
      <div className="profile-settings-grid">
        {/* Left Column: Account Details & Preferences */}
        <div className="panel page-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">PERSONAL IDENTITY</div>
              <h2>Account Details</h2>
              <p className="panel-description">Manage your workspace identity and personal preferences.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form-layout">
            <label>
              Email Address (Account Identifier)
              <input value={user.email} disabled className="disabled-input" />
            </label>

            <label>
              Full Name
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </label>

            <div className="preferences-divider">
              <Sliders size={14} />
              <span>Trader Workspace Defaults</span>
            </div>

            <div className="form-grid-2col">
              <label>
                Default Risk Allocation
                <input 
                  value={defaultRisk} 
                  onChange={e => setDefaultRisk(e.target.value)} 
                />
              </label>

              <label>
                Primary Exchange
                <input 
                  value={defaultExchange} 
                  onChange={e => setDefaultExchange(e.target.value)} 
                />
              </label>
            </div>

            <div className="pref-checkbox-row">
              <input 
                type="checkbox" 
                id="alert-pref" 
                checked={alertsEnabled} 
                onChange={e => setAlertsEnabled(e.target.checked)} 
              />
              <label htmlFor="alert-pref">
                Enable Simulated Real-Time Breakout & RSI Notifications
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-btn" disabled={busy} style={{ width: 'fit-content' }}>
              <UserCheck size={15} />
              <span>{busy ? 'Saving changes…' : 'Save Details'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Security & Password */}
        <div className="panel page-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">SECURITY & ACCESS</div>
              <h2>Change Password</h2>
              <p className="panel-description">Keep your trading notes and custom setups protected.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form-layout">
            <label>
              Current Password
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 10 characters"
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                required
                minLength={10}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </label>

            <div className="password-security-hint">
              <Lock size={13} />
              <span>Passwords must contain at least 10 characters with numbers and letters.</span>
            </div>

            <button className="secondary-btn" disabled={busy} style={{ width: 'fit-content' }}>
              <KeyRound size={15} />
              <span>{busy ? 'Updating…' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
