import React from 'react';
import { Sparkles, X, ArrowRight, Search, Target, Zap } from 'lucide-react';
import creativeClimbUnstuck from '../../assets/creative_climb_unstuck.png';

export function ConceptModal({ isOpen, onClose, onStartDoing }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card concept-modal-card-refined"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-concept-title"
      >
        {/* Modal Header */}
        <div className="modal-header-refined">
          <div className="modal-title-with-badge">
            <span className="concept-modal-pill">
              <Sparkles size={13} />
              <span>THE UNSTUCK CONCEPT</span>
            </span>
            <h2 id="modal-concept-title" className="modal-concept-heading">
              Why Unstuck?
            </h2>
          </div>
          <button
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Split visual + benefits */}
        <div className="concept-modal-body-grid">
          {/* Left: Controlled, responsive mascot illustration container */}
          <div className="concept-illustration-container">
            <div className="concept-illustration-frame">
              <img
                src={creativeClimbUnstuck}
                alt="Freelancer getting unstuck from the search vortex"
                className="concept-illustration-img"
              />
            </div>
            <div className="concept-illustration-caption">
              <span>Lost in the noise</span>
              <span className="caption-arrow">→</span>
              <span className="caption-highlight">Finding your signal</span>
            </div>
          </div>

          {/* Right: Short explanation & 3 focused benefits */}
          <div className="concept-content-column">
            <p className="concept-intro-paragraph">
              Freelancing shouldn’t feel like endless job hunting. Unstuck cuts through scattered platforms, filtering out the noise so you spend less time searching and more time working.
            </p>

            <div className="concept-benefits-stack">
              {/* Benefit 1 */}
              <div className="concept-benefit-row">
                <div className="concept-benefit-icon yellow">
                  <Search size={18} />
                </div>
                <div className="concept-benefit-text">
                  <h4 className="concept-benefit-title">Less Searching</h4>
                  <p className="concept-benefit-desc">
                    One feed unifies Khamsat, Mostaql, Nafezly, and Freelancer. No more 20 open tabs or constant refreshing.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="concept-benefit-row">
                <div className="concept-benefit-icon cerulean">
                  <Target size={18} />
                </div>
                <div className="concept-benefit-text">
                  <h4 className="concept-benefit-title">Better Matches</h4>
                  <p className="concept-benefit-desc">
                    Opportunities are matched directly to your skills and preferences, highlighting the projects where you stand out.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="concept-benefit-row">
                <div className="concept-benefit-icon red">
                  <Zap size={18} />
                </div>
                <div className="concept-benefit-text">
                  <h4 className="concept-benefit-title">More Action</h4>
                  <p className="concept-benefit-desc">
                    Turn high-fit matches into tailored proposals instantly and apply before competition piles up.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTAs */}
            <div className="concept-modal-actions">
              <button
                type="button"
                className="btn-primary-universe"
                onClick={() => {
                  onClose();
                  if (onStartDoing) onStartDoing();
                }}
              >
                <span>Start Doing</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn-secondary-cancel"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptModal;
