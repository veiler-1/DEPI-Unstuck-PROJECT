import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function OpportunitiesPage({
  opportunities = [],
  savedIds = [],
  toggleSave,
  onSelectOpportunity,
  onGenerateProposal,
  userProfile
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [sortBy, setSortBy] = useState('match');

  const categoryScrollRef = useRef(null);

  // Dynamically extract all available categories across opportunities
  const availableCategories = useMemo(() => {
    const set = new Set();
    opportunities.forEach((job) => {
      if (job.category && typeof job.category === 'string') {
        set.add(job.category.trim());
      }
    });

    // Ensure core freelance disciplines are represented even if dataset is currently small
    const standardCategories = [
      'Software & Web Dev',
      'AI & Automation',
      'Design & UI/UX',
      'Data & Admin',
      'Writing & Translation',
      'Marketing & Sales',
      'Creative & Media',
      'Mobile Apps'
    ];
    standardCategories.forEach((cat) => set.add(cat));

    return ['all', ...Array.from(set)];
  }, [opportunities]);

  // Extract all unique skills across opportunities for the compact filter
  const allSkills = useMemo(() => {
    const set = new Set();
    opportunities.forEach((job) => {
      (job.skills || []).forEach((s) => set.add(s));
    });
    return Array.from(set).slice(0, 15);
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          (item.skills || []).some((s) => s.toLowerCase().includes(query)) ||
          item.platform?.toLowerCase().includes(query);

        const matchesPlatform =
          selectedPlatform === 'all' || item.platformKey === selectedPlatform;

        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;

        const matchesSkill =
          selectedSkill === 'all' || (item.skills || []).includes(selectedSkill);

        let matchesBudget = true;
        if (selectedBudget === 'under100') {
          matchesBudget = (item.budgetMin || 0) < 100;
        } else if (selectedBudget === '100to500') {
          matchesBudget = (item.budgetMin || 0) >= 100 && (item.budgetMax || 0) <= 500;
        } else if (selectedBudget === 'over500') {
          matchesBudget = (item.budgetMax || 0) > 500;
        }

        return matchesSearch && matchesPlatform && matchesCategory && matchesSkill && matchesBudget;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return (b.match || 0) - (a.match || 0);
        if (sortBy === 'budget') return (b.budgetMax || 0) - (a.budgetMax || 0);
        return b.id - a.id;
      });
  }, [opportunities, searchQuery, selectedPlatform, selectedCategory, selectedSkill, selectedBudget, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setSelectedBudget('all');
    setSelectedSkill('all');
    setSortBy('match');
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="opportunities-clean-page">
      {/* 1. Page Header */}
      <div className="clean-page-header">
        <h1 className="clean-page-title">Opportunities</h1>
        <p className="clean-page-subtitle">
          Search and compare verified projects aggregated from Khamsat, Mostaql, Nafezly, and Freelancer.
        </p>
      </div>

      {/* 2. Top Search Bar */}
      <div className="opp-search-bar-clean">
        <label htmlFor="opp-search-input" className="sr-only">Search Opportunities</label>
        <Search size={18} className="opp-search-icon" />
        <input
          id="opp-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder=""
          className="opp-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="opp-clear-search-btn"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* 3. Horizontally Scrollable Categories Selector */}
      <div className="opp-category-scroll-section">
        <div className="opp-category-scroll-header">
          <label className="filter-mini-label">Opportunity Categories</label>
          <div className="opp-category-scroll-nav-btns">
            <button
              type="button"
              className="btn-scroll-arrow"
              onClick={() => scrollCategories('left')}
              aria-label="Scroll categories left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn-scroll-arrow"
              onClick={() => scrollCategories('right')}
              aria-label="Scroll categories right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="opp-category-scroll-container" ref={categoryScrollRef}>
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'all'
              ? opportunities.length
              : opportunities.filter((j) => j.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`opp-category-pill-btn ${isSelected ? 'active' : ''}`}
              >
                <span>{cat === 'all' ? 'All Categories' : cat}</span>
                <span className="opp-category-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Compact Secondary Filter Bar */}
      <div className="opp-compact-filter-bar">
        {/* Platform Filter */}
        <div className="filter-select-group">
          <label className="filter-mini-label" htmlFor="filter-platform">Platform</label>
          <select
            id="filter-platform"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Platforms</option>
            <option value="khamsat">Khamsat</option>
            <option value="mostaql">Mostaql</option>
            <option value="nafezly">Nafezly</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>

        {/* Skills Filter */}
        <div className="filter-select-group">
          <label className="filter-mini-label" htmlFor="filter-skill">Skills</label>
          <select
            id="filter-skill"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Skills</option>
            {allSkills.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {/* Budget Filter */}
        <div className="filter-select-group">
          <label className="filter-mini-label" htmlFor="filter-budget">Budget</label>
          <select
            id="filter-budget"
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="filter-select"
          >
            <option value="all">Any Budget</option>
            <option value="under100">Under $100</option>
            <option value="100to500">$100 – $500</option>
            <option value="over500">$500+</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="filter-select-group">
          <label className="filter-mini-label" htmlFor="filter-sort">Sort</label>
          <select
            id="filter-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="match">Highest Match</option>
            <option value="budget">Highest Budget</option>
            <option value="newest">Recently Posted</option>
          </select>
        </div>

        {/* Reset button if filtered */}
        {(selectedPlatform !== 'all' || selectedCategory !== 'all' || selectedSkill !== 'all' || selectedBudget !== 'all' || searchQuery) && (
          <button
            type="button"
            className="btn-filter-reset"
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 5. Results Header */}
      <div className="opp-results-summary-row">
        <span className="results-count-text">
          Showing <b>{filteredOpportunities.length}</b> verified opportunities
          {selectedCategory !== 'all' && <span> in <em>{selectedCategory}</em></span>}
        </span>
      </div>

      {/* 6. Opportunity Results Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="clean-empty-state-card">
          <p className="empty-title">No opportunities found matching your filters.</p>
          <p className="empty-desc">Try selecting a different category or clearing your filters.</p>
          <button
            type="button"
            className="btn-secondary-white"
            onClick={handleResetFilters}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="clean-opportunities-grid">
          {filteredOpportunities.map((job) => {
            const isSaved = savedIds.includes(job.id);
            return (
              <div key={job.id} className="clean-job-card">
                <div className="clean-card-header">
                  <div className="clean-card-platform-row">
                    <span className={`platform-source-badge ${job.platformKey}`}>
                      {job.platform}
                    </span>
                    <span className="clean-match-score-pill">
                      {job.match}% Match
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`btn-mini-save ${isSaved ? 'saved' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(job.id);
                    }}
                    title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                  >
                    <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <h3
                  className="clean-job-title"
                  onClick={() => onSelectOpportunity(job)}
                  title={job.title}
                >
                  {job.title}
                </h3>

                <p className="clean-job-description">
                  {job.description}
                </p>

                <div className="clean-job-skills-row">
                  {job.skills?.slice(0, 3).map((s) => (
                    <span key={s} className="clean-skill-tag">
                      {s}
                    </span>
                  ))}
                  {job.skills?.length > 3 && (
                    <span className="clean-skill-more">+{job.skills.length - 3}</span>
                  )}
                </div>

                <div className="clean-card-footer">
                  <div className="clean-job-budget">
                    <span className="budget-amount">{job.budget}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-card-action-text"
                      onClick={() => onSelectOpportunity(job)}
                    >
                      <span>Details</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn-mini-proposal-pill"
                      onClick={() => onGenerateProposal(job)}
                      title="Generate AI Proposal for this project"
                    >
                      <span>Pitch</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OpportunitiesPage;
