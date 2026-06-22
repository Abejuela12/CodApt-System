import React, { useState, useEffect } from 'react';
import styles from './AdminSettings.module.css';
import { FaGear, FaFloppyDisk, FaArrowRotateLeft, FaChevronRight, FaShield, FaUser, FaEnvelope } from "react-icons/fa6";

const AdminSettings = ({ userData = {}, onLogout }) => {
  const [form, setForm] = useState({
    name: userData?.name || '',
    username: userData?.username || '',
    email: userData?.email || ''
  });
  const [initialForm, setInitialForm] = useState({
    name: userData?.name || '',
    username: userData?.username || '',
    email: userData?.email || ''
  });
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_BASE = API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/profile`);
        const data = await res.json();
        if (data.admin) {
          const adminData = {
            name: data.admin.name || '',
            username: data.admin.username || '',
            email: data.admin.email || ''
          };
          setForm(adminData);
          setInitialForm(adminData);
        }
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        const savedData = {
          name: data.admin.name || '',
          username: data.admin.username || '',
          email: data.admin.email || ''
        };
        setForm(savedData);
        setInitialForm(savedData);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        console.error('Save failed:', data.error);
      }
    } catch (err) {
      console.error('Error saving admin profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
  };

  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/reports/download`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unable to read error message');
        throw new Error(`Failed to export data (${res.status} ${res.statusText}): ${errorText}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CodApt_Research_Data_${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert('✅ Research data exported successfully!\n\nIncludes:\n- All student submissions\n- Performance profiles\n- Recommendation effectiveness\n- Summary statistics');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert(`Failed to export data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetExperimentData = async () => {
    const confirmed = window.confirm(
      '⚠️ This will permanently delete all experiment data including submissions, profiles, and progress. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Type YES to confirm permanent deletion of all experiment data.'
    );
    if (!doubleConfirm) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/reset-experiment-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to reset data');
      
      const data = await res.json();
      alert(`✅ Experiment data reset successfully!\n\nDeleted:\n- ${data.deletedSubmissions} submissions\n- ${data.deletedProfiles} user profiles\n- ${data.deletedProgress} progress records`);
    } catch (err) {
      console.error('Error resetting data:', err);
      alert('Failed to reset experiment data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {showToast && <div className={styles.toast}>✔ Saved successfully!</div>}

      {/* Admin Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileCardHeader}>
          <div className={styles.profileHeaderLeft}>
            <div className={styles.avatarLarge}>
              <FaShield className={styles.shieldIcon} />
            </div>
            <div className={styles.profileHeaderInfo}>
              <h1 className={styles.adminTitle}>Administrator</h1>
              <p className={styles.adminSubtitle}>System Administrator</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Account Information</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaUser className={styles.fieldIcon} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaUser className={styles.fieldIcon} />
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter username"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FaEnvelope className={styles.fieldIcon} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className={styles.secondaryBtn} disabled={isSaving} onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </form>
      </div>

      {/* System Control Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FaGear className={styles.headerIcon} /> 
          <span>System Control</span>
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
          <FaFloppyDisk className={styles.headerIcon} /> 
          <span>Data & Research Controls</span>
        </div>
        <div className={styles.actionGrid}>
          <div className={styles.actionButton} onClick={handleExportCSV} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
            <div className={styles.btnContent}>
               <FaFloppyDisk className={styles.actionIcon} />
               <span>{isLoading ? 'Exporting...' : 'Export Data (CSV)'}</span>
            </div>
            <FaChevronRight className={styles.chevron} />
          </div>
          <div className={styles.actionButton} onClick={handleResetExperimentData} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
            <div className={styles.btnContent}>
               <FaArrowRotateLeft className={styles.actionIcon} />
               <span>Reset Experiment Data</span>
            </div>
            <FaChevronRight className={styles.chevron} />
          </div>
        </div>
      </div>

      <div className={styles.logoutSection}>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={onLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;