import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  ArrowRight,
  Clock,
  Radio,
  CheckCircle2
} from 'lucide-react';

export function SignalsPage({
  signals = [],
  onSelectOpportunityById,
  onSimulateIncomingSignal,
  onNavigate
}) {
  const [filterType, setFilterType] = useState('all');

  const filteredSignals = signals.filter(sig => {
    if (filterType === 'all') return true;
    return sig.type === filterType;
  });

  return (
    <div className="signals-clean-page">
      {/* 1. Page Header */}
      <div className="clean-page-header">
        <div className="clean-header-with-action">
          <div>
            <h1 className="clean-page-title">Signals</h1>
            <p className="clean-page-subtitle">
              Instant alerts when high-match opportunities drop or saved projects change.
            </p>
          </div>

          <button
            type="button"
            className="btn-simulate-signal"
            onClick={onSimulateIncomingSignal}
            title="Simulate scraper push alert"
          >
            <Radio size={14} />
            <span>Simulate Live Alert</span>
          </button>
        </div>
      </div>

      {/* 2. Organized Filter Pills */}
      <div className="signals-filter-row">
        {[
          { key: 'all', label: 'All Signals' },
          { key: 'high_match', label: 'High Matches (90%+)' },
          { key: 'preferred_skill', label: 'Skill Surges' },
          { key: 'market_trend', label: 'Market Shifts' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`signal-tab-pill ${filterType === tab.key ? 'active' : ''}`}
            onClick={() => setFilterType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Grouped Signals Feed */}
      <div className="signals-clean-feed">
        {filteredSignals.length === 0 ? (
          <div className="clean-empty-state-card">
            <p className="empty-title">No signals under this category.</p>
            <button
              type="button"
              className="btn-secondary-white"
              onClick={() => setFilterType('all')}
            >
              Show All Signals
            </button>
          </div>
        ) : (
          filteredSignals.map(sig => (
            <div
              key={sig.id}
              className={`signal-feed-card ${sig.read ? 'read' : 'unread'}`}
              onClick={() => {
                if (sig.opportunityId) onSelectOpportunityById(sig.opportunityId);
              }}
            >
              <div className="signal-feed-icon-box">
                {sig.type === 'high_match' ? (
                  <Sparkles size={16} />
                ) : sig.type === 'market_trend' ? (
                  <TrendingUp size={16} />
                ) : (
                  <Bell size={16} />
                )}
              </div>

              <div className="signal-feed-content">
                <div className="signal-feed-top-row">
                  <span className="signal-feed-title">{sig.title}</span>
                  <span className="signal-feed-time">
                    <Clock size={12} /> {sig.timestamp}
                  </span>
                </div>

                <p className="signal-feed-desc">
                  {sig.jobTitle || sig.description || 'A new opportunity arrived matching your criteria.'}
                </p>

                {sig.matchScore && (
                  <div className="signal-feed-meta-row">
                    <span className="signal-score-pill">{sig.matchScore}% Match</span>
                    {sig.platform && (
                      <span className={`platform-source-badge ${sig.platform.toLowerCase()}`}>
                        {sig.platform}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="signal-feed-action-arrow">
                <ArrowRight size={15} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SignalsPage;
