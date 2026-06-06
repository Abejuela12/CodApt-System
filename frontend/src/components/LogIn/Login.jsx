import React, { useState, useEffect } from 'react';
import styles from './SignUp.module.css';
import ThemeToggle from '../shared/ThemeToggle';

const Login = ({ isDarkMode, toggleTheme, onLogin, onSignUp, onHome }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: ''
  });
  const [adminError, setAdminError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

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
            // Pass Google user data to onLogin
            onLogin({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = data?.message || data?.error || (isJson ? JSON.stringify(data) : 'Login failed');
        setLoginError(message);
        setLoading(false);
        return;
      }

      if (!data || !data.success || !data.user) {
        setLoginError(data?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      onLogin({
        ...data.user
      });
    } catch (err) {
      setLoading(false);
      setLoginError('Server error. Check backend connection.');
      console.error('Login error:', err);
    }
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    // Admin credentials check
    if (adminFormData.email === 'admin@codapt.com' && adminFormData.password === 'admin123') {
      setAdminError('');
      onLogin({ isAdmin: true });
    } else {
      setAdminError('Invalid admin credentials');
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
          <ThemeToggle isDarkMode={isDarkMode} onClick={toggleTheme}/>
          <button onClick={onSignUp} className={styles.signUpBtn}>
            Sign Up
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
          
          {showAdminLogin ? (
            // Admin Login Form
            <form className={styles.form} onSubmit={handleAdminSubmit}>
              <p style={{ color: '#ff6b6b', marginBottom: '10px', fontSize: '14px' }}>Login</p>
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
              {adminError && <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '10px' }}>{adminError}</p>}
              <button type="submit" className={styles.submitBtn}>
                Login
              </button>
              <p className={styles.footerText}>
                <span className={styles.link} onClick={() => setShowAdminLogin(false)}>Back to User Login</span>
              </p>
            </form>
          ) : (
            // Regular User Login Form
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
                {loginError && <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '10px' }}>{loginError}</p>}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className={styles.footerText}>
                Already have an Account? <span className={styles.link} onClick={onSignUp}>Sign Up</span>
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

              <hr style={{ marginTop: '20px', border: 'none', borderTop: '1px solid #ddd' }} />

              {/* Admin Login Link */}
              <p className={styles.footerText} style={{ marginTop: '15px' }}>
                Are you an admin? <button className={styles.link} onClick={() => setShowAdminLogin(true)}>Login here</button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
