import React, { useState } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

// ─── Replace this with your real Google Client ID ───────────────────────────
// Get it from: https://console.cloud.google.com → APIs & Services → Credentials
 
// ────────────────────────────────────────────────────────────────────────────

const SignUp = ({ isDarkMode, toggleTheme, onSignUp, onLogin, onHome }) => {
  const [formData, setFormData]           = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

  

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
      const res  = await fetch('http://localhost:5000/api/auth/register', {
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

      onSignUp(data.user); // { id, name, username, email, photo }
    } catch {
      setError('Cannot reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
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

          
        </div>
      </main>
    </div>
  );
};

export default SignUp;