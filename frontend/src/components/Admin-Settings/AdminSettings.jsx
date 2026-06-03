import React, { useEffect, useState } from 'react';
import styles from './AdminSettings.module.css';
import { FaGear, FaFloppyDisk, FaArrowRotateLeft, FaChevronRight } from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminSettings = ({ authToken }) => {
  const [settings, setSettings] = useState({
    recommendationEngine: true,
    cfgValidation: true,
    hardcodedDetection: true
  });

  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_BASE}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const loaded = data?.data || data?.settings || data || {};
        const normalize = (value, defaultValue = true) => {
          if (value === undefined || value === null) return defaultValue;
          return String(value) !== 'false';
        };

        setSettings({
          recommendationEngine: normalize(loaded.recommendationEngine, true),
          cfgValidation: normalize(loaded.cfgValidation, true),
          hardcodedDetection: normalize(loaded.hardcodedDetection, true)
        });
      })
      .catch((err) => console.error('Failed to load settings', err));
  }, [authToken]);

  const updateSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (!authToken) return;

    try {
      await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ [key]: value })
      });
    } catch (err) {
      console.error('Failed to save setting', err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

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
            <input type="checkbox" checked={settings.recommendationEngine} onChange={(e) => updateSetting('recommendationEngine', e.target.checked)} />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>CFG Validation Module</h3>
            <p>Enable Context-Free Grammar checking for code exercises.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={settings.cfgValidation} onChange={(e) => updateSetting('cfgValidation', e.target.checked)} />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>Hardcoded Answer Detection</h3>
            <p>Detect hardcoded outputs in programming submissions.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={settings.hardcodedDetection} onChange={(e) => updateSetting('hardcodedDetection', e.target.checked)} />
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