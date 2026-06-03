import React, { useState, useEffect } from 'react';
import styles from './AdminUsers.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UsersPanel = ({ authToken }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const rawUsers = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
            ? data.users
            : Array.isArray(data.data)
              ? data.data
              : null;

        if (!Array.isArray(rawUsers)) {
          setUsers([]);
          setError(data.error || 'Unable to load users.');
          return;
        }

        const palette = ['#66CC99', '#D4AF37', '#8B5CF6', '#38BDF8', '#F97316', '#22D3EE'];
        setUsers(rawUsers.map((user) => {
          const color = palette[user.id % palette.length];
          return {
            ...user,
            progress: user.avg_success ?? 0,
            isBanned: user.status === 'banned',
            enrolledDate: user.created_at ? user.created_at.split('T')[0] : '',
            lastActive: user.last_login ? user.last_login.split('T')[0] : '',
            completedLessons: user.completed_lessons ?? 0,
            certificates: user.certificates ?? 0,
            scores: user.scores || { python: 0, javascript: 0, java: 0 },
            color,
          };
        }));
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load users', err);
        setError('Failed to load users.');
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '' });

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

  const saveEdit = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: editForm.name, email: editForm.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update user');
      const updatedUser = {
        ...selectedUser,
        name: data.user.name,
        email: data.user.email
      };
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save user', err);
      alert('Could not save changes.');
    }
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'delete') {
        const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Delete failed');
        setUsers(users.filter(u => u.id !== selectedUser.id));
      } else if (actionType === 'ban' || actionType === 'unban') {
        const status = actionType === 'ban' ? 'banned' : 'active';
        const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Status update failed');
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: data.user.status, isBanned: data.user.status === 'banned' } : u));
        setSelectedUser({ ...selectedUser, status: data.user.status, isBanned: data.user.status === 'banned' });
      } else if (actionType === 'reset') {
        alert(`Password reset link sent to ${selectedUser.email}`);
      }
    } catch (err) {
      console.error('User action failed', err);
      alert('Unable to perform action.');
    } finally {
      setShowActionModal(false);
      setSelectedUser(null);
    }
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
          <h2>{users.length}</h2>
        </div>
        <div className={styles.statBox}>
          <span>Active Learners</span>
          <h2>{users.length ? `${Math.round((users.filter(u => !u.isBanned).length / users.length) * 100)}%` : '0%'}</h2>
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
                filteredUsers.map((user) => (
                  <tr key={user.id} className={user.isBanned ? styles.bannedRow : ''}>
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
                {selectedUser?.name?.charAt(0) || 'U'}
              </div>
              <h3>{selectedUser.name || 'Unknown User'}</h3>
              <p>{selectedUser.email || 'No email'}</p>
              <span className={`${styles.statusBadge} ${selectedUser.isBanned ? styles.bannedStatus : styles.activeStatus}`}>
                {selectedUser.isBanned ? 'Banned' : 'Active'}
              </span>
            </div>

            <div className={styles.detailsSection}>
              <h4>Progress</h4>
              <div className={styles.progressBarLarge}>
                <div 
                  className={styles.progressFillLarge} 
                  style={{ width: `${selectedUser.progress ?? 0}%`, backgroundColor: selectedUser.color }}
                ></div>
              </div>
              <p className={styles.progressPercentage}>{selectedUser.progress}% Complete</p>
            </div>

            <div className={styles.detailsSection}>
              <h4>Scores</h4>
              <div className={styles.scoresGrid}>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>Python</span>
                  <span className={styles.scoreValue}>{selectedUser?.scores?.python ?? 0}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>JavaScript</span>
                  <span className={styles.scoreValue}>{selectedUser?.scores?.javascript ?? 0}</span>
                </div>
                <div className={styles.scoreItem}>
                  <span className={styles.scoreLabel}>Java</span>
                  <span className={styles.scoreValue}>{selectedUser?.scores?.java ?? 0}</span>
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
