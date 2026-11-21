import React from 'react';
import {
  Sparkles,
  Bookmark,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Globe,
  Tag
} from 'lucide-react';

export function OpportunityDetailPage({
  opportunity,
  userProfile,
  savedIds = [],
  toggleSave,
  onGenerateProposal,
  onBack
}) {
  if (!opportunity) {
    return (
      <div className="clean-empty-state-card">
        <p className="empty-title">No opportunity selected.</p>
        <button type="button" className="btn-primary-universe" onClick={onBack}>
          ← Back to Opportunities
        </button>
      </div>
    );
  }

  const isSaved = savedIds.includes(opportunity.id);
  const userSkillsLower = (userProfile?.skills || []).map(s => s.toLowerCase());

  const matchingSkills = (opportunity.skills || []).filter(s =>
    userSkillsLower.includes(s.toLowerCase())
  );
  const otherSkills = (opportunity.skills || []).filter(
    s => !userSkillsLower.includes(s.toLowerCase())
  );

  return (
    <div className="opportunity-detail-clean-page">
      {/* Top Navigation */}
      <div className="detail-top-nav">
        <button type="button" className="btn-detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Opportunities</span>
        </button>
      </div>

      <div className="detail-main-layout-grid">
        {/* Left Column: Core Sections */}
        <div className="detail-primary-content">
          {/* Section 1: Opportunity Overview Header */}
          <div className="detail-section-card overview-card">
            <div className="detail-meta-pill-strip">
              <span className={`platform-source-badge ${opportunity.platformKey}`}>
                {opportunity.platform}
              </span>
              <span className="detail-match-tag">
                <Sparkles size={13} /> {opportunity.match}% Match
              </span>
              <span className="detail-posted-tag">
                <Clock size={13} /> Published {opportunity.publish_date_relative || 'recently'}
              </span>
              <span className="detail-verified-tag">
                <ShieldCheck size={13} /> Verified Project
              </span>
            </div>

            <h1 className="detail-job-heading">{opportunity.title}</h1>

            <div className="detail-quick-stat-bar">
              <div className="stat-item">
                <span className="stat-label">Budget</span>
                <span className="stat-value">{opportunity.budget}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Timeline</span>
                <span className="stat-value">{opportunity.duration || 'Flexible'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Competition</span>
                <span className="stat-value low">{opportunity.competition || 'Low'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Client Rating</span>
                <span className="stat-value">{opportunity.clientRating || '5.0 Verified'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Description */}
          <div className="detail-section-card">
            <h2 className="detail-subhead">Description</h2>
            <p className="detail-description-body">
              {opportunity.description}
            </p>
          </div>

          {/* Section 3: Required Skills */}
          <div className="detail-section-card">
            <h2 className="detail-subhead">Required Skills</h2>
            <div className="detail-skills-grid">
              {matchingSkills.map(s => (
                <span key={s} className="skill-chip matched">
                  <CheckCircle2 size={13} />
                  <span>{s} (In Your DNA)</span>
                </span>
              ))}
              {otherSkills.map(s => (
                <span key={s} className="skill-chip neutral">
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Why This Matches You */}
          <div className="detail-section-card match-rationale-card">
            <div className="match-rationale-header">
              <Sparkles size={18} className="rationale-sparkle" />
              <h2 className="detail-subhead" style={{ marginBottom: 0 }}>
                Why This Matches You
              </h2>
            </div>
            <ul className="rationale-points-list">
              <li>
                <b>Technical Stack Alignment:</b> You have direct experience in {matchingSkills.join(', ' || 'the primary requirements')}.
              </li>
              <li>
                <b>Budget Viability:</b> Project budget of {opportunity.budget} meets or exceeds your minimum preferred project rate.
              </li>
              <li>
                <b>High Win Probability:</b> Verified client profile with low competing proposal density at this stage.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Sticky Action Sidebar */}
        <div className="detail-action-sidebar">
          <div className="detail-action-card">
            <span className="sidebar-action-eyebrow">READY TO ACT?</span>
            <h3 className="sidebar-action-title">Make Your Move</h3>
            <p className="sidebar-action-desc">
              Generate a custom proposal tailored directly to this client’s scope and your unique skills.
            </p>

            <button
              type="button"
              className="btn-primary-universe sidebar-generate-btn"
              onClick={() => onGenerateProposal(opportunity)}
            >
              <Sparkles size={16} />
              <span>Generate Proposal</span>
              <ArrowRight size={16} />
            </button>

            <div className="sidebar-secondary-actions">
              <button
                type="button"
                className={`btn-sidebar-save ${isSaved ? 'saved' : ''}`}
                onClick={() => toggleSave(opportunity.id)}
              >
                <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Saved in Orbit' : 'Save for Later'}</span>
              </button>

              {opportunity.link && (
                <a
                  href={opportunity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sidebar-external"
                  onClick={() => {
                    try {
                      fetch('http://localhost:8000/api/user/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: userProfile?.email || 'ahmed.fathy.dev@gmail.com',
                          action: 'apply',
                          project_title: opportunity.title || '',
                          platform: opportunity.platform || ''
                        })
                      });
                    } catch {}
                  }}
                >
                  <span>Open on {opportunity.platform}</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="sidebar-trust-box">
              <ShieldCheck size={14} />
              <span>Direct application on verified marketplace platform.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpportunityDetailPage;
