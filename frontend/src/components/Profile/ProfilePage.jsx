import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ProfilePage.module.css';
import ThemeToggle from '../shared/ThemeToggle';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getConceptLevel } from '../../utils/levelUtils';

const LANGUAGES = ['Java', 'Python', 'JavaScript'];
const CONCEPTS  = ['Variables','Data Types','Operators','Conditional',
                   'Loops','Functions','Input & Output','Error Handling'];
const API_BASE  = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Language capability — based only on concepts the user actually attempted
// Advanced: needs 4+ mastered concepts AND avg success >= 80
// Intermediate: needs 2+ attempted AND avg success >= 50
function getLanguageCapability(language, progress = {}) {
  const langData  = progress[language] || {};
  const attempted = CONCEPTS.filter(c => langData[c] && (langData[c]?.tasksCompleted ?? 0) > 0);
  if (attempted.length === 0) return { label: 'Beginner', color: '#ef4444' };

  const mastered   = attempted.filter(c => (langData[c]?.successRate ?? 0) >= 80);
  const avgSuccess = attempted.reduce((sum, c) => sum + (langData[c]?.successRate ?? 0), 0) / attempted.length;

  if (mastered.length >= 4 && avgSuccess >= 80) return { label: 'Advanced',     color: '#22c55e' };
  if (attempted.length >= 2 && avgSuccess >= 50) return { label: 'Intermediate', color: '#facc15' };
  return { label: 'Beginner', color: '#ef4444' };
}

// Mastery progress — only counts concepts with actual submissions
function calcMasteryProgress(language, progress = {}) {
  const langData  = progress[language] || {};
  const attempted = CONCEPTS.filter(c => langData[c] && (langData[c]?.tasksCompleted ?? 0) > 0);
  if (attempted.length === 0) return { masteredConcepts: 0, totalConcepts: CONCEPTS.length, percentage: 0, avgSuccess: 0 };

  const avgSuccess       = attempted.reduce((sum, c) => sum + (langData[c]?.successRate ?? 0), 0) / attempted.length;
  const masteredConcepts = attempted.filter(c => (langData[c]?.successRate ?? 0) >= 80).length;

  return { masteredConcepts, totalConcepts: CONCEPTS.length, percentage: Math.round(avgSuccess), avgSuccess };
}

const ProfilePage = ({
  userData, onSave, isDarkMode, toggleTheme,
  onHomeClick, onLogout, progress: propProgress = {}
}) => {
  const [form, setForm]           = useState({ ...userData });
  const [showToast, setShowToast] = useState(false);
  const fileInputRef              = useRef(null);
  const [progress,    setProgress]        = useState(propProgress);
  const [chartData,   setChartData]       = useState([]);
  const [activeChartLangs, setActiveChartLangs] = useState([]);
  const [loadingData, setLoadingData]     = useState(false);
  const [selectedLang, setSelectedLang]   = useState('Java');
  const [showAnalysis, setShowAnalysis]   = useState(false);
  const [isAnalyzing,  setIsAnalyzing]    = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!userData?.id) return;
    try {
      const res  = await fetch(`${API_BASE}/api/progress/${userData.id}`);
      const data = await res.json();
      setProgress(data);
    } catch {}
  }, [userData?.id]);

  const fetchDailyProgress = useCallback(async () => {
    if (!userData?.id) return;
    try {
      const res  = await fetch(`${API_BASE}/api/daily-progress/${userData.id}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) { setChartData([]); setActiveChartLangs([]); return; }

      const byDate     = {};
      const langsInDB  = new Set();
      rows.forEach(r => {
        const label   = new Date(r.progress_date).toLocaleDateString('en-US', { month:'short', day:'numeric' });
        if (!byDate[label]) byDate[label] = { name: label };
        const langKey = r.language?.toLowerCase();
        byDate[label][langKey] = r.score ?? 0;
        if (r.language) langsInDB.add(r.language);
      });

      const sorted = Object.values(byDate)
        .sort((a, b) => new Date(a.name) - new Date(b.name))
        .slice(-7);

      setChartData(sorted);
      setActiveChartLangs([...langsInDB]);
    } catch { setChartData([]); setActiveChartLangs([]); }
  }, [userData?.id]);

  useEffect(() => {
    setLoadingData(true);
    fetchProgress().then(() => fetchDailyProgress()).finally(() => setLoadingData(false));
  }, [userData?.id]);

  useEffect(() => { if (Object.keys(propProgress).length > 0) setProgress(propProgress); }, [propProgress]);
  useEffect(() => { if (!showToast) return; const t = setTimeout(() => setShowToast(false), 3000); return () => clearTimeout(t); }, [showToast]);
  useEffect(() => { if (!showAnalysis) return; setIsAnalyzing(true); const t = setTimeout(() => setIsAnalyzing(false), 1800); return () => clearTimeout(t); }, [showAnalysis]);

  const langCapability = getLanguageCapability(selectedLang, progress);
  const langMastery    = calcMasteryProgress(selectedLang, progress);

  const overall = (() => {
    let totalMastered = 0, successSum = 0, langCount = 0;
    LANGUAGES.forEach(lang => {
      const m = calcMasteryProgress(lang, progress);
      totalMastered += m.masteredConcepts;
      if (m.avgSuccess > 0) { successSum += m.avgSuccess; langCount++; }
    });
    const avgSuccess = langCount > 0 ? Math.round(successSum / langCount) : 0;
    const rank       = avgSuccess > 80 ? 'Gold' : avgSuccess > 50 ? 'Silver' : 'Bronze';
    const langStats  = {};
    LANGUAGES.forEach(lang => { langStats[lang] = calcMasteryProgress(lang, progress); });
    let rec = '', actions = [];
    if (avgSuccess < 20)      { rec = '🚀 Start Your Journey!';  actions = ['Complete Variables first','Practice regularly']; }
    else if (avgSuccess < 50) { rec = '📈 Building Momentum!';   actions = ['Review incomplete concepts','Aim for 50% success rate']; }
    else if (avgSuccess < 80) { rec = '⭐ Almost There!';         actions = ['Push for higher success rates','Try harder problems']; }
    else                      { rec = '🎉 Coding Master!';        actions = ['Explore Advanced topics','Build real projects']; }
    const trend  = avgSuccess > 70 ? 'consistently rising' : avgSuccess > 40 ? 'showing improvement' : 'just beginning';
    const cons   = avgSuccess > 80 ? 'rock-solid consistency' : avgSuccess > 60 ? 'good consistency' : 'some ups and downs';
    const interp = `Your graph shows a ${trend} pattern with ${cons}. You're ${avgSuccess > 70 ? 'mastering concepts quickly' : avgSuccess > 40 ? 'building momentum' : 'gaining valuable experience'}!`;
    return { totalMastered, avgSuccess, rank, langStats, rec, actions, interp };
  })();

  const handleSubmit = async e => { e.preventDefault(); await onSave(form); setShowToast(true); };
  const handlePhotoChange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  // Only show concepts user has actually attempted (tasksCompleted > 0)
  const conceptRows = CONCEPTS.map(concept => {
    const stored         = progress?.[selectedLang]?.[concept];
    const tasksCompleted = stored?.tasksCompleted ?? 0;
    const success        = stored?.successRate ?? 0;
    const hasData        = !!stored && tasksCompleted > 0;
    const isMastered     = hasData && success >= 80;
    const masteryPct     = hasData ? Math.round(success) : 0;
    const lvl            = hasData
      ? getConceptLevel({ tasksCompleted: isMastered ? 3 : 1, totalTasks: 3, successRate: success })
      : { label: 'Not Started', color: '#64748b' };
    return { concept, success, masteryPct, isMastered, hasData, lvl };
  });

  const tickFormatter = v => `${Math.round(v)}%`;
  const langColors    = { Java: '#FF6700', Python: '#4B8BBE', JavaScript: '#F7DF1E' };

  return (
    <div className={styles.container}>
      {showToast && <div className={styles.toast}>✔ Saved successfully!</div>}

      <nav className={styles.navbar}>
        <img src="/CODAPT_LOGO.png" alt="Codapt" className={styles.logo} onClick={onHomeClick} />
        <div className={styles.navActions}>
          <div className={styles.nameBadge}>{userData?.name || 'Name'}</div>
          <ThemeToggle isDarkMode={isDarkMode} onClick={toggleTheme} />
          <div className={styles.profileWrapper}>
            <div className={styles.profileIcon}>
              {form.photo
                ? <img src={form.photo} alt="Profile" className={styles.profilePhoto} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
              }
            </div>
            <div className="unifiedDropdown">
              <div className="dropdownArrow"/>
              <div className="dropdownItem" onClick={onHomeClick}>Home</div>
              <div className="dropdownItem dropdownItemDanger" onClick={onLogout}>Log Out</div>
            </div>
          </div>
        </div>
      </nav>

      <main className={styles.mainWrapper}>

        {/* Profile Card */}
        <div className={styles.card}>
          <h1 className={styles.title}>Profile</h1>
          <div className={styles.headerSection}>
            <div className={styles.avatarCircleLarge} onClick={() => fileInputRef.current?.click()}>
              {form.photo ? <img src={form.photo} alt="Profile" className={styles.profilePhotoLarge} /> : <span>👤</span>}
              <div className={styles.cameraIcon}>📷</div>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }} />
            <div className={styles.infoLabels}>
              <div className={styles.labelYellow}>Name : <span>{userData?.name}</span></div>
              <div className={styles.labelYellow}>Username : <span>{userData?.username}</span></div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            {[
              { label:'Name',     key:'name',     type:'text' },
              { label:'Username', key:'username', type:'text' },
              { label:'Email',    key:'email',    type:'email' },
              { label:'Password', key:'password', type:'password' },
            ].map(({ label, key, type }) => (
              <div className={styles.formGroup} key={key}>
                <label className={styles.fieldLabel}>{label}</label>
                <input type={type} className={styles.inputField}
                  value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={type === 'password' ? '••••••••' : ''} />
              </div>
            ))}
            <div className={styles.saveBtnWrapper}>
              <button type="submit" className={styles.saveBtn}>Save</button>
            </div>
          </form>
        </div>

        {/* Stats Sidebar */}
        <div className={styles.statsSidebar}>

          {/* Performance Chart */}
          <div className={styles.miniCard}>
            <h3 className={styles.miniTitle}>Performance Progress</h3>
            <div className={styles.chartPlaceholder}>
              {loadingData ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13 }}>Loading chart…</div>
              ) : chartData.length === 0 || activeChartLangs.length === 0 ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13, textAlign:'center', padding:'0 20px' }}>
                  Complete tasks to see your performance chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} />
                    <YAxis tickFormatter={tickFormatter} tick={{ fontSize:11, fill:'#94a3b8' }} domain={[0,100]} />
                    <Tooltip formatter={(v, name) => [`${Math.round(v)}%`, name]}
                      contentStyle={{ borderRadius:'10px', border:'none', backgroundColor:'#1e293b', color:'#f1f5f9', fontSize:12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize:12 }} />
                    {activeChartLangs.map(lang => (
                      <Line key={lang} type="monotone" dataKey={lang.toLowerCase()} name={lang}
                        stroke={langColors[lang] || '#888'} strokeWidth={2}
                        dot={{ r:3 }} activeDot={{ r:5 }} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Accomplishments */}
          <div className={styles.miniCard}>
            <div className={styles.miniCardHeader}>
              <h3>Accomplishments</h3>
              <div className={styles.levelBadge}
                style={{ backgroundColor:`${langCapability.color}22`, color:langCapability.color, border:`1px solid ${langCapability.color}` }}>
                {langCapability.label}
              </div>
            </div>

            <select className={styles.langSelect} value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>

            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width:`${langMastery.percentage}%` }} />
              </div>
              <span className={styles.progressText} onClick={() => setShowAnalysis(true)}
                style={{ cursor:'pointer', textDecoration:'underline' }}
                onMouseEnter={e => e.target.style.color = '#ffcc00'}
                onMouseLeave={e => e.target.style.color = ''}>
                {langMastery.masteredConcepts}/{langMastery.totalConcepts} concepts mastered ({langMastery.percentage}%) ▶
              </span>
            </div>

            <div className={styles.accomplishList}>
              {loadingData ? (
                <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>Loading progress…</div>
              ) : conceptRows.every(r => !r.hasData) ? (
                <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>
                  No activity in {selectedLang} yet. Start a lesson!
                </div>
              ) : conceptRows.map(({ concept, success, masteryPct, isMastered, hasData, lvl }) => (
                <div key={concept} className={styles.accomplishItem} style={{ opacity: hasData ? 1 : 0.3 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p className={styles.accomplishTitle}>
                      {concept}{isMastered && <span style={{ marginLeft:6, fontSize:12 }}>✅</span>}
                    </p>
                    <span style={{ padding:'3px 8px', borderRadius:'999px', fontSize:'10px', fontWeight:'700',
                      backgroundColor:`${lvl.color}22`, color:lvl.color, border:`1px solid ${lvl.color}` }}>
                      {lvl.label}
                    </span>
                  </div>
                  <div className={styles.accomplishBar}>
                    <div className={styles.accomplishFill} style={{
                      width:`${masteryPct}%`,
                      background: isMastered ? '#4ade80' : masteryPct >= 50 ? '#facc15' : masteryPct > 0 ? '#60a5fa' : '#334155'
                    }} />
                  </div>
                  <p className={styles.accomplishRate}>
                    {hasData ? `${Math.round(success)}% success rate${isMastered ? ' — Mastered! 🎉' : ''}` : 'Not attempted yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Modal */}
        {showAnalysis && (
          <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%',
            backgroundColor:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center' }}
            onClick={() => setShowAnalysis(false)}>
            <div className={styles.compactAnalysis} onClick={e => e.stopPropagation()}>
              {isAnalyzing ? (
                <div className={styles.compactLoader}>
                  <div className={styles.miniLoadingBars}>
                    {[0,1,2].map(i => <div key={i} className={`${styles.miniBar} ${styles[`miniPulse${i}`]}`} />)}
                  </div>
                  <div className={styles.miniProgress}>Analysing your data…</div>
                </div>
              ) : (
                <div className={styles.analysisCard}>
                  <div className={styles.cardHeader}>
                    <h3>📊 Your Progress Story</h3>
                    <button onClick={() => setShowAnalysis(false)} className={styles.cardClose}>✕</button>
                  </div>
                  <div className={styles.achievementSummary}>
                    <div className={styles.percentBig}>{overall.avgSuccess}<span>%</span></div>
                    <div className={styles.tasksCompleted}>{overall.totalMastered} concepts mastered across all languages</div>
                    <div className={styles.rankBadge}>{overall.rank} Rank</div>
                  </div>
                  <div className={styles.graphInsight}>
                    <div className={styles.insightIcon}>📈</div>
                    <p>{overall.interp}</p>
                  </div>
                  <div className={styles.langQuick}>
                    <h4>Language Status:</h4>
                    <div className={styles.langRow}>
                      {LANGUAGES.map(lang => {
                        const s   = overall.langStats[lang];
                        const cap = getLanguageCapability(lang, progress);
                        return (
                          <div key={lang} className={styles.langQuickItem}>
                            <span>{lang.slice(0,2)}</span>
                            <strong style={{ color: cap.color }}>{cap.label}</strong>
                            <span style={{ fontSize:10, color:'#64748b' }}>
                              {s.avgSuccess > 0 ? `${Math.round(s.avgSuccess)}% avg` : 'No activity'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.nextSteps}>
                    <h4>🎯 {overall.rec}</h4>
                    <div className={styles.stepList}>
                      {overall.actions.map((step, i) => <div key={i} className={styles.stepItem}>{i+1}. {step}</div>)}
                    </div>
                  </div>
                  <button className={styles.continueBtn} onClick={() => setShowAnalysis(false)}>Continue Learning →</button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ProfilePage;