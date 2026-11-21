import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  Edit3
} from 'lucide-react';

export function ProposalGeneratorPage({
  opportunity,
  userProfile,
  onBack,
  onCopySuccess
}) {
  const [tone, setTone] = useState('value'); // 'value' | 'direct' | 'authoritative'
  const [language, setLanguage] = useState(
    opportunity?.platformKey === 'freelancer' ? 'english' : 'arabic'
  );
  const [proposalText, setProposalText] = useState(opportunity?.proposal || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (opportunity) {
      generateProposal(tone, language);
    }
  }, [opportunity]);

  const generateProposal = async (selectedTone, selectedLang) => {
    setIsGenerating(true);
    const skillsStr = (userProfile?.skills || []).slice(0, 4).join(', ');
    const isArabic = selectedLang === 'arabic';

    try {
      const res = await fetch('http://localhost:8000/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_title: opportunity?.title || '',
          project_brief: opportunity?.description || '',
          project_skills: opportunity?.skills || [],
          user_profile: userProfile || {},
          tone: selectedTone,
          language: selectedLang
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.proposal) {
          setProposalText(data.proposal);
          setIsGenerating(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI API error, fallback to local templates:', e);
    }

    // Fallback template
    setTimeout(() => {
      let pitch = '';
      if (isArabic) {
        if (selectedTone === 'direct') {
          pitch = `مرحباً بك، اطلعت على مشروع "${opportunity?.title}" وجاهز لتنفيذه فوراً بأعلى معايير الدقة. خبرتي في (${skillsStr}) تضمن لك إنجاز كافة المتطلبات وتسليمها في الوقت المحدد بالضبط. متفرغ للبدء الآن ومناقشة التفاصيل.`;
        } else if (selectedTone === 'authoritative') {
          pitch = `أهلاً بك، بحكم خبرتي كـ (${userProfile?.title || 'مطور برمجيات'}) ومعرفتي العميقة في التعامل مع (${skillsStr})، يسعدني تولي مشروعك "${opportunity?.title}". سأعمل على تقديم بنية عمل متينة، خالية من الأخطاء، مع توثيق شامل وتسليم احترافي يتجاوز توقعاتك.`;
        } else {
          pitch = `أهلاً بك! قرأت تفاصيل مشروعك "${opportunity?.title}" بعناية واحتياجك المباشر لـ (${(opportunity?.skills || []).slice(0, 3).join(', ')}). أمتلك سجلاً حافلاً في بناء حلول مماثلة بالاعتماد على (${skillsStr}) تضمن سرعة الأداء وجودة الكود. يسعدني مشاركة نماذج من أعمالي والبدء فوراً في تنفيذ طلبك.`;
        }
      } else {
        if (selectedTone === 'direct') {
          pitch = `Hello! I reviewed your project "${opportunity?.title}" and I am ready to start immediately. With direct expertise in ${skillsStr}, I will deliver a clean, high-performance solution within your exact timeframe. Available right now to discuss specifications.`;
        } else if (selectedTone === 'authoritative') {
          pitch = `Dear Client, as a specialized ${userProfile?.title || 'Senior Software Engineer'} with proven delivery experience across ${skillsStr}, I can guarantee an enterprise-grade execution of "${opportunity?.title}". My focus is maintainability, performance, and clean code that scales effortlessly.`;
        } else {
          pitch = `Hi there! I noticed your need for a specialist in ${(opportunity?.skills || []).slice(0, 3).join(', ')} for "${opportunity?.title}". Having delivered production systems using ${skillsStr}, I understand the key technical milestones required for this build. I can deliver a polished, fast, and fully documented solution tailored to your timeline. Looking forward to discussing details!`;
        }
      }

      setProposalText(pitch);
      setIsGenerating(false);
    }, 300);
  };

  const handleToneChange = (newTone) => {
    setTone(newTone);
    generateProposal(newTone, language);
  };

  const handleLangChange = (newLang) => {
    setLanguage(newLang);
    generateProposal(tone, newLang);
  };

  const handleCopy = () => {
    if (!proposalText) return;
    navigator.clipboard.writeText(proposalText);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();

    // Reward points on Leaderboard
    try {
      fetch('http://localhost:8000/api/user/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile?.email || 'ahmed.fathy.dev@gmail.com',
          action: 'proposal',
          project_title: opportunity.title || '',
          platform: opportunity.platform || ''
        })
      });
    } catch (e) {
      console.debug('Leaderboard score update notice', e);
    }

    setTimeout(() => setCopied(false), 2200);
  };

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

  return (
    <div className="proposal-tool-clean-page">
      {/* Top Header & Breadcrumb */}
      <div className="proposal-top-header">
        <button type="button" className="btn-detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Opportunity</span>
        </button>
        <h1 className="proposal-tool-title">AI Proposal Generator</h1>
      </div>

      <div className="proposal-workspace-grid">
        {/* Left Column: Context Card & Controls */}
        <div className="proposal-context-card">
          <div className="context-opportunity-header">
            <span className={`platform-source-badge ${opportunity.platformKey}`}>
              {opportunity.platform}
            </span>
            <span className="context-match-tag">
              <Sparkles size={13} /> {opportunity.match}% Match
            </span>
          </div>

          <h2 className="context-job-title">{opportunity.title}</h2>
          <div className="context-budget-badge">{opportunity.budget}</div>

          <div className="context-divider" />

          {/* Tone Selector */}
          <div className="tool-control-section">
            <label className="tool-control-label">
              <Sliders size={14} />
              <span>Pitch Style & Tone</span>
            </label>
            <div className="tone-buttons-group">
              <button
                type="button"
                className={`tone-pill-btn ${tone === 'value' ? 'active' : ''}`}
                onClick={() => handleToneChange('value')}
              >
                Value-Driven (Recommended)
              </button>
              <button
                type="button"
                className={`tone-pill-btn ${tone === 'direct' ? 'active' : ''}`}
                onClick={() => handleToneChange('direct')}
              >
                Direct & Concise
              </button>
              <button
                type="button"
                className={`tone-pill-btn ${tone === 'authoritative' ? 'active' : ''}`}
                onClick={() => handleToneChange('authoritative')}
              >
                Senior & Authoritative
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="tool-control-section">
            <label className="tool-control-label">
              <span>Proposal Language</span>
            </label>
            <div className="language-toggle-group">
              <button
                type="button"
                className={`lang-pill-btn ${language === 'english' ? 'active' : ''}`}
                onClick={() => handleLangChange('english')}
              >
                English
              </button>
              <button
                type="button"
                className={`lang-pill-btn ${language === 'arabic' ? 'active' : ''}`}
                onClick={() => handleLangChange('arabic')}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Regenerate Button */}
          <button
            type="button"
            className="btn-regenerate-proposal"
            onClick={() => generateProposal(tone, language)}
            disabled={isGenerating}
          >
            <RefreshCw size={14} className={isGenerating ? 'spin-icon' : ''} />
            <span>Regenerate Proposal</span>
          </button>
        </div>

        {/* Right Column: Proposal Editor & Actions */}
        <div className="proposal-editor-card">
          <div className="proposal-editor-top">
            <div className="editor-label-badge">
              <Edit3 size={14} />
              <span>Editable Proposal Draft</span>
            </div>
            <div className="proposal-character-count">
              {proposalText.length} characters
            </div>
          </div>

          <div className="proposal-textarea-wrapper">
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              placeholder=""
              className="proposal-clean-textarea"
              rows={10}
              dir={language === 'arabic' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="proposal-actions-footer">
            <button
              type="button"
              className="btn-primary-universe btn-copy-proposal"
              onClick={handleCopy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Proposal'}</span>
            </button>

            {opportunity.link && (
              <a
                href={opportunity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-external-marketplace"
              >
                <span>Submit on {opportunity.platform}</span>
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProposalGeneratorPage;
