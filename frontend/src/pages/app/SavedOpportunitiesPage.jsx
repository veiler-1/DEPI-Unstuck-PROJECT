import React from 'react';
import {
  Bookmark,
  Sparkles,
  ArrowRight,
  Trash2,
  Clock,
  Layers
} from 'lucide-react';

export function SavedOpportunitiesPage({
  opportunities = [],
  savedIds = [],
  toggleSave,
  onSelectOpportunity,
  onGenerateProposal,
  onNavigate
}) {
  const savedJobs = opportunities.filter(j => savedIds.includes(j.id));

  return (
    <div className="saved-clean-page">
      {/* Page Header */}
      <div className="clean-page-header">
        <h1 className="clean-page-title">Saved Opportunities</h1>
        <p className="clean-page-subtitle">
          Quickly return to opportunities you care about and prepare your proposals.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        /* Meaningful Empty State */
        <div className="clean-empty-state-card">
          <div className="empty-state-icon-circle">
            <Bookmark size={32} />
          </div>
          <h2 className="empty-title">Nothing saved yet.</h2>
          <p className="empty-desc">
            Save opportunities you want to come back to later by clicking the bookmark icon.
          </p>
          <button
            type="button"
            className="btn-primary-universe"
            onClick={() => onNavigate('opportunities')}
          >
            <span>Explore Opportunities</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* Saved Jobs Grid */
        <div className="clean-opportunities-grid">
          {savedJobs.map(job => (
            <div key={job.id} className="clean-job-card">
              <div className="clean-card-header">
                <div className="clean-card-platform-row">
                  <span className={`platform-source-badge ${job.platformKey}`}>
                    {job.platform}
                  </span>
                  <span className="clean-match-score-pill">
                    {job.match}% Match
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-mini-save saved"
                  onClick={() => toggleSave(job.id)}
                  title="Remove from saved"
                  aria-label="Remove from saved"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3
                className="clean-job-title"
                onClick={() => onSelectOpportunity(job)}
                title={job.title}
              >
                {job.title}
              </h3>

              <p className="clean-job-description">
                {job.description}
              </p>

              <div className="clean-job-skills-row">
                {job.skills?.slice(0, 3).map(s => (
                  <span key={s} className="clean-skill-tag">
                    {s}
                  </span>
                ))}
              </div>

              <div className="clean-card-footer">
                <div className="clean-job-budget">
                  <span className="budget-amount">{job.budget}</span>
                </div>

                <div className="saved-card-action-group">
                  <button
                    type="button"
                    className="btn-card-action-text"
                    onClick={() => onSelectOpportunity(job)}
                  >
                    <span>View</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-mini-proposal-pill"
                    onClick={() => onGenerateProposal(job)}
                  >
                    <span>Pitch</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedOpportunitiesPage;
