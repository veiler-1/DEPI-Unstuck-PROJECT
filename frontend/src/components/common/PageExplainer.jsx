import React, { useState } from 'react';
import { HelpCircle, X, Sparkles, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

// ==========================================
// UNSTUCK Page Purpose Explainer Component
// Answers: Where am I? Why am I here? What can I do here? What should I do next?
// ==========================================

export function PageExplainer({
  pageKey,
  title = 'Page Purpose',
  shortTagline,
  whyHere,
  whatCanIDo = [],
  nextStep,
  badgeText = 'WHY AM I HERE?'
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="page-explainer-wrapper">
      <button
        type="button"
        className="btn-explainer-pill"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to understand this page's purpose and your next step"
      >
        <HelpCircle size={13} className="explainer-icon" />
        <span className="explainer-text">{badgeText}</span>
      </button>

      {isOpen && (
        <div className="explainer-overlay" onClick={() => setIsOpen(false)}>
          <div className="explainer-card" onClick={(e) => e.stopPropagation()}>
            <div className="explainer-card-header">
              <div className="explainer-header-title">
                <div className="explainer-spark-icon">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="explainer-heading">{title}</h3>
                  <p className="explainer-subtag">{shortTagline}</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-action-btn explainer-close"
                onClick={() => setIsOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="explainer-body">
              {/* Question 1 & 2: Why Am I Here */}
              <div className="explainer-section">
                <div className="explainer-section-label">
                  <span className="explainer-num">1</span>
                  <span>WHY AM I HERE?</span>
                </div>
                <p className="explainer-text-desc">{whyHere}</p>
              </div>

              {/* Question 3: What Can I Do Here */}
              {whatCanIDo && whatCanIDo.length > 0 && (
                <div className="explainer-section">
                  <div className="explainer-section-label">
                    <span className="explainer-num">2</span>
                    <span>WHAT CAN I DO HERE?</span>
                  </div>
                  <ul className="explainer-actions-list">
                    {whatCanIDo.map((item, idx) => (
                      <li key={idx} className="explainer-action-item">
                        <CheckCircle2 size={13} className="explainer-check" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Question 4: What Should I Do Next */}
              {nextStep && (
                <div className="explainer-next-box">
                  <div className="explainer-next-tag">
                    <Sparkles size={12} />
                    <span>RECOMMENDED NEXT MOVE</span>
                  </div>
                  <p className="explainer-next-text">{nextStep}</p>
                </div>
              )}
            </div>

            <div className="explainer-footer">
              <button
                type="button"
                className="btn-primary-universe explainer-dismiss-btn"
                onClick={() => setIsOpen(false)}
              >
                Got It, Let's Continue <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
