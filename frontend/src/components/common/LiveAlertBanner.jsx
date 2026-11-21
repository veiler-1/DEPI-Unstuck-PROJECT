import React from 'react';
import { Sparkles, ExternalLink, X, ArrowRight } from 'lucide-react';

export function LiveAlertBanner({ alert, onClose, onSelectOpportunity }) {
  if (!alert) return null;

  return (
    <div className="live-incoming-alert-banner">
      <div className="alert-banner-avatar">
        <Sparkles size={18} color="#0c1829" />
      </div>
      <div className="alert-banner-content">
        <div className="alert-banner-eyebrow">
          ⚡ NEW HIGH GRAVITY SIGNAL DETECTED!
        </div>
        <div className="alert-banner-title">{alert.title}</div>
        <div className="alert-banner-meta">
          {alert.platform} · {alert.budget} · <b>{alert.match}% Match</b>
        </div>
      </div>

      <div className="alert-banner-actions">
        <button
          type="button"
          className="btn-primary-universe alert-btn"
          onClick={() => onSelectOpportunity(alert)}
        >
          <span>Turn into Proposal</span>
          <ArrowRight size={13} />
        </button>

        <a
          href={alert.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-watch-video alert-btn"
        >
          <span>Direct URL</span>
          <ExternalLink size={12} />
        </a>

        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
