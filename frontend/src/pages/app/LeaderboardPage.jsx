import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  User,
  Briefcase,
  CheckCircle2,
  Filter,
  ArrowRight,
  Flame,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export function LeaderboardPage({ userProfile, onNavigate, onToast }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [userRankInfo, setUserRankInfo] = useState({
    rank: 1,
    total_users: 45,
    total_score: 985,
    skills_score: 165,
    applied_score: 820,
    badge: '🏆 Elite Master',
    percentile: 95
  });

  // Fetch live leaderboard from FastAPI / Supabase
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const email = userProfile?.email || 'ahmed.fathy.dev@gmail.com';
      const [lbRes, rankRes] = await Promise.all([
        fetch('http://localhost:8000/api/leaderboard?limit=50'),
        fetch(`http://localhost:8000/api/user/rank?email=${encodeURIComponent(email)}`)
      ]);

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        if (lbData?.leaderboard?.length > 0) {
          setLeaderboard(lbData.leaderboard);
        }
      }

      if (rankRes.ok) {
        const rankData = await rankRes.json();
        if (rankData?.rank_info) {
          setUserRankInfo(rankData.rank_info);
        }
      }
    } catch (err) {
      console.warn('Backend leaderboard offline, using dynamic fallback:', err);
      // Fallback seed
      setLeaderboard([
        {
          rank: 1,
          email: userProfile?.email || 'ahmed.fathy.dev@gmail.com',
          full_name: `${userProfile?.name || 'أحمد فتحي'} (You)`,
          title: userProfile?.title || 'Full-Stack & AI Automation Specialist',
          skills: userProfile?.skills || ['React', 'FastAPI', 'Python', 'n8n', 'Docker', 'Supabase'],
          applied_jobs_count: 8,
          proposals_count: 14,
          total_score: 985,
          badge: '🏆 Elite Master'
        },
        {
          rank: 2,
          email: 'sarah.uiux@unstuck.app',
          full_name: 'سارة الشريف',
          title: 'Senior Product & UI/UX Designer',
          skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'],
          applied_jobs_count: 6,
          proposals_count: 9,
          total_score: 685,
          badge: '🏆 Elite Master'
        },
        {
          rank: 3,
          email: 'kareem.cloud@unstuck.app',
          full_name: 'كريم عبد العزيز',
          title: 'DevOps & Cloud Automation Engineer',
          skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
          applied_jobs_count: 4,
          proposals_count: 7,
          total_score: 530,
          badge: '⚡ Senior Pro'
        },
        {
          rank: 4,
          email: 'layla.nlp@unstuck.app',
          full_name: 'ليلى محمود',
          title: 'AI & NLP Data Specialist',
          skills: ['Python', 'FastAPI', 'Scraping', 'OpenAI'],
          applied_jobs_count: 3,
          proposals_count: 5,
          total_score: 410,
          badge: '⚡ Senior Pro'
        },
        {
          rank: 5,
          email: 'omar.flutter@unstuck.app',
          full_name: 'عمر طارق',
          title: 'Mobile Engineer (Flutter / Dart)',
          skills: ['Flutter', 'Dart', 'Firebase', 'REST APIs'],
          applied_jobs_count: 2,
          proposals_count: 4,
          total_score: 315,
          badge: '⚡ Senior Pro'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [userProfile]);

  // Filtered leaderboard
  const filteredUsers = leaderboard.filter((u) => {
    if (filterCategory === 'all') return true;
    const skillsText = (Array.isArray(u.skills) ? u.skills.join(' ') : String(u.skills || '')).toLowerCase();
    const titleText = (u.title || '').toLowerCase();
    const combined = skillsText + ' ' + titleText;

    if (filterCategory === 'dev') return combined.includes('react') || combined.includes('python') || combined.includes('code') || combined.includes('developer');
    if (filterCategory === 'design') return combined.includes('ui') || combined.includes('ux') || combined.includes('figma') || combined.includes('design');
    if (filterCategory === 'automation') return combined.includes('n8n') || combined.includes('automation') || combined.includes('ai') || combined.includes('scraper');
    return true;
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="dna-clean-page leaderboard-page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* 1. Page Header */}
      <div className="clean-page-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef2f2', color: '#be123c', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>
          <Trophy size={16} />
          <span>لوحة صدارة المستقلين والمبدعين • Application Leaderboard</span>
        </div>
        <h1 className="clean-page-title" style={{ fontSize: '28px', color: '#0f172a' }}>
          ترتيب المستقلين على مستوى التطبيق
        </h1>
        <p className="clean-page-subtitle" style={{ maxWidth: '640px', margin: '8px auto 0', color: '#64748b' }}>
          يتم احتساب الترتيب والنقاط تلقائياً في Supabase بناءً على المهارات المستخرجة من الـ CV وعدد طلبات التقديم ومقترحات المشاريع المنفذة.
        </p>
      </div>

      {/* 2. Current User Personal Rank Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(67, 56, 202, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>Rank</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#fef08a' }}>#{userRankInfo.rank || 1}</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                {userProfile?.name || 'أحمد فتحي'}
              </h2>
              <span style={{ background: '#fef08a', color: '#854d0e', padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '800' }}>
                {userRankInfo.badge || '🏆 Elite Master'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>
              {userProfile?.title || 'Full-Stack Web & AI Automation Specialist'}
            </p>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#c7d2fe' }}>
              🎯 أنت متقدم على <strong>{userRankInfo.percentile || 90}%</strong> من المستقلين المسجلين في التطبيق!
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>مجموع النقاط</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fde047' }}>{userRankInfo.total_score || 985}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>نقاط المهارات (CV)</div>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>+{userRankInfo.skills_score || 165}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 18px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>شغل ومقترحات متطبقة</div>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>+{userRankInfo.applied_score || 820}</div>
          </div>
        </div>
      </div>

      {/* 3. Top 3 Podium */}
      {top3.length >= 3 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {/* Rank 2 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥈</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>RANK #2</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>{top3[1]?.full_name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{top3[1]?.title}</div>
            <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: '800' }}>
              {top3[1]?.total_score} pts
            </span>
          </div>

          {/* Rank 1 (Gold) */}
          <div style={{
            background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)',
            borderRadius: '16px',
            padding: '24px 20px',
            border: '2px solid #f59e0b',
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.15)',
            transform: 'translateY(-6px)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '6px' }}>👑 🥇</div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '800' }}>TOP PERFORMER • #1</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>{top3[0]?.full_name}</div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>{top3[0]?.title}</div>
            <span style={{ background: '#f59e0b', color: '#ffffff', padding: '6px 16px', borderRadius: '999px', fontSize: '14px', fontWeight: '900' }}>
              {top3[0]?.total_score} pts • {top3[0]?.badge}
            </span>
          </div>

          {/* Rank 3 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥉</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>RANK #3</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>{top3[2]?.full_name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{top3[2]?.title}</div>
            <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: '800' }}>
              {top3[2]?.total_score} pts
            </span>
          </div>
        </div>
      )}

      {/* 4. Filter Tabs & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'الكل (All)' },
            { id: 'dev', label: 'برمجة وتطوير' },
            { id: 'automation', label: 'ذكاء وأتمتة (AI)' },
            { id: 'design', label: 'تصميم UI/UX' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: filterCategory === tab.id ? '1px solid #be123c' : '1px solid #e2e8f0',
                background: filterCategory === tab.id ? '#be123c' : '#ffffff',
                color: filterCategory === tab.id ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={fetchLeaderboardData}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>تحديث الترتيب اللحظي</span>
        </button>
      </div>

      {/* 5. Full Leaderboard Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
              <th style={{ padding: '14px 16px', textAlign: 'center', width: '70px' }}>الترتيب</th>
              <th style={{ padding: '14px 16px' }}>المستقل / التخصص</th>
              <th style={{ padding: '14px 16px' }}>المهارات المثبتة (CV)</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>الشغل المطبق</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>الرتبة</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>النقاط</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => {
              const isCurrentUser = user.email === (userProfile?.email || 'ahmed.fathy.dev@gmail.com');
              const skillsList = Array.isArray(user.skills) ? user.skills : [];
              return (
                <tr
                  key={user.email || idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: isCurrentUser ? '#fff1f2' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Rank */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {idx === 0 ? (
                      <span style={{ fontSize: '18px' }}>🥇</span>
                    ) : idx === 1 ? (
                      <span style={{ fontSize: '18px' }}>🥈</span>
                    ) : idx === 2 ? (
                      <span style={{ fontSize: '18px' }}>🥉</span>
                    ) : (
                      <span style={{ fontWeight: '700', color: '#64748b', fontSize: '14px' }}>#{idx + 1}</span>
                    )}
                  </td>

                  {/* Name & Title */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        {user.full_name}
                      </span>
                      {isCurrentUser && (
                        <span style={{ background: '#be123c', color: '#ffffff', fontSize: '10.5px', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                          أنت (You)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {user.title || 'Freelance Specialist'}
                    </div>
                  </td>

                  {/* Skills */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillsList.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {s}
                        </span>
                      ))}
                      {skillsList.length > 4 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>
                          +{skillsList.length - 4}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Applied Work */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                      {(user.applied_jobs_count || 0) + (user.proposals_count || 0)} عمل
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {user.applied_jobs_count || 0} تقديم • {user.proposals_count || 0} مقترح
                    </div>
                  </td>

                  {/* Badge */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: '#fef2f2',
                      color: '#991b1b',
                      border: '1px solid #fee2e2',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.badge || '🌱 Aspiring Talent'}
                    </span>
                  </td>

                  {/* Points */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#be123c' }}>
                      {user.total_score || 0}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>pts</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. How to Boost Rank Card */}
      <div style={{
        marginTop: '28px',
        background: '#f8fafc',
        borderRadius: '14px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>
            🚀 كيف ترفع ترتيبك في صدارة Unstuck؟
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            1. ارفع سيرتك الذاتية (CV) لاستخراج وتأكيد كافة مهاراتك (+25 نقطة لكل مهارة مطلوبة).<br />
            2. ولّد مقترحات ذكية وقدّم على الفرص المتطابقة مع رادارك (+50 نقطة لكل تقديم).
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('freelance-dna')}
          style={{
            background: '#be123c',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>تحديث الـ CV والمهارات الآن</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default LeaderboardPage;
