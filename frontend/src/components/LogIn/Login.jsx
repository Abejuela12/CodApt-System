import React, { useState } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

import { API_BASE_URL } from '../../config';

const Login = ({ isDarkMode, toggleTheme, onLogin, onSignUp, onHome }) => {
  const [formData, setFormData]           = useState({ email: '', password: '' });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword]   = useState(false);

  /* ── Email / Password Login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: formData.email, password: formData.password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        setError(`Server returned status ${res.status}. Ensure DATABASE_URL is set in Vercel environment variables.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      onLogin(data.user);
    } catch (err) {
      setError('Cannot reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // BUG FIX: any active loading state
  const isAnyLoading = loading;

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
            Logging in…
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

          {/* ── User Form ── */}
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
                <div className={styles.passwordInputWrap}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={styles.inputField}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className={styles.eyeIcon} aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                        <path d="M9.88 4.78A10.7 10.7 0 0 1 12 4.5c4.5 0 8.2 2.9 9.4 7.2a14.8 14.8 0 0 1-3.2 4.7" />
                        <path d="M6.2 6.2A14.2 14.2 0 0 0 2.6 11.7c1.2 4.3 4.9 7.2 9.4 7.2a10.7 10.7 0 0 0 3.1-.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className={styles.eyeIcon} aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

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
        </>
      </div>
      </main>
    </div>
  );
};

export default Login;