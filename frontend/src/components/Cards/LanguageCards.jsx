import React from 'react';
import styles from './LanguageCards.module.css';
import ThemeToggle from '../shared/ThemeToggle';
import LanguageFlipCard from "./LanguageFlipCard";
import javaCardImage from '../../assets/javaCard.jpg';
import javascriptCardImage from '../../assets/JavascriptCard.jpg';
import pythonCardImage from '../../assets/PythonCard.jpg';

const CARD_IMAGES = {
  Java: javaCardImage,
  Python: pythonCardImage,
  JavaScript: javascriptCardImage,
};

// Evolution chains per language
// Beginner → Intermediate → Advanced
const EVOLUTIONS = {
  Java: [
    {
      label:       'Charmander',
      hp:          60,
      description: 'A beginner Java coder — small flame, big dreams. Still learning to compile without errors.',
    },
    {
      label:       'Charmeleon',
      hp:          90,
      description: 'An intermediate Java developer — the flame burns hotter. OOP concepts and logic are clicking.',
    },
    {
      label:       'Charizard',
      hp:          120,
      description: 'A Java master — commands the JVM with fire and fury. Enterprise systems fear this coder.',
    },
  ],
  Python: [
    {
      label:       'Ekans',
      hp:          45,
      description: 'A beginner Python coder — small and coiling. Just starting to wrap their head around syntax.',
    },
    {
      label:       'Arbok',
      hp:          80,
      description: 'An intermediate Python dev — the snake grows stronger. Functions and data structures are in their grasp.',
    },
    {
      label:       'Serperior',
      hp:          115,
      description: 'A Python master — elegant and powerful. Scripts data pipelines and AI models with regal precision.',
    },
  ],
  JavaScript: [
    {
      label:       'Pichu',
      hp:          40,
      description: 'A beginner JS coder — tiny sparks of logic. Still getting zapped by undefined errors.',
    },
    {
      label:       'Pikachu',
      hp:          75,
      description: 'An intermediate JS developer — the shocks are real now. Async functions and DOM events are no problem.',
    },
    {
      label:       'Raichu',
      hp:          110,
      description: 'A JavaScript master — thunderous and fast. Builds full-stack apps and frameworks with pure electric power.',
    },
  ],
};

const CONCEPTS = ['Variables','Data Types','Operators','Conditionals',
                  'Loops','Functions','Input & Output','Error Handling'];

// Same capability logic as ProfilePage
function getLanguageCapability(language, progress = {}) {
  const langData  = progress[language] || {};
  const attempted = CONCEPTS.filter(c => langData[c] && (langData[c]?.tasksCompleted ?? 0) > 0);
  if (attempted.length === 0) return 'Beginner';

  const mastered   = attempted.filter(c => (langData[c]?.successRate ?? 0) >= 80);
  const avgSuccess = attempted.reduce((sum, c) => sum + (langData[c]?.successRate ?? 0), 0) / attempted.length;

  if (mastered.length >= 4 && avgSuccess >= 80) return 'Advanced';
  if (attempted.length >= 2 && avgSuccess >= 50) return 'Intermediate';
  return 'Beginner';
}

// Returns the correct pokemon image and label based on user level
function getEvolution(language, progress) {
  const level = getLanguageCapability(language, progress);
  const chain = EVOLUTIONS[language];
  if (level === 'Advanced')     return chain[2];
  if (level === 'Intermediate') return chain[1];
  return chain[0];
}

const LanguageCards = ({ onSelect, isDarkMode, toggleTheme, onProfileClick, onHomeClick, onLogout, userData, progress = {} }) => {
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <img
          src="/CODAPT_LOGO.png"
          alt="Codapt"
          className={styles.logo}
          onClick={onHomeClick}
        />
        <div className={styles.navActions}>
          <div className={styles.nameBadge}>
            {userData?.name || 'Name'}
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onClick={toggleTheme} />
          <div className={styles.profileWrapper}>
            <div className={styles.profileIcon} onClick={onProfileClick}>
              {userData?.photo ? (
                <img src={userData.photo} alt="Profile" className={styles.profilePhoto}/>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <div className="unifiedDropdown">
              <div className="dropdownArrow"></div>
              <div className="dropdownItem" onClick={(e) => { e.stopPropagation(); onProfileClick(); }}>Profile</div>
              <div className="dropdownItem dropdownItemDanger" onClick={(e) => { e.stopPropagation(); onLogout(); }}>Log Out</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.content}>
        <h1 className={styles.title}>Programming Languages</h1>

        <div className={styles.cardGrid}>

          <LanguageFlipCard
            name="Java"
            hp={getEvolution('Java', progress).hp}
            type="Fire"
            color="#FF6700"
            image={CARD_IMAGES.Java}
            evolutionLabel={getEvolution('Java', progress).label}
            userLevel={getLanguageCapability('Java', progress)}
            ability1={{ name:"Flame Compile", damage:40, desc:"Burn through compilation." }}
            ability2={{ name:"JVM Blast",     damage:80, desc:"Virtual machine attack."  }}
            description={getEvolution('Java', progress).description}
            onClick={() => onSelect("Java")}
          />

          <LanguageFlipCard
            name="Python"
            hp={getEvolution('Python', progress).hp}
            type="Grass"
            color="#4B8BBE"
            image={CARD_IMAGES.Python}
            evolutionLabel={getEvolution('Python', progress).label}
            userLevel={getLanguageCapability('Python', progress)}
            ability1={{ name:"Script Coil", damage:30, desc:"Wrap opponents elegantly."           }}
            ability2={{ name:"Data Bite",   damage:70, desc:"Process massive datasets instantly." }}
            description={getEvolution('Python', progress).description}
            onClick={() => onSelect("Python")}
          />

          <LanguageFlipCard
            name="JavaScript"
            hp={getEvolution('JavaScript', progress).hp}
            type="Electric"
            color="#F7DF1E"
            image={CARD_IMAGES.JavaScript}
            evolutionLabel={getEvolution('JavaScript', progress).label}
            userLevel={getLanguageCapability('JavaScript', progress)}
            ability1={{ name:"Dynamic Shock", damage:30, desc:"Shock enemies with dynamic typing." }}
            ability2={{ name:"Async Thunder", damage:80, desc:"Async lightning strike."            }}
            description={getEvolution('JavaScript', progress).description}
            onClick={() => onSelect("JavaScript")}
          />

        </div>
      </main>
    </div>
  );
};

export default LanguageCards;