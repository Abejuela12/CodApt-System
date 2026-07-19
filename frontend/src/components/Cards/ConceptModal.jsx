import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import styles from './ConceptModal.module.css';


// Concept data
const concepts = [
  { name: "Variables", difficulty: "Easy" },
  { name: "Data Types", difficulty: "Easy" },
  { name: "Operators", difficulty: "Easy" },
  { name: "Conditionals", difficulty: "Intermediate" },
  { name: "Loops", difficulty: "Intermediate" },
  { name: "Functions", difficulty: "Intermediate" },
  { name: "Input & Output", difficulty: "Hard" },
  { name: "Error Handling", difficulty: "Hard" }
];

// Concept descriptions
const conceptDescriptions = {
  "Variables": "A container for storing data values. Variables are like boxes that hold information you can use and manipulate in your program.",
  "Data Types": "The classification of data that determines the type of operations that can be performed on it. Common types include numbers, strings, and booleans.",
  "Operators": "Symbols that perform operations on values or variables. Examples include arithmetic (+, -, *, /), comparison (==, >, <), and logical (&&, ||) operators.",
  "Conditionals": "Code blocks that execute different actions based on whether a condition is true or false. Common examples include if, else, and switch statements.",
  "Loops": "Control structures that repeat a block of code multiple times. Common types include for loops, while loops, and do-while loops.",
  "Functions": "Reusable blocks of code that perform specific tasks. Functions help organize code and make it more modular and maintainable.",
  "Input & Output": "Methods for interacting with users and external systems. Input receives data from users, while output displays results or information.",
  "Error Handling": "Techniques for managing and responding to errors that occur during program execution. Helps prevent crashes and provides better user experience."
};

// ── Helper: check mastery from progress data ──────────────────────
function isMasteredConcept(progress, language, conceptName) {
  const d = progress?.[language]?.[conceptName];
  return !!(d && d.tasksCompleted >= d.totalTasks && d.successRate >= 60);
}

const ConceptModal = ({ language, level, onSelect, onClose, progress = {}, justMasteredConcept = null }) => {
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMasteredPopup, setShowMasteredPopup] = useState(false);
  const [popupConcept, setPopupConcept] = useState(null);
  const swiperRef = useRef(null);

  const filteredConcepts = concepts.filter(c => c.difficulty === level);

  const handleConceptClick = (index) => {
    const concept = filteredConcepts[index];
    const mastered = isMasteredConcept(progress, language, concept.name);

    if (mastered) {
      setPopupConcept(concept.name);
      setShowMasteredPopup(true);
      return;
    }

    setSelectedConcept(concept.name);
    setActiveIndex(index);
  };

  const handleStart = () => {
    if (selectedConcept && !isMasteredConcept(progress, language, selectedConcept)) {
      onSelect(selectedConcept);
    }
  };

  const handleCloseCard = () => {
    setSelectedConcept(null);
  };

  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.activeIndex);
  };

  const handleCloseMasteredPopup = () => {
    setShowMasteredPopup(false);
    setPopupConcept(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 className={styles.modalTitle}>
          Choose a Concept - {language?.toUpperCase()} ({level})
        </h2>

        {/* ── "Just Mastered" congratulatory banner ── */}
        {justMasteredConcept && (
          <div style={{
            margin: '0 0 18px 0',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(250,204,21,0.15) 0%, rgba(251,191,36,0.08) 100%)',
            border: '1px solid #facc15',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            animation: 'fadeInDown 0.4s ease'
          }}>
            <style>{`
              @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-10px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes trophyBounce {
                0%, 100% { transform: translateY(0) rotate(-5deg); }
                50%       { transform: translateY(-6px) rotate(5deg); }
              }
            `}</style>
            <span style={{ fontSize: '32px', animation: 'trophyBounce 1.6s ease-in-out infinite' }}>🏆</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#facc15', fontWeight: '900', fontSize: '15px', marginBottom: '3px' }}>
                Concept Mastered!
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
                You've completed <span style={{ color: '#fbbf24', fontWeight: '700' }}>{justMasteredConcept}</span> — great work! Choose your next concept below.
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(250,204,21,0.2)',
              border: '1px solid #facc15',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#facc15',
              whiteSpace: 'nowrap'
            }}>
              🏅 MASTERED
            </div>
          </div>
        )}

        {selectedConcept ? (
          <div className={styles.conceptCardDetail}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{selectedConcept}</h3>
              <button className={styles.backBtn} onClick={handleCloseCard}>← Back</button>
            </div>
            {/* Mastered banner inside card detail */}
            {(() => {
              const d = progress?.[language]?.[selectedConcept];
              const mastered = d && d.tasksCompleted >= d.totalTasks && d.successRate >= 60;
              return mastered ? (
                <div style={{
                  backgroundColor: 'rgba(250,204,21,0.12)', border: '1px solid #facc15',
                  borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>🏆</span>
                  <div>
                    <div style={{ color: '#facc15', fontWeight: '800', fontSize: '14px' }}>You've mastered this concept!</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{d.successRate}% success · {d.tasksCompleted} tasks done</div>
                  </div>
                </div>
              ) : null;
            })()}
            <div className={styles.cardContent}>
              <div className={styles.cardIcon}><span>📚</span></div>
              <p className={styles.cardDescription}>
                {conceptDescriptions[selectedConcept]}
              </p>
            </div>
            <button className={styles.startBtn} onClick={handleStart}>
              <span>▶</span> Start Learning
            </button>
          </div>
        ) : (
          <div className={styles.conceptCarousel}>

            {/* SWIPER */}
            <Swiper
              ref={swiperRef}
              modules={[Navigation, Pagination, EffectCoverflow]}
              effect="coverflow"
              grabCursor={false}
              allowTouchMove={false}
              simulateTouch={false}
              centeredSlides={true}
              slidesPerView="auto"
              initialSlide={activeIndex}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 110,
                modifier: 2.5,
                slideShadows: true
              }}
              pagination={{ el: `.${styles.dotsContainer}`, clickable: true }}
              onSlideChange={handleSlideChange}
              className={styles.swiperContainer}
            >
              {filteredConcepts.map((item, index) => {
                const mastered = isMasteredConcept(progress, language, item.name);
                return (
                  <SwiperSlide
                    key={item.name}
                    className={styles.swiperSlide}
                  >
                    <div
                      className={styles.conceptCard}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        swiperRef.current?.swiper.slideTo(index);
                        handleConceptClick(index);
                      }}
                      style={mastered
                        ? {
                            borderColor: '#facc15',
                            boxShadow: '0 0 22px rgba(250,204,21,0.35)',
                            position: 'relative',
                            cursor: 'pointer',
                            opacity: 0.85
                          }
                        : { position: 'relative', cursor: 'pointer' }}
                    >
                      {mastered && (
                        <>
                          {/* Gold "Mastered" badge top-right */}
                          <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            backgroundColor: '#facc15', color: '#1e3a5f',
                            borderRadius: '999px', padding: '3px 10px',
                            fontSize: '11px', fontWeight: '900',
                            display: 'flex', alignItems: 'center', gap: '3px',
                            boxShadow: '0 2px 8px rgba(250,204,21,0.5)'
                          }}>✓ Mastered</div>

                          {/* Lock overlay to indicate non-accessible */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            borderRadius: 'inherit',
                            background: 'rgba(0,0,0,0.18)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'flex-end',
                            paddingBottom: '12px',
                            pointerEvents: 'none'
                          }}>
                            <div style={{
                              fontSize: '11px', color: '#facc15', fontWeight: '700',
                              backgroundColor: 'rgba(0,0,0,0.55)',
                              padding: '3px 10px', borderRadius: '999px'
                            }}>
                              🔒 Already Mastered
                            </div>
                          </div>
                        </>
                      )}
                      <div className={styles.cardIcon}>{mastered ? '🏆' : '📚'}</div>
                      <div className={styles.cardText}>{item.name}</div>
                      {mastered && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#facc15', fontWeight: '700' }}>
                          🏅 Complete
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* ARROWS */}
            <div className={styles.arrowContainer}>
              <button
                className={styles.navArrow}
                onClick={() => swiperRef.current.swiper.slidePrev()}
                disabled={activeIndex === 0}
              >
                ←
              </button>
              <button
                className={styles.navArrow}
                onClick={() => swiperRef.current.swiper.slideNext()}
                disabled={activeIndex === filteredConcepts.length - 1}
              >
                →
              </button>
            </div>

            {/* DOTS */}
            <div className={styles.dotsContainer}></div>

          </div>
        )}
      </div>

      {/* ── Already Mastered Popup ── */}
      {showMasteredPopup && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000
          }}
          onClick={handleCloseMasteredPopup}
        >
          <div
            style={{
              width: 'min(380px, 90vw)',
              backgroundColor: '#0f172a',
              borderRadius: '20px',
              border: '2px solid #facc15',
              boxShadow: '0 0 50px rgba(250,204,21,0.3), 0 20px 50px rgba(0,0,0,0.7)',
              padding: '36px 28px 28px',
              textAlign: 'center',
              animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes popIn {
                from { opacity: 0; transform: scale(0.75); }
                to   { opacity: 1; transform: scale(1); }
              }
              @keyframes shimmer {
                0%,100% { background-position: -200% center; }
                50%      { background-position: 200% center; }
              }
            `}</style>

            {/* Trophy icon */}
            <div style={{ fontSize: '56px', marginBottom: '12px', lineHeight: 1 }}>🏆</div>

            {/* Shimmer headline */}
            <div style={{
              fontSize: '22px', fontWeight: '900', marginBottom: '10px',
              background: 'linear-gradient(90deg,#facc15,#fbbf24,#FFD700,#facc15)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 2s linear infinite'
            }}>
              Already Mastered!
            </div>

            {/* Concept name badge */}
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(250,204,21,0.15)',
              border: '1px solid #facc15',
              borderRadius: '999px',
              padding: '5px 18px',
              fontSize: '14px',
              fontWeight: '800',
              color: '#facc15',
              marginBottom: '14px'
            }}>
              🏅 {popupConcept}
            </div>

            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '22px' }}>
              You've already mastered this concept. Choose a different concept to keep leveling up your skills!
            </p>

            {/* Progress from data */}
            {(() => {
              const d = progress?.[language]?.[popupConcept];
              if (!d) return null;
              return (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '10px', marginBottom: '20px'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(250,204,21,0.08)',
                    border: '1px solid rgba(250,204,21,0.2)',
                    borderRadius: '10px', padding: '10px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Done</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#f1f5f9' }}>{d.tasksCompleted}/{d.totalTasks}</div>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(250,204,21,0.08)',
                    border: '1px solid rgba(250,204,21,0.2)',
                    borderRadius: '10px', padding: '10px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80' }}>{d.successRate}%</div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleCloseMasteredPopup}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg,#facc15,#f59e0b)',
                border: 'none', borderRadius: '12px',
                color: '#1e3a5f', fontWeight: '900', fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(250,204,21,0.4)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Choose Another Concept
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptModal;