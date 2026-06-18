import React, { useState, useEffect } from 'react';
import styles from './AdminUsers.module.css';

const UsersPanel = ({ users: initialUsers = [] }) => {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [error, setError] = useState(null);

  const totalLearners = users.length;
  const activeRate = totalLearners ? Math.round((users.filter(u => !u.isBanned).length / totalLearners) * 100) : 0;

  useEffect(() => {
    setUsers(initialUsers);
    if (initialUsers.length > 0) {
      setIsLoading(false);
      setError(null);
    }
  }, [initialUsers]);

  useEffect(() => {
    if (initialUsers.length > 0) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/admin/users');
        if (!response.ok) throw new Error('Failed to load admin users');
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Admin users fetch error:', err);
        setError('Unable to load users from the backend.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [initialUsers.length]);

  const getAvatarColor = (name) => {
    const colors = ['#76D7A4', '#F1C40F', '#E74C3C', '#3498DB', '#9B59B6', '#5DADE2'];
    return colors[name?.charCodeAt(0) % colors.length] || '#76D7A4';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const closePanel = () => {
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    setUsers(users.map(u => 
      u.id === selectedUser.id ? { ...u, name: editForm.name, email: editForm.email } : u
    ));
    setSelectedUser({ ...selectedUser, name: editForm.name, email: editForm.email });
    setShowEditModal(false);
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (actionType === 'delete') {
      setUsers(users.filter(u => u.id !== selectedUser.id));
    } else if (actionType === 'ban') {
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, isBanned: true } : u
      ));
    } else if (actionType === 'unban') {
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, isBanned: false } : u
      ));
    } else if (actionType === 'reset') {
      alert(`Password reset link sent to ${selectedUser.email}`);
    }
    setShowActionModal(false);
    setSelectedUser(null);
  };

  return (
    <div className={styles.usersPanelWrapper}>
      <h1 className={styles.panelTitle}>Users</h1>

      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Search Users......" 
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.statsSummary}>
        <div className={styles.statBox}>
          <span>Total Learners</span>
          <h2>{totalLearners}</h2>
        </div>
        <div className={styles.statBox}>
          <span>Active Learners</span>
          <h2>{activeRate}%</h2>
        </div>
      </div>

      <div className={styles.activityCard}>
        <div className={styles.activityHeader}>
          <h3>Recent User Activity</h3>
        </div>

        <div className={styles.tableScrollArea}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={index} className={user.isBanned ? styles.bannedRow : ''}>
                    <td className={styles.userCell}>
                      <div className={styles.avatar} style={{ backgroundColor: user.color }}>
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </td>
                    <td>{user.email}</td>
                    <td className={styles.progressCell}>
                      <div className={styles.progressTrack}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${user.progress}%`, backgroundColor: user.color }}
                        ></div>
                      </div>
                      <span className={styles.progressText}>{user.progress}%</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.isBanned ? styles.bannedStatus : styles.activeStatus}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.viewBtn} onClick={() => setSelectedUser(user)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && !showEditModal && !showActionModal && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsPanelContent}>
            <div className={styles.detailsPanelHeader}>
              <h2>User Details</h2>
              <button className={styles.closeBtn} onClick={closePanel}>×</button>
            </div>
            
            <div className={styles.userProfileSection}>
              <div className={styles.userAvatarLarge} style={{ backgroundColor: selectedUser.color }}>
                {selectedUser.name.charAt(0)}
              </div>
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>
              <span className={`${styles.statusBadge} ${selectedUser.isBanned ? styles.bannedStatus : styles.activeStatus}`}>
                {selectedUser.isBanned ? 'Banned' : 'Active'}
              </span>
            </div>

            <div className={styles.detailsSection}>
              <h4>Progress</h4>
              <div className={styles.progressBarLarge}>
                <div 
                  className={styles.progressFillLarge} 
                  style={{ width: `${selectedUser.progress}%`, backgroundColor: selectedUser.color }}
                ></div>
              </div>
              <p className={styles.progressPercentage}>{selectedUser.progress}% Complete</p>
            </div>

            <div className={styles.detailsSection}>
              <h4>Scores</h4>
              <div className={styles.scoresGrid}>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>Python</span>
                  <span className={styles.scoreValue}>{selectedUser.scores.python}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>JavaScript</span>
                  <span className={styles.scoreValue}>{selectedUser.scores.javascript}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>Java</span>
                  <span className={styles.scoreValue}>{selectedUser.scores.java}</span>
                </div>
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h4>Statistics</h4>
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <span>Joined Date</span>
                  <span>{selectedUser.enrolledDate}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Last Active</span>
                  <span>{selectedUser.lastActive}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Completed Lessons</span>
                  <span>{selectedUser.completedLessons}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Certificates</span>
                  <span>{selectedUser.certificates}</span>
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.editUserBtn} onClick={() => openEditModal(selectedUser)}>
                ✏️ Edit User
              </button>
              <button className={styles.resetPasswordBtn} onClick={() => openActionModal(selectedUser, 'reset')}>
                🔑 Reset Password
              </button>
              {selectedUser.isBanned ? (
                <button className={styles.unbanUserBtn} onClick={() => openActionModal(selectedUser, 'unban')}>
                  ✅ Unban User
                </button>
              ) : (
                <button className={styles.banUserBtn} onClick={() => openActionModal(selectedUser, 'ban')}>
                  🚫 Ban User
                </button>
              )}
              <button className={styles.deleteUserBtn} onClick={() => openActionModal(selectedUser, 'delete')}>
                🗑️ Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Edit User</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  className={styles.inputField}
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  className={styles.inputField}
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>
                {actionType === 'delete' && 'Delete User'}
                {actionType === 'ban' && 'Ban User'}
                {actionType === 'unban' && 'Unban User'}
                {actionType === 'reset' && 'Reset Password'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowActionModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p>
                {actionType === 'delete' && `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
                {actionType === 'ban' && `Are you sure you want to ban ${selectedUser.name}? They will lose access to the platform.`}
                {actionType === 'unban' && `Are you sure you want to unban ${selectedUser.name}? They will regain access to the platform.`}
                {actionType === 'reset' && `A password reset link will be sent to ${selectedUser.email}.`}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowActionModal(false)}>Cancel</button>
              <button 
                className={`${styles.confirmBtn} ${actionType === 'delete' ? styles.deleteConfirmBtn : actionType === 'ban' ? styles.banConfirmBtn : actionType === 'unban' ? styles.unbanConfirmBtn : styles.resetConfirmBtn}`}
                onClick={confirmAction}
              >
                {actionType === 'delete' && 'Delete'}
                {actionType === 'ban' && 'Ban'}
                {actionType === 'unban' && 'Unban'}
                {actionType === 'reset' && 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPanel;
