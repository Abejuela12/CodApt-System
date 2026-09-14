import React, { useState } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

// ─── Replace this with your real Google Client ID ───────────────────────────
// Get it from: https://console.cloud.google.com → APIs & Services → Credentials

// ────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from '../../config';

const SignUp = ({ isDarkMode, toggleTheme, onSignUp, onLogin, onHome }) => {
  const [formData, setFormData]           = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAgreed, setTermsAgreed]     = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const res  = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
            <div className={styles.passwordInputWrap}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                className={styles.inputField}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" className={styles.eyeIcon} aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M9.88 4.78A10.7 10.7 0 0 1 12 4.5c4.5 0 2.9 2.9 9.4 7.2a14.8 14.8 0 0 1-3.2 4.7" />
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

            <label className={styles.termsRow}>
              <input
                type="checkbox"
                className={styles.termsCheck}
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
              />
              <span className={styles.termsText}>I agree to the Terms and Conditions</span>
            </label>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !termsAgreed}
              style={{ opacity: loading || !termsAgreed ? 0.75 : 1 }}
            >
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className={styles.footerText}>
            By signing up, I agree to CodApt{' '}
            <button type="button" className={styles.link} onClick={() => setShowTermsModal(true)}>
              Terms
            </button>
          </p>

          <p className={styles.footerText}>
            Already have an account?{' '}
            <span className={styles.link} onClick={onLogin}>Login</span>
          </p>

          {showTermsModal && (
            <div className={styles.termsModalOverlay} onClick={() => setShowTermsModal(false)}>
              <div className={styles.termsModalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.termsModalHeader}>
                  <h2 className={styles.termsModalTitle}>Terms and Conditions</h2>
                  <button
                    type="button"
                    className={styles.termsModalClose}
                    aria-label="Close Terms and Conditions"
                    onClick={() => setShowTermsModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.termsModalContent}>
                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>Acceptance of Terms</h3>
                    <p className={styles.termsTextBlock}>By creating a CodApt account, the user agrees to follow these Terms.</p>
                  </section>

                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>Use of CodApt</h3>
                    <p className={styles.termsTextBlock}>CodApt is a coding-learning system intended for learning and practice.</p>
                    <p className={styles.termsTextBlock}>Users should use the system responsibly and for its intended purpose.</p>
                  </section>

                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>User Account</h3>
                    <p className={styles.termsTextBlock}>Users are responsible for the information they provide.</p>
                    <p className={styles.termsTextBlock}>Users should keep their account credentials secure.</p>
                  </section>

                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>Learning Content</h3>
                    <p className={styles.termsTextBlock}>Coding lessons, problems, and related content are provided for educational purposes.</p>
                    <p className={styles.termsTextBlock}>Users should not misuse the platform or attempt to disrupt its operation.</p>
                  </section>

                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>User Responsibilities</h3>
                    <p className={styles.termsTextBlock}>Users must not intentionally interfere with the system or misuse other users' accounts or data.</p>
                    <p className={styles.termsTextBlock}>Users should provide accurate registration information.</p>
                  </section>

                  <section className={styles.termsSection}>
                    <h3 className={styles.termsSectionTitle}>Changes to These Terms</h3>
                    <p className={styles.termsTextBlock}>CodApt may update these Terms when necessary.</p>
                    <p className={styles.termsTextBlock}>Continued use of the service after changes means the updated Terms apply.</p>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignUp;
