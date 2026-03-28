import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import styles from './SceneSelectScreen.module.css';

const SCENES = [
  {
    num: 1,
    title:    'The Algorithm',
    year:     '2016',
    location: 'Silicon Valley',
    desc:     'You are a product executive at the world\'s largest social network. The data is on your desk. What you do next will reach 2.9 billion people.',
    accent:   '#1a6b8a',
    icon:     '💻',
    path:     '/scene1',
  },
  {
    num: 2,
    title:    'The Airstrike',
    year:     '2003',
    location: 'The Situation Room',
    desc:     'You are the National Security Advisor. In 45 minutes you walk into the Oval Office. Your recommendation will determine whether a war begins.',
    accent:   '#8a1a1a',
    icon:     '🏛',
    path:     '/scene2',
  },
];

export default function SceneSelectScreen() {
  const navigate            = useNavigate();
  const { scene1Complete, scene2Complete } = useGame();

  const completed = [scene1Complete, scene2Complete];

  function handlePlay(scene) {
    if (scene.num === 2 && !scene1Complete) return;
    navigate(scene.path);
  }

  function handleContinue() {
    if (scene1Complete && scene2Complete) navigate('/dna');
    else if (scene1Complete)              navigate('/scene2');
    else                                  navigate('/scene1');
  }

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.header}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Choose a scenario
        </motion.p>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Ripple
        </motion.h1>
        <motion.p
          className={styles.sub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Complete Scene 1 before Scene 2 unlocks.
        </motion.p>
      </div>

      {/* Scene cards */}
      <div className={styles.cards}>
        {SCENES.map((scene, i) => {
          const locked   = scene.num === 2 && !scene1Complete;
          const isDone   = completed[i];

          return (
            <motion.div
              key={scene.num}
              className={`${styles.card} ${locked ? styles.locked : ''} ${isDone ? styles.done : ''}`}
              style={{ '--accent': scene.accent }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={locked ? {} : { y: -6, boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${scene.accent}40` }}
            >
              {/* Lock overlay */}
              {locked && (
                <div className={styles.lockOverlay}>
                  <span className={styles.lockIcon}>🔒</span>
                  <p className={styles.lockNote}>Complete Scene 1 first</p>
                </div>
              )}

              {/* Card content */}
              <div className={styles.cardInner}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardIcon}>{scene.icon}</span>
                  <div>
                    <span className={styles.cardYear}>{scene.year}</span>
                    <span className={styles.cardLocation}>{scene.location}</span>
                  </div>
                  {isDone && <span className={styles.doneTag}>✓ Complete</span>}
                </div>

                <h2 className={styles.cardTitle}>{scene.title}</h2>
                <p  className={styles.cardDesc}>{scene.desc}</p>

                <button
                  className={`${styles.playBtn} ${locked ? styles.playBtnLocked : ''}`}
                  onClick={() => handlePlay(scene)}
                  disabled={locked}
                  aria-label={locked ? 'Locked' : `Play ${scene.title}`}
                >
                  {isDone ? 'Replay' : locked ? 'Locked' : 'Play →'}
                </button>
              </div>

              {/* Accent strip */}
              <div className={styles.accentStrip} />
            </motion.div>
          );
        })}
      </div>

      {/* Progress + Continue */}
      <motion.div
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className={styles.progress}>
          {SCENES.map((s, i) => (
            <div key={i} className={styles.progressItem}>
              <span className={`${styles.progressDot} ${completed[i] ? styles.progressDone : ''}`} />
              <span className={styles.progressLabel}>Scene {s.num}</span>
            </div>
          ))}
        </div>

        {(scene1Complete || scene2Complete) && (
          <motion.button
            className={styles.continueBtn}
            onClick={handleContinue}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {scene1Complete && scene2Complete ? 'View Decision DNA →' : 'Continue →'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
