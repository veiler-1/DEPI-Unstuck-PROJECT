import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, ArrowRight, RotateCw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';

export function VerifyOtpPage({ email, fullName, devOtp: initialDevOtp, onVerificationSuccess, onBackToSignUp, onNavigate }) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState(initialDevOtp || '');
  const [cooldown, setCooldown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const char = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Advance to next input if available
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const chars = pastedData.slice(0, 6).split('');
    const newDigits = [...otpDigits];
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setOtpDigits(newDigits);
    setErrorMessage('');

    const nextIndex = Math.min(chars.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: fullOtp
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || 'Verification failed. Please check the code.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Email verified successfully! Calibrating your workspace...');
      setTimeout(() => {
        setIsLoading(false);
        onVerificationSuccess({
          email: email,
          name: fullName || 'Freelancer',
          user: data.user
        });
      }, 1000);
    } catch (err) {
      console.error('OTP verification error:', err);
      if (devOtp && fullOtp === devOtp) {
        setSuccessMessage('Demo Mode: Email verified! Calibrating your workspace...');
        setTimeout(() => {
          setIsLoading(false);
          onVerificationSuccess({
            email: email,
            name: fullName || 'Freelancer',
            user: { email, full_name: fullName, is_verified: true }
          });
        }, 800);
        return;
      }
      setErrorMessage('Unable to reach server. Please make sure backend is running.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || 'Failed to resend code. Please try again.');
        setIsResending(false);
        return;
      }

      setSuccessMessage('A fresh 6-digit verification code has been dispatched.');
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setErrorMessage('Network error while resending verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-clean-page">
      <div className="auth-clean-nav">
        <button
          type="button"
          className="auth-back-link"
          onClick={onBackToSignUp || (() => onNavigate('signup'))}
        >
          <ArrowLeft size={16} />
          <span>Change Email</span>
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
            <div className="otp-icon-badge">
              <ShieldCheck size={28} className="otp-shield-icon" />
            </div>
            <h1 className="auth-main-heading">Check your email</h1>
            <p className="auth-sub-heading">
              We sent a verification code to your email address:
            </p>
            <div className="otp-target-email-pill">
              <Mail size={14} />
              <span>{email || 'your-email@example.com'}</span>
            </div>

            {devOtp && (
              <div className="otp-dev-code-box">
                <span className="otp-dev-badge">Development Code</span>
                <p className="otp-dev-text">
                  Your generated code is: <strong>{devOtp}</strong>
                </p>
                <button
                  type="button"
                  className="btn-autofill-otp"
                  onClick={() => {
                    const chars = devOtp.split('');
                    setOtpDigits(chars);
                    setErrorMessage('');
                  }}
                >
                  Click to Auto-fill Code
                </button>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successMessage && (
            <div className="auth-success-alert" role="alert">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* OTP Verification Form */}
          <form onSubmit={handleVerify} className="auth-form-fields" noValidate>
            <div className="auth-field">
              <label className="auth-field-label" style={{ textAlign: 'center' }}>
                Enter 6-Digit Code
              </label>

              {/* 6 Digit Split Input Container */}
              <div className="otp-inputs-grid" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`otp-digit-box ${digit ? 'filled' : ''}`}
                    placeholder=""
                    autoComplete="off"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
              <p className="otp-expiry-hint">
                Code expires in 5 minutes. Paste complete code supported.
              </p>
            </div>

            {/* Verify CTA Button */}
            <button
              type="submit"
              className="btn-primary-universe auth-submit-btn"
              disabled={isLoading || fullOtp.length !== 6}
            >
              {isLoading ? (
                <span>Verifying code...</span>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="otp-resend-row">
            {cooldown > 0 ? (
              <span className="otp-cooldown-text">
                Resend code in <strong>{cooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                className="otp-resend-active-btn"
                onClick={handleResend}
                disabled={isResending}
              >
                <RotateCw size={14} className={isResending ? 'spinning' : ''} />
                <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            )}
          </div>

          {/* Change Email Footer */}
          <div className="auth-switch-box">
            <span className="auth-switch-caption">Entered the wrong address?</span>
            <button
              type="button"
              className="btn-auth-switch-pill"
              onClick={onBackToSignUp || (() => onNavigate('signup'))}
            >
              <span>Change Email</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
