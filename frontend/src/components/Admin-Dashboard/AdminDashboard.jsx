import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import UsersPanel from '../Admin-Users/AdminUsers';
import AdminReports from '../Admin-Reports/AdminReports';
import AdminSettings from '../Admin-Settings/AdminSettings';
import AdminCourses from '../Admin-Courses/AdminCourses';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ isDarkMode, toggleTheme, authToken }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats]             = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalLessons: 0,
    completedSubmissions: 0,
    recentUsers: []
  });

  const handleNavClick = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!authToken) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load admin stats', err);
      }
    };
    fetchStats();
  }, [authToken]);

  const recentUsers = stats.recentUsers || [];

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
        <header className={styles.topHeader}>
          <div className={styles.headerRight}>
            <span className={styles.adminBadge}>Admin</span>
            <span className={styles.iconBtn} onClick={toggleTheme}>
              {isDarkMode ? '☀️' : '🌙'}
            </span>
            <div className={styles.profileCircle}>👤</div>
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
                    <h3>{stats.totalUsers ?? 0}</h3>
                  </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <span className={styles.statEmoji}>📈</span>
                        <p>Avg Score</p>
                        <h3>{stats.totalUsers > 0 ? `${Math.round((stats.completedSubmissions || 0) / stats.totalUsers)}%` : '0%'}</h3>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statContent}>
                        <span className={styles.statEmoji}>✅</span>
                        <p>Average Progress</p>
                        <h3>{stats.totalLessons > 0 ? `${Math.round(((stats.completedSubmissions || 0) / stats.totalLessons) * 100)}%` : '0%'}</h3>
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

                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => {
                      const progress = user.completed_lessons ? Math.min(user.completed_lessons * 10, 100) : 0;
                      return (
                        <div key={user.id} className={styles.userRow}>
                          <div className={styles.userInfo}>
                            <div className={styles.avatar} style={{backgroundColor: '#38BDF8'}}>
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <span className={styles.userName}>{user.name}</span>
                          </div>
                          <div className={styles.progressWrapper}>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{ width: `${progress}%`, backgroundColor: '#38BDF8' }}
                              ></div>
                            </div>
                            <span className={styles.progressVal}>{progress}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: '#94a3b8', padding: '24px', textAlign: 'center' }}>
                      No recent user activity available.
                    </div>
                  )}
                </div>
                <div className={styles.actionArea}>
                    <button className={styles.viewAllBtn} onClick={() => handleNavClick('users')}>View All Users</button>
                </div>
              </div>
            </>
          )}

          {currentView === 'users' && <UsersPanel authToken={authToken} />}
          {currentView === 'reports' && <AdminReports />}
          {currentView === 'content' && <AdminCourses />}
          {currentView === 'settings' && <AdminSettings authToken={authToken} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
