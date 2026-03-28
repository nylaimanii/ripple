import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LoadingScreen.module.css';

const PHRASES = [
  'Consulting the historical record…',
  'Finding your role…',
  'Calculating the weight of your choices…',
  'Preparing the consequences…',
];

export default function LoadingScreen() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle phrases every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex(i => (i + 1) % PHRASES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Globe */}
      <div className={styles.globeWrapper}>
        <div className={styles.globe}>
          <div className={styles.gridLines}>
            {/* Latitude lines */}
            {[20, 40, 60, 80, 100, 120, 140, 160].map(top => (
              <div key={`lat-${top}`} className={styles.latLine} style={{ top: `${top / 2}%` }} />
            ))}
            {/* Longitude lines */}
            {[0, 30, 60, 90, 120, 150].map(angle => (
              <div key={`lng-${angle}`} className={styles.lngLine} style={{ '--angle': `${angle}deg` }} />
            ))}
          </div>
          <div className={styles.globeSheen} />
        </div>
        <div className={styles.globeShadow} />
      </div>

      {/* Cycling phrase */}
      <div className={styles.phraseContainer}>
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            className={styles.phrase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
          >
            {PHRASES[phraseIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <motion.div
          className={styles.progressFill}
          initial={{ width: '0%' }}
          animate={{ width: '90%' }}
          transition={{ duration: 8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </motion.div>
  );
}
