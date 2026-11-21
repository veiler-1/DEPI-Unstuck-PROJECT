import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getInitials } from '../../data/unstuckData';

export function Header({
  isAuthenticated,
  activePage,
  onNavigate,
  userProfile,
  savedCount = 0,
  unreadSignalsCount = 0,
  onOpenNotifications,
  onOpenConceptModal,
  onLogout,
  canGoBack = false,
  onGoBack
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="main-header">
      {/* Brand Wordmark & Universal Back Button */}
      <div className="brand-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {canGoBack && (
          <button
            type="button"
            className="btn-header-back-universal"
            onClick={onGoBack}
            title="الرجوع للصفحة السابقة (Back)"
            aria-label="Back to previous page"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
        <BrandLogo
          size="medium"
          showTagline={true}
          onClick={() => handleNavClick(isAuthenticated ? 'signal-today' : 'landing')}
        />
      </div>

      {/* Main Navigation */}
      {isAuthenticated ? (
        <nav className="header-nav" aria-label="Main Application Navigation">
          <button
            type="button"
            className={`nav-link ${activePage === 'signal-today' ? 'active' : ''}`}
            onClick={() => handleNavClick('signal-today')}
          >
            Your Signal Today
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'opportunities' || activePage === 'opportunity-detail' ? 'active' : ''}`}
            onClick={() => handleNavClick('opportunities')}
          >
            Opportunities
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'saved' ? 'active' : ''}`}
            onClick={() => handleNavClick('saved')}
          >
            Saved
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'market-pulse' ? 'active' : ''}`}
            onClick={() => handleNavClick('market-pulse')}
          >
            Market Pulse
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'signals' ? 'active' : ''}`}
            onClick={() => handleNavClick('signals')}
          >
            Signals
            {unreadSignalsCount > 0 && <span className="nav-live-dot" />}
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'freelance-dna' ? 'active' : ''}`}
            onClick={() => handleNavClick('freelance-dna')}
          >
            Freelance DNA
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            Settings
          </button>
        </nav>
      ) : (
        <nav className="header-nav" aria-label="Public Navigation">
          <button
            type="button"
            className={`nav-link ${activePage === 'landing' ? 'active' : ''}`}
            onClick={() => handleNavClick('landing')}
          >
            Stop Searching
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              if (activePage !== 'landing') {
                handleNavClick('landing');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            How It Works
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={onOpenConceptModal}
          >
            Why Unstuck?
          </button>
        </nav>
      )}

      {/* Header Actions */}
      <div className="header-actions">
        {isAuthenticated ? (
          <div className="auth-header-action-group">
            {/* Live Notifications Bell */}
            <button
              type="button"
              className="btn-header-icon-action"
              onClick={onOpenNotifications}
              title="Open incoming radar signals"
              aria-label="Signals"
            >
              <Bell size={18} />
              {unreadSignalsCount > 0 && <span className="notification-ping-badge">{unreadSignalsCount}</span>}
            </button>

            {/* Quick Profile Pill & Menu */}
            <div className="profile-dropdown-wrapper">
              <button
                type="button"
                className="btn-profile-pill"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="profile-avatar-initials">
                  {getInitials(userProfile?.name || 'A')}
                </div>
                <span className="profile-name-text">{userProfile?.name?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={14} className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="profile-dropdown-card">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{userProfile?.name}</div>
                    <div className="dropdown-user-role">{userProfile?.title}</div>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => handleNavClick('freelance-dna')}
                  >
                    <User size={15} />
                    <span>Freelance DNA</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => handleNavClick('leaderboard')}
                  >
                    <Trophy size={15} />
                    <span>Leaderboard (الترتيب)</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => handleNavClick('settings')}
                  >
                    <Settings size={15} />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => handleNavClick('admin-hub')}
                  >
                    <ShieldCheck size={15} />
                    <span>Admin Scraper Hub</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={onOpenConceptModal}
                  >
                    <Sparkles size={15} />
                    <span>Why Unstuck? (Concept)</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item-btn logout"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="guest-header-action-group">
            <button
              type="button"
              className="btn-nav-text-login"
              onClick={() => handleNavClick('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className="btn-primary-universe btn-header-cta"
              onClick={() => handleNavClick('signup')}
            >
              <span>Start Doing</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="btn-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <div className="mobile-menu-nav-links">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'signal-today' ? 'active' : ''}`}
                  onClick={() => handleNavClick('signal-today')}
                >
                  Your Signal Today
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'opportunities' ? 'active' : ''}`}
                  onClick={() => handleNavClick('opportunities')}
                >
                  Opportunities
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'saved' ? 'active' : ''}`}
                  onClick={() => handleNavClick('saved')}
                >
                  Saved
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'market-pulse' ? 'active' : ''}`}
                  onClick={() => handleNavClick('market-pulse')}
                >
                  Market Pulse
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'signals' ? 'active' : ''}`}
                  onClick={() => handleNavClick('signals')}
                >
                  Signals
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'freelance-dna' ? 'active' : ''}`}
                  onClick={() => handleNavClick('freelance-dna')}
                >
                  Freelance DNA
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'leaderboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('leaderboard')}
                >
                  🏆 Leaderboard (لوحة الصدارة)
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'settings' ? 'active' : ''}`}
                  onClick={() => handleNavClick('settings')}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${activePage === 'admin-hub' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin-hub')}
                >
                  Admin Scraper Hub
                </button>
                <div className="mobile-menu-divider" />
                <button
                  type="button"
                  className="mobile-nav-item logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => handleNavClick('landing')}
                >
                  Stop Searching
                </button>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => {
                    handleNavClick('landing');
                    setTimeout(() => {
                      const el = document.getElementById('how-it-works');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  How It Works
                </button>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenConceptModal();
                  }}
                >
                  Why Unstuck?
                </button>
                <div className="mobile-menu-divider" />
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => handleNavClick('login')}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="btn-primary-universe mobile-cta-full"
                  onClick={() => handleNavClick('signup')}
                >
                  <span>Start Doing</span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
