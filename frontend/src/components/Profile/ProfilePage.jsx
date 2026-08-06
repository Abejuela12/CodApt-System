import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ProfilePage.module.css';
import ThemeToggle from '../shared/ThemeToggle';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getConceptLevel } from '../../utils/levelUtils';
import { DEFAULT_CONCEPTS, DEFAULT_LANGUAGES, getLanguageCapability, calcMasteryProgress, buildOverallStats, buildPerformanceChartData, isConceptMastered, getConceptProgress } from './profileLogic';

import { API_BASE_URL } from '../../config';

const LANGUAGES = DEFAULT_LANGUAGES;
const CONCEPTS  = DEFAULT_CONCEPTS;
const API       = API_BASE_URL;

const mergeProgressData = (existing = {}, fresh = {}) => {
  const merged = { ...(existing || {}) };

  Object.entries(fresh || {}).forEach(([lang, concepts]) => {
    const nextLangData = { ...(existing?.[lang] || {}) };

    Object.entries(concepts || {}).forEach(([concept, data]) => {
      nextLangData[concept] = {
        ...(existing?.[lang]?.[concept] || {}),
        ...(data || {})
      };
    });

    merged[lang] = nextLangData;
  });

  return merged;
};

const ProfilePage = ({
  userData, onSave, onDeleteAccount, isDarkMode, toggleTheme,
  onHomeClick, onLogout, progress: propProgress = {}
}) => {
  const [form, setForm]           = useState({ ...userData });
  const [showToast, setShowToast] = useState(false);
  const fileInputRef              = useRef(null);
  const [chartData,   setChartData]       = useState([]);
  const [activeChartLangs, setActiveChartLangs] = useState([]);
  const [loadingData, setLoadingData]     = useState(false);
  const [selectedLang, setSelectedLang]   = useState(Object.keys(propProgress || {})[0] || 'Java');
  const [showAnalysis, setShowAnalysis]   = useState(false);
  const [isAnalyzing,  setIsAnalyzing]    = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSaving, setIsSaving]          = useState(false);
  const [isDeleting, setIsDeleting]      = useState(false);
  const [saveError, setSaveError]        = useState('');
  const [deleteError, setDeleteError]    = useState('');

  const loadProfileData = useCallback(async () => {
    if (!userData?.id) return;

    setLoadingData(true);

    try {
      const dailyResult = await fetch(`${API}/api/daily-progress/${userData.id}`);
      const rows = dailyResult.ok ? await dailyResult.json() : [];

      const fallback = buildPerformanceChartData(rows, propProgress || {});
      setChartData(fallback.chartData);
      setActiveChartLangs(fallback.activeChartLangs);
    } catch {
      const fallback = buildPerformanceChartData([], propProgress || {});
      setChartData(fallback.chartData);
      setActiveChartLangs(fallback.activeChartLangs);
    } finally {
      setLoadingData(false);
    }
  }, [userData?.id, propProgress]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const langs = Object.keys(propProgress || {});
    if (langs.length > 0 && !langs.includes(selectedLang)) {
      setSelectedLang(langs[0]);
    }
  }, [propProgress, selectedLang]);
  useEffect(() => { if (!showToast) return; const t = setTimeout(() => setShowToast(false), 3000); return () => clearTimeout(t); }, [showToast]);
  useEffect(() => { if (!showAnalysis) return; setIsAnalyzing(true); const t = setTimeout(() => setIsAnalyzing(false), 1800); return () => clearTimeout(t); }, [showAnalysis]);

  const langCapability = getLanguageCapability(selectedLang, propProgress);
  const langMastery    = calcMasteryProgress(selectedLang, propProgress);

  const overall = buildOverallStats(propProgress, LANGUAGES, CONCEPTS);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      const result = await onSave(form);
      const ok = result?.success !== false;
      if (!ok) throw new Error(result?.error || 'Unable to save profile.');
      setShowToast(true);
    } catch (err) {
      setSaveError(err?.message || 'Unable to save profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userData?.id) return;
    const confirmed = window.confirm('Delete your account permanently? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteAccount();
      setShowProfileModal(false);
    } catch (err) {
      setDeleteError(err?.message || 'Unable to delete account right now.');
      setIsDeleting(false);
    }
  };
  const handlePhotoChange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  // Only show concepts user has actually attempted (tasksCompleted > 0)
  const conceptRows = CONCEPTS.map(concept => {
    const stored         = getConceptProgress(propProgress?.[selectedLang] || {}, concept);
    const tasksCompleted = stored?.tasksCompleted ?? 0;
    const success        = stored?.successRate ?? 0;
    const hasData        = !!stored && (tasksCompleted > 0 || success > 0 || stored?.mastered === true || stored?.isMastered === true);
    const isMastered     = hasData && isConceptMastered(propProgress, selectedLang, concept);
    const masteryPct     = hasData ? Math.round(success) : 0;
    const lvl            = hasData
      ? getConceptLevel({ tasksCompleted: isMastered ? 3 : Math.max(tasksCompleted, 1), totalTasks: 3, successRate: success })
      : { label: 'Not Started', color: '#64748b' };
    return { concept, success, masteryPct, isMastered, hasData, lvl };
  });

  const tickFormatter = v => `${Math.round(v)}%`;
  const langColors    = { Java: '#FF6700', Python: '#4B8BBE', JavaScript: '#F7DF1E' };

  return (
    <div className={styles.container}>
      {showToast && (
        <div className={styles.saveToast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Profile saved successfully
        </div>
      )}

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

        {/* Left Sidebar - Compact Profile Card */}
        <aside className={styles.sidebarProfile}>
          <div className={styles.compactProfileCard}>
            <div className={styles.profileCardAvatar}>
              {form.photo ? <img src={form.photo} alt="Profile" className={styles.profileCardImg} /> : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            <div className={styles.profileCardName}>{userData?.name || userData?.username || 'User'}</div>
            <div className={styles.profileCardLevel}>Level 1</div>

            <div className={styles.profileCardStats}>
              <div className={styles.statRow}>
                <span className={styles.statIcon}>🏆</span>
                <span className={styles.statValue}>{overall.rank}</span>
                <span className={styles.statLabel}>Rank</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statIcon}>🎖️</span>
                <span className={styles.statValue}>{overall.totalMastered}</span>
                <span className={styles.statLabel}>Mastered</span>
              </div>
            </div>

            <button className={styles.viewProfileBtn} onClick={() => setShowProfileModal(true)}>
              View Profile
            </button>
          </div>
        </aside>

        {/* Right Main - Accomplishments + Chart, side by side */}
        <div className={styles.mainDashboard}>
          <h2 className={styles.dashboardTitle}>Dashboard</h2>

          {/* Accomplishments Section */}
          <div className={styles.accomplishmentsSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>ACCOMPLISHMENTS</h3>
              <div className={styles.levelBadge}
                style={{ backgroundColor:`${langCapability.color}22`, color:langCapability.color, border:`1px solid ${langCapability.color}` }}>
                {langCapability.label}
              </div>
            </div>

            <select className={styles.langSelectDropdown} value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>

            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width:`${langMastery.completionPercentage}%` }} />
              </div>
              <span className={styles.progressText} onClick={() => setShowAnalysis(true)}
                style={{ cursor:'pointer', textDecoration:'underline' }}>
                {langMastery.masteredConcepts}/{langMastery.totalConcepts} concepts mastered ({langMastery.completionPercentage}%) ▶
              </span>
            </div>

            <div className={styles.conceptGrid}>
              {loadingData ? (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 20px', color:'#94a3b8' }}>Loading progress…</div>
              ) : conceptRows.every(r => !r.hasData) ? (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 20px', color:'#94a3b8' }}>
                  No activity in {selectedLang} yet. Start a lesson!
                </div>
              ) : (
                conceptRows.map(({ concept, success, masteryPct, isMastered, hasData, lvl }) => (
                  <div key={concept} className={styles.conceptCard} style={{ opacity: hasData ? 1 : 0.4 }}>
                    <div className={styles.conceptHeader}>
                      <h4 className={styles.conceptName}>{concept}</h4>
                      <span className={styles.conceptBadge} style={{ color:lvl.color, borderColor:lvl.color }}>
                        {lvl.label}
                      </span>
                    </div>
                    <div className={styles.conceptBar}>
                      <div className={styles.conceptBarFill} style={{
                        width: isMastered ? '100%' : `${masteryPct}%`,
                        background: isMastered ? '#4ade80' : masteryPct >= 50 ? '#facc15' : masteryPct > 0 ? '#60a5fa' : '#334155'
                      }} />
                    </div>
                    <p className={styles.conceptRate}>
                      {hasData ? `${Math.round(success)}% success rate` : 'Not attempted yet'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Chart */}
          <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Performance Progress</h3>
            <div className={styles.chartContainer}>
              {loadingData ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13 }}>Loading chart…</div>
              ) : chartData.length === 0 || activeChartLangs.length === 0 ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13, textAlign:'center', padding:'0 20px' }}>
                  Complete tasks to see your performance chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
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
        </div>

        {/* Profile Edit Modal */}
        {showProfileModal && (
          <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Edit Profile</h2>
                <button className={styles.modalClose} onClick={() => setShowProfileModal(false)}>✕</button>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.modalAvatarSection}>
                  <div className={styles.modalAvatar} onClick={() => fileInputRef.current?.click()}>
                    {form.photo ? <img src={form.photo} alt="Profile" /> : <span>👤</span>}
                    <div className={styles.cameraOverlay}>📷</div>
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }} />
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                  {[
                    { label:'Name',     key:'name',     type:'text' },
                    { label:'Username', key:'username', type:'text' },
                    { label:'Email',    key:'email',    type:'email' },
                    { label:'Password', key:'password', type:'password' },
                  ].map(({ label, key, type }) => (
                    <div className={styles.formGroup} key={key}>
                      <label className={styles.formLabel}>{label}</label>
                      <input type={type} className={styles.formInput} disabled={isSaving}
                        value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={type === 'password' ? '••••••••' : ''} />
                    </div>
                  ))}

                  <div className={styles.formActionsRow}>
                    <button type="submit" className={styles.submitBtn} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className={styles.deleteAccountRow}>
                    <button type="button" className={styles.deleteAccountBtn} onClick={handleDeleteAccount} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                  {isSaving && <p className={styles.saveStatus}>Saving your information…</p>}
                  {saveError && <p className={styles.saveStatus} style={{ color: '#f87171' }}>{saveError}</p>}
                  {deleteError && <p className={styles.saveStatus} style={{ color: '#f87171' }}>{deleteError}</p>}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Modal */}
        {showAnalysis && (
          <div className={styles.analysisOverlay} onClick={() => setShowAnalysis(false)}>
            <div className={styles.analysisCard} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAnalysis(false)} className={styles.analysisClose}>✕</button>
              <h3>📊 Your Progress Story</h3>
              <div className={styles.analysisContent}>
                <div className={styles.percentDisplay}>{overall.avgSuccess}%</div>
                <p>{overall.totalMastered} concepts mastered across all languages</p>
                <p className={styles.rankDisplay}>{overall.rank} Rank</p>
                <p>{overall.interp}</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ProfilePage;