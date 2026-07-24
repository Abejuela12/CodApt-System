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
import './App.css';

const EMPTY_USER = {
  id:       null,
  name:     '',
  username: '',
  email:    '',
  photo:    null
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
  const [isDarkMode, setIsDarkMode]   = useState(false);

  // Determine current page from URL
  const currentPage = location.pathname === '/' ? 'landing'
    : location.pathname === '/signup' ? 'signup'
    : location.pathname === '/login' ? 'login'
    : location.pathname.startsWith('/admin') ? 'admin'
    : location.pathname === '/profile' ? 'profile'
    : 'languages';

  const [selectedLang, setSelectedLang]       = useState(null);
  const [selectedLevel, setSelectedLevel]     = useState(null);
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
    setSavedTaskIndices(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [concept]: index }
    }));
  };

  const handleCompleteTask = (language, concept, taskId) => {
    setProgress(prev => {
      const existing = prev?.[language]?.[concept] || {};
      const totalTasks = existing.totalTasks || 3;
      return {
        ...prev,
        [language]: {
          ...prev[language],
          [concept]: {
            ...existing,
            tasksCompleted: Math.max(existing.tasksCompleted || 0, taskId),
            totalTasks,
            successRate: Math.max(existing.successRate || 0, Math.round((taskId / totalTasks) * 100)),
          }
        }
      };
    });
  };

  const handleSaveProfile = async (formData) => {
    if (!userData.id) { setUserData(formData); return; }
    try {
      const res  = await fetch(`http://localhost:5000/api/auth/profile/${userData.id}`, {
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
      const res = await fetch(`http://localhost:5000/api/auth/delete-account/${userData.id}`, {
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

  const goToAdmin         = () => navigate('/admin');
  const goToLanding       = () => navigate('/');
  const goToSignUp        = () => navigate('/signup');
  const goToLogin         = () => navigate('/login');
  const goToLanguages     = () => navigate('/languages');
  const goToProfile       = () => navigate('/profile');
  const goToAdminSettings = () => navigate('/admin/settings');

  // Fetch progress from server and store it — called after login/signup
  const mergeProgress = (existing = {}, fresh = {}) => {
    const merged = { ...existing };

    Object.entries(fresh || {}).forEach(([lang, concepts]) => {
      merged[lang] = { ...existing[lang], ...concepts };
    });

    Object.entries(existing || {}).forEach(([lang, concepts]) => {
      Object.entries(concepts || {}).forEach(([concept, data]) => {
        if (data?.mastered) {
          merged[lang] = { ...merged[lang], [concept]: { ...merged[lang]?.[concept], ...data } };
        }
      });
    });

    return merged;
  };

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
      const res  = await fetch(`http://localhost:5000/api/progress/${userId}`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        setProgress(prev => {
          const merged = mergeProgress(prev, data);
          saveStoredProgress(userId, merged);
          return merged;
        });
      }
      // Also restore task indices after loading progress
      setSavedTaskIndices(readStoredTaskIndices(userId));
      return true;
    } catch (err) {
      console.error('Failed to load progress:', err);
      return false;
    } finally {
      setProgressLoading(false);
      setProgressLoaded(true);
    }
  };

  const handleSignUp = async (user) => {
    setUserData(user);
    setSavedTaskIndices(readStoredTaskIndices(user?.id));
    const loaded = await fetchAndSetProgress(user?.id);
    if (loaded) goToLanguages();
  };

  const handleLogin = async (loginData) => {
    if (loginData?.isAdmin) { setIsAdmin(true); goToAdmin(); return; }
    setUserData(loginData);
    setSavedTaskIndices(readStoredTaskIndices(loginData?.id));
    const loaded = await fetchAndSetProgress(loginData?.id);
    if (loaded) goToLanguages();
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

              // ── Optimistic update: mark mastered BEFORE setSelectedConcept(null) ──
              // ConceptModal mounts synchronously after that call, so progress must
              // already reflect mastery or the lock won't appear until the async
              // server fetch resolves (~200–500 ms later).
              setJustMasteredConcept(conceptName);
              setProgress(prev => {
                const existing = prev?.[selectedLang]?.[conceptName] || {};
                return {
                  ...prev,
                  [selectedLang]: {
                    ...prev[selectedLang],
                    [conceptName]: {
                      ...existing,
                      tasksCompleted: existing.totalTasks || existing.tasksCompleted || 3,
                      totalTasks:     existing.totalTasks || 3,
                      // Ensure value meets the >= 60 mastery threshold in isMasteredConcept
                      successRate:    Math.max(existing.successRate || 0, 60),
                      mastered:       true,
                    }
                  }
                };
              });

              // Background sync for accurate data (profile chart, etc.)
              if (userData?.id) {
                fetch(`http://localhost:5000/api/progress/${userData.id}`)
                  .then(r => r.json())
                  .then(data => setProgress(prev => mergeProgress(prev, data)))
                  .catch(() => {});
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