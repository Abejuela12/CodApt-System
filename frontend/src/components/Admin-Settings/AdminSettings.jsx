import React from 'react';
import styles from './AdminSettings.module.css';
import { FaGear, FaFloppyDisk, FaArrowRotateLeft, FaChevronRight } from "react-icons/fa6";

const AdminSettings = () => {
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
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>CFG Validation Module</h3>
            <p>Enable Context-Free Grammar checking for code exercises.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingText}>
            <h3>Hardcoded Answer Detection</h3>
            <p>Detect hardcoded outputs in programming submissions.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" defaultChecked />
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