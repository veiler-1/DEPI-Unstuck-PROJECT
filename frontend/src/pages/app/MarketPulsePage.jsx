import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Layers,
  DollarSign,
  Cpu,
  BarChart2,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { MARKET_PULSE_DATA } from '../../data/unstuckData';

export function MarketPulsePage({ userProfile, onNavigate, onBack, isAuthenticated }) {
  const data = MARKET_PULSE_DATA || {};
  const [liveTotals, setLiveTotals] = useState({ total: 95, active: 85 });

  useEffect(() => {
    async function fetchPlatformTotals() {
      try {
        const res = await fetch('http://localhost:8000/api/status');
        if (res.ok) {
          const json = await res.json();
          if (json.platforms) {
            let sum = 0;
            Object.values(json.platforms).forEach(p => {
              sum += (p.count || 0);
            });
            if (sum > 0) {
              setLiveTotals({ total: sum, active: Math.round(sum * 0.9) });
            }
          }
        }
      } catch (e) {
        // Fallback to static
      }
    }
    fetchPlatformTotals();
  }, []);

  const summary = {
    totalScanned24h: liveTotals.total,
    activeOpportunities: liveTotals.active,
    avgWeeklyTimeSaved: '15.4 hrs',
    topGrowthSector: 'AI Workflows & Automation'
  };
  const mostRequested = data.mostRequestedSkills || [];
  const trending = data.trendingSkills || [];
  const budgetDist = data.budgetDistribution || [];
  const platformShare = data.platformShare || [];

  return (
    <div className="market-pulse-clean-page">
      {/* Top Breadcrumb if guest */}
      <div className="pulse-top-nav">
        <button
          type="button"
          className="btn-detail-back"
          onClick={() => {
            if (onBack) onBack();
            else if (onNavigate) onNavigate(isAuthenticated ? 'signal-today' : 'landing');
          }}
        >
          <ArrowLeft size={16} />
          <span>{isAuthenticated ? 'Back' : 'Back to Home'}</span>
        </button>
      </div>

      {/* 1. Page Header */}
      <div className="clean-page-header">
        <div className="section-eyebrow-tag">
          <TrendingUp size={13} />
          <span>REAL-TIME AGGREGATION</span>
        </div>
        <h1 className="clean-page-title">Market Pulse</h1>
        <p className="clean-page-subtitle">
          Continuous demand signals and live bidding trends analyzed from 800+ projects across Khamsat, Mostaql, Nafezly, and Freelancer.
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div className="pulse-kpi-banner-grid">
        <div className="pulse-kpi-card">
          <span className="kpi-label">Projects Scanned (24h)</span>
          <span className="kpi-number">{summary.totalScanned24h}</span>
          <span className="kpi-sub">Continuous crawlers active</span>
        </div>
        <div className="pulse-kpi-card">
          <span className="kpi-label">Active Open Matches</span>
          <span className="kpi-number cerulean">{summary.activeOpportunities}</span>
          <span className="kpi-sub">Verified client postings</span>
        </div>
        <div className="pulse-kpi-card">
          <span className="kpi-label">Weekly Time Saved</span>
          <span className="kpi-number green">{summary.avgWeeklyTimeSaved}</span>
          <span className="kpi-sub">Versus manual tab-hopping</span>
        </div>
        <div className="pulse-kpi-card">
          <span className="kpi-label">Fastest Growing Sector</span>
          <span className="kpi-number-text">{summary.topGrowthSector}</span>
          <span className="kpi-sub">+45% client budget expansion</span>
        </div>
      </div>

      {/* 2. Insights Grid */}
      <div className="market-pulse-insights-grid">
        {/* Card 1: Trending Skills (Surging weekly demand) */}
        <div className="pulse-card">
          <div className="pulse-card-header">
            <div className="pulse-icon-box cerulean">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="pulse-card-heading">Trending Capabilities</h2>
              <span className="pulse-card-question">What skills have surging weekly demand?</span>
            </div>
          </div>

          <div className="trending-skills-list">
            {trending.map((item, index) => (
              <div key={item.name || index} className="trending-skill-row">
                <div className="skill-rank-badge">0{index + 1}</div>
                <div className="skill-info-block">
                  <div className="skill-name-row">
                    <span className="skill-name-text">{item.name}</span>
                    <span className="skill-growth-pill">{item.surge}</span>
                  </div>
                  <p className="skill-reason-text">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Most Requested Stack & Budgets */}
        <div className="pulse-card">
          <div className="pulse-card-header">
            <div className="pulse-icon-box red">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="pulse-card-heading">Top Market Overlap</h2>
              <span className="pulse-card-question">Most requested technical skills across platforms</span>
            </div>
          </div>

          <div className="active-categories-list">
            {mostRequested.map((item) => (
              <div key={item.skill} className="category-metric-card">
                <div className="category-metric-top">
                  <span className="category-name">{item.skill}</span>
                  <span className="category-budget-tag">{item.count} Listings ({item.growth})</span>
                </div>
                <div className="category-bar-row">
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${item.percent || 70}%` }}
                    />
                  </div>
                  <span className="category-share-pct">{item.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Distribution Across Marketplaces */}
      <div className="pulse-card" style={{ marginBottom: '24px' }}>
        <div className="pulse-card-header">
          <div className="pulse-icon-box yellow">
            <DollarSign size={18} />
          </div>
          <div>
            <h2 className="pulse-card-heading">Budget Range Distribution</h2>
            <span className="pulse-card-question">Average project rates by platform tier</span>
          </div>
        </div>

        <div className="budget-dist-grid">
          {budgetDist.map((tier) => (
            <div key={tier.range} className="budget-tier-box">
              <div className="budget-tier-header">
                <span className="budget-tier-range">{tier.range}</span>
                <span className="budget-tier-share">{tier.share} Volume</span>
              </div>
              <span className="budget-tier-platform">{tier.platform}</span>
              <p className="budget-tier-note">{tier.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insight Card 3: Actionable Market Insight */}
      <div className="pulse-actionable-insight-banner">
        <div className="insight-badge-pill">
          <Sparkles size={14} />
          <span>TACTICAL RECOMMENDATION</span>
        </div>
        <h3 className="insight-banner-title">
          High demand for API Integrations & n8n Workflows
        </h3>
        <p className="insight-banner-desc">
          Clients on Nafezly and Mostaql are actively paying 30% higher budgets for automated Python/n8n pipelines compared to standard scripts. Adding these to your Freelance DNA increases your match score across 14 new listings.
        </p>
        <button
          type="button"
          className="btn-primary-universe btn-insight-action"
          onClick={() => {
            if (onNavigate) onNavigate(isAuthenticated ? 'freelance-dna' : 'signup');
          }}
        >
          <span>{isAuthenticated ? 'Update Freelance DNA' : 'Get Started'}</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default MarketPulsePage;
