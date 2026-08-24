import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageCards from './components/Cards/LanguageCards';
import ConceptModal from './components/Cards/ConceptModal';
import CodeEditor from './components/CodeEditors/CodeEditor';
import ProfilePage from './components/Profile/ProfilePage';
import LandingPage from './components/LandingPage/LandingPage';
import SignUp from './components/LogIn/SignUp';
import Login from './components/LogIn/Login';
import ChooseLevelModal from './components/Cards/ChooseLevelModal';
import AdminDashboard from './components/Admin-Dashboard/AdminDashboard';
import { API_BASE_URL } from './config';
import { isConceptMastered, getConceptTotalTaskCount } from './components/Profile/profileLogic';
import './App.css';

const EMPTY_USER = {
  id: null,
  name: '',
  username: '',
  email: '',
  photo: null
};

const getProgressStorageKey = (userId) => `codapt_progress_${userId || 'guest'}`;
const getTaskIndexStorageKey = (userId) => `codapt_task_indices_${userId || 'guest'}`;

const readStoredProgress = (userId) => {
  if (!userId || typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getProgressStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveStoredProgress = (userId, progressData) => {
  if (!userId || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getProgressStorageKey(userId), JSON.stringify(progressData || {}));
  } catch {
    // Ignore storage quota issues: the app should still continue working in-memory.
  }
};

const readStoredTaskIndices = (userId) => {
  if (!userId || typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getTaskIndexStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveStoredTaskIndices = (userId, taskIndices) => {
  if (!userId || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getTaskIndexStorageKey(userId), JSON.stringify(taskIndices || {}));
  } catch {
    // Ignore storage quota issues: the app should still continue working in-memory.
  }
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Determine current page from URL
  const currentPage = location.pathname === '/' ? 'landing'
    : location.pathname === '/signup' ? 'signup'
      : location.pathname === '/login' ? 'login'
        : location.pathname.startsWith('/admin') ? 'admin'
          : location.pathname === '/profile' ? 'profile'
            : 'languages';

  const [selectedLang, setSelectedLang] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Tracks the last task index per concept so "Back" resumes where you left off
  // Shape: { [language]: { [concept]: taskIndex } }
  const [savedTaskIndices, setSavedTaskIndices] = useState(() => readStoredTaskIndices(EMPTY_USER.id));
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const [userData, setUserData] = useState(EMPTY_USER);
  const [progress, setProgress] = useState(() => readStoredProgress(EMPTY_USER.id));
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [justMasteredConcept, setJustMasteredConcept] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (userData?.id) {
      const storedIndices = readStoredTaskIndices(userData.id);
      setSavedTaskIndices(storedIndices);
    } else {
      setSavedTaskIndices({});
    }
  }, [userData?.id]);

  useEffect(() => {
    if (userData?.id && Object.keys(progress || {}).length > 0) {
      saveStoredProgress(userData.id, progress);
    }
  }, [progress, userData?.id]);

  useEffect(() => {
    if (userData?.id) {
      saveStoredTaskIndices(userData.id, savedTaskIndices);
    }
  }, [savedTaskIndices, userData?.id]);

  const saveTaskIndex = (lang, concept, index) => {
    setSavedTaskIndices(prev => {
      const next = {
        ...prev,
        [lang]: { ...prev[lang], [concept]: index }
      };
      if (userData?.id) saveStoredTaskIndices(userData.id, next);
      return next;
    });
  };

  const handleCompleteTask = (language, concept, taskId) => {
    setProgress(prev => {
      const catalogCount = getConceptTotalTaskCount(language, concept, selectedLevel || 'Beginner');
      const existing = prev?.[language]?.[concept] || {};
      const totalTasks = catalogCount;
      const tasksCompleted = Math.max(existing.tasksCompleted || 0, taskId);
      const successRate = Math.round((tasksCompleted / totalTasks) * 100);
      const next = {
        ...prev,
        [language]: {
          ...prev[language],
          [concept]: {
            ...existing,
            tasksCompleted,
            totalTasks,
            successRate: Math.max(existing.successRate || 0, successRate),
            mastered: tasksCompleted >= totalTasks && successRate >= 60,
          }
        }
      };
      if (userData?.id) saveStoredProgress(userData.id, next);
      return next;
    });
  };

  const handleSaveProfile = async (formData) => {
    if (!userData.id) { setUserData(formData); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/${userData.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) setUserData({ ...data.user, id: userData.id });
    } catch {
      setUserData(formData);
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogout = () => {
    if (userData?.id) {
      const finalTaskIndices = selectedLang && selectedConcept != null
        ? {
          ...savedTaskIndices,
          [selectedLang]: {
            ...savedTaskIndices[selectedLang],
            [selectedConcept]: currentTaskIndex
          }
        }
        : savedTaskIndices;

      saveStoredProgress(userData.id, progress);
      saveStoredTaskIndices(userData.id, finalTaskIndices);
      setSavedTaskIndices(finalTaskIndices);
    }

    setIsAdmin(false);
    setUserData(EMPTY_USER);
    setProgress({});
    setProgressLoading(false);
    setProgressLoaded(false);
    setSelectedLang(null);
    setSelectedLevel(null);
    setSelectedConcept(null);
    setCurrentTaskIndex(0);
    setSavedTaskIndices({});
    goToLanding();
  };

  const handleDeleteAccount = async () => {
    if (!userData?.id) throw new Error('User ID not found.');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/delete-account/${userData.id}`, {
        method: 'DELETE'
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse response:', res.status, res.statusText);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to delete account.');
      }
    } catch (err) {
      console.error('Delete account failed:', err);
      throw err;
    }

    handleLogout();
  };

  const goToAdmin = () => navigate('/admin');
  const goToLanding = () => navigate('/');
  const goToSignUp = () => navigate('/signup');
  const goToLogin = () => navigate('/login');
  const goToLanguages = () => navigate('/languages');
  const goToProfile = () => navigate('/profile');
  const goToAdminSettings = () => navigate('/admin/settings');

  const mergeProgressWithMastery = (prevProgress = {}, serverProgress = {}) => {
    if (!serverProgress || typeof serverProgress !== 'object') return prevProgress;
    const merged = { ...serverProgress };
    Object.keys(prevProgress || {}).forEach(lang => {
      if (!merged[lang]) merged[lang] = { ...prevProgress[lang] };
      else {
        merged[lang] = { ...merged[lang] };
        Object.keys(prevProgress[lang] || {}).forEach(concept => {
          const prevEntry = prevProgress[lang][concept];
          const serverEntry = merged[lang][concept];
          const isMasteredLocally = prevEntry?.mastered === true || isConceptMastered(prevProgress, lang, concept);
          if (isMasteredLocally) {
            merged[lang][concept] = {
              ...serverEntry,
              ...prevEntry,
              mastered: true,
              tasksCompleted: Math.max(prevEntry?.tasksCompleted || 0, serverEntry?.tasksCompleted || 0),
              totalTasks: prevEntry?.totalTasks || serverEntry?.totalTasks || 1,
              successRate: Math.max(prevEntry?.successRate || 0, serverEntry?.successRate || 0),
            };
          }
        });
      }
    });
    return merged;
  };

  // Fetch progress from server and store it — called after login/signup
  const fetchAndSetProgress = async (userId) => {
    setProgressLoaded(false);

    const cachedProgress = readStoredProgress(userId);
    if (userId && Object.keys(cachedProgress).length > 0) {
      setProgress(cachedProgress);
    } else {
      setProgress({});
    }

    if (!userId) {
      setProgressLoading(false);
      return false;
    }

    setProgressLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/progress/${userId}`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        setProgress(prev => {
          const merged = mergeProgressWithMastery(prev, data);
          saveStoredProgress(userId, merged);
          return merged;
        });
      }
      // Also restore task indices after loading progress
      setSavedTaskIndices(readStoredTaskIndices(userId));
      return true;
    } catch (err) {
      console.error('Failed to load progress:', err);
      if (userId && Object.keys(cachedProgress).length > 0) {
        setProgress(cachedProgress);
      } else {
        setProgress({});
      }
      return false;
    } finally {
      setProgressLoading(false);
      setProgressLoaded(true);
    }
  };

  const handleSignUp = async (user) => {
    setUserData(user);
    setSavedTaskIndices(readStoredTaskIndices(user?.id));
    await fetchAndSetProgress(user?.id);
    goToLanguages();
  };

  const handleLogin = async (loginData) => {
    if (loginData?.isAdmin) { setIsAdmin(true); goToAdmin(); return; }
    setUserData(loginData);
    setSavedTaskIndices(readStoredTaskIndices(loginData?.id));
    await fetchAndSetProgress(loginData?.id);
    goToLanguages();
  };

  if (currentPage === 'landing') return (
    <LandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme}
      onSignUp={goToSignUp} onLogin={goToLogin} onGetStarted={goToSignUp} />
  );
  if (currentPage === 'signup') return (
    <SignUp isDarkMode={isDarkMode} toggleTheme={toggleTheme}
      onSignUp={handleSignUp} onLogin={goToLogin} onHome={goToLanding} />
  );
  if (currentPage === 'login') return (
    <Login isDarkMode={isDarkMode} toggleTheme={toggleTheme}
      onLogin={handleLogin} onSignUp={goToSignUp} onHome={goToLanding} />
  );
  if (currentPage === 'admin') return (
    <AdminDashboard
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      userData={userData}
      onProfileClick={goToAdminSettings}
      onLogout={handleLogout}
    />
  );
  if (currentPage === 'profile') return (
    <ProfilePage userData={userData} onSave={handleSaveProfile} onDeleteAccount={handleDeleteAccount}
      isDarkMode={isDarkMode} toggleTheme={toggleTheme}
      onHomeClick={goToLanguages} onLogout={handleLogout} progress={progress} />
  );

  return (
    <div className="App">
      {!selectedConcept && (
        <>
          <LanguageCards
            onSelect={(lang) => {
              setSelectedLang(lang);
              setSelectedLevel(null);
              setSelectedConcept(null);
              setCurrentTaskIndex(0);
            }}
            isDarkMode={isDarkMode} toggleTheme={toggleTheme}
            onProfileClick={goToProfile} onHomeClick={goToLanguages}
            onLogout={handleLogout} userData={userData}
          />

          {selectedLang && selectedLevel === null && (
            <ChooseLevelModal
              language={selectedLang}
              onSelectLevel={(level) => setSelectedLevel(level)}
              onClose={() => setSelectedLang(null)}
            />
          )}

          {selectedLang && selectedLevel !== null && (
            <ConceptModal
              language={selectedLang}
              level={selectedLevel}
              progress={progress}
              justMasteredConcept={justMasteredConcept}
              onSelect={(concept) => {
                // Restore saved task index for this concept, or start at 0
                const restored = savedTaskIndices?.[selectedLang]?.[concept] ?? 0;
                setCurrentTaskIndex(restored);
                setSelectedConcept(concept);
              }}
              onClose={() => { setSelectedLevel(null); setJustMasteredConcept(null); }}
            />
          )}
        </>
      )}

      {selectedConcept && (
        <CodeEditor
          language={selectedLang}
          concept={selectedConcept}
          level={selectedLevel}
          onBack={() => {
            // Save current task index before going back so we can resume
            saveTaskIndex(selectedLang, selectedConcept, currentTaskIndex);
            setSelectedConcept(null);
          }}
          onProfileClick={goToProfile}
          onHomeClick={goToLanguages}
          onLogout={handleLogout}
          onCompleteTask={handleCompleteTask}
          userData={userData}
          isDarkMode={isDarkMode}
          progress={progress}
          currentTaskIndex={currentTaskIndex}
          onNextTask={(nextIndex, masteredConcept = null) => {
            if (nextIndex === 'Complete!') {
              const conceptName = masteredConcept || selectedConcept;

              if (userData?.id) {
                fetch(`${API_BASE_URL}/api/progress/${userData.id}`)
                  .then(r => r.json())
                  .then(data => {
                    if (data && typeof data === 'object') {
                      setProgress(prev => {
                        const merged = mergeProgressWithMastery(prev, data);
                        saveStoredProgress(userData.id, merged);
                        if (isConceptMastered(merged, selectedLang, conceptName)) {
                          setJustMasteredConcept(conceptName);
                        } else {
                          setJustMasteredConcept(null);
                        }
                        return merged;
                      });
                    }
                  })
                  .catch(() => {
                    if (isConceptMastered(progress, selectedLang, conceptName)) {
                      setJustMasteredConcept(conceptName);
                    } else {
                      setJustMasteredConcept(null);
                    }
                  });
              } else {
                if (isConceptMastered(progress, selectedLang, conceptName)) {
                  setJustMasteredConcept(conceptName);
                } else {
                  setJustMasteredConcept(null);
                }
              }

              setSavedTaskIndices(prev => ({
                ...prev,
                [selectedLang]: { ...prev[selectedLang], [selectedConcept]: 0 }
              }));
              setCurrentTaskIndex(0);
              setSelectedConcept(null);
              return;
            }

            saveTaskIndex(selectedLang, selectedConcept, nextIndex);
            setCurrentTaskIndex(nextIndex);
          }}
        />
      )}
    </div>
  );
}

export default App;