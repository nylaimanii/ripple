import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import GhostIcon from '../ui/GhostIcon';
import styles from './RippleScoreUpdate.module.css';

const BARS = [
  { key: 'humanCost',                label: 'Human Cost',          icon: '🔴', color: '#c43a3a' },
  { key: 'economicImpact',           label: 'Economic Impact',     icon: '🟡', color: '#c4b02a' },
  { key: 'environmentalConsequence', label: 'Environmental',       icon: '🟢', color: '#2ac45a' },
  { key: 'longTermStability',        label: 'Long-Term Stability', icon: '🔵', color: '#2a9bc4' },
];

export default function RippleScoreUpdate() {
  const {
    generatedScenario, playerChoices,
    rippleScore, currentChoiceIndex, unheardRoomVisited,
    setChoiceIndex, setScreen, setScenarioComplete,
  } = useGame();

  // ─── Derive tradeoffLabel from last choice ────────────────
  const tradeoffLabel = useMemo(() => {
    const last   = playerChoices[playerChoices.length - 1];
    const choice = generatedScenario?.choices?.[last?.choiceIndex];
    const option = choice?.options?.find(o => o.id === last?.optionId);
    return option?.consequences?.tradeoffLabel ?? '';
  }, [generatedScenario, playerChoices]);

  // ─── Check if Unheard Room was skipped for this choice ────
  const currentChoice  = generatedScenario?.choices?.[currentChoiceIndex];
  const skippedUnheard = currentChoice
    ? !unheardRoomVisited[currentChoice.choiceNumber]
    : false;

  const totalChoices = generatedScenario?.choices?.length ?? 3;

  // ─── Continue handler ─────────────────────────────────────
  function handleContinue() {
    if (currentChoiceIndex < totalChoices - 1) {
      setChoiceIndex(currentChoiceIndex + 1);
      setScreen('choice');
    } else {
      setScenarioComplete(true);
      setScreen('summary');
    }
  }

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Blurred backdrop */}
      <div className={styles.backdrop} />

      {/* Sliding card — enters from right, lands centered */}
      <motion.div
        className={styles.card}
        initial={{ x: '110%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '110%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 230, damping: 26, delay: 0.1 }}
      >
        {/* Title */}
        <div className={styles.titleRow}>
          <h2 className={styles.title}>
            <span className={styles.wave}>~</span> Your Ripple
          </h2>
          {skippedUnheard && (
            <GhostIcon count={1} tooltip="You didn't enter the Unheard Room for this choice" />
          )}
        </div>

        {/* Animated bars */}
        <div className={styles.bars}>
          {BARS.map(({ key, label, icon, color }, idx) => {
            const value   = rippleScore[key] ?? 0;
            const danger  = value > 70;
            return (
              <div key={key} className={styles.barRow}>
                <span className={styles.barIcon}>{icon}</span>
                <div className={styles.barInfo}>
                  <div className={styles.barLabelRow}>
                    <span className={styles.barLabel}>{label}</span>
                    <span className={styles.barValue} style={{ color }}>
                      {Math.round(value)}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <motion.div
                      className={`${styles.barFill} ${danger ? styles.barDanger : ''}`}
                      style={{ background: color }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${value}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.3 + idx * 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tradeoff label */}
        {tradeoffLabel ? (
          <motion.p
            className={styles.tradeoff}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            {tradeoffLabel}
          </motion.p>
        ) : null}

        {/* Ghost warning */}
        <AnimatePresence>
          {skippedUnheard && (
            <motion.p
              className={styles.ghostWarning}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              👻 You didn't listen.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <motion.button
          className={styles.continueBtn}
          onClick={handleContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {currentChoiceIndex < totalChoices - 1 ? 'Continue →' : 'See the Full Ripple →'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
