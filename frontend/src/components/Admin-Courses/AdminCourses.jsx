 import React, { useState, useEffect } from 'react';
import styles from './AdminCourses.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const languageIconMap = {
  Python: '🐍',
  JavaScript: '📜',
  Java: '☕',
};

const languageColorMap = {
  Python: '#3776AB',
  JavaScript: '#F7DF1E',
  Java: '#007396',
};

const difficulties = ['Easy', 'Medium', 'Hard'];
const tiers = ['Beginner', 'Intermediate', 'Advanced'];

const AdminCourses = () => {
  const [problems, setProblems] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeTab, setActiveTab] = useState('problems');
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '',
    language: 'Python',
    concept: '',
    difficulty: 'Easy',
    problem_tier: 'Beginner',
    instruction: '',
    expected_output: ''
  });
  const [newLanguage, setNewLanguage] = useState({ name: '', icon: '' });

  const fetchProblems = async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/problems`);
    if (!res.ok) throw new Error('Failed to load problems');
    return res.json();
  };

  const fetchLanguages = async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/content`);
    if (!res.ok) throw new Error('Failed to load languages');
    const data = await res.json();
    return data.languages || [];
  };

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const [problemsData, languagesData] = await Promise.all([
          fetchProblems(),
          fetchLanguages()
        ]);
        setProblems(problemsData);
        setLanguages(languagesData);
      } catch (err) {
        console.error('Failed to load admin content:', err);
        setFetchError('Could not load content data from the server.');
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  const saveProblem = async () => {
    if (!newProblem.title || !newProblem.concept) {
      setFetchError('Problem title and concept are required.');
      return;
    }

    try {
      if (isEditing && editingId) {
        const res = await fetch(`${API_BASE_URL}/api/admin/problems/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProblem)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update problem');
        }
        const updated = await res.json();
        setProblems(problems.map(p => (p.id === editingId ? updated : p)));
        setIsEditing(false);
        setEditingId(null);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/admin/problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProblem)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create problem');
        }
        const createdProblem = await res.json();
        setProblems([createdProblem, ...problems]);
      }

      setNewProblem({
        title: '',
        language: 'Python',
        concept: '',
        difficulty: 'Easy',
        problem_tier: 'Beginner',
        instruction: '',
        expected_output: ''
      });
      setShowAddProblem(false);
      setFetchError('');
    } catch (err) {
      console.error('Failed to save problem:', err);
      setFetchError(err.message || 'Could not save problem.');
    }
  };

  const deleteProblem = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete problem');
      }
      setProblems(problems.filter(problem => problem.id !== id));
      setFetchError('');
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setFetchError(err.message || 'Could not delete problem.');
    }
  };

  const addLanguage = () => {
    if (newLanguage.name && newLanguage.icon) {
      const language = {
        id: languages.length + 1,
        ...newLanguage,
        color: '#2D58A6',
        courses: 0,
        students: 0,
      };
      setLanguages([...languages, language]);
      setNewLanguage({ name: '', icon: '' });
      setShowAddLanguage(false);
      setFetchError('');
    }
  };

  const deleteLanguage = (id) => {
    setLanguages(languages.filter(lang => lang.id !== id));
  };

  const uniqueConceptCount = new Set(problems.map(problem => problem.concept)).size;
  const beginnerCount = problems.filter(problem => problem.problem_tier === 'Beginner').length;

  return (
    <div className={styles.coursesPanelWrapper}>
      <h1 className={styles.panelTitle}>Content Management</h1>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>📚</span>
          <div className={styles.statInfo}>
            <h3>{problems.length}</h3>
            <p>Total Problems</p>
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
          <span className={styles.statEmoji}>🧠</span>
          <div className={styles.statInfo}>
            <h3>{uniqueConceptCount}</h3>
            <p>Unique Concepts</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji}>✅</span>
          <div className={styles.statInfo}>
            <h3>{beginnerCount}</h3>
            <p>Beginner Problems</p>
          </div>
        </div>
      </div>
      {fetchError && <div className={styles.errorMessage}>{fetchError}</div>}
      {isLoading && <div className={styles.loading}>Loading admin content...</div>}

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'problems' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          🧩 Problems
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'languages' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('languages')}
        >
          💻 Programming Languages
        </button>
      </div>

      {activeTab === 'problems' && (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Problems</h2>
            <button
              className={styles.addBtn}
              onClick={() => {
                setShowAddProblem(true);
                setIsEditing(false);
                setEditingId(null);
                setNewProblem({
                  title: '',
                  language: 'Python',
                  concept: '',
                  difficulty: 'Easy',
                  problem_tier: 'Beginner',
                  instruction: '',
                  expected_output: ''
                });
              }}
            >
              + Add Problem
            </button>
          </div>

          {showAddProblem && (
            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Problem Title"
                className={styles.inputField}
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Concept"
                className={styles.inputField}
                value={newProblem.concept}
                onChange={(e) => setNewProblem({ ...newProblem, concept: e.target.value })}
              />
              <select
                className={styles.selectField}
                value={newProblem.language}
                onChange={(e) => setNewProblem({ ...newProblem, language: e.target.value })}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.name}>{lang.name}</option>
                ))}
              </select>
              <select
                className={styles.selectField}
                value={newProblem.difficulty}
                onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
              >
                {difficulties.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <select
                className={styles.selectField}
                value={newProblem.problem_tier}
                onChange={(e) => setNewProblem({ ...newProblem, problem_tier: e.target.value })}
              >
                {tiers.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
              <textarea
                placeholder="Instruction"
                className={styles.textareaField}
                value={newProblem.instruction}
                onChange={(e) => setNewProblem({ ...newProblem, instruction: e.target.value })}
              />
              <input
                type="text"
                placeholder="Expected Output"
                className={styles.inputField}
                value={newProblem.expected_output}
                onChange={(e) => setNewProblem({ ...newProblem, expected_output: e.target.value })}
              />
              <button className={styles.saveBtn} onClick={saveProblem}>{isEditing ? 'Update' : 'Save'}</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddProblem(false)}>Cancel</button>
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Problem Title</th>
                  <th>Language</th>
                  <th>Concept</th>
                  <th>Difficulty</th>
                  <th>Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr key={problem.id}>
                    <td>{problem.title}</td>
                    <td>
                      <span className={styles.languageBadge}>
                        {problem.language}
                      </span>
                    </td>
                    <td>{problem.concept}</td>
                    <td>{problem.difficulty}</td>
                    <td>{problem.problem_tier}</td>
                    <td>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setIsEditing(true);
                          setEditingId(problem.id);
                          setNewProblem({
                            title: problem.title || '',
                            language: problem.language || 'Python',
                            concept: problem.concept || '',
                            difficulty: problem.difficulty || 'Easy',
                            problem_tier: problem.problem_tier || 'Beginner',
                            instruction: problem.instruction || '',
                            expected_output: problem.expected_output || ''
                          });
                          setShowAddProblem(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteProblem(problem.id)}>
                        Delete
                      </button>
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
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Icon (emoji)"
                className={styles.inputField}
                value={newLanguage.icon}
                onChange={(e) => setNewLanguage({ ...newLanguage, icon: e.target.value })}
              />
              <button className={styles.saveBtn} onClick={addLanguage}>Save</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddLanguage(false)}>Cancel</button>
            </div>
          )}

          <div className={styles.languagesGrid}>
            {languages.map((lang) => (
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
