import React, { useState, useEffect } from 'react';
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

// Empty user — used on logout and initial load
const EMPTY_USER = {
  id:       null,   // ← real DB id stored here after login
  name:     '',
  username: '',
  email:    '',
  photo:    null
};

function App() {
  const [isDarkMode, setIsDarkMode]       = useState(false);
  const [currentPage, setCurrentPage]     = useState('landing');

  const [selectedLang, setSelectedLang]       = useState(null);
  const [selectedLevel, setSelectedLevel]     = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // userData now always has an `id` field that comes from the database
  const [userData, setUserData] = useState(EMPTY_USER);

  // Progress is tracked in state and updated after each correct submission
  const [progress, setProgress] = useState({});

  // Apply dark/light theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      isDarkMode ? 'dark' : 'light'
    );
  }, [isDarkMode]);

  // Called by CodeEditor after a correct submission
  const handleCompleteTask = (language, concept, taskId) => {
    setProgress(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [concept]: {
          tasksCompleted: Math.max(
            prev[language]?.[concept]?.tasksCompleted || 0,
            taskId
          ),
          totalTasks:  3,
          successRate: Math.round((taskId / 3) * 100),
          avgAttempts: prev[language]?.[concept]?.avgAttempts || 0
        }
      }
    }));
  };

  // Called by ProfilePage save button
  const handleSaveProfile = async (formData) => {
    if (!userData.id) {
      // No DB id — just update local state (shouldn't happen in normal flow)
      setUserData(formData);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/profile/${userData.id}`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(formData)
        }
      );
      const data = await res.json();
      if (data.success) {
        setUserData({ ...data.user, id: userData.id });
      }
    } catch {
      // If backend is unreachable, still update local state
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
    goToLanding();
  };

  // ── Navigation helpers ──────────────────────────────────────────
  const goToAdmin    = () => setCurrentPage('admin');
  const goToLanding  = () => setCurrentPage('landing');
  const goToSignUp   = () => setCurrentPage('signup');
  const goToLogin    = () => setCurrentPage('login');
  const goToLanguages = () => setCurrentPage('languages');
  const goToProfile  = () => setCurrentPage('profile');

  // ── Auth handlers ───────────────────────────────────────────────

  // SignUp passes the user object returned by POST /api/auth/register
  const handleSignUp = (user) => {
    setUserData(user);   // user.id is the real DB id
    goToLanguages();
  };

  // Login passes the user object returned by POST /api/auth/login
  // OR { isAdmin: true } for the admin shortcut
  const handleLogin = (loginData) => {
    if (loginData?.isAdmin) {
      setIsAdmin(true);
      goToAdmin();
      return;
    }
    setUserData(loginData);  // loginData.id is the real DB id
    goToLanguages();
  };

  // ── Page routing ────────────────────────────────────────────────
  if (currentPage === 'landing') {
    return (
      <LandingPage
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSignUp={goToSignUp}
        onLogin={goToLogin}
        onGetStarted={goToSignUp}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignUp
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSignUp={handleSignUp}
        onLogin={goToLogin}
        onHome={goToLanding}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <Login
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onLogin={handleLogin}
        onSignUp={goToSignUp}
        onHome={goToLanding}
      />
    );
  }

  if (currentPage === 'admin') {
    return (
      <AdminDashboard
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentPage === 'profile') {
    return (
      <ProfilePage
        userData={userData}
        onSave={handleSaveProfile}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onHomeClick={goToLanguages}
        onLogout={handleLogout}
        progress={progress}
      />
    );
  }

  // ── Main learning flow ──────────────────────────────────────────
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
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onProfileClick={goToProfile}
            onHomeClick={goToLanguages}
            onLogout={handleLogout}
            userData={userData}
            progress={progress}
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
              onSelect={(concept) => {
                setCurrentTaskIndex(0);
                setSelectedConcept(concept);
              }}
              onClose={() => setSelectedLevel(null)}
            />
          )}
        </>
      )}

      {selectedConcept && (
        <CodeEditor
          language={selectedLang}
          concept={selectedConcept}
          level={selectedLevel}
          onBack={() => setSelectedConcept(null)}
          onProfileClick={goToProfile}
          onHomeClick={goToLanguages}
          onLogout={handleLogout}
          onCompleteTask={handleCompleteTask}
          userData={userData}        // includes userData.id from DB
          isDarkMode={isDarkMode}
          progress={progress}
          currentTaskIndex={currentTaskIndex}
          onNextTask={(nextIndex) => {
            if (nextIndex === 'Complete!') {
              setCurrentTaskIndex(0);
              setSelectedConcept(null);
              setSelectedLevel(null);
              return;
            }
            setCurrentTaskIndex(nextIndex);
          }}
        />
      )}

    </div>
  );
}

export default App;