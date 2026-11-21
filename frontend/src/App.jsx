import React, { useState, useMemo, useEffect } from 'react';
import { Check } from 'lucide-react';

// Common Components
import { Header } from './components/common/Header';
import { ConceptModal } from './components/common/ConceptModal';
import { NotificationsDrawer } from './components/common/NotificationsDrawer';
import { LiveAlertBanner } from './components/common/LiveAlertBanner';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignUpPage } from './pages/public/SignUpPage';
import { OnboardingPage } from './pages/public/OnboardingPage';
import { VerifyOtpPage } from './pages/public/VerifyOtpPage';

// Authenticated Application Pages
import { YourSignalToday } from './pages/app/YourSignalToday';
import { OpportunitiesPage } from './pages/app/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/app/OpportunityDetailPage';
import { ProposalGeneratorPage } from './pages/app/ProposalGeneratorPage';
import { SavedOpportunitiesPage } from './pages/app/SavedOpportunitiesPage';
import { MarketPulsePage } from './pages/app/MarketPulsePage';
import { SignalsPage } from './pages/app/SignalsPage';
import { FreelanceDnaPage } from './pages/app/FreelanceDnaPage';
import { LeaderboardPage } from './pages/app/LeaderboardPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { AdminScraperHub } from './pages/app/AdminScraperHub';

// Initial Data
import {
  INITIAL_OPPORTUNITIES,
  DEFAULT_PROFILE,
  INITIAL_SIGNALS
} from './data/unstuckData';

export function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem('unstuck_auth_state');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Current Active Page
  const [activePage, setActivePage] = useState(() => {
    const isAuth = localStorage.getItem('unstuck_auth_state') === 'true';
    return isAuth ? 'signal-today' : 'landing';
  });

  // Page Navigation History Stack
  const [pageHistory, setPageHistory] = useState([]);

  const handleNavigate = (page) => {
    if (page === activePage) return;
    setPageHistory(prev => [...prev, activePage]);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (pageHistory.length > 0) {
      const prevPage = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setActivePage(prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const defaultHome = isAuthenticated ? 'signal-today' : 'landing';
      setActivePage(defaultHome);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canGoBack = pageHistory.length > 0 || (activePage !== (isAuthenticated ? 'signal-today' : 'landing'));

  // Onboarding temporary transit state
  const [onboardingInitialData, setOnboardingInitialData] = useState(null);

  // Pending Auth State for OTP verification
  const [pendingAuthUser, setPendingAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem('unstuck_pending_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // User Freelance DNA Profile
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('unstuck_user_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Saved Opportunities IDs
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('unstuck_saved_ids');
      return saved ? JSON.parse(saved) : [1, 4];
    } catch {
      return [1, 4];
    }
  });

  // Signals Feed
  const [signals, setSignals] = useState(() => {
    try {
      const saved = localStorage.getItem('unstuck_signals');
      return saved ? JSON.parse(saved) : INITIAL_SIGNALS;
    } catch {
      return INITIAL_SIGNALS;
    }
  });

  // Selected Opportunity (for Detail & Proposal Generator)
  const [selectedOpportunity, setSelectedOpportunity] = useState(INITIAL_OPPORTUNITIES[0]);

  // Global UI States
  const [toastMessage, setToastMessage] = useState('');
  const [liveSimulationAlert, setLiveSimulationAlert] = useState(null);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Save profile to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('unstuck_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }, [userProfile]);

  // Save savedIds to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('unstuck_saved_ids', JSON.stringify(savedIds));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  }, [savedIds]);

  // Save signals to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('unstuck_signals', JSON.stringify(signals));
    } catch (e) {
      console.error('Failed to save signals', e);
    }
  }, [signals]);

  // Save auth state
  useEffect(() => {
    try {
      localStorage.setItem('unstuck_auth_state', isAuthenticated ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  }, [isAuthenticated]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Toggle Save / Unsave
  const toggleSave = (id) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(x => x !== id));
      showToast('Removed from your saved universe');
    } else {
      setSavedIds([...savedIds, id]);
      showToast('Saved to your opportunity orbit! ★');
    }
  };

  // Compute dynamic match score based on current user skills
  const computeJobMatch = (jobSkills) => {
    if (!jobSkills || jobSkills.length === 0) return 75;
    const userSkillsUpper = (userProfile.skills || []).map(s => s.toLowerCase());
    let matchCount = 0;
    jobSkills.forEach(s => {
      if (userSkillsUpper.includes(s.toLowerCase())) matchCount++;
    });
    const percentage = Math.round((matchCount / jobSkills.length) * 100);
    return Math.max(35, Math.min(98, percentage === 0 ? 40 : percentage));
  };

  // Fetch live opportunities from Scraper + DB API
  const [liveOpportunities, setLiveOpportunities] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    async function fetchLiveJobs() {
      setIsLoadingJobs(true);
      try {
        const skills = userProfile?.skills || ['React', 'Python', 'FastAPI', 'JavaScript'];
        const res = await fetch('http://localhost:8000/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_skills: skills, limit: 100 })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.jobs && data.jobs.length > 0) {
            const mapped = data.jobs.map((item, idx) => {
              const reqs = Array.isArray(item.requirements) ? item.requirements : [];
              const textCorpus = ((item.title || '') + ' ' + (item.brief || '') + ' ' + reqs.join(' ')).toLowerCase();
              let category = 'Software & Web Dev';
              if (textCorpus.includes('design') || textCorpus.includes('ui') || textCorpus.includes('ux') || textCorpus.includes('figma') || textCorpus.includes('شعار') || textCorpus.includes('تصميم')) {
                category = 'Design & UI/UX';
              } else if (textCorpus.includes('ai') || textCorpus.includes('machine learning') || textCorpus.includes('scraper') || textCorpus.includes('scraping') || textCorpus.includes('n8n') || textCorpus.includes('automation') || textCorpus.includes('bot') || textCorpus.includes('ذكاء')) {
                category = 'AI & Automation';
              } else if (textCorpus.includes('data') || textCorpus.includes('admin') || textCorpus.includes('excel') || textCorpus.includes('إدخال') || textCorpus.includes('بيانات')) {
                category = 'Data & Admin';
              } else if (textCorpus.includes('writing') || textCorpus.includes('translation') || textCorpus.includes('ترجمة') || textCorpus.includes('كتابة') || textCorpus.includes('محتوى') || textCorpus.includes('content') || textCorpus.includes('article')) {
                category = 'Writing & Translation';
              } else if (textCorpus.includes('marketing') || textCorpus.includes('seo') || textCorpus.includes('تسويق') || textCorpus.includes('ads') || textCorpus.includes('sales')) {
                category = 'Marketing & Sales';
              } else if (textCorpus.includes('video') || textCorpus.includes('audio') || textCorpus.includes('صوت') || textCorpus.includes('فيديو') || textCorpus.includes('مونتاج')) {
                category = 'Creative & Media';
              } else if (textCorpus.includes('mobile') || textCorpus.includes('flutter') || textCorpus.includes('ios') || textCorpus.includes('android') || textCorpus.includes('تطبيق')) {
                category = 'Mobile Apps';
              }

              let budgetMin = 50, budgetMax = 200;
              const priceMatches = (item.price || '').match(/\d[\d,]*/g);
              if (priceMatches && priceMatches.length >= 2) {
                budgetMin = parseInt(priceMatches[0].replace(/,/g, ''), 10) || 50;
                budgetMax = parseInt(priceMatches[1].replace(/,/g, ''), 10) || 200;
              } else if (priceMatches && priceMatches.length === 1) {
                budgetMin = parseInt(priceMatches[0].replace(/,/g, ''), 10) || 50;
                budgetMax = budgetMin;
              }

              let pKey = item.platform_key;
              if (!pKey) {
                const pStr = (item.platform || '').toLowerCase();
                if (pStr.includes('مستقل') || pStr.includes('mostaql')) pKey = 'mostaql';
                else if (pStr.includes('خمسات') || pStr.includes('khamsat')) pKey = 'khamsat';
                else if (pStr.includes('نفذلي') || pStr.includes('nafezly')) pKey = 'nafezly';
                else if (pStr.includes('freelancer')) pKey = 'freelancer';
                else pKey = 'mostaql';
              }

              let pName = item.platform;
              if (!pName || pName === 'Freelance Platform') {
                if (pKey === 'mostaql') pName = 'مستقل';
                else if (pKey === 'khamsat') pName = 'خمسات';
                else if (pKey === 'nafezly') pName = 'نفذلي';
                else if (pKey === 'freelancer') pName = 'Freelancer';
              }

              return {
                id: item.id || (idx + 100),
                title: item.title,
                budget: item.price || '$50 - $150',
                budgetMin: budgetMin,
                budgetMax: budgetMax,
                duration: item.duration || 'أسبوع',
                platform: pName,
                platformKey: pKey,
                category: category,
                link: item.url,
                description: item.brief || item.title,
                publish_date: item.published_at || new Date().toISOString(),
                publish_date_relative: item.published_at || 'Just now',
                clientQuality: '9.0 / 10',
                clientCountry: 'Global',
                clientRating: '5.0',
                competition: 'MEDIUM',
                winProbability: `${item.match_score || 85}%`,
                recommendation: (item.match_score || 80) >= 80 ? 'HIGHLY RECOMMENDED' : 'POTENTIAL MATCH',
                skills: reqs.length > 0 ? reqs : ['Web Development'],
                match: item.match_score || 80,
                proposal: '',
                whyMatches: {
                  headline: 'Smart AI Skills Match',
                  reasons: item.reasons || ['Matched with your profile skills'],
                  matchingSkills: item.matched_skills || [],
                  missingSkills: item.missing_skills || []
                }
              };
            });
            setLiveOpportunities(mapped);
          }
        }
      } catch (err) {
        console.warn('Backend API not reachable, falling back to static opportunities:', err);
      } finally {
        setIsLoadingJobs(false);
      }
    }

    fetchLiveJobs();
  }, [userProfile.skills]);

  // Enhanced opportunities with dynamic match scores
  const opportunities = useMemo(() => {
    if (liveOpportunities.length > 0) {
      return liveOpportunities;
    }
    return INITIAL_OPPORTUNITIES.map(job => {
      const dynamicMatch = computeJobMatch(job.skills);
      return {
        ...job,
        match: dynamicMatch
      };
    });
  }, [liveOpportunities, userProfile.skills]);

  // Authenticate & Route to Your Signal Today
  const handleLoginSuccess = (loginInfo) => {
    setIsAuthenticated(true);
    if (loginInfo?.user) {
      setUserProfile(prev => ({
        ...prev,
        name: loginInfo.user.full_name || prev.name,
        email: loginInfo.user.email || prev.email
      }));
    }
    setActivePage('signal-today');
    const welcomeMsg = loginInfo?.notificationMessage || `أهلاً بك مجدداً ${loginInfo?.user?.full_name || userProfile.name}! تم فحص المشاريع ومطابقتها وإرسالها لبريدك 📧`;
    showToast(welcomeMsg);
  };

  const handleStartVerification = (pendingInfo) => {
    setPendingAuthUser(pendingInfo);
    try {
      localStorage.setItem('unstuck_pending_auth', JSON.stringify(pendingInfo));
    } catch (e) {
      console.warn('Could not store pending auth in localStorage', e);
    }
    setActivePage('verify-otp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerificationSuccess = (verifiedData) => {
    setIsAuthenticated(true);
    setUserProfile(prev => ({
      ...prev,
      name: verifiedData.name || prev.name,
      email: verifiedData.email || prev.email
    }));
    try {
      localStorage.removeItem('unstuck_pending_auth');
    } catch {}
    setActivePage('signal-today');
    showToast(`Email verified! Welcome aboard, ${verifiedData.name}!`);
  };

  const handleStartOnboarding = (initialInfo) => {
    setOnboardingInitialData(initialInfo);
    setActivePage('onboarding');
  };

  const handleCompleteOnboarding = (completedDna) => {
    setUserProfile(completedDna);
    setIsAuthenticated(true);
    setActivePage('signal-today');
    showToast('Freelance DNA calibrated! Your Signal is ready.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('landing');
    showToast('Logged out of active radar session.');
  };

  const handleResetData = () => {
    setUserProfile(DEFAULT_PROFILE);
    setSavedIds([1, 4]);
    setSignals(INITIAL_SIGNALS);
    showToast('Reset to default graduation project demo state!');
  };

  // Navigate to Opportunity Detail
  const handleSelectOpportunity = (job) => {
    setSelectedOpportunity(job);
    handleNavigate('opportunity-detail');
  };

  const handleSelectOpportunityById = (id) => {
    const found = opportunities.find(j => String(j.id) === String(id));
    if (found) {
      handleSelectOpportunity(found);
    } else if (opportunities.length > 0) {
      handleSelectOpportunity(opportunities[0]);
    }
  };

  // Navigate to Proposal Generator
  const handleGenerateProposal = (job) => {
    if (job) setSelectedOpportunity(job);
    handleNavigate('proposal-generator');
  };

  // Simulate Incoming Live Notification
  const triggerTestNotification = () => {
    const job = opportunities[0];
    setLiveSimulationAlert(job);
    showToast('🔔 Live notification simulated! (Scrapers & Browser)');

    // Add to signals
    const newSignal = {
      id: Date.now(),
      type: 'high_match',
      title: '⚡ High-Gravity Signal Dispatched',
      jobTitle: `${job.title} (${job.platform})`,
      platform: job.platform,
      matchScore: job.match,
      timestamp: 'Just now',
      read: false,
      opportunityId: job.id
    };
    setSignals(prev => [newSignal, ...prev]);

    setTimeout(() => {
      setLiveSimulationAlert(null);
    }, 9000);
  };

  // Count unread signals
  const unreadSignalsCount = signals.filter(s => !s.read).length;

  return (
    <div className={`app-container ${userProfile.motionPreference === 'static' ? 'reduced-motion-mode' : ''}`}>
      {/* Universal Header */}
      <Header
        isAuthenticated={isAuthenticated}
        activePage={activePage}
        onNavigate={handleNavigate}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        userProfile={userProfile}
        savedCount={savedIds.length}
        unreadSignalsCount={unreadSignalsCount}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onOpenConceptModal={() => setIsConceptModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Floating Incoming Simulation Alert Banner */}
      <LiveAlertBanner
        alert={liveSimulationAlert}
        onClose={() => setLiveSimulationAlert(null)}
        onSelectOpportunity={(job) => {
          setLiveSimulationAlert(null);
          handleGenerateProposal(job);
        }}
      />

      {/* Main Page Routing */}
      <main className="main-viewport-content">
        {/* PUBLIC ROUTES */}
        {!isAuthenticated && activePage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenConceptModal={() => setIsConceptModalOpen(true)}
            opportunities={opportunities}
          />
        )}

        {!isAuthenticated && activePage === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onStartVerification={handleStartVerification}
            onNavigate={handleNavigate}
          />
        )}

        {!isAuthenticated && activePage === 'signup' && (
          <SignUpPage
            onStartVerification={handleStartVerification}
            onNavigate={handleNavigate}
          />
        )}

        {!isAuthenticated && activePage === 'verify-otp' && (
          <VerifyOtpPage
            email={pendingAuthUser?.email || ''}
            fullName={pendingAuthUser?.fullName || ''}
            devOtp={pendingAuthUser?.devOtp || ''}
            onVerificationSuccess={handleVerificationSuccess}
            onBackToSignUp={() => handleNavigate('signup')}
            onNavigate={handleNavigate}
          />
        )}

        {!isAuthenticated && activePage === 'onboarding' && (
          <OnboardingPage
            initialData={onboardingInitialData}
            onCompleteOnboarding={handleCompleteOnboarding}
            onNavigate={handleNavigate}
          />
        )}

        {/* AUTHENTICATED ROUTES */}
        {isAuthenticated && activePage === 'signal-today' && (
          <YourSignalToday
            opportunities={opportunities}
            userProfile={userProfile}
            savedIds={savedIds}
            toggleSave={toggleSave}
            onSelectOpportunity={handleSelectOpportunity}
            onGenerateProposal={handleGenerateProposal}
            onNavigate={handleNavigate}
            onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
          />
        )}

        {isAuthenticated && activePage === 'opportunities' && (
          <OpportunitiesPage
            opportunities={opportunities}
            savedIds={savedIds}
            toggleSave={toggleSave}
            onSelectOpportunity={handleSelectOpportunity}
            onGenerateProposal={handleGenerateProposal}
            userProfile={userProfile}
          />
        )}

        {isAuthenticated && activePage === 'opportunity-detail' && (
          <OpportunityDetailPage
            opportunity={selectedOpportunity}
            userProfile={userProfile}
            savedIds={savedIds}
            toggleSave={toggleSave}
            onGenerateProposal={handleGenerateProposal}
            onBack={handleGoBack}
          />
        )}

        {isAuthenticated && activePage === 'proposal-generator' && (
          <ProposalGeneratorPage
            opportunity={selectedOpportunity}
            userProfile={userProfile}
            onBack={handleGoBack}
            onCopySuccess={() => showToast('Proposal copied to clipboard!')}
          />
        )}

        {isAuthenticated && activePage === 'saved' && (
          <SavedOpportunitiesPage
            opportunities={opportunities}
            savedIds={savedIds}
            toggleSave={toggleSave}
            onSelectOpportunity={handleSelectOpportunity}
            onGenerateProposal={handleGenerateProposal}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'market-pulse' && (
          <MarketPulsePage
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onBack={handleGoBack}
            isAuthenticated={isAuthenticated}
          />
        )}

        {activePage === 'signals' && (
          <SignalsPage
            signals={signals}
            onSelectOpportunityById={handleSelectOpportunityById}
            onSimulateIncomingSignal={triggerTestNotification}
            onNavigate={handleNavigate}
          />
        )}

        {isAuthenticated && activePage === 'freelance-dna' && (
          <FreelanceDnaPage
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
            onToast={showToast}
            onNavigate={handleNavigate}
          />
        )}

        {isAuthenticated && activePage === 'leaderboard' && (
          <LeaderboardPage
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {isAuthenticated && activePage === 'settings' && (
          <SettingsPage
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
            onLogout={handleLogout}
            onResetData={handleResetData}
            onNavigate={handleNavigate}
            onToast={showToast}
          />
        )}

        {isAuthenticated && activePage === 'admin-hub' && (
          <AdminScraperHub
            onSimulateNotification={triggerTestNotification}
            onBack={handleGoBack}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ConceptModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        onStartDoing={() => {
          setIsConceptModalOpen(false);
          handleNavigate(isAuthenticated ? 'signal-today' : 'signup');
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        signals={signals}
        onSelectOpportunityById={handleSelectOpportunityById}
        onSimulateIncomingSignal={triggerTestNotification}
        onNavigateToSignals={() => handleNavigate('signals')}
      />

      {/* Floating Global Toast */}
      {toastMessage && (
        <div className="floating-toast-alert">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export default App;
