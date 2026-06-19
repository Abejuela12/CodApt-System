 import React, { useState } from 'react';
import styles from './AdminCourses.module.css';

const AdminCourses = () => {
  const [courses, setCourses] = useState([
    { id: 1, title: "Python Basics", language: "Python", lessons: 12, status: "Active", enrolled: 450 },
    { id: 2, title: "JavaScript Fundamentals", language: "JavaScript", lessons: 15, status: "Active", enrolled: 380 },
    { id: 3, title: "Java OOP", language: "Java", lessons: 10, status: "Active", enrolled: 220 },
    { id: 4, title: "Python Advanced", language: "Python", lessons: 8, status: "Draft", enrolled: 0 },
    { id: 5, title: "React.js Basics", language: "JavaScript", lessons: 18, status: "Active", enrolled: 290 },
    { id: 6, title: "Data Structures", language: "Python", lessons: 20, status: "Active", enrolled: 180 },
    { id: 7, title: "Java Spring Boot", language: "Java", lessons: 14, status: "Active", enrolled: 150 },
    { id: 8, title: "Node.js Backend", language: "JavaScript", lessons: 12, status: "Active", enrolled: 200 },
    { id: 9, title: "Machine Learning Intro", language: "Python", lessons: 16, status: "Draft", enrolled: 0 },
    { id: 10, title: "Android Development", language: "Java", lessons: 22, status: "Active", enrolled: 95 },
    { id: 11, title: "Python GUI Programming", language: "Python", lessons: 10, status: "Active", enrolled: 75 },
    { id: 12, title: "ES6 JavaScript", language: "JavaScript", lessons: 8, status: "Active", enrolled: 120 },
  ]);

  const [languages, setLanguages] = useState([
    { id: 1, name: "Python", icon: "🐍", color: "#3776AB", courses: 4, students: 725 },
    { id: 2, name: "JavaScript", icon: "📜", color: "#F7DF1E", courses: 4, students: 990 },
    { id: 3, name: "Java", icon: "☕", color: "#007396", courses: 4, students: 545 },
  ]);

  const [activeTab, setActiveTab] = useState('courses');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', language: 'Python', lessons: 0 });
  const [newLanguage, setNewLanguage] = useState({ name: '', icon: '' });

  const addCourse = () => {
    if (newCourse.title) {
      const course = {
        id: courses.length + 1,
        ...newCourse,
        status: "Active",
        enrolled: 0
      };
      setCourses([...courses, course]);
      setNewCourse({ title: '', language: 'Python', lessons: 0 });
      setShowAddCourse(false);
    }
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  const addLanguage = () => {
    if (newLanguage.name && newLanguage.icon) {
      const language = {
        id: languages.length + 1,
        ...newLanguage,
        color: "#2D58A6",
        courses: 0,
        students: 0
      };
      setLanguages([...languages, language]);
      setNewLanguage({ name: '', icon: '' });
      setShowAddLanguage(false);
    }
  };

  const deleteLanguage = (id) => {
    setLanguages(languages.filter(lang => lang.id !== id));
  };

  return (
    <div className={styles.coursesPanelWrapper}>
      <h1 className={styles.panelTitle}>Content Management</h1>

      <div className={styles.statsRow}>
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
