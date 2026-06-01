import React, { useState, useEffect } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const Login = ({ isDarkMode, toggleTheme, onLogin, onSignUp, onHome }) => {
  const [formData, setFormData]           = useState({ email: '', password: '' });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminFormData, setAdminFormData]   = useState({ email: '', password: '' });
  const [adminError, setAdminError]         = useState('');

  // Load Google Identity Services script once
  useEffect(() => {
    if (document.getElementById('gsi-script')) return;
    const script = document.createElement('script');
    script.id    = 'gsi-script';
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  /* ── Email / Password Login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      onLogin(data.user);
    } catch {
      setError('Cannot reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Login ── */
  const handleGoogleClick = () => {
    if (!window.google) {
      setError('Google sign-in is not ready yet. Please wait a moment and try again.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (!tokenResponse.access_token) {
          setError('Google sign-in was cancelled or failed.');
          setGoogleLoading(false);
          return;
        }

        try {
          const infoRes  = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const userInfo = await infoRes.json();

          const res  = await fetch('http://localhost:5000/api/auth/google', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              name:  userInfo.name    || 'User',
              email: userInfo.email   || '',
              photo: userInfo.picture || null,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error || 'Google login failed.');
            return;
          }

          onLogin(data.user);
        } catch {
          setError('Something went wrong during Google sign-in.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    client.requestAccessToken();
  };

  /* ── Admin Login ── */
  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (
      adminFormData.email    === 'admin@codapt.com' &&
      adminFormData.password === 'admin123'
    ) {
      setAdminError('');
      onLogin({ isAdmin: true });
    } else {
      setAdminError('Invalid admin credentials.');
    }
  };

  // BUG FIX: any active loading state
  const isAnyLoading = loading || googleLoading;

  return (
    <div className={styles.container}>

      {/* ── BUG FIX #3: Full-screen loading overlay ── */}
      {isAnyLoading && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          {/* Spinner ring */}
          <div style={{
            width: 52, height: 52,
            border: '5px solid rgba(255,255,255,0.2)',
            borderTopColor: '#ffcc00',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ marginTop: 16, color: '#fff', fontWeight: 700, fontSize: 15 }}>
            {googleLoading ? 'Connecting to Google…' : 'Logging in…'}
          </p>
          {/* Inline keyframe — avoids needing a separate CSS file */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Navbar */}
      <nav className={styles.navbar}>
        <img
          src="/CODAPT_LOGO.png"
          alt="CodApt"
          className={styles.logo}
          onClick={onHome}
        />
        <div className={styles.navRight}>
          <ThemeToggle isDarkMode={isDarkMode} onClick={toggleTheme} />
          <button onClick={onSignUp} className={styles.signUpBtn}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Auth Card */}
      <main className={styles.main}>
        <div className={styles.authCard}>
          <img src="/Welcome.png" alt="Welcome!" className={styles.welcomeImage} />

          {showAdminLogin ? (
            /* ── Admin Form ── */
            <form className={styles.form} onSubmit={handleAdminSubmit}>
              <p style={{ color: '#ff6b6b', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>
                🔐 Admin Login
              </p>

              <input
                type="email"
                placeholder="Admin Email"
                className={styles.inputField}
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Admin Password"
                className={styles.inputField}
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                required
              />

              {adminError && (
                <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '8px' }}>
                  {adminError}
                </p>
              )}

              <button type="submit" className={styles.submitBtn}>
                Login as Admin
              </button>

              <p className={styles.footerText}>
                <span
                  className={styles.link}
                  onClick={() => { setShowAdminLogin(false); setAdminError(''); }}
                >
                  ← Back to User Login
                </span>
              </p>
            </form>

          ) : (
            /* ── User Form ── */
            <>
              <form className={styles.form} onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email"
                  className={styles.inputField}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className={styles.inputField}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                {error && (
                  <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '4px' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isAnyLoading}
                  style={{ opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? 'Logging in…' : 'Login'}
                </button>
              </form>

              <p className={styles.footerText}>
                Don't have an account?{' '}
                <span className={styles.link} onClick={onSignUp}>Sign Up</span>
              </p>

              {/* Google Button */}
              <button
                className={styles.googleBtn}
                onClick={handleGoogleClick}
                disabled={isAnyLoading}
                style={{ opacity: googleLoading ? 0.75 : 1 }}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  width="18"
                  alt="G"
                />
                {googleLoading ? 'Connecting…' : 'Continue with Google'}
              </button>

              <hr style={{ marginTop: '20px', border: 'none', borderTop: '1px solid #ddd' }} />

              <p className={styles.footerText} style={{ marginTop: '15px' }}>
                Are you an admin?{' '}
                <button
                  className={styles.link}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setShowAdminLogin(true); setError(''); }}
                >
                  Login here
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;