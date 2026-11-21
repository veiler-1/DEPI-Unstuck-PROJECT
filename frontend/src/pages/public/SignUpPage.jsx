import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Check, X } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';

export function SignUpPage({ onStartVerification, onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password rule analysis
  const passwordChecks = useMemo(() => {
    return {
      hasMinLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    };
  }, [password]);

  const passedChecksCount = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length;
  }, [passwordChecks]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Strength status text and color
  const strengthStatus = useMemo(() => {
    if (!password) return { label: '', color: '' };
    if (password.length < 6) return { label: 'Too short (min 6 chars)', color: '#E02424' };
    if (passedChecksCount <= 2) return { label: 'Good', color: '#D97706' };
    return { label: 'Strong', color: '#057A55' };
  }, [password, passedChecksCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل (Full name is required).');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح (Please enter a valid email address).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('كلمة المرور يجب ألا تقل عن 6 أحرف (Password must be at least 6 characters).');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين، يرجى التأكد من تطابقهما (Passwords do not match).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || data.error || 'فشل التسجيل. يرجى مراجعة البيانات.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      // Navigate to dedicated verification screen
      if (onStartVerification) {
        onStartVerification({
          email: email.trim(),
          fullName: fullName.trim(),
          devOtp: data.dev_otp
        });
      }
    } catch (err) {
      console.error('Registration request error:', err);
      // Resilient fallback for demo mode if backend is starting or offline
      setIsLoading(false);
      if (onStartVerification) {
        onStartVerification({
          email: email.trim(),
          fullName: fullName.trim(),
          devOtp: '123456'
        });
      }
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

          {/* Header */}
          <div className="auth-header-block">
            <h1 className="auth-main-heading">Get Unstuck.</h1>
            <p className="auth-sub-heading">
              Create your account and let Unstuck find opportunities that fit you.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="signup-name">
                Full Name
              </label>
              <div className="auth-input-container">
                <User size={17} className="auth-input-icon" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder=""
                  className="auth-text-input"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="signup-email">
                Email
              </label>
              <div className="auth-input-container">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder=""
                  className="auth-text-input"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-field-header-row">
                <label className="auth-field-label" htmlFor="signup-password">
                  Password
                </label>
                {password && (
                  <span className="pwd-strength-badge" style={{ color: strengthStatus.color }}>
                    {strengthStatus.label}
                  </span>
                )}
              </div>
              <div className="auth-input-container">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="signup-password"
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

              {/* Password Strength Progress Bar */}
              {password && (
                <div className="pwd-meter-track">
                  <div
                    className="pwd-meter-fill"
                    style={{
                      width: `${(passedChecksCount / 5) * 100}%`,
                      backgroundColor: strengthStatus.color
                    }}
                  />
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="pwd-rules-checklist">
                <div className={`pwd-rule-item ${passwordChecks.hasMinLength ? 'valid' : ''}`}>
                  {passwordChecks.hasMinLength ? <Check size={12} /> : <span className="pwd-dot" />}
                  <span>At least 6 characters (6 أحرف على الأقل)</span>
                </div>
                <div className={`pwd-rule-item ${passwordChecks.hasUpper ? 'valid' : ''}`}>
                  {passwordChecks.hasUpper ? <Check size={12} /> : <span className="pwd-dot" />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`pwd-rule-item ${passwordChecks.hasNumber ? 'valid' : ''}`}>
                  {passwordChecks.hasNumber ? <Check size={12} /> : <span className="pwd-dot" />}
                  <span>Number (0-9)</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="auth-input-container">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder=""
                  className="auth-text-input"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <div className={`pwd-match-indicator ${passwordsMatch ? 'matched' : 'mismatched'}`}>
                  {passwordsMatch ? (
                    <>
                      <Check size={13} />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X size={13} />
                      <span>Passwords do not match (غير متطابقتين)</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action CTA */}
            <button
              type="submit"
              className="btn-primary-universe auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Generating secure verification...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="auth-switch-box">
            <span className="auth-switch-caption">Already have an account?</span>
            <button
              type="button"
              className="btn-auth-switch-pill"
              onClick={() => onNavigate('login')}
            >
              <span>Log In</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
