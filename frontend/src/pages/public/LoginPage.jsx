import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage({ onLoginSuccess, onStartVerification, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setUnverifiedEmail(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setIsLoading(false);
        // Check if unverified
        if (data.requires_verification || (data.detail && data.detail.includes('not verified')) || (data.error && data.error.includes('not verified'))) {
          setUnverifiedEmail(email.trim());
          setErrorMessage(data.error || data.detail || 'Email verification is required before logging in.');
          return;
        }
        setErrorMessage(data.error || data.detail || 'Login failed. Please verify your credentials.');
        return;
      }

      setIsLoading(false);
      onLoginSuccess({
        email: email.trim(),
        user: data.user,
        notificationMessage: data.notification_message
      });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Could not connect to authentication service. Please verify the backend is running.');
      setIsLoading(false);
    }
  };

  const handleGoToVerify = () => {
    if (onStartVerification && unverifiedEmail) {
      onStartVerification({
        email: unverifiedEmail,
        fullName: 'Freelancer'
      });
    }
  };

  return (
    <div className="auth-clean-page">
      <div className="auth-clean-nav">
        <button
          type="button"
          className="auth-back-link"
          onClick={() => onNavigate('landing')}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-card-surface">
          {/* Brand Logo */}
          <div className="auth-logo-center">
            <BrandLogo size="medium" showTagline={false} onClick={() => onNavigate('landing')} />
          </div>

          {/* Welcome Message */}
          <div className="auth-header-block">
            <h1 className="auth-main-heading">Welcome back.</h1>
            <p className="auth-sub-heading">
              Pick up where you left off and find your next opportunity.
            </p>
          </div>

          {/* Human-Readable Error Notice */}
          {errorMessage && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Unverified Account Prompt */}
          {unverifiedEmail && (
            <div className="auth-unverified-box">
              <ShieldAlert size={18} className="auth-unverified-icon" />
              <div className="auth-unverified-content">
                <p className="auth-unverified-title">Account Not Verified</p>
                <p className="auth-unverified-desc">
                  Your account requires email OTP confirmation before you can sign in.
                </p>
                <button
                  type="button"
                  className="btn-verify-now-pill"
                  onClick={handleGoToVerify}
                >
                  <span>Enter Verification Code</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="login-email">
                Email
              </label>
              <div className="auth-input-container">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                    if (unverifiedEmail) setUnverifiedEmail(null);
                  }}
                  placeholder=""
                  className="auth-text-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-header-row">
                <label className="auth-field-label" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => alert('Password reset instructions will be sent to your registered email.')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-container">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder=""
                  className="auth-text-input"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Action CTA */}
            <button
              type="submit"
              className="btn-primary-universe auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <div className="auth-switch-box">
            <span className="auth-switch-caption">Don't have an account?</span>
            <button
              type="button"
              className="btn-auth-switch-pill"
              onClick={() => onNavigate('signup')}
            >
              <span>Get Unstuck</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
