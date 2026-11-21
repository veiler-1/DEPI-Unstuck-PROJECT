import React from 'react';
import { Bell, X, Sparkles, Zap, ArrowRight, Clock, Radio } from 'lucide-react';

export function NotificationsDrawer({
  isOpen,
  onClose,
  signals = [],
  onSelectOpportunityById,
  onSimulateIncomingSignal,
  onNavigateToSignals
}) {
  if (!isOpen) return null;

  return (
    <div className="notifications-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="notifications-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header-row">
          <div className="drawer-title-block">
            <span className="drawer-heading">
              <span className="drawer-bell-badge">
                <Bell size={15} />
              </span>
              Radar Notifications
            </span>
            <span className="drawer-sub">
              Live alerts pushed from continuous scrapers
            </span>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close notifications">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-items-list">
          {signals.length === 0 ? (
            <div className="drawer-empty-state">
              <Bell size={28} className="empty-bell-icon" />
              <p className="empty-text">No incoming alerts right now.</p>
              <button
                type="button"
                className="btn-drawer-simulate"
                onClick={onSimulateIncomingSignal}
              >
                <Radio size={13} />
                <span>Simulate a Live Alert</span>
              </button>
            </div>
          ) : (
            signals.slice(0, 6).map((sig) => (
              <div
                key={sig.id}
                className={`drawer-signal-item ${!sig.read ? 'unread' : ''}`}
                onClick={() => {
                  onClose();
                  if (sig.opportunityId) {
                    onSelectOpportunityById(sig.opportunityId);
                  } else {
                    onNavigateToSignals();
                  }
                }}
              >
                <div className="drawer-item-top">
                  <span className={`drawer-platform-tag ${(sig.platform || '').toLowerCase()}`}>
                    {sig.platform || 'Platform'}
                  </span>
                  <span className="drawer-time-tag">
                    <Clock size={11} /> {sig.timestamp}
                  </span>
                </div>
                <h4 className="drawer-item-title">{sig.title}</h4>
                <p className="drawer-item-sub">{sig.jobTitle}</p>
                {sig.matchScore && (
                  <div className="drawer-item-footer">
                    <span className="drawer-match-badge">
                      <Sparkles size={11} /> {sig.matchScore}% Match
                    </span>
                    <span className="drawer-inspect-hint">
                      Inspect <ArrowRight size={12} />
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer-actions">
          <button
            type="button"
            className="btn-drawer-simulate-action"
            onClick={onSimulateIncomingSignal}
          >
            <Zap size={14} />
            <span>Simulate Incoming Alert</span>
          </button>

          <button
            type="button"
            className="btn-primary-universe btn-drawer-all-signals"
            onClick={() => {
              onClose();
              onNavigateToSignals();
            }}
          >
            <span>View All Signals ({signals.length})</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsDrawer;
