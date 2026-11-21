import React from 'react';
import unstuck3dWordmark from '../../assets/unstuck_3d_wordmark.png';

export function BrandLogo({ size = 'medium', showTagline = true, onClick }) {
  return (
    <div className={`brand-logo-container brand-size-${size}`} onClick={onClick}>
      <div className="brand-logo-mark">
        <svg
          className="brand-vortex-svg"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring - Cerulean Blue */}
          <circle
            cx="20"
            cy="20"
            r="17"
            stroke="#A5BCD6"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            strokeLinecap="round"
          />
          {/* Inner Swirl - Sceptre Red */}
          <path
            d="M 20 7 C 27.18 7 33 12.82 33 20 C 33 24.5 30.5 28.5 26.8 30.5"
            stroke="#4D0E12"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Counter Swirl - Potting Soil */}
          <path
            d="M 20 33 C 12.82 33 7 27.18 7 20 C 7 15.5 9.5 11.5 13.2 9.5"
            stroke="#4A2E27"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Central Signal Core - Sceptre Red & Transparent Yellow glow */}
          <circle cx="20" cy="20" r="5.5" fill="#4D0E12" />
          <circle cx="20" cy="20" r="2.5" fill="#F5EFC6" />
        </svg>
      </div>

      <div className="brand-logo-text-group">
        <div className="brand-logo-title-row">
          <span className="brand-title-unstuck">UNSTUCK</span>
          <span className="brand-title-badge">RADAR</span>
        </div>
        {showTagline && (
          <span className="brand-title-tagline">
            Stop Searching. <span className="tagline-bold">Start Doing.</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default BrandLogo;
