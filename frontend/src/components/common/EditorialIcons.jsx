import React from 'react';

// ==========================================
// 9 Custom UNSTUCK Editorial Icons
// Matches exact visual grammar from reference sheet
// (Scattered, Scanning, AI Match, Gravity, Direct Apply, Automation, Alerts, Semantic, Unified)
// ==========================================

export function IconScatteredMarketplaces({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="2" stroke="#8c6b54" strokeWidth="1.5" fill="#f8fafc" />
      <circle cx="7.5" cy="7.5" r="1.6" fill="#05a894" />
      <rect x="21" y="4" width="7" height="7" rx="2" stroke="#8c6b54" strokeWidth="1.5" fill="#f8fafc" />
      <circle cx="24.5" cy="7.5" r="1.6" fill="#0c1829" />
      <rect x="4" y="21" width="7" height="7" rx="2" stroke="#8c6b54" strokeWidth="1.5" fill="#f8fafc" />
      <circle cx="7.5" cy="24.5" r="1.6" fill="#7c5cff" />
      <rect x="21" y="21" width="7" height="7" rx="2" stroke="#8c6b54" strokeWidth="1.5" fill="#f8fafc" />
      <circle cx="24.5" cy="24.5" r="1.6" fill="#ff6854" />
      <line x1="11" y1="11" x2="13.5" y2="13.5" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
      <line x1="21" y1="11" x2="18.5" y2="13.5" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
      <line x1="11" y1="21" x2="13.5" y2="18.5" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
      <line x1="21" y1="21" x2="18.5" y2="18.5" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
      <circle cx="16" cy="16" r="3" fill="#ff6854" />
      <circle cx="16" cy="16" r="1" fill="#ffffff" />
    </svg>
  );
}

export function IconAutomatedScanning({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke="#0c1829" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="7" stroke="#8c6b54" strokeWidth="1.2" strokeDasharray="3 2" />
      <path d="M 16 16 L 24.5 7.5 A 12 12 0 0 0 16 4 Z" fill="rgba(145, 110, 85, 0.12)" />
      <line x1="16" y1="16" x2="24.5" y2="7.5" stroke="#0c1829" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24.5" cy="7.5" r="2.2" fill="#ff6854" />
      <circle cx="16" cy="16" r="1.6" fill="#0c1829" />
    </svg>
  );
}

export function IconAISemanticMatch({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M 12 7 C 7.5 10, 7.5 13, 10.5 16 C 7.5 19, 7.5 22, 12 25"
        stroke="#0c1829"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="rgba(145, 110, 85, 0.08)"
      />
      <path
        d="M 20 7 C 24.5 10, 24.5 13, 21.5 16 C 24.5 19, 24.5 22, 20 25"
        stroke="#05a894"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="rgba(5, 168, 148, 0.08)"
      />
      <path
        d="M 16 10.5 L 17.3 14.5 L 21.5 16 L 17.3 17.5 L 16 21.5 L 14.7 17.5 L 10.5 16 L 14.7 14.5 Z"
        fill="#8c6b54"
      />
      <circle cx="16" cy="16" r="1.8" fill="#ffffff" />
    </svg>
  );
}

export function IconGravityWinFilter({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="16" rx="13" ry="5.5" stroke="#8c6b54" strokeWidth="1.4" strokeDasharray="3 2" transform="rotate(-20 16 16)" />
      <ellipse cx="16" cy="16" rx="8" ry="3.2" stroke="#0c1829" strokeWidth="1.5" transform="rotate(-20 16 16)" />
      <circle cx="16" cy="16" r="4.5" fill="#0c1829" />
      <circle cx="16" cy="16" r="2.2" fill="#8c6b54" />
      <circle cx="25" cy="11" r="2" fill="#ff6854" />
      <line x1="25" y1="11" x2="19" y2="14" stroke="#ff6854" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

export function IconDirectApplyWin({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="6" width="22" height="20" rx="3" stroke="#0c1829" strokeWidth="1.5" fill="#f8fafc" />
      <line x1="9" y1="11" x2="17" y2="11" stroke="#0c1829" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="15" x2="15" y2="15" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="19" x2="13" y2="19" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="21.5" cy="19.5" r="5.5" fill="#05a894" />
      <path d="M 19.5 19.5 L 21 21 L 23.5 18" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAutomationLoop({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M 16 6 A 10 10 0 0 1 26 16 L 23 16"
        stroke="#05a894"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="26,13 29,16.5 26,20" fill="#05a894" />
      <path
        d="M 16 26 A 10 10 0 0 1 6 16 L 9 16"
        stroke="#0c1829"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="6,19 3,15.5 6,12" fill="#0c1829" />
      <circle cx="16" cy="16" r="3" fill="#8c6b54" />
    </svg>
  );
}

export function IconInstantAlerts({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M 16 5 C 12.5 5 10 7.8 10 11.5 L 10 17 L 8 19 L 8 20.5 L 24 20.5 L 24 19 L 22 17 L 22 11.5 C 22 7.8 19.5 5 16 5 Z"
        stroke="#0c1829"
        strokeWidth="1.6"
        fill="#ffffff"
      />
      <path d="M 14 22 C 14 23.2 14.9 24.2 16 24.2 C 17.1 24.2 18 23.2 18 22" stroke="#0c1829" strokeWidth="1.6" />
      <circle cx="23" cy="8" r="3.2" fill="#ff6854" />
      <line x1="23" y1="8" x2="26" y2="5" stroke="#ff6854" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconAISemanticFingerprint({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M 16 7 C 11 7 8 10 8 14 C 8 18 10 22 13 25" stroke="#8c6b54" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 10 C 13 10 11 12 11 15 C 11 18 13 21 15 23" stroke="#0c1829" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 13 C 14.5 13 13.5 14 13.5 15.5 C 13.5 17 14.5 19 16 20.5" stroke="#05a894" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 16 7 C 21 7 24 10 24 14 C 24 18 22 22 19 25" stroke="#8c6b54" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="15.5" r="1.5" fill="#ff6854" />
    </svg>
  );
}

export function IconUnifiedConvergence({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke="#0c1829" strokeWidth="1.3" strokeDasharray="3 2" />
      <line x1="5" y1="16" x2="13" y2="16" stroke="#05a894" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="27" y1="16" x2="19" y2="16" stroke="#ff6854" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="5" x2="16" y2="13" stroke="#7c5cff" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="27" x2="16" y2="19" stroke="#8c6b54" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.2" fill="#0c1829" />
      <circle cx="16" cy="16" r="1.2" fill="#ffffff" />
    </svg>
  );
}
