import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import styles from './HumanCostCounter.module.css';

const DURATION_MS   = 3000; // counter animation duration
const MAX_CIRCLES   = 200;  // visual cap for performance

// Stable random circle positions — generated once per mount
function buildCircles() {
  return Array.from({ length: MAX_CIRCLES }, (_, i) => ({
    id: i,
    left:  `${(Math.random() * 94) + 1}%`,
    top:   `${(Math.random() * 94) + 1}%`,
    delay: `${(Math.random() * 2.8).toFixed(2)}s`,
  }));
}

export default function HumanCostCounter() {
  const { generatedScenario, playerChoices, setScreen } = useGame();

  // ─── Derive humanCostCount + tradeoffLabel from last choice ─
  const { humanCostCount, tradeoffLabel } = useMemo(() => {
    const last   = playerChoices[playerChoices.length - 1];
    const choice = generatedScenario?.choices?.[last?.choiceIndex];
    const option = choice?.options?.find(o => o.id === last?.optionId);
    const c      = option?.consequences ?? {};

    return {
      humanCostCount: c.humanCostCount ?? 0,
      tradeoffLabel:  c.tradeoffLabel  ?? '',
    };
  }, [generatedScenario, playerChoices]);

  const noVictims = humanCostCount === 0;

  const [displayed,      setDisplayed]      = useState(0);
  const [counterDone,    setCounterDone]     = useState(false);
  const [circles]                            = useState(buildCircles);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  // ─── Counter animation (RAF, ease-out cubic) ─────────────
  useEffect(() => {
    if (noVictims) {
      const t = setTimeout(() => setCounterDone(true), 800);
      return () => clearTimeout(t);
    }

    startRef.current = performance.now();

    function tick(now) {
      const elapsed  = now - startRef.current;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(Math.round(eased * humanCostCount));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(humanCostCount);
        setCounterDone(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [humanCostCount, noVictims]);


  const formatted = displayed.toLocaleString();

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Circle grid background */}
      <div className={styles.circleGrid} aria-hidden="true">
        {circles.map(c => (
          <motion.span
            key={c.id}
            className={styles.circle}
            style={{ left: c.left, top: c.top }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: noVictims ? 0.06 : 0.2, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: parseFloat(c.delay),
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Counter box */}
      <div className={styles.counterBox}>
        {noVictims ? (
          <motion.div
            className={styles.noVictimsBlock}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <p className={styles.noVictimsMain}>No direct casualties.</p>
            <p className={styles.noVictimsSub}>The cost is measured differently.</p>
            <motion.button
              onClick={() => setScreen('consequenceMap')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              style={{
                marginTop: '28px',
                background: 'transparent',
                border: '1px solid rgba(201,162,39,0.5)',
                color: '#c9a227',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '10px 28px',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              See the Ripple →
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.p
              className={styles.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              People affected by your decision
            </motion.p>

            <motion.p
              className={styles.number}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 180, damping: 20 }}
            >
              {formatted}
            </motion.p>

            {/* tradeoffLabel — fades in after counter finishes */}
            <motion.p
              className={styles.tradeoff}
              initial={{ opacity: 0 }}
              animate={{ opacity: counterDone ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {tradeoffLabel}
            </motion.p>

            <motion.button
              onClick={() => setScreen('consequenceMap')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: counterDone ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                marginTop: '28px',
                background: 'transparent',
                border: '1px solid rgba(201,162,39,0.5)',
                color: '#c9a227',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '10px 28px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#c9a227';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(201,162,39,0.5)';
                e.currentTarget.style.color = '#c9a227';
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              See the Ripple →
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
