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
  { name: "Variables", difficulty: "Easy", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
  { name: "Data Types", difficulty: "Easy", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png" },
  { name: "Operators", difficulty: "Easy", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png" },
  { name: "Conditional", difficulty: "Intermediate", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png" },
  { name: "Loops", difficulty: "Intermediate", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png" },
  { name: "Functions", difficulty: "Intermediate", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/50.png" },
  { name: "Input & Output", difficulty: "Hard", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" },
  { name: "Error Handling", difficulty: "Hard", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png" }
];

// Concept descriptions
const conceptDescriptions = {
  "Variables": "A container for storing data values. Variables are like boxes that hold information you can use and manipulate in your program.",
  "Data Types": "The classification of data that determines the type of operations that can be performed on it. Common types include numbers, strings, and booleans.",
  "Operators": "Symbols that perform operations on values or variables. Examples include arithmetic (+, -, *, /), comparison (==, >, <), and logical (&&, ||) operators.",
  "Conditional": "Code blocks that execute different actions based on whether a condition is true or false. Common examples include if, else, and switch statements.",
  "Loops": "Control structures that repeat a block of code multiple times. Common types include for loops, while loops, and do-while loops.",
  "Functions": "Reusable blocks of code that perform specific tasks. Functions help organize code and make it more modular and maintainable.",
  "Input & Output": "Methods for interacting with users and external systems. Input receives data from users, while output displays results or information.",
  "Error Handling": "Techniques for managing and responding to errors that occur during program execution. Helps prevent crashes and provides better user experience."
};

const ConceptModal = ({ language, level, onSelect, onClose }) => {
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const filteredConcepts = concepts.filter(c => c.difficulty === level);

  const handleConceptClick = (index) => {
    setSelectedConcept(filteredConcepts[index].name);
    setActiveIndex(index);
  };

  const handleStart = () => {
    if (selectedConcept) {
      onSelect(selectedConcept); // triggers CodeEditor

    }
  };

  const handleCloseCard = () => {
    setSelectedConcept(null);
  };

  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.activeIndex);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 className={styles.modalTitle}>
          Choose a Concept - {language?.toUpperCase()} ({level})
        </h2>

        {selectedConcept ? (
          <div className={styles.conceptCardDetail}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{selectedConcept}</h3>
              <button className={styles.backBtn} onClick={handleCloseCard}>← Back</button>
            </div>
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
          // Start
        <div className={styles.conceptCarousel}>

          {/* SWIPER */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination, EffectCoverflow]}
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: true
            }}
            pagination={{ el: `.${styles.dotsContainer}`, clickable: true }}
            onSlideChange={handleSlideChange}
            className={styles.swiperContainer}
          >
            {filteredConcepts.map((item, index) => (
              <SwiperSlide key={item.name} className={styles.swiperSlide}>
                <div
                  className={styles.conceptCard}
                  onClick={() => handleConceptClick(index)}
                >
                  <div className={styles.cardIcon}>📚</div>
                  <div className={styles.cardText}>{item.name}</div>
                </div>
              </SwiperSlide>
            ))}
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
                  // end of concept carousel
                )}
              </div>
            </div>
          );
        };

export default ConceptModal;