import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Search,
  Clock,
  ExternalLink,
  Target,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Briefcase,
  Copy,
  Check,
  Filter
} from 'lucide-react';

// Character Artwork Imports
import sittingLaptop from '../../assets/sitting_laptop.png';
import victoryChar from '../../assets/victory.png';

import { Footer } from '../../components/common/Footer';

export function LandingPage({ onNavigate, onOpenConceptModal, opportunities = [] }) {
  // Hero Story State Machine: 1 = Noise, 2 = Searching, 3 = Signal, 4 = Action / Doing
  const [heroPhase, setHeroPhase] = useState(1);
  const [heroAutoPlay, setHeroAutoPlay] = useState(true);

  // Proposal Section Interactive State
  const [proposalStep, setProposalStep] = useState('idle'); // 'idle' | 'generating' | 'ready'
  const [copiedProposal, setCopiedProposal] = useState(false);

  // Matching Section Animated Score State
  const [matchingScore, setMatchingScore] = useState(0);

  // Controlled sequential timer for Hero Story (Noise -> Searching -> Signal -> Action)
  useEffect(() => {
    if (!heroAutoPlay) return;

    const timer1 = setTimeout(() => setHeroPhase(2), 2200);
    const timer2 = setTimeout(() => setHeroPhase(3), 4400);
    const timer3 = setTimeout(() => {
      setHeroPhase(4);
      setHeroAutoPlay(false); // Settle into calm ambient state after 1 full purposeful run
    }, 6600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [heroAutoPlay]);

  // Smooth counter animation for Section 5 (Matching Score)
  useEffect(() => {
    let start = 0;
    const target = 94;
    const duration = 1200;
    const stepTime = Math.abs(Math.floor(duration / target));

    const counter = setInterval(() => {
      start += 2;
      if (start >= target) {
        setMatchingScore(target);
        clearInterval(counter);
      } else {
        setMatchingScore(start);
      }
    }, stepTime);

    return () => clearInterval(counter);
  }, []);

  const handleReplayHeroStory = () => {
    setHeroPhase(1);
    setHeroAutoPlay(true);
  };

  const handleGenerateProposalClick = () => {
    setProposalStep('generating');
    setTimeout(() => {
      setProposalStep('ready');
    }, 1100);
  };

  const handleCopySampleProposal = () => {
    navigator.clipboard.writeText(
      "Hi! I noticed your need for a React specialist to build the SaaS dashboard. Having built production dashboards with modern React and REST APIs, I can deliver clean code, high speed, and a great UX within your 3-week timeline. Ready to discuss specs!"
    );
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 2200);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-view-story">
      {/* =========================================================
          SECTION 1 — HERO
          Stop Searching. Start Doing.
          ========================================================= */}
      <section className="hero-story-section" id="hero-section">
        <div className="hero-story-container">
          {/* Left Column: Short, powerful copy & CTAs */}
          <div className="hero-copy-column">
            <div className="hero-badge-pill">
              <span className="hero-badge-dot" />
              <span>THE FREELANCE INTELLIGENCE SYSTEM</span>
            </div>

            <h1 className="hero-main-title">
              Stop Searching.<br />
              <span className="hero-title-accent">Start Doing.</span>
            </h1>

            <p className="hero-supporting-text">
              Unstuck finds the freelance opportunities that fit your skills, preferences, and goals — so you spend less time searching and more time working.
            </p>

            {/* CTAs: Start Doing -> Sign Up, See How It Works -> Scroll */}
            <div className="hero-cta-button-group">
              <button
                type="button"
                className="btn-primary-universe hero-cta-primary"
                onClick={() => onNavigate('signup')}
              >
                <span>Start Doing</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="btn-secondary-story hero-cta-secondary"
                onClick={() => scrollToSection('the-problem')}
              >
                <span>See How It Works</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Subtle Platform Indicators */}
            <div className="hero-supported-platforms-bar">
              <span className="supported-label">Active crawlers across:</span>
              <div className="supported-tags">
                <span className="platform-tag khamsat">Khamsat</span>
                <span className="platform-tag mostaql">Mostaql</span>
                <span className="platform-tag nafezly">Nafezly</span>
                <span className="platform-tag freelancer">Freelancer</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Story (Noise -> Searching -> Signal -> Action) */}
          <div className="hero-story-canvas-column">
            <div className={`hero-story-stage phase-${heroPhase}`}>
              {/* Background ambient orbit circles */}
              <div className="hero-ambient-ring ring-outer" />
              <div className="hero-ambient-ring ring-middle" />
              <div className="hero-ambient-ring ring-inner" />

              {/* Central Character in a controlled, responsive frame */}
              <div className="hero-character-box">
                <img
                  src={sittingLaptop}
                  alt="Freelancer at work"
                  className={`hero-mascot-img character-state-${heroPhase}`}
                />

                {/* State Tag below Mascot */}
                <div className="hero-character-status-badge">
                  {heroPhase === 1 && (
                    <span className="status-label noise">
                      <span className="status-pulse red" /> Phase 1: Noise (Surrounded by requests)
                    </span>
                  )}
                  {heroPhase === 2 && (
                    <span className="status-label searching">
                      <span className="status-pulse amber" /> Phase 2: Searching (What to choose?)
                    </span>
                  )}
                  {heroPhase === 3 && (
                    <span className="status-label signal">
                      <span className="status-pulse cerulean" /> Phase 3: Signal (Your match is found!)
                    </span>
                  )}
                  {heroPhase === 4 && (
                    <span className="status-label action">
                      <span className="status-pulse green" /> Phase 4: Doing (Stop searching. Start doing!)
                    </span>
                  )}
                </div>
              </div>

              {/* Floating Signal Tags appearing around character */}
              {/* Signal 1: React Developer (The True Signal in Phase 3 & 4) */}
              <div
                className={`story-tag-card tag-react-job ${heroPhase >= 3 ? 'is-highlighted-signal' : 'is-noise'}`}
              >
                <div className="tag-header-row">
                  <span className="tag-platform">Freelancer</span>
                  <span className="tag-match-score">95% Match</span>
                </div>
                <div className="tag-job-title">React Developer — SaaS Dashboard</div>
                <div className="tag-job-meta">
                  <span className="tag-budget">$600 – $1,200</span>
                  <span className="tag-badge-accent">Your Fit</span>
                </div>
              </div>

              {/* Noise Signal 2: Content Writer */}
              <div className={`story-tag-card tag-noise-1 ${heroPhase >= 3 ? 'is-faded' : ''}`}>
                <span className="tag-platform-dot red" />
                <span className="tag-text">Content Writer • $25</span>
              </div>

              {/* Noise Signal 3: UI Designer */}
              <div className={`story-tag-card tag-noise-2 ${heroPhase >= 3 ? 'is-faded' : ''}`}>
                <span className="tag-platform-dot cerulean" />
                <span className="tag-text">UI Designer • Remote</span>
              </div>

              {/* Noise Signal 4: Urgent Task */}
              <div className={`story-tag-card tag-noise-3 ${heroPhase >= 3 ? 'is-faded' : ''}`}>
                <span className="tag-platform-dot amber" />
                <span className="tag-text">Urgent • 50+ Bids</span>
              </div>

              {/* Noise Signal 5: $250 Quick Fix */}
              <div className={`story-tag-card tag-noise-4 ${heroPhase >= 3 ? 'is-faded' : ''}`}>
                <span className="tag-platform-dot potting" />
                <span className="tag-text">PHP Bug Fix • $30</span>
              </div>

              {/* Story Playback Navigation Controls */}
              <div className="hero-story-playback-controls">
                <div className="story-step-pills">
                  {[1, 2, 3, 4].map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={`story-step-pill ${heroPhase === step ? 'active' : ''}`}
                      onClick={() => {
                        setHeroPhase(step);
                        setHeroAutoPlay(false);
                      }}
                      title={`Jump to Phase ${step}`}
                    >
                      {step === 1 && 'Noise'}
                      {step === 2 && 'Searching'}
                      {step === 3 && 'Signal'}
                      {step === 4 && 'Action'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-replay-story"
                  onClick={handleReplayHeroStory}
                  title="Replay visual story sequence"
                >
                  <RotateCcw size={13} />
                  <span>Replay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 2 — THE PROBLEM
          Getting stuck starts with too much noise.
          ========================================================= */}
      <section className="problem-story-section" id="the-problem">
        <div className="section-narrative-header">
          <div className="section-eyebrow-tag">
            <Layers size={13} />
            <span>THE PROBLEM</span>
          </div>
          <h2 className="section-headline-large">
            Getting stuck starts with too much noise.
          </h2>
          <p className="section-description-text">
            Freelance opportunities are everywhere. The hard part is knowing which ones are actually worth your time.
          </p>
        </div>

        {/* 3 Simple, Visually Clean Problem Cards */}
        <div className="problem-cards-row">
          {/* Problem 1 */}
          <div className="problem-card-item">
            <div className="problem-card-header">
              <div className="problem-card-num">01</div>
              <div className="problem-card-icon red">
                <Layers size={20} />
              </div>
            </div>
            <h3 className="problem-card-title">Too Many Platforms</h3>
            <p className="problem-card-desc">
              Opportunities are scattered across different freelance platforms. You spend your morning opening 20 tabs just to see what was posted.
            </p>
            <div className="problem-card-visual-strip">
              <span className="mini-chip">Khamsat</span>
              <span className="mini-chip">Mostaql</span>
              <span className="mini-chip">Nafezly</span>
              <span className="mini-chip">Freelancer</span>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="problem-card-item">
            <div className="problem-card-header">
              <div className="problem-card-num">02</div>
              <div className="problem-card-icon amber">
                <Search size={20} />
              </div>
            </div>
            <h3 className="problem-card-title">Endless Searching</h3>
            <p className="problem-card-desc">
              You spend more time searching and comparing than actually applying. Hours vanish filtering out irrelevant and low-budget requests.
            </p>
            <div className="problem-card-visual-strip">
              <span className="mini-chip warning">3 hrs spent searching daily</span>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="problem-card-item">
            <div className="problem-card-header">
              <div className="problem-card-num">03</div>
              <div className="problem-card-icon potting">
                <Clock size={20} />
              </div>
            </div>
            <h3 className="problem-card-title">Missed Opportunities</h3>
            <p className="problem-card-desc">
              Good opportunities can disappear while you’re still looking. By the time you spot the right project, 40 competitors have already applied.
            </p>
            <div className="problem-card-visual-strip">
              <span className="mini-chip danger">Applied 40 mins too late</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3 — THE UNSTUCK MOMENT
          Then, the noise gets filtered.
          ========================================================= */}
      <section className="unstuck-filter-section" id="unstuck-moment">
        <div className="section-narrative-header">
          <div className="section-eyebrow-tag">
            <Filter size={13} />
            <span>THE UNSTUCK MOMENT</span>
          </div>
          <h2 className="section-headline-large">
            Then, the noise gets filtered.
          </h2>
          <p className="section-description-text">
            Unstuck brings opportunities from different platforms into one place and focuses your attention on the ones that fit you.
          </p>
        </div>

        {/* Visual Transformation: Many signals -> Unstuck Filter -> Clear Path */}
        <div className="filter-transformation-board">
          {/* Left: Scattered Sources */}
          <div className="trans-col trans-sources">
            <div className="trans-col-header">
              <span className="trans-col-badge">INPUT</span>
              <h4 className="trans-col-title">Multiple Platforms</h4>
              <span className="trans-col-sub">Hundreds of scattered postings</span>
            </div>

            <div className="trans-source-chips-cloud">
              <div className="source-stream-chip">Khamsat (54 new requests)</div>
              <div className="source-stream-chip">Mostaql (28 client projects)</div>
              <div className="source-stream-chip">Nafezly (19 verified tasks)</div>
              <div className="source-stream-chip">Freelancer (140 global bids)</div>
              <div className="source-stream-chip noise">Irrelevant tech stack</div>
              <div className="source-stream-chip noise">Underbudget listings</div>
            </div>
          </div>

          {/* Center: The Unstuck Central Filter */}
          <div className="trans-col trans-engine">
            <div className="engine-pulse-core">
              <div className="engine-glow-ring" />
              <div className="engine-center-symbol">
                <span className="engine-brand-label">UNSTUCK</span>
                <span className="engine-sub-label">Signal Filter</span>
              </div>
            </div>
            <div className="engine-flow-arrows">
              <span className="arrow-flow-dot d1">→</span>
              <span className="arrow-flow-dot d2">→</span>
              <span className="arrow-flow-dot d3">→</span>
            </div>
          </div>

          {/* Right: High-Gravity Relevant Opportunities */}
          <div className="trans-col trans-results">
            <div className="trans-col-header">
              <span className="trans-col-badge green">OUTPUT</span>
              <h4 className="trans-col-title">Your Signal Today</h4>
              <span className="trans-col-sub">Only verified, high-fit opportunities</span>
            </div>

            <div className="trans-output-cards-stack">
              <div className="output-match-card top">
                <div className="output-card-top">
                  <span className="output-platform-pill freelancer">Freelancer</span>
                  <span className="output-match-pill">95% Match</span>
                </div>
                <div className="output-job-name">React Developer — Modern SaaS Dashboard</div>
                <div className="output-job-footer">
                  <span className="output-budget">$600 – $1,200</span>
                  <span className="output-action-hint">High Probability Win →</span>
                </div>
              </div>

              <div className="output-match-card">
                <div className="output-card-top">
                  <span className="output-platform-pill nafezly">Nafezly</span>
                  <span className="output-match-pill">91% Match</span>
                </div>
                <div className="output-job-name">FastAPI & n8n AI Automation Pipeline</div>
                <div className="output-job-footer">
                  <span className="output-budget">$450 – $800</span>
                  <span className="output-action-hint">Ready to Apply →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 4 — HOW UNSTUCK HELPS (3 STEPS ONLY)
          From searching to doing.
          ========================================================= */}
      <section className="how-helps-section" id="how-it-works">
        <div className="section-narrative-header">
          <div className="section-eyebrow-tag">
            <Target size={13} />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="section-headline-large">
            From searching to doing.
          </h2>
          <p className="section-description-text">
            Three simple steps take you out of the search vortex and directly into high-paying work.
          </p>
        </div>

        {/* The 3 Steps Connected by a Visual Flow Path */}
        <div className="three-steps-connected-grid">
          {/* Step 01 */}
          <div className="step-journey-card">
            <div className="step-badge-number">01</div>
            <div className="step-content-block">
              <span className="step-subhead">THE FOUNDATION</span>
              <h3 className="step-title">Understand You</h3>
              <p className="step-body">
                Tell Unstuck your skills, experience, and preferences once. We turn them into your persistent Freelance DNA.
              </p>
            </div>
            <div className="step-card-footer">
              <span className="step-tag-pill">Skills & Minimum Rate</span>
            </div>
          </div>

          {/* Connector Line 1 */}
          <div className="step-journey-connector">
            <div className="connector-line-pulse" />
            <span className="connector-arrow">→</span>
          </div>

          {/* Step 02 */}
          <div className="step-journey-card active-card">
            <div className="step-badge-number active">02</div>
            <div className="step-content-block">
              <span className="step-subhead">THE RADAR</span>
              <h3 className="step-title">Find Your Signal</h3>
              <p className="step-body">
                Unstuck continuously monitors platforms and highlights only the opportunities that align with your background.
              </p>
            </div>
            <div className="step-card-footer">
              <span className="step-tag-pill highlight">90%+ Verified Matches</span>
            </div>
          </div>

          {/* Connector Line 2 */}
          <div className="step-journey-connector">
            <div className="connector-line-pulse" />
            <span className="connector-arrow">→</span>
          </div>

          {/* Step 03 */}
          <div className="step-journey-card">
            <div className="step-badge-number">03</div>
            <div className="step-content-block">
              <span className="step-subhead">THE ACTION</span>
              <h3 className="step-title">Start Doing</h3>
              <p className="step-body">
                Choose an opportunity, generate your proposal in one click, and submit directly on the platform before anyone else.
              </p>
            </div>
            <div className="step-card-footer">
              <span className="step-tag-pill">Instant Proposal & Apply</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 5 — PERSONALIZATION / MATCHING
          Not every opportunity is for you.
          ========================================================= */}
      <section className="personalization-section" id="matching-section">
        <div className="section-narrative-header">
          <div className="section-eyebrow-tag">
            <Target size={13} />
            <span>PERSONALIZED MATCHING</span>
          </div>
          <h2 className="section-headline-large">
            Not every opportunity is for you.
          </h2>
          <p className="section-description-text">
            Unstuck uses your skills and preferences to highlight opportunities that actually make sense for you.
          </p>
        </div>

        <div className="matching-showcase-row">
          {/* Match Card 1: High Match (94%) */}
          <div className="match-example-card top-match">
            <div className="match-card-header">
              <div className="match-role-info">
                <span className="match-category-tag">Development</span>
                <h3 className="match-role-title">Frontend Developer</h3>
                <span className="match-platform-sub">Freelancer • SaaS Dashboard</span>
              </div>
              <div className="match-score-badge-circle high">
                <span className="match-percent-number">{matchingScore}%</span>
                <span className="match-percent-label">Match</span>
              </div>
            </div>

            <p className="match-card-why">
              Matches your core React & JavaScript stack with zero missing requirements.
            </p>

            <div className="match-skills-list">
              <span className="match-skill-pill matched">React</span>
              <span className="match-skill-pill matched">JavaScript</span>
              <span className="match-skill-pill matched">CSS</span>
              <span className="match-skill-pill matched">REST APIs</span>
            </div>

            <div className="match-card-bottom">
              <span className="match-budget-val">$600 – $1,200</span>
              <button
                type="button"
                className="btn-match-action"
                onClick={() => onNavigate('signup')}
              >
                Inspect Signal →
              </button>
            </div>
          </div>

          {/* Match Card 2: Moderate Match (71%) */}
          <div className="match-example-card moderate-match">
            <div className="match-card-header">
              <div className="match-role-info">
                <span className="match-category-tag">Design & UX</span>
                <h3 className="match-role-title">UI/UX Designer</h3>
                <span className="match-platform-sub">Mostaql • Fintech Mobile App</span>
              </div>
              <div className="match-score-badge-circle moderate">
                <span className="match-percent-number">71%</span>
                <span className="match-percent-label">Match</span>
              </div>
            </div>

            <p className="match-card-why">
              Good visual overlap with your Figma skills; requires additional user research experience.
            </p>

            <div className="match-skills-list">
              <span className="match-skill-pill matched">Figma</span>
              <span className="match-skill-pill matched">UI Design</span>
              <span className="match-skill-pill unmoved">User Research</span>
            </div>

            <div className="match-card-bottom">
              <span className="match-budget-val">$300 – $500</span>
              <span className="match-status-note">Moderate Fit</span>
            </div>
          </div>

          {/* Match Card 3: Automation Specialist (92%) */}
          <div className="match-example-card top-match">
            <div className="match-card-header">
              <div className="match-role-info">
                <span className="match-category-tag">Automation</span>
                <h3 className="match-role-title">Python Automation Specialist</h3>
                <span className="match-platform-sub">Nafezly • Webhook Integration</span>
              </div>
              <div className="match-score-badge-circle high">
                <span className="match-percent-number">92%</span>
                <span className="match-percent-label">Match</span>
              </div>
            </div>

            <p className="match-card-why">
              Direct alignment with your n8n workflow and FastAPI background.
            </p>

            <div className="match-skills-list">
              <span className="match-skill-pill matched">FastAPI</span>
              <span className="match-skill-pill matched">n8n</span>
              <span className="match-skill-pill matched">Python</span>
            </div>

            <div className="match-card-bottom">
              <span className="match-budget-val">$400 – $750</span>
              <button
                type="button"
                className="btn-match-action"
                onClick={() => onNavigate('signup')}
              >
                Inspect Signal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 6 — AI PROPOSAL
          Found the right opportunity? Make your move.
          ========================================================= */}
      <section className="proposal-story-section" id="proposal-section">
        <div className="section-narrative-header">
          <div className="section-eyebrow-tag">
            <Zap size={13} />
            <span>ACTION READY</span>
          </div>
          <h2 className="section-headline-large">
            Found the right opportunity? Make your move.
          </h2>
          <p className="section-description-text">
            Turn a good match into a strong proposal with AI assistance tailored to the opportunity and your skills.
          </p>
        </div>

        {/* Visual Process: Opportunity -> Generate Proposal -> Ready to Apply */}
        <div className="proposal-flow-container">
          <div className="proposal-steps-ribbon">
            <div className="ribbon-step active">
              <span className="r-dot" /> 1. Selected Opportunity
            </div>
            <span className="r-arrow">→</span>
            <div className={`ribbon-step ${proposalStep !== 'idle' ? 'active' : ''}`}>
              <span className="r-dot" /> 2. Generate Proposal
            </div>
            <span className="r-arrow">→</span>
            <div className={`ribbon-step ${proposalStep === 'ready' ? 'active' : ''}`}>
              <span className="r-dot" /> 3. Ready to Apply
            </div>
          </div>

          <div className="proposal-interactive-workspace">
            {/* Left: Matched Opportunity Snapshot */}
            <div className="proposal-opportunity-snapshot">
              <div className="snapshot-header">
                <span className="snapshot-platform-tag">Freelancer</span>
                <span className="snapshot-match-tag">95% Fit</span>
              </div>
              <h3 className="snapshot-title">React Developer — Modern SaaS Dashboard</h3>
              <p className="snapshot-desc">
                Need a skilled React developer to build an interactive SaaS dashboard with modern component architecture and REST APIs.
              </p>
              <div className="snapshot-skills-strip">
                <span className="mini-skill">React</span>
                <span className="mini-skill">JavaScript</span>
                <span className="mini-skill">REST APIs</span>
              </div>

              <div className="snapshot-action-area">
                <button
                  type="button"
                  className="btn-primary-universe btn-generate-proposal"
                  onClick={handleGenerateProposalClick}
                  disabled={proposalStep === 'generating'}
                >
                  <Sparkles size={16} />
                  <span>
                    {proposalStep === 'generating'
                      ? 'Generating Tailored Proposal...'
                      : proposalStep === 'ready'
                      ? 'Regenerate Proposal'
                      : 'Generate Proposal'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: The Proposal Output Card (Focused tool, NOT a chatbot) */}
            <div className="proposal-output-canvas">
              <div className="output-canvas-header">
                <div className="output-canvas-label">
                  <span className="canvas-dot-green" />
                  <span>Proposal Draft (Tailored to Client Scope)</span>
                </div>
                {proposalStep === 'ready' && (
                  <button
                    type="button"
                    className="btn-copy-proposal-inline"
                    onClick={handleCopySampleProposal}
                  >
                    {copiedProposal ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedProposal ? 'Copied!' : 'Copy Proposal'}</span>
                  </button>
                )}
              </div>

              <div className="proposal-text-area-box">
                {proposalStep === 'idle' && (
                  <div className="proposal-placeholder-state">
                    <Sparkles size={28} className="placeholder-sparkle" />
                    <p className="placeholder-text">
                      Click <b>"Generate Proposal"</b> to generate a persuasive, personalized pitch based on your Freelance DNA.
                    </p>
                  </div>
                )}

                {proposalStep === 'generating' && (
                  <div className="proposal-generating-state">
                    <div className="generating-pulse-indicator" />
                    <p>Analyzing client requirements and crafting tailored proposal...</p>
                  </div>
                )}

                {proposalStep === 'ready' && (
                  <div className="proposal-ready-text">
                    <p>
                      <b>Hello!</b> I noticed your need for a React specialist to build the SaaS dashboard with clean component architecture.
                    </p>
                    <p>
                      Having delivered production dashboards using React and REST APIs, I understand the exact state management and performance tuning required. I can deliver a polished, fast, and fully documented solution within your 3-week timeline.
                    </p>
                    <p>
                      Available right now to review your technical specs and get started.
                    </p>
                    <div className="proposal-ready-footer">
                      <span className="proposal-stats-pill">Tailored to your skills: React, REST APIs</span>
                      <span className="proposal-stats-pill green">Ready to submit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 7 — FINAL CTA
          Stop Searching. Start Doing.
          ========================================================= */}
      <section className="final-cta-story-section" id="final-cta">
        <div className="final-cta-story-card">
          <div className="final-cta-content-column">
            <div className="final-cta-badge">
              <Sparkles size={14} />
              <span>THE SIGNAL IS WAITING</span>
            </div>

            <h2 className="final-cta-title">
              Stop searching for your next opportunity.<br />
              <span className="final-cta-title-highlight">Start doing.</span>
            </h2>

            <p className="final-cta-subtitle">
              Let Unstuck find the signal. You take the next step.
            </p>

            <div className="final-cta-button-row">
              <button
                type="button"
                className="btn-primary-universe final-cta-btn-primary"
                onClick={() => onNavigate('signup')}
              >
                <span>Start Doing</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="btn-secondary-white final-cta-btn-secondary"
                onClick={() => scrollToSection('how-it-works')}
              >
                <span>See How It Works</span>
              </button>
            </div>

            <div className="final-cta-foot-note">
              <span>Already registered?</span>
              <button
                type="button"
                className="btn-link-inline"
                onClick={() => onNavigate('login')}
              >
                Log In to Your Signal →
              </button>
            </div>
          </div>

          {/* Victory Mascot in a controlled responsive container */}
          <div className="final-cta-mascot-column">
            <div className="final-mascot-frame">
              <img
                src={victoryChar}
                alt="Freelancer celebrating getting unstuck"
                className="final-mascot-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} onOpenConceptModal={onOpenConceptModal} />
    </div>
  );
}

export default LandingPage;
