import { useState, useEffect } from 'react';
import { 
  Activity, 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Check, 
  ShieldCheck,
  ArrowRight,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { api, setToken } from '../lib/api';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultMode?: 'login' | 'register' | 'reset';
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>(defaultMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync mode if defaultMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthMode(defaultMode);
      setError('');
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      let endpoint = '/auth/login';
      let payload: Record<string, string> = { email: email.trim(), password };

      if (authMode === 'register') {
        endpoint = '/auth/register';
        payload = { name: name.trim(), email: email.trim(), password };
      } else if (authMode === 'reset') {
        endpoint = '/auth/reset-password';
        payload = { email: email.trim(), newPassword: password };
      }

      const data = await api<{ user: User; token?: string; message?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.token) {
        setToken(data.token);
      }

      onSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function fillDemoAccount() {
    setEmail('demo@marketpilot.local');
    setPassword('DemoPass!234');
    setError('');
  }

  const isPasswordValid = password.length >= 10;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="auth-modal" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
      >
        {/* Ambient Top Glow Effect */}
        <div className="modal-glow-top" />

        {/* Close Button */}
        <button 
          className="modal-close" 
          onClick={onClose} 
          aria-label="Close modal"
          title="Close (Esc)"
          type="button"
        >
          <X size={18} />
        </button>

        {/* Header: Brand & Mode Segmented Switcher */}
        <div className="auth-header-top">
          <div className="modal-brand-badge">
            <div className="brand-mark">
              <Activity size={19} />
            </div>
            <span className="brand-text">
              market<span className="brand-accent">pilot</span><sup>AI</sup>
            </span>
          </div>

          {authMode !== 'reset' ? (
            <div className="auth-segmented-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                className={`auth-segment-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setError(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                className={`auth-segment-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setError(''); }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => { setAuthMode('login'); setError(''); }}
            >
              <ArrowLeft size={13} /> Back to Sign In
            </button>
          )}
        </div>

        {/* Heading & Subtitle */}
        <div className="auth-title-section">
          <h2>
            {authMode === 'login' && (
              <>Welcome <span className="auth-highlight">back</span></>
            )}
            {authMode === 'register' && (
              <>Create your <span className="auth-highlight">account</span></>
            )}
            {authMode === 'reset' && (
              <>Reset your <span className="auth-highlight">password</span></>
            )}
          </h2>
          <p>
            {authMode === 'login' && 'Access your saved watchlists, simulated trades & AI risk analytics.'}
            {authMode === 'register' && 'Join MarketPilot to execute with confidence, journal trades & track alpha.'}
            {authMode === 'reset' && 'Enter your registered email and choose your new secure password.'}
          </p>
        </div>

        {/* Quick Fill Demo Pill for Login */}
        {authMode === 'login' && (
          <button 
            type="button" 
            className="demo-prefill-pill" 
            onClick={fillDemoAccount}
            title="Click to fill test credentials"
          >
            <Sparkles size={14} className="sparkle-icon" />
            <span className="demo-pill-text">
              Demo: <code>demo@marketpilot.local</code>
            </span>
            <span className="demo-pill-badge">Autofill</span>
          </button>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {authMode === 'register' && (
            <div className="input-group">
              <label htmlFor="auth-name">Full name</label>
              <div className="input-wrapper">
                <UserIcon size={16} className="input-icon" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ratnesh Kumar"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="auth-email">Email address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                autoFocus={authMode !== 'register'}
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-label-row">
              <label htmlFor="auth-password">
                {authMode === 'reset' ? 'New Password' : 'Password'}
              </label>

              {authMode === 'login' ? (
                <button
                  type="button"
                  className="forgot-pwd-link"
                  onClick={() => { setAuthMode('reset'); setError(''); }}
                >
                  Forgot password?
                </button>
              ) : (
                <span className={`pwd-req-badge ${isPasswordValid ? 'valid' : ''}`}>
                  {isPasswordValid ? (
                    <><Check size={12} /> ≥ 10 characters</>
                  ) : (
                    'Min 10 characters'
                  )}
                </span>
              )}
            </div>

            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={authMode === 'login' ? 1 : 10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === 'login' ? 'Enter your password' : 'At least 10 characters'}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={15} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button 
            type="submit" 
            className="primary-btn auth-submit-btn" 
            disabled={busy || (authMode !== 'login' && password.length < 10)}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="btn-spinner" />
                <span>
                  {authMode === 'login' && 'Signing in…'}
                  {authMode === 'register' && 'Creating account…'}
                  {authMode === 'reset' && 'Resetting password…'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {authMode === 'login' && 'Sign in to Dashboard'}
                  {authMode === 'register' && 'Create Free Account'}
                  {authMode === 'reset' && 'Reset Password & Sign In'}
                </span>
                {authMode === 'reset' ? <KeyRound size={15} /> : <ArrowRight size={15} />}
              </>
            )}
          </button>
        </form>

        {/* Bottom Switcher */}
        <div className="auth-switch-row">
          {authMode === 'login' && (
            <>
              <span>Don't have an account yet?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => { setAuthMode('register'); setError(''); }}
              >
                Create an account
              </button>
            </>
          )}
          {authMode === 'register' && (
            <>
              <span>Already registered?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => { setAuthMode('login'); setError(''); }}
              >
                Sign in here
              </button>
            </>
          )}
          {authMode === 'reset' && (
            <>
              <span>Remembered your password?</span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => { setAuthMode('login'); setError(''); }}
              >
                Return to sign in
              </button>
            </>
          )}
        </div>

        {/* Security & Platform Trust Badges */}
        <div className="auth-trust-footer">
          <div className="trust-item">
            <ShieldCheck size={13} className="trust-icon" />
            <span>Encrypted HttpOnly Cookie Session</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <Sparkles size={13} className="trust-icon" />
            <span>Zero LocalStorage Exposure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
