import React, { useState, useEffect } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

const SignUp = ({ isDarkMode, toggleTheme, onSignUp, onLogin, onHome }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleGoogleClick = () => {
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      scope: 'email profile openid',
      callback: (response) => {
        if (response.access_token) {
          fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          })
          .then(res => res.json())
          .then(userInfo => {
            console.log('Google User:', userInfo);
            // Pass Google user data to onSignUp
            onSignUp({
              name: userInfo.name || 'User',
              username: userInfo.email?.split('@')[0] || 'user',
              email: userInfo.email || '',
              password: 'google-oauth',
              photo: userInfo.picture || null
            });
          });
        }
      }
    });
    if (client) {
      client.requestAccessToken();
    }
  };

  const [signUpError, setSignUpError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');
    setLoading(true);

    const payload = {
      email: formData.email,
      password: formData.password,
      username: formData.email.split('@')[0],
      name: formData.email.split('@')[0]
    };

    try {
      const result = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await result.json();
      setLoading(false);

      if (!result.ok || !data.success) {
        setSignUpError(data.message || 'Registration failed');
        return;
      }

      onSignUp(data.user);
    } catch (error) {
      setLoading(false);
      setSignUpError('Unable to sign up. Try again later.');
      console.error('Sign up error:', error);
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
            <ThemeToggle 
              isDarkMode={isDarkMode} 
              onClick={toggleTheme}
            />
            <button 
              onClick={onLogin}
              className={styles.signUpBtn}
            >
              Log In
            </button>
        </div>
      </nav>

      {/* Auth Card */}
      <main className={styles.main}>
        <div className={styles.authCard}>
          <img 
            src="/Welcome.png" 
            alt="Welcome!" 
            className={styles.welcomeImage} 
          />
          
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
            {signUpError && <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '10px' }}>{signUpError}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className={styles.footerText}>
            By signing up, I agree to CodApt <a href="#" className={styles.link}>Terms</a>
          </p>
          
          <p className={styles.footerText}>
            Need an account? <span className={styles.link} onClick={onLogin}>Login</span>
          </p>

          {/* Google Button */}
          <button className={styles.googleBtn} onClick={handleGoogleClick}>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              width="18" 
              alt="G" 
            />
            Google
          </button>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
