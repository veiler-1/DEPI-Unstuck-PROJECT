import React, { useState } from 'react';
import {
  User,
  Bell,
  Sliders,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';

export function SettingsPage({
  userProfile,
  onSaveProfile,
  onLogout,
  onResetData,
  onNavigate,
  onToast
}) {
  const [settings, setSettings] = useState({
    email: userProfile?.email || 'ahmed.fathy.dev@gmail.com',
    browserAlerts: userProfile?.notificationChannels?.browser ?? true,
    emailAlerts: userProfile?.notificationChannels?.email ?? true,
    motionPreference: userProfile?.motionPreference || 'subtle', // 'subtle' | 'static'
    alertThreshold: userProfile?.alertThreshold || 80
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveProfile({
      ...userProfile,
      email: settings.email,
      alertThreshold: settings.alertThreshold,
      motionPreference: settings.motionPreference,
      notificationChannels: {
        browser: settings.browserAlerts,
        email: settings.emailAlerts
      }
    });
    setSaved(true);
    if (onToast) onToast('Settings saved successfully!');
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="settings-clean-page">
      {/* 1. Header */}
      <div className="clean-page-header">
        <h1 className="clean-page-title">Settings</h1>
        <p className="clean-page-subtitle">
          Manage your account credentials, notifications, and motion preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="settings-cards-stack">
        {/* Section 1: Account */}
        <div className="settings-card">
          <div className="settings-card-header">
            <User size={18} />
            <h2 className="settings-heading">Account</h2>
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Account Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="auth-text-input"
              required
            />
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Bell size={18} />
            <h2 className="settings-heading">Notifications</h2>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="toggle-title">Browser Desktop Notifications</span>
              <p className="toggle-desc">Receive instant alerts when 90%+ matching opportunities drop.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.browserAlerts}
              onChange={(e) => setSettings({ ...settings, browserAlerts: e.target.checked })}
              className="settings-checkbox"
            />
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="toggle-title">Email Summary Digest</span>
              <p className="toggle-desc">Daily summary of new opportunities matching your Freelance DNA.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
              className="settings-checkbox"
            />
          </div>
        </div>

        {/* Section 3: Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Sliders size={18} />
            <h2 className="settings-heading">Preferences</h2>
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Motion & Animation Mode</label>
            <select
              value={settings.motionPreference}
              onChange={(e) => setSettings({ ...settings, motionPreference: e.target.value })}
              className="filter-select"
            >
              <option value="subtle">Subtle Motion (Smooth modern transitions)</option>
              <option value="static">Reduced Motion (Static, accessible mode)</option>
            </select>
          </div>

          <div className="auth-field" style={{ marginTop: '14px' }}>
            <label className="auth-field-label">
              Minimum Radar Match Threshold ({settings.alertThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.alertThreshold}
              onChange={(e) => setSettings({ ...settings, alertThreshold: Number(e.target.value) })}
              className="settings-slider"
            />
            <span className="slider-hint">
              Only opportunities with a {settings.alertThreshold}% match score or higher trigger push alerts.
            </span>
          </div>
        </div>

        {/* Section 4: Security & Session */}
        <div className="settings-card">
          <div className="settings-card-header">
            <ShieldCheck size={18} />
            <h2 className="settings-heading">Security & Session</h2>
          </div>

          <div className="settings-danger-actions-row">
            <button
              type="button"
              className="btn-settings-action reset"
              onClick={onResetData}
            >
              <RotateCcw size={15} />
              <span>Reset Demo State</span>
            </button>

            <button
              type="button"
              className="btn-settings-action logout"
              onClick={onLogout}
            >
              <LogOut size={15} />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="settings-save-row">
          <button
            type="submit"
            className="btn-primary-universe"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
