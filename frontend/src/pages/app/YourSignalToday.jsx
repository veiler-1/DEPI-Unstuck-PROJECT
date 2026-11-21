import React, { useMemo } from 'react';
import {
  Sparkles,
  Bookmark,
  ArrowRight,
  Target,
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';

export function YourSignalToday({
  opportunities = [],
  userProfile,
  savedIds = [],
  toggleSave,
  onSelectOpportunity,
  onGenerateProposal,
  onNavigate,
  onOpenNotifications
}) {
  // Sort by highest match score first
  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => b.match - a.match);
  }, [opportunities]);

  // Recommended opportunities: top 3-4 matches only (focused, intentional)
  const topMatch = sortedOpportunities[0];
  const recommendedOpportunities = sortedOpportunities.slice(0, 4);

  return (
    <div className="signal-today-clean-page">
      {/* 1. Today's Signal Header */}
      <div className="today-signal-hero-banner">
        <div className="today-signal-badge">
          <span className="signal-live-indicator" />
          <span>TODAY'S RADAR SIGNAL</span>
        </div>

        <h1 className="today-signal-headline">
          {recommendedOpportunities.length} opportunities match your profile today.
        </h1>

        <p className="today-signal-subcopy">
          Based on your Freelance DNA ({userProfile?.skills?.slice(0, 3).join(', ')}), here are the verified projects with the highest probability of winning.
        </p>
      </div>

      {/* 2. Top Match Highlight Card (Level 1 Attention) */}
      {topMatch && (
        <div className="top-match-hero-card">
          <div className="top-match-header-row">
            <div className="top-match-tag-group">
              <span className="top-match-pill-primary">
                <Sparkles size={14} />
                <span>Top Signal: {topMatch.match}% Match</span>
              </span>
              <span className={`platform-source-badge ${topMatch.platformKey}`}>
                {topMatch.platform}
              </span>
            </div>

            <button
              type="button"
              className={`btn-save-bookmark ${savedIds.includes(topMatch.id) ? 'saved' : ''}`}
              onClick={() => toggleSave(topMatch.id)}
              aria-label={savedIds.includes(topMatch.id) ? 'Saved' : 'Save opportunity'}
            >
              <Bookmark size={17} fill={savedIds.includes(topMatch.id) ? 'currentColor' : 'none'} />
              <span>{savedIds.includes(topMatch.id) ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <div className="top-match-body-grid">
            <div className="top-match-main-info">
              <h2 className="top-match-title" onClick={() => onSelectOpportunity(topMatch)}>
                {topMatch.title}
              </h2>
              <p className="top-match-desc">
                {topMatch.description}
              </p>

              <div className="top-match-skills-wrap">
                {topMatch.skills?.slice(0, 4).map((skill) => (
                  <span key={skill} className="clean-skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="top-match-sidebar-action">
              <div className="top-match-budget-box">
                <span className="budget-label">Verified Budget</span>
                <span className="budget-value">{topMatch.budget}</span>
                <span className="budget-sub">{topMatch.duration || 'Fast delivery'}</span>
              </div>

              <div className="top-match-button-stack">
                <button
                  type="button"
                  className="btn-primary-universe btn-card-primary"
                  onClick={() => onGenerateProposal(topMatch)}
                >
                  <span>Generate Proposal</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn-card-secondary"
                  onClick={() => onSelectOpportunity(topMatch)}
                >
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Recommended Opportunities Grid */}
      <div className="recommended-section-container">
        <div className="section-title-bar">
          <div className="section-title-group">
            <h2 className="section-clean-title">Recommended Opportunities</h2>
            <span className="section-clean-sub">Curated matches awaiting your move</span>
          </div>

          <button
            type="button"
            className="btn-view-all-link"
            onClick={() => onNavigate('opportunities')}
          >
            <span>Explore All Opportunities ({opportunities.length})</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="clean-opportunities-grid">
          {recommendedOpportunities.map((job) => {
            const isSaved = savedIds.includes(job.id);
            return (
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
                    className={`btn-mini-save ${isSaved ? 'saved' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(job.id);
                    }}
                    title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                  >
                    <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
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
                  {job.skills?.slice(0, 3).map((s) => (
                    <span key={s} className="clean-skill-tag">
                      {s}
                    </span>
                  ))}
                  {job.skills?.length > 3 && (
                    <span className="clean-skill-more">+{job.skills.length - 3}</span>
                  )}
                </div>

                <div className="clean-card-footer">
                  <div className="clean-job-budget">
                    <span className="budget-amount">{job.budget}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-card-action-text"
                      onClick={() => onSelectOpportunity(job)}
                    >
                      <span>Details</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn-mini-proposal-pill"
                      onClick={() => onGenerateProposal(job)}
                      title="Generate AI Proposal for this project"
                    >
                      <span>Pitch</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default YourSignalToday;
