import React, { useState, useEffect } from 'react';
import styles from './AdminSettings.module.css';
import { FaGear, FaFloppyDisk, FaArrowRotateLeft, FaChevronRight } from "react-icons/fa6";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    recommendationEngine: true,
    cfgValidation: true,
    hardcodedAnswerDetection: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/settings');
        if (!response.ok) throw new Error('Failed to load settings');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Admin settings fetch error:', err);
        setError('Unable to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      if (!response.ok) throw new Error('Failed to save setting');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Admin settings update error:', err);
      setError('Unable to save setting.');
    }
  };

  const onToggle = async (key) => {
    await updateSetting(key, !settings[key]);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {loading && <div className={styles.loadingText}>Loading settings...</div>}

      {/* System Control Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FaGear className={styles.headerIcon} /> System Control
        </div>
        
        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>Recommendation Engine</h3>
            <p>Enable adaptive learning recommendations for students.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={settings.recommendationEngine} onChange={() => onToggle('recommendationEngine')} />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>CFG Validation Module</h3>
            <p>Enable Context-Free Grammar checking for code exercises.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={settings.cfgValidation} onChange={() => onToggle('cfgValidation')} />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>Hardcoded Answer Detection</h3>
            <p>Detect hardcoded outputs in programming submissions.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={settings.hardcodedAnswerDetection} onChange={() => onToggle('hardcodedAnswerDetection')} />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Data & Research Controls Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FaFloppyDisk className={styles.headerIcon} /> Data & Research Controls
        </div>
        <div className={styles.actionGrid}>
          <div className={styles.actionButton}>
            <div className={styles.btnContent}>
               <FaFloppyDisk className={styles.actionIcon} />
               <span>Export Data (CSV)</span>
            </div>
            <FaChevronRight className={styles.chevron} />
          </div>
          <div className={styles.actionButton}>
            <div className={styles.btnContent}>
               <FaArrowRotateLeft className={styles.actionIcon} />
               <span>Reset Experiment Data</span>
            </div>
            <FaChevronRight className={styles.chevron} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;