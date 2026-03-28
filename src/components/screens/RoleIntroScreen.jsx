import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import TypewriterText from '../ui/TypewriterText';
import { speakText, cancelSpeech } from '../../services/elevenLabsService';
import styles from './RoleIntroScreen.module.css';

const AMBIANCE_COLORS = {
  tense:     '#8a1a1a',
  solemn:    '#1a6b8a',
  urgent:    '#8a7a1a',
  hopeful:   '#1a6b3a',
  desperate: '#6b1a6b',
};

// Deterministic particle layout — no Math.random so positions are stable
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     `${((i * 47 + 13) % 95) + 1}%`,
  top:      `${((i * 31 + 7)  % 88) + 4}%`,
  size:     (i % 3) + 2,
  delay:    `${((i * 0.41) % 4).toFixed(2)}s`,
  duration: `${(3.5 + (i * 0.53) % 2.5).toFixed(2)}s`,
}));

export default function RoleIntroScreen() {
  const { generatedScenario, setScreen, characterImage, isMuted } = useGame();

  const [showButton, setShowButton] = useState(false);
  const typewriterDoneRef = useRef(false);

  const scenario   = generatedScenario ?? {};
  const role       = scenario.playerRole   ?? {};
  const setting    = scenario.setting      ?? {};
  const ambiance   = setting.ambiance ?? 'solemn';
  const accentColor = AMBIANCE_COLORS[ambiance] ?? AMBIANCE_COLORS.solemn;

  const narratorText = scenario.narratorIntro ?? '';

  // ─── ElevenLabs voiceover ─────────────────────────────────
  useEffect(() => {
    if (!narratorText) return;
    speakText(narratorText, { isMuted });
    return () => cancelSpeech();
  }, [narratorText, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Typewriter done handler ──────────────────────────────
  const handleTypewriterDone = useCallback(() => {
    if (typewriterDoneRef.current) return;
    typewriterDoneRef.current = true;
    setShowButton(true);
  }, []);

  // ─── CSS custom property for accent color ─────────────────
  const rootStyle = useMemo(() => ({
    '--accent': accentColor,
  }), [accentColor]);

  return (
    <motion.div
      className={styles.root}
      style={rootStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Ambient particles */}
      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map(p => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left:              p.left,
              top:               p.top,
              width:             p.size,
              height:            p.size,
              animationDelay:    p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className={styles.content}>

        {/* Year + Location */}
        <motion.div
          className={styles.dateLocation}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className={styles.year}>{scenario.year ?? '—'}</span>
          <span className={styles.location}>{scenario.location ?? ''}</span>
        </motion.div>

        {/* Portrait card — slides up from below */}
        <motion.div
          className={styles.portrait}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.35, type: 'spring', stiffness: 120, damping: 20 }}
        >
          {characterImage ? (
            <img src={characterImage} alt={role.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9a227', display: 'block', margin: '0 auto 16px auto' }} />
          ) : (
            <div className={styles.portraitPlaceholder} />
          )}
          <p className={styles.portraitName}>{role.name ?? ''}</p>
          <p className={styles.portraitTitle}>{role.title ?? ''}</p>
          <p className={styles.portraitDesc}>{role.portraitDescription ?? ''}</p>
        </motion.div>

        {/* Narrator intro — typewriter */}
        <motion.div
          className={styles.narratorBlock}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <TypewriterText
            text={narratorText}
            speed={30}
            startDelay={1100}
            onDone={handleTypewriterDone}
            tag="p"
            className={styles.narratorText}
          />
        </motion.div>

        {/* Step Into History button */}
        <AnimatePresence>
          {showButton && (
            <motion.button
              className={styles.stepBtn}
              onClick={() => setScreen('choice')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Step Into History →
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
