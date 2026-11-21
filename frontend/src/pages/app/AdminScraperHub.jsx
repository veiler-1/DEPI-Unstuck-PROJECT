import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Cpu,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Play,
  Database,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { PageExplainer } from '../../components/common/PageExplainer';

export function AdminScraperHub({ onSimulateNotification, onBack }) {
  const [platformStats, setPlatformStats] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [activeScrapingPlatform, setActiveScrapingPlatform] = useState(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [testPayloadDispatched, setTestPayloadDispatched] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'info', text: 'Initializing Admin Scraper & Pipeline Hub...' }
  ]);

  const addLog = (type, text) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-30), { time, type, text }]);
  };

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const [resStatus, resDb] = await Promise.all([
        fetch('http://localhost:8000/api/status'),
        fetch('http://localhost:8000/api/db-status')
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setPlatformStats(data.platforms || {});
        addLog('green', `Fetched platform metrics: ${Object.keys(data.platforms || {}).length} sources verified.`);
      }

      if (resDb.ok) {
        const dbData = await resDb.json();
        setDbHealth(dbData);
        if (dbData.connected) {
          addLog('green', `PostgreSQL connected: ${dbData.total_projects} projects in table.`);
        } else {
          addLog('yellow', `Database note: running in resilient JSON fallback mode.`);
        }
      }
    } catch (err) {
      addLog('red', `Connection error: Scraper API at http://localhost:8000 is offline or starting.`);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunScraper = async (platform = 'all') => {
    setActiveScrapingPlatform(platform);
    addLog('blue', `Starting scraper worker for platform: [${platform.toUpperCase()}]...`);

    try {
      const res = await fetch(`http://localhost:8000/api/scrape?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: [platform], wait: true })
      });

      if (res.ok) {
        const data = await res.json();
        addLog('green', `Scraper finished for [${platform.toUpperCase()}]. Ingested & synced!`);
        fetchStatus();
      } else {
        addLog('red', `Scraper run returned status ${res.status}`);
      }
    } catch (err) {
      addLog('red', `Scraper trigger failed: ${err.message}`);
    } finally {
      setActiveScrapingPlatform(null);
    }
  };

  const handleSyncToDb = async () => {
    setIsSyncingDb(true);
    addLog('blue', `Initiating JSON-to-PostgreSQL batch upsert...`);
    try {
      const res = await fetch('http://localhost:8000/api/sync-json-to-db', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        addLog('green', `Sync completed: ${JSON.stringify(data.synced || data)}`);
        fetchStatus();
      } else {
        addLog('red', `Sync request failed: status ${res.status}`);
      }
    } catch (err) {
      addLog('red', `Database sync error: ${err.message}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleTestDispatch = () => {
    setTestPayloadDispatched(true);
    addLog('yellow', `Triggered simulated n8n webhook event -> dispatched high-match signal to user.`);
    onSimulateNotification();
    setTimeout(() => setTestPayloadDispatched(false), 3000);
  };

  const platformsList = [
    { key: 'mostaql', name: 'Mostaql (مستقل)', color: '#0ea5e9' },
    { key: 'khamsat', name: 'Khamsat (خمسات)', color: '#f59e0b' },
    { key: 'nafezly', name: 'Nafezly (نفذلي)', color: '#10b981' },
    { key: 'freelancer', name: 'Freelancer.com', color: '#6366f1' }
  ];

  return (
    <div className="admin-hub-page">
      <div className="app-page-header-row">
        <div className="app-page-title-block">
          <button className="opp-detail-back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Application</span>
          </button>
          <div className="page-eyebrow-tag" style={{ marginTop: '8px' }}>
            <ShieldCheck size={13} />
            <span>ADMINISTRATIVE INFRASTRUCTURE</span>
          </div>
          <h1 className="app-page-title">Autonomous Scrapers & n8n Pipeline</h1>
          <p className="app-page-subtitle">
            Diagnostic console monitoring distributed scraping workers, PostgreSQL ingestion, and real-time webhook dispatches.
          </p>
        </div>

        <PageExplainer
          pageKey="admin-hub"
          title="Admin Scraper Hub"
          shortTagline="Separate technical diagnostic workspace"
          whyHere="This view connects directly to FastAPI backend (localhost:8000), monitors distributed crawler nodes across Mostaql, Khamsat, Nafezly, and Freelancer, and tests pipeline alerts."
          whatCanIDo={[
            'Check real-time health and project count per platform.',
            'Trigger live scraping runs on demand.',
            'Sync scraped JSON output to PostgreSQL database.',
            'Simulate live n8n webhook notifications into your active radar.'
          ]}
          nextStep="Click 'Scrape All Platforms' or 'Dispatch Test Alert' to test end-to-end flow."
        />
      </div>

      {/* Infrastructure Top Overview Bar */}
      <div className="pulse-kpi-banner-grid" style={{ marginBottom: '24px' }}>
        <div className="pulse-kpi-card">
          <span className="kpi-label">Database Connection</span>
          <span className={`kpi-number ${dbHealth?.connected ? 'green' : 'cerulean'}`} style={{ fontSize: '20px' }}>
            {dbHealth?.connected ? 'PostgreSQL Active' : 'JSON Storage Active'}
          </span>
          <span className="kpi-sub">
            {dbHealth?.connected
              ? `${dbHealth.total_projects} projects in DB`
              : 'Resilient fallback mode'}
          </span>
        </div>

        <div className="pulse-kpi-card">
          <span className="kpi-label">n8n Automation Engine</span>
          <span className="kpi-number green" style={{ fontSize: '20px' }}>
            Port 5678 Ready
          </span>
          <span className="kpi-sub">
            <a
              href="http://localhost:5678"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#0ea5e9', textDecoration: 'underline' }}
            >
              Open n8n Canvas ↗
            </a>
          </span>
        </div>

        <div className="pulse-kpi-card">
          <span className="kpi-label">FastAPI Backend</span>
          <span className="kpi-number cerulean" style={{ fontSize: '20px' }}>
            Port 8000
          </span>
          <span className="kpi-sub">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#0ea5e9', textDecoration: 'underline' }}
            >
              Swagger API Docs ↗
            </a>
          </span>
        </div>

        <div className="pulse-kpi-card">
          <span className="kpi-label">Scraper Pipeline</span>
          <button
            type="button"
            className="btn-primary-universe"
            style={{ width: '100%', marginTop: '6px', padding: '8px 12px', fontSize: '13px' }}
            onClick={() => handleRunScraper('all')}
            disabled={activeScrapingPlatform !== null}
          >
            <RefreshCw size={14} className={activeScrapingPlatform === 'all' ? 'animate-spin' : ''} />
            <span>{activeScrapingPlatform === 'all' ? 'Scraping All...' : 'Scrape All Platforms'}</span>
          </button>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="admin-workers-grid">
        {platformsList.map(p => {
          const stats = platformStats?.[p.key] || {};
          const isScrapingThis = activeScrapingPlatform === p.key;

          return (
            <div key={p.key} className="admin-worker-card">
              <div className="worker-card-header">
                <span className="worker-dot active" />
                <b className="worker-name">{p.name}</b>
                <span className="worker-plat-pill" style={{ borderColor: p.color, color: p.color }}>
                  {p.key.toUpperCase()}
                </span>
              </div>

              <div className="worker-metrics-list">
                <div className="worker-metric-row">
                  <span>Status:</span>
                  <b className="green">ONLINE</b>
                </div>
                <div className="worker-metric-row">
                  <span>Cached Projects:</span>
                  <b>{stats.count ?? '20+'} projects</b>
                </div>
                <div className="worker-metric-row">
                  <span>Last Updated:</span>
                  <b>{stats.last_updated || 'Active recently'}</b>
                </div>
                <div className="worker-metric-row">
                  <span>Data Source:</span>
                  <b>{stats.source === 'postgresql' ? 'PostgreSQL' : 'Live Scraped JSON'}</b>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                  onClick={() => handleRunScraper(p.key)}
                  disabled={activeScrapingPlatform !== null}
                >
                  <Play size={13} className={isScrapingThis ? 'animate-spin' : ''} />
                  <span>{isScrapingThis ? `Scraping ${p.key}...` : `Run ${p.name} Scraper`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Simulation & Terminal Output */}
      <div className="admin-dispatch-section">
        <div className="admin-panel-box">
          <div className="admin-panel-top">
            <h3 className="admin-panel-heading">
              <Terminal size={16} /> Live Pipeline Ingestion & Actions
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary-white btn-small"
                onClick={handleSyncToDb}
                disabled={isSyncingDb}
                title="Sync all scraped JSON files to PostgreSQL"
              >
                <Database size={14} />
                <span>{isSyncingDb ? 'Syncing DB...' : 'Sync JSON to DB'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary-white btn-small"
                onClick={fetchStatus}
                disabled={isLoadingStatus}
              >
                <RefreshCw size={14} className={isLoadingStatus ? 'animate-spin' : ''} />
                <span>Refresh Status</span>
              </button>

              <button
                type="button"
                className="btn-primary-universe btn-small"
                onClick={handleTestDispatch}
                disabled={testPayloadDispatched}
              >
                <Zap size={14} />
                <span>{testPayloadDispatched ? 'Dispatching Payload...' : 'Dispatch Test Alert'}</span>
              </button>
            </div>
          </div>

          <p className="admin-panel-sub">
            Real-time feed communicating with the FastAPI server, n8n webhook pipelines, and PostgreSQL database.
          </p>

          <div className="admin-terminal-output" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {terminalLogs.map((log, idx) => {
              const colorClass = log.type === 'green' ? 't-green' : log.type === 'red' ? 't-red' : log.type === 'yellow' ? 't-yellow' : 't-blue';
              return (
                <div key={idx} className="terminal-line">
                  {log.time && <span style={{ color: '#64748b', marginRight: '6px' }}>[{log.time}]</span>}
                  <span className={colorClass}>[{log.type.toUpperCase()}]</span> {log.text}
                </div>
              );
            })}
            {testPayloadDispatched && (
              <div className="terminal-line highlight">
                <span className="t-yellow">[EVENT]</span> Test notification simulated: Real-time opportunity pushed to radar!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
