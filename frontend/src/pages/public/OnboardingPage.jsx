import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Check,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Bell,
  Globe,
  Award
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import unstuck3dWordmark from '../../assets/unstuck_3d_wordmark.png';
import avatarChar from '../../assets/avatar_smiling.png';

const POPULAR_SKILLS = [
  'React', 'JavaScript', 'Python', 'FastAPI', 'Automation', 'n8n',
  'Tailwind', 'REST APIs', 'UI/UX', 'Figma', 'Data Entry', 'Fast Delivery',
  'Audio Transcription', 'Arabic UX', 'Scraping', 'Telegram Bot', 'Docker'
];

export function OnboardingPage({ initialData, onCompleteOnboarding, onNavigate }) {
  const [step, setStep] = useState(1); // 1: Bio & Role, 2: Skills & Exp, 3: Platforms & Budget, 4: Notifications

  const [formData, setFormData] = useState({
    name: initialData?.name || 'أحمد فتحي',
    email: initialData?.email || 'ahmed.fathy.dev@gmail.com',
    title: initialData?.title || 'Full-Stack Developer & AI Automation Specialist',
    bio: 'مطور برمجيات متخصص في بناء تطبيقات React و FastAPI وتصميم مسارات الأتمتة الذكية عبر n8n.',
    experience: 'Mid-Level (2–4 Years)',
    minBudget: '$150',
    skills: ['React', 'JavaScript', 'Python', 'FastAPI', 'Automation', 'n8n', 'Tailwind'],
    preferredPlatforms: ['Khamsat', 'Mostaql', 'Nafezly', 'Freelancer'],
    alertThreshold: 80,
    notificationChannels: {
      browser: true,
      email: true,
      whatsapp: false
    }
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  const toggleSkill = (skill) => {
    if (formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: formData.skills.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, trimmed]
      });
      setNewSkillInput('');
    }
  };

  const togglePlatform = (plat) => {
    if (formData.preferredPlatforms.includes(plat)) {
      if (formData.preferredPlatforms.length === 1) return; // Keep at least one
      setFormData({
        ...formData,
        preferredPlatforms: formData.preferredPlatforms.filter(p => p !== plat)
      });
    } else {
      setFormData({
        ...formData,
        preferredPlatforms: [...formData.preferredPlatforms, plat]
      });
    }
  };

  const handleFinish = () => {
    onCompleteOnboarding(formData);
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-header-bar">
        <div className="onboarding-brand">
          <BrandLogo size="small" showTagline={false} onClick={() => onNavigate('landing')} />
        </div>
        <div className="onboarding-progress-steps">
          <div className={`onboarding-step-indicator ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'current' : ''}`}>
            <span>1</span> Role & Bio
          </div>
          <div className="step-connector" />
          <div className={`onboarding-step-indicator ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'current' : ''}`}>
            <span>2</span> Skills DNA
          </div>
          <div className="step-connector" />
          <div className={`onboarding-step-indicator ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'current' : ''}`}>
            <span>3</span> Platforms & Rate
          </div>
          <div className="step-connector" />
          <div className={`onboarding-step-indicator ${step >= 4 ? 'completed' : ''} ${step === 4 ? 'current' : ''}`}>
            <span>4</span> Radar Alerts
          </div>
        </div>
        <div className="onboarding-exit">
          <button className="auth-back-btn" onClick={() => onNavigate('landing')}>
            Exit Setup
          </button>
        </div>
      </div>

      <div className="onboarding-main-card">
        {/* Step 1: Role & Elevator Pitch */}
        {step === 1 && (
          <div className="onboarding-step-content">
            <div className="onboarding-step-badge">
              <Sparkles size={14} />
              <span>STEP 1: YOUR PROFESSIONAL IDENTITY</span>
            </div>
            <h2 className="onboarding-title">Let’s calibrate your Freelance DNA</h2>
            <p className="onboarding-desc">
              UNSTUCK matches you with opportunities that value your exact strengths. Start by confirming how you want to be presented to clients.
            </p>

            <div className="onboarding-form-fields">
              <div className="auth-field-group">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="auth-text-input"
                  placeholder=""
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Professional Headline / Role</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="auth-text-input"
                  placeholder=""
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Short Bio / Pitch (Used for AI Proposals)</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="auth-textarea-input"
                  placeholder=""
                />
              </div>
            </div>

            <div className="onboarding-actions-row">
              <div />
              <button
                type="button"
                className="btn-primary-universe"
                onClick={() => setStep(2)}
              >
                <span>Continue to Skills DNA</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Skills & Experience */}
        {step === 2 && (
          <div className="onboarding-step-content">
            <div className="onboarding-step-badge">
              <Cpu size={14} />
              <span>STEP 2: SKILL CALIBRATION</span>
            </div>
            <h2 className="onboarding-title">Select your primary skills</h2>
            <p className="onboarding-desc">
              Our AI semantic engine matches job requirements against these exact skills to compute your live Match Scores and Win Probabilities.
            </p>

            <div className="onboarding-form-fields">
              <div className="skills-selector-block">
                <label className="auth-label">
                  Your Selected Skills ({formData.skills.length})
                </label>
                <div className="selected-skills-chip-container">
                  {formData.skills.map((s) => (
                    <span key={s} className="skill-chip-pill active">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className="skill-chip-remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddCustomSkill} className="add-custom-skill-row">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder=""
                    className="auth-text-input custom-skill-input"
                  />
                  <button type="submit" className="btn-add-skill">
                    <Plus size={14} /> Add
                  </button>
                </form>

                <div className="popular-skills-wrapper">
                  <span className="popular-skills-label">Suggested from market scrape:</span>
                  <div className="popular-skills-grid">
                    {POPULAR_SKILLS.map((sk) => {
                      const isSelected = formData.skills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`skill-tag-pill ${isSelected ? 'selected' : ''}`}
                        >
                          {isSelected && <Check size={12} />}
                          <span>{sk}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="auth-field-group" style={{ marginTop: '16px' }}>
                <label className="auth-label">Experience Level</label>
                <div className="experience-cards-grid">
                  {[
                    { level: 'Entry / Junior (< 2 Years)', desc: 'Fast wins, micro-tasks, portfolio building' },
                    { level: 'Mid-Level (2–4 Years)', desc: 'Autonomous delivery, full projects, standard rates' },
                    { level: 'Senior / Lead (5+ Years)', desc: 'Architectural scope, high-ticket corporate contracts' }
                  ].map((exp) => (
                    <div
                      key={exp.level}
                      onClick={() => setFormData({ ...formData, experience: exp.level })}
                      className={`experience-option-card ${formData.experience === exp.level ? 'active' : ''}`}
                    >
                      <div className="exp-radio-dot" />
                      <div>
                        <b>{exp.level}</b>
                        <p>{exp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="onboarding-actions-row">
              <button
                type="button"
                className="btn-watch-video"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn-primary-universe"
                onClick={() => setStep(3)}
              >
                <span>Continue to Platforms</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Platforms & Budget */}
        {step === 3 && (
          <div className="onboarding-step-content">
            <div className="onboarding-step-badge">
              <Globe size={14} />
              <span>STEP 3: MARKETPLACE CHANNELS</span>
            </div>
            <h2 className="onboarding-title">Where do you want to win?</h2>
            <p className="onboarding-desc">
              Select which platforms your autonomous scraper should index and set your minimum target budget threshold.
            </p>

            <div className="onboarding-form-fields">
              <div className="auth-field-group">
                <label className="auth-label">Active Marketplaces</label>
                <div className="platform-toggle-grid">
                  {[
                    { key: 'Khamsat', title: 'Khamsat (خمسات)', desc: 'Micro-services, fast execution, Arab audience' },
                    { key: 'Mostaql', title: 'Mostaql (مستقل)', desc: 'Comprehensive projects, design & software contracts' },
                    { key: 'Nafezly', title: 'Nafezly (نفّذلي)', desc: 'Tech tasks, verified client escrow' },
                    { key: 'Freelancer', title: 'Freelancer Global', desc: 'USD projects, worldwide enterprise clients' }
                  ].map((p) => {
                    const isChecked = formData.preferredPlatforms.includes(p.key);
                    return (
                      <div
                        key={p.key}
                        onClick={() => togglePlatform(p.key)}
                        className={`platform-select-card ${isChecked ? 'active' : ''}`}
                      >
                        <div className="plat-check-box">
                          {isChecked && <Check size={14} color="#ffffff" />}
                        </div>
                        <div>
                          <b>{p.title}</b>
                          <p>{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="auth-field-group" style={{ marginTop: '16px' }}>
                <label className="auth-label">Minimum Target Project Budget</label>
                <div className="budget-preset-bar">
                  {['$10 (Fast Wins)', '$50+', '$150+', '$300+', '$600+ (High Value)'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData({ ...formData, minBudget: b.split(' ')[0] })}
                      className={`budget-preset-btn ${formData.minBudget === b.split(' ')[0] ? 'active' : ''}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="onboarding-actions-row">
              <button
                type="button"
                className="btn-watch-video"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn-primary-universe"
                onClick={() => setStep(4)}
              >
                <span>Continue to Alerts</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Radar Alerts & Launch */}
        {step === 4 && (
          <div className="onboarding-step-content">
            <div className="onboarding-step-badge">
              <Bell size={14} />
              <span>STEP 4: RADAR NOTIFICATION PREFERENCES</span>
            </div>
            <h2 className="onboarding-title">How should UNSTUCK notify you?</h2>
            <p className="onboarding-desc">
              When an opportunity reaches your required match gravity, our system alerts you immediately so you can be first to apply.
            </p>

            <div className="onboarding-form-fields">
              <div className="alert-threshold-slider-box">
                <div className="threshold-row-top">
                  <label className="auth-label">Minimum Match Score for Instant Alerts</label>
                  <span className="threshold-score-badge">{formData.alertThreshold}% Match</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
                  className="threshold-range-slider"
                />
                <span className="threshold-hint">
                  Only notify me for projects where Skill DNA alignment is {formData.alertThreshold}% or higher.
                </span>
              </div>

              <div className="notification-channels-list">
                <label className="auth-label">Notification Channels</label>
                <div className="channel-item-row">
                  <div>
                    <b>Browser In-App Radar</b>
                    <p>Live audio/visual alert banner when browsing UNSTUCK</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationChannels.browser}
                    onChange={(e) => setFormData({
                      ...formData,
                      notificationChannels: { ...formData.notificationChannels, browser: e.target.checked }
                    })}
                  />
                </div>
                <div className="channel-item-row">
                  <div>
                    <b>Email Dispatch ({formData.email})</b>
                    <p>Instant direct project URL pushed to your inbox</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationChannels.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      notificationChannels: { ...formData.notificationChannels, email: e.target.checked }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="onboarding-actions-row">
              <button
                type="button"
                className="btn-watch-video"
                onClick={() => setStep(3)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn-primary-universe"
                onClick={handleFinish}
              >
                <span>Launch Your Signal Today →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
