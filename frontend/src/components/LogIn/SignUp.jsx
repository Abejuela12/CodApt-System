import React, { useState, useEffect } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Replace this with your real Google Client ID ───────────────────────────
// Get it from: https://console.cloud.google.com → APIs & Services → Credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
// ────────────────────────────────────────────────────────────────────────────

const SignUp = ({ isDarkMode, toggleTheme, onSignUp, onLogin, onHome }) => {
  const [formData, setFormData]           = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  /* ── Email / Password Sign Up ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     formData.email.split('@')[0],
          username: formData.email.split('@')[0],
          email:    formData.email,
          password: formData.password,
          photo:    null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Sign up failed. Please try again.');
        return;
      }

      onSignUp({ ...data.user, token: data.token }); // { id, name, username, email, photo, token }
    } catch {
      setError('Cannot reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Sign Up ── */
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
          // 1. Get user info from Google
          const infoRes  = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const userInfo = await infoRes.json();

          // 2. Send to backend → will register if new, login if existing
          const res  = await fetch(`${API_BASE}/api/auth/google`, {
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
            setError(data.error || 'Google sign-up failed.');
            return;
          }

          onSignUp({ ...data.user, token: data.token });
        } catch {
          setError('Something went wrong during Google sign-up.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className={styles.container}>
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
          <button onClick={onLogin} className={styles.signUpBtn}>
            Log In
          </button>
        </div>
      </nav>

      {/* Auth Card */}
      <main className={styles.main}>
        <div className={styles.authCard}>
          <img src="/Welcome.png" alt="Welcome!" className={styles.welcomeImage} />

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
            <input
              type="password"
              placeholder="Confirm Password"
              className={styles.inputField}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              disabled={loading || googleLoading}
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className={styles.footerText}>
            By signing up, I agree to CodApt{' '}
            <a href="#" className={styles.link}>Terms</a>
          </p>

          <p className={styles.footerText}>
            Already have an account?{' '}
            <span className={styles.link} onClick={onLogin}>Login</span>
          </p>

          {/* Google Button */}
          <button
            className={styles.googleBtn}
            onClick={handleGoogleClick}
            disabled={loading || googleLoading}
            style={{ opacity: googleLoading ? 0.75 : 1 }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width="18"
              alt="G"
            />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SignUp;