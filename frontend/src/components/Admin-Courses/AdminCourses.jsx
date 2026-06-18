import React, { useState, useEffect } from 'react';
import styles from './AdminCourses.module.css';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', language: 'Python', lessons: 0 });
  const [newLanguage, setNewLanguage] = useState({ name: '', icon: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/content');
        if (!response.ok) throw new Error('Failed to load content');
        const data = await response.json();
        setCourses(data.courses || []);
        setLanguages(data.languages || []);
        if (data.languages && data.languages.length > 0 && !newCourse.language) {
          setNewCourse(prev => ({ ...prev, language: data.languages[0].name }));
        }
      } catch (err) {
        console.error('Admin content fetch error:', err);
        setError('Unable to load admin content.');
      }
    };

    fetchContent();
  }, []);

  const addCourse = async () => {
    if (!newCourse.title) return;
    try {
      const response = await fetch('http://localhost:5000/api/admin/content/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      if (!response.ok) throw new Error('Failed to add course');
      const createdCourse = await response.json();
      setCourses(prev => [...prev, createdCourse]);
      setNewCourse({ title: '', language: newCourse.language || 'Python', lessons: 0 });
      setShowAddCourse(false);
    } catch (err) {
      console.error('Add course error:', err);
      setError('Unable to save course.');
    }
  };

  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/content/courses/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete course');
      setCourses(prev => prev.filter(course => course.id !== id));
    } catch (err) {
      console.error('Delete course error:', err);
      setError('Unable to delete course.');
    }
  };

  const addLanguage = async () => {
    if (!newLanguage.name || !newLanguage.icon) return;
    try {
      const response = await fetch('http://localhost:5000/api/admin/content/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLanguage)
      });
      if (!response.ok) throw new Error('Failed to add language');
      const createdLanguage = await response.json();
      setLanguages(prev => [...prev, createdLanguage]);
      setNewLanguage({ name: '', icon: '' });
      setShowAddLanguage(false);
    } catch (err) {
      console.error('Add language error:', err);
      setError('Unable to save language.');
    }
  };

  const deleteLanguage = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/content/languages/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete language');
      setLanguages(prev => prev.filter(lang => lang.id !== id));
    } catch (err) {
      console.error('Delete language error:', err);
      setError('Unable to delete language.');
    }
  };

  return (
    <div className={styles.coursesPanelWrapper}>
      <h1 className={styles.panelTitle}>Content Management</h1>

      <div className={styles.statsRow}>
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>📚</span>
          <div className={styles.statInfo}>
            <h3>{courses.length}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>💻</span>
          <div className={styles.statInfo}>
            <h3>{languages.length}</h3>
            <p>Languages</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>👨‍🎓</span>
          <div className={styles.statInfo}>
            <h3>{courses.reduce((acc, c) => acc + c.enrolled, 0)}</h3>
            <p>Total Enrolled</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>✅</span>
          <div className={styles.statInfo}>
            <h3>{courses.filter(c => c.status === 'Active').length}</h3>
            <p>Active Courses</p>
          </div>
        </div>
      </div>

      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'courses' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses / Lessons
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'languages' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('languages')}
        >
          💻 Programming Languages
        </button>
      </div>

      {activeTab === 'courses' && (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Courses & Lessons</h2>
            <button className={styles.addBtn} onClick={() => setShowAddCourse(true)}>
              + Add Course
            </button>
          </div>

          {showAddCourse && (
            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Course Title"
                className={styles.inputField}
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
              />
              <select
                className={styles.selectField}
                value={newCourse.language}
                onChange={(e) => setNewCourse({...newCourse, language: e.target.value})}
              >
                {languages.map(lang => (
                  <option key={lang.id} value={lang.name}>{lang.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Number of Lessons"
                className={styles.inputField}
                value={newCourse.lessons}
                onChange={(e) => setNewCourse({...newCourse, lessons: parseInt(e.target.value) || 0})}
              />
              <button className={styles.saveBtn} onClick={addCourse}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddCourse(false)}>Cancel</button>
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Language</th>
                  <th>Lessons</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>
                      <span className={styles.languageBadge}>
                        {course.language}
                      </span>
                    </td>
                    <td>{course.lessons}</td>
                    <td>{course.enrolled}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${course.status === 'Active' ? styles.activeStatus : styles.draftStatus}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.editBtn}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => deleteCourse(course.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'languages' && (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Programming Languages</h2>
            <button className={styles.addBtn} onClick={() => setShowAddLanguage(true)}>
              + Add Language
            </button>
          </div>

          {showAddLanguage && (
            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Language Name"
                className={styles.inputField}
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Icon (emoji)"
                className={styles.inputField}
                value={newLanguage.icon}
                onChange={(e) => setNewLanguage({...newLanguage, icon: e.target.value})}
              />
              <button className={styles.saveBtn} onClick={addLanguage}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddLanguage(false)}>Cancel</button>
            </div>
          )}

          <div className={styles.languagesGrid}>
            {languages.map(lang => (
              <div key={lang.id} className={styles.languageCard}>
                <div className={styles.languageIcon} style={{ backgroundColor: lang.color }}>
                  {lang.icon}
                </div>
                <h3>{lang.name}</h3>
                <p>{lang.courses} courses</p>
                <p className={styles.studentCount}>{lang.students} students</p>
                <div className={styles.cardActions}>
                  <button className={styles.editBtn}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => deleteLanguage(lang.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
