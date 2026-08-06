import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import UsersPanel from '../Admin-Users/AdminUsers';
import AdminReports from '../Admin-Reports/AdminReports';
import AdminSettings from '../Admin-Settings/AdminSettings';
import { API_BASE_URL } from '../../config';
import AdminCourses from '../Admin-Courses/AdminCourses';

const AdminDashboard = ({ isDarkMode, toggleTheme, userData, onProfileClick, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract current view from URL path or default to dashboard
  const currentView = location.pathname.includes('/admin/users') ? 'users'
    : location.pathname.includes('/admin/reports') ? 'reports'
    : location.pathname.includes('/admin/content') ? 'content'
    : location.pathname.includes('/admin/settings') ? 'settings'
    : 'dashboard';

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        if (!response.ok) throw new Error('Failed to load admin users');
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Admin fetch error:', err);
        setError('Unable to load admin users from the backend.');
        setUsers([]);
      }
    };

    const fetchDashboardMetrics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reports`);
        if (!response.ok) throw new Error('Failed to load dashboard metrics');
        const data = await response.json();
        setAvgScore(data.avgScore || 0);
        setAvgProgress(data.avgProgress || 0);
      } catch (err) {
        console.error('Admin metrics fetch error:', err);
      }
    };

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAdminUsers(), fetchDashboardMetrics()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleNavClick = (view) => {
    const paths = {
      dashboard: '/admin',
      users: '/admin/users',
      reports: '/admin/reports',
      content: '/admin/content',
      settings: '/admin/settings'
    };
    navigate(paths[view] || '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalLearners = users.length;
  const activeRate = totalLearners ? Math.round((users.filter(user => !user.isBanned).length / totalLearners) * 100) : 0;

  const dashboardUsers = users.slice(0, 4);

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
            <img src="/CODAPT_LOGO.png" alt="CodAPT" />
        </div>
        <nav className={styles.sideNav}>
          <div 
            className={`${styles.navItem} ${currentView === 'dashboard' ? styles.active : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <span>🏠</span> Dashboard
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'users' ? styles.active : ''}`}
            onClick={() => handleNavClick('users')}
          >
            <span>👤</span> Users
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'reports' ? styles.active : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <span>📊</span> Reports
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'content' ? styles.active : ''}`}
            onClick={() => handleNavClick('content')}
          >
            <span>📚</span> Content
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'settings' ? styles.active : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span>⚙️</span> Settings
          </div>
        </nav>
      </aside>

      <main className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={`${styles.topHeader} ${styles.navbar}`}>
          <div className={styles.navActions}>
            <div className={styles.nameBadge}>{userData?.username || 'Admin'}</div>
            <button className={styles.themeToggle} onClick={toggleTheme} type="button">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className={styles.profileWrapper} onClick={onProfileClick}>
              <div className={styles.profileIcon}>👤</div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className={styles.content}>
          {currentView === 'dashboard' && (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <span className={styles.statEmoji}>📚</span>
                    <p>Total Learners</p>
                    <h3>{isLoading ? '…' : totalLearners}</h3>
                  </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <span className={styles.statEmoji}>📈</span>
                        <p>Avg Score</p>
                        <h3>{isLoading ? '…' : `${avgScore}%`}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <span className={styles.statEmoji}>✅</span>
                        <p>Average Progress</p>
                        <h3>{isLoading ? '…' : `${avgProgress}%`}</h3>
                    </div>
                </div>
              </div>

              <div className={styles.activityCard}>
                <h2 className={styles.activityTitle}>Recent User Activity</h2>
                <div className={styles.activityTable}>
                  <div className={styles.tableHeader}>
                    <span>User</span>
                    <span>Progress</span>
                  </div>

                  {isLoading ? (
                    <div className={styles.loadingRow}>Loading users...</div>
                  ) : error ? (
                    <div className={styles.loadingRow}>{error}</div>
                  ) : dashboardUsers.length === 0 ? (
                    <div className={styles.loadingRow}>No users available.</div>
                  ) : (
                    dashboardUsers.map((user, index) => (
                      <div key={index} className={styles.userRow}>
                        <div className={styles.userInfo}>
                          <div className={styles.avatar} style={{ backgroundColor: user.color || '#76D7A4' }}>
                              {user.name?.charAt(0) || 'U'}
                          </div>
                          <span className={styles.userName}>{user.name}</span>
                        </div>
                        <div className={styles.progressWrapper}>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ width: `${user.progress || 0}%`, backgroundColor: user.color || '#76D7A4' }}
                            ></div>
                          </div>
                          <span className={styles.progressVal}>{user.progress ?? 0}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.actionArea}>
                    <button className={styles.viewAllBtn} onClick={() => handleNavClick('users')}>View All Users</button>
                </div>
              </div>
            </>
          )}

          {currentView === 'users' && <UsersPanel users={users} />}
          {currentView === 'reports' && <AdminReports />}
          {currentView === 'content' && <AdminCourses />}
          {currentView === 'settings' && <AdminSettings userData={userData} onLogout={onLogout} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
