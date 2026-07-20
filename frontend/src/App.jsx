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
  const [savedTaskIndices, setSavedTaskIndices] = useState({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const [userData, setUserData] = useState(EMPTY_USER);
  const [progress, setProgress] = useState({});
  const [justMasteredConcept, setJustMasteredConcept] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
    setIsAdmin(false);
    setUserData(EMPTY_USER);
    setProgress({});
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
  const fetchAndSetProgress = async (userId) => {
    if (!userId) return;
    try {
      const res  = await fetch(`http://localhost:5000/api/progress/${userId}`);
      const data = await res.json();
      if (data && typeof data === 'object') setProgress(data);
    } catch {}
  };

  const handleSignUp = (user) => {
    setUserData(user);
    fetchAndSetProgress(user?.id);
    goToLanguages();
  };

  const handleLogin = (loginData) => {
    if (loginData?.isAdmin) { setIsAdmin(true); goToAdmin(); return; }
    setUserData(loginData);
    fetchAndSetProgress(loginData?.id);
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
                    }
                  }
                };
              });

              // Background sync for accurate data (profile chart, etc.)
              if (userData?.id) {
                fetch(`http://localhost:5000/api/progress/${userData.id}`)
                  .then(r => r.json())
                  .then(data => setProgress(data))
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