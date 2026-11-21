import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer({ onNavigate, onOpenConceptModal }) {
  return (
    <footer className="unstuck-clean-footer">
      <div className="footer-top-container">
        <div className="footer-brand-col">
          <BrandLogo size="medium" showTagline={true} onClick={() => onNavigate && onNavigate('landing')} />
          <p className="footer-brand-desc">
            Helping freelancers break out of the search vortex across Khamsat, Mostaql, Nafezly, and Freelancer. Stop searching. Start doing.
          </p>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-col-title">Navigation</h4>
          <ul className="footer-links-list">
            <li><button type="button" onClick={() => onNavigate && onNavigate('landing')}>Home</button></li>
            <li><button type="button" onClick={onOpenConceptModal}>Why Unstuck?</button></li>
            <li><button type="button" onClick={() => onNavigate && onNavigate('signup')}>Create Account</button></li>
            <li><button type="button" onClick={() => onNavigate && onNavigate('login')}>Log In</button></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-col-title">Connected Platforms</h4>
          <ul className="footer-links-list">
            <li><span>Khamsat (خمسات)</span></li>
            <li><span>Mostaql (مستقل)</span></li>
            <li><span>Nafezly (نفّذلي)</span></li>
            <li><span>Freelancer.com</span></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-col-title">The Story</h4>
          <div className="footer-story-steps">
            <span className="story-step">STUCK</span>
            <span className="story-arrow">→</span>
            <span className="story-step">NOISE</span>
            <span className="story-arrow">→</span>
            <span className="story-step">SIGNAL</span>
            <span className="story-arrow">→</span>
            <span className="story-step active">DOING</span>
          </div>
          <p className="footer-meta-note">
            Unstuck removes the searching problem so you can start doing.
          </p>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-bottom-copy">
          © {new Date().getFullYear()} UNSTUCK. Stop Searching. Start Doing.
        </div>
        <div className="footer-bottom-badge">
          <Sparkles size={13} />
          <span>Noise → Signal → Action</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
