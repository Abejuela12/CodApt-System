import React, { useState } from 'react';
import styles from './LandingPage.module.css';
import ThemeToggle from '../shared/ThemeToggle';

// ── Intro slides shown when "Get Started" is clicked ──────────────
const SLIDES = [
  {
    icon: '🎯',
    title: 'Adaptive Difficulty',
    desc: 'CodApt automatically adjusts problem difficulty based on your performance using a CART machine learning model — so every challenge is the right level for you.',
  },
  {
    icon: '💻',
    title: 'Code Right in the Browser',
    desc: 'Write and run real Java, Python, and JavaScript code in our built-in editor. Instant output, no setup required.',
  },
  {
    icon: '🧩',
    title: 'Concept-by-Concept Learning',
    desc: 'Master Variables, Loops, Functions, and more — one concept at a time. Each concept has structured tasks that build on each other.',
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    desc: 'Your profile tracks success rates, concepts mastered, and daily performance across all three languages on a live chart.',
  },
  {
    icon: '🏆',
    title: 'Earn Concept Badges',
    desc: 'Complete all tasks in a concept with a strong success rate and earn a Mastered badge — with a celebration to match!',
  },
];

const IntroOverlay = ({ onDone }) => {
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      setExiting(true);
      setTimeout(onDone, 500);
    } else {
      setSlide(s => s + 1);
    }
  };

  const skip = () => {
    setExiting(true);
    setTimeout(onDone, 500);
  };

  const { icon, title, desc } = SLIDES[slide];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(10, 15, 30, 0.96)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* floating bg dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${40 + (i % 4) * 30}px`,
            height: `${40 + (i % 4) * 30}px`,
            borderRadius: '50%',
            background: ['rgba(255,204,0,0.06)', 'rgba(49,130,206,0.06)', 'rgba(99,102,241,0.06)'][i % 3],
            left: `${(i * 17) % 90}%`,
            top: `${(i * 23) % 80}%`,
            animation: `floatDot ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite alternate`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes floatDot {
          from { transform: translateY(0px); }
          to   { transform: translateY(-20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(560px, 92vw)',
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        border: '1px solid rgba(255,204,0,0.25)',
        boxShadow: '0 0 60px rgba(255,204,0,0.1), 0 30px 60px rgba(0,0,0,0.7)',
        padding: '48px 40px 36px',
        textAlign: 'center',
        animation: 'slideUp 0.4s ease both',
      }}>
        {/* Skip */}
        <button onClick={skip} style={{
          position: 'absolute', top: '16px', right: '20px',
          background: 'none', border: 'none',
          color: '#64748b', fontSize: '13px', cursor: 'pointer',
          fontWeight: '600', transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = '#94a3b8'}
          onMouseLeave={e => e.target.style.color = '#64748b'}
        >
          Skip ✕
        </button>

        {/* Icon */}
        <div key={slide} style={{
          fontSize: '64px', marginBottom: '20px', lineHeight: 1,
          animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          {icon}
        </div>

        {/* Slide counter dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? '24px' : '8px',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: i === slide ? '#ffcc00' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Title */}
        <h2 key={`t-${slide}`} style={{
          fontSize: '26px', fontWeight: '900',
          marginBottom: '16px',
          animation: 'slideUp 0.35s ease both',
          background: 'linear-gradient(90deg, #ffcc00, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {title}
        </h2>

        {/* Description */}
        <p key={`d-${slide}`} style={{
          fontSize: '16px', color: '#94a3b8', lineHeight: '1.7',
          marginBottom: '36px',
          animation: 'slideUp 0.4s ease 0.05s both',
        }}>
          {desc}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {slide > 0 && (
            <button onClick={() => setSlide(s => s - 1)} style={{
              padding: '12px 24px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: '#94a3b8',
              fontWeight: '700', fontSize: '15px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            >
              ← Back
            </button>
          )}
          <button onClick={next} style={{
            padding: '12px 32px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #ffcc00, #f59e0b)',
            color: '#1e3a5f', fontWeight: '900', fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 0 #d4aa00, 0 8px 20px rgba(255,204,0,0.3)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 #d4aa00, 0 12px 25px rgba(255,204,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #d4aa00, 0 8px 20px rgba(255,204,0,0.3)'; }}
          >
            {isLast ? "Let's Go 🚀" : 'Next →'}
          </button>
        </div>

        {/* Step label */}
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
          {slide + 1} of {SLIDES.length}
        </p>
      </div>
    </div>
  );
};

// ── Main LandingPage ──────────────────────────────────────────────
const LandingPage = ({ onGetStarted, isDarkMode, toggleTheme, onSignUp, onLogin }) => {
  const [showIntro, setShowIntro] = useState(false);

  const handleGetStarted = () => setShowIntro(true);
  const handleIntroDone  = () => { setShowIntro(false); onGetStarted(); };

  return (
    <div className={styles.container}>
      {showIntro && <IntroOverlay onDone={handleIntroDone} />}

      {/* Navigation */}
      <nav className={styles.navbar}>
        <img
          src="/CODAPT_LOGO.png"
          alt="CodApt"
          className={styles.logoImg}
        />

        <div className={styles.navRight}>
          <ThemeToggle isDarkMode={isDarkMode} onClick={toggleTheme} />

          <button onClick={onLogin} className={styles.signInBtn}>
            Log In
          </button>

          <button onClick={onSignUp} className={styles.signUpBtn}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className={styles.hero}>
        <h1 className={styles.title}>
          Adaptive Programming <span className={styles.titleAccent}>Practice Platform</span>
        </h1>

        <p className={styles.subtitle}>
          Personalize Coding Challenges
        </p>

        <button onClick={handleGetStarted} className={styles.getStartedBtn}>
          Get Started
        </button>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLeft}>
            <p>&copy; 2026 CodApt. All rights reserved.</p>
          </div>
          <div className={styles.footerRight}>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;