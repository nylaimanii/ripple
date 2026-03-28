import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GlassShatter.module.css';

/**
 * GlassShatter — cinematic page transition overlay.
 *
 * Usage: wrap each screen in <PageShell> and use navigate() normally.
 * The overlay fires on every route change automatically via useLocation
 * trigger (wired in App.jsx).
 *
 * The effect: 9 irregular glass shards (fixed-pos divs with clip-path)
 * covering the whole viewport fly apart, briefly exposing the new screen.
 * A hairline SVG crack pattern draws over the top for the final touch.
 */

// 9 shards whose clip-path polygons together tile the viewport.
// Using slightly enlarged polygons so there are no visible gaps.
const SHARDS = [
  { id: 0, clip: 'polygon(0% 0%, 37% 0%, 30% 42%, 0% 32%)',        exit: { x: -320, y: -220, rotate: -28, opacity: 0 } },
  { id: 1, clip: 'polygon(37% 0%, 63% 0%, 60% 38%, 33% 42%)',       exit: { x:    0, y: -320, rotate:  18, opacity: 0 } },
  { id: 2, clip: 'polygon(63% 0%, 100% 0%, 100% 32%, 70% 42%)',     exit: { x:  320, y: -220, rotate:  28, opacity: 0 } },
  { id: 3, clip: 'polygon(0% 32%, 30% 42%, 26% 68%, 0% 72%)',       exit: { x: -320, y:    0, rotate: -22, opacity: 0 } },
  { id: 4, clip: 'polygon(33% 42%, 60% 38%, 64% 68%, 36% 64%)',     exit: { x:    0, y:    0, scale: 2.5, rotate: 45, opacity: 0 } },
  { id: 5, clip: 'polygon(70% 42%, 100% 32%, 100% 72%, 74% 68%)',   exit: { x:  320, y:    0, rotate:  22, opacity: 0 } },
  { id: 6, clip: 'polygon(0% 72%, 26% 68%, 30% 100%, 0% 100%)',     exit: { x: -320, y:  220, rotate: -28, opacity: 0 } },
  { id: 7, clip: 'polygon(36% 64%, 64% 68%, 62% 100%, 34% 100%)',   exit: { x:    0, y:  320, rotate: -18, opacity: 0 } },
  { id: 8, clip: 'polygon(74% 68%, 100% 72%, 100% 100%, 70% 100%)', exit: { x:  320, y:  220, rotate:  28, opacity: 0 } },
];

// SVG crack paths radiating from center (viewBox 0 0 100 100)
const CRACKS = [
  'M50,50 L22,0 L10,8',
  'M50,50 L78,0 L90,12',
  'M50,50 L0,38 L0,55',
  'M50,50 L100,30 L100,52',
  'M50,50 L28,100 L12,82',
  'M50,50 L72,100 L88,80',
  'M50,50 L50,0',
  'M50,50 L50,100',
  'M50,50 L0,75',
  'M50,50 L100,62',
];

export default function GlassShatter({ trigger, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | flash | crack | shatter

  useEffect(() => {
    if (!trigger) return;

    setPhase('flash');
    const t1 = setTimeout(() => setPhase('crack'), 80);
    const t2 = setTimeout(() => setPhase('shatter'), 280);
    const t3 = setTimeout(() => {
      setPhase('idle');
      onComplete?.();
    }, 700);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [trigger]);

  if (phase === 'idle') return null;

  return (
    <div className={styles.root} aria-hidden="true">
      {/* White flash */}
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            className={styles.flash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          />
        )}
      </AnimatePresence>

      {/* SVG crack lines */}
      <AnimatePresence>
        {(phase === 'crack' || phase === 'shatter') && (
          <motion.svg
            className={styles.crackSvg}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {CRACKS.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.3"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.18, delay: i * 0.015 }}
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Shard fragments */}
      <AnimatePresence>
        {phase === 'shatter' &&
          SHARDS.map((shard, i) => (
            <motion.div
              key={shard.id}
              className={styles.shard}
              style={{ clipPath: shard.clip }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 0.7, scale: 1 }}
              animate={shard.exit}
              transition={{
                duration: 0.38,
                delay: i * 0.025,
                ease: [0.55, 0, 1, 0.45],
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
