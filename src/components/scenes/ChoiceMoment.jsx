import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import TypewriterText from '../ui/TypewriterText';
import UnheardRoom from './UnheardRoom';
import styles from './ChoiceMoment.module.css';

const AMBIANCE_COLORS = {
  tense:     '#8a1a1a',
  solemn:    '#1a6b8a',
  urgent:    '#8a7a1a',
  hopeful:   '#1a6b3a',
  desperate: '#6b1a6b',
};

// Portrait placeholder colors for UnheardRoom characters
const PORTRAIT_COLORS = ['#1a2a3a', '#2a1a1a', '#1a2a1a', '#2a1a2a'];

// Deterministic particles — stable positions across renders
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left:     `${((i * 47 + 13) % 95) + 1}%`,
  top:      `${((i * 31 + 7)  % 88) + 4}%`,
  size:     (i % 3) + 2,
  delay:    `${((i * 0.41) % 4).toFixed(2)}s`,
  duration: `${(3.5 + (i * 0.53) % 2.5).toFixed(2)}s`,
}));

export default function ChoiceMoment() {
  const {
    generatedScenario, currentChoiceIndex,
    rippleScore, setScreen, playerChoices,
    addPlayerChoice, updateRippleScore, addHumanCost,
    unheardRoomVisited, visitUnheardRoom,
  } = useGame();

  const [showCards, setShowCards]           = useState(false);
  const [showUnheardRoom, setShowUnheardRoom] = useState(false);
  const [flashing, setFlashing]             = useState(false);
  const [tooltipId, setTooltipId]           = useState(null);
  const setupDoneRef   = useRef(false);
  const longPressTimer = useRef(null);
  const selecting      = useRef(false);

  const choices  = generatedScenario?.choices ?? [];
  const choice   = choices[currentChoiceIndex];
  const ambiance = generatedScenario?.setting?.ambiance ?? 'solemn';
  const accentColor = AMBIANCE_COLORS[ambiance] ?? AMBIANCE_COLORS.solemn;
  const totalChoices = choices.length || 3;

  // Inject placeholderColor into characters (not in AI schema)
  const characters = (choice?.unheardRoomCharacters ?? []).map((c, i) => ({
    ...c,
    placeholderColor: PORTRAIT_COLORS[i % PORTRAIT_COLORS.length],
  }));

  const visitedThisChoice = unheardRoomVisited[choice?.choiceNumber] ?? false;

  // ─── Setup text done → show cards ────────────────────────
  const handleSetupDone = useCallback(() => {
    if (setupDoneRef.current) return;
    setupDoneRef.current = true;
    setTimeout(() => setShowCards(true), 150);
  }, []);

  // ─── Open Unheard Room ────────────────────────────────────
  function openUnheardRoom() {
    setShowUnheardRoom(true);
  }

  // ─── Tooltip: desktop hover ───────────────────────────────
  function handleMouseEnter(id) { setTooltipId(id); }
  function handleMouseLeave()   { setTooltipId(null); }

  // ─── Tooltip: mobile long-press ───────────────────────────
  function handleTouchStart(id) {
    longPressTimer.current = setTimeout(() => setTooltipId(id), 500);
  }
  function handleTouchEnd() {
    clearTimeout(longPressTimer.current);
    setTooltipId(null);
  }

  // ─── Select a choice ─────────────────────────────────────
  function handleSelect(option) {
    if (selecting.current) return;
    selecting.current = true;

    // White flash
    setFlashing(true);

    // Save choice
    addPlayerChoice({ choiceIndex: currentChoiceIndex, optionId: option.id });

    // Average ripple score toward this choice's consequences
    const c = option.consequences ?? {};
    updateRippleScore({
      humanCost:                Math.round((( c.humanCost                ?? 50) - rippleScore.humanCost)                / 2),
      economicImpact:           Math.round((( c.economicImpact           ?? 50) - rippleScore.economicImpact)           / 2),
      environmentalConsequence: Math.round((( c.environmentalConsequence ?? 50) - rippleScore.environmentalConsequence) / 2),
      longTermStability:        Math.round((( c.longTermStability        ?? 50) - rippleScore.longTermStability)        / 2),
    });

    if (c.humanCostCount > 0) addHumanCost(c.humanCostCount);

    setTimeout(() => setScreen('humanCost'), 180);
  }

  if (!choice) return null;

  return (
    <motion.div
      className={styles.root}
      style={{ '--accent': accentColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient particles */}
      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map(p => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left: p.left, top: p.top,
              width: p.size, height: p.size,
              animationDelay: p.delay, animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Progress indicator */}
        <motion.p
          className={styles.progress}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Decision {currentChoiceIndex + 1} of {totalChoices}
        </motion.p>

        {/* Consequence bridge — shown for choices 2 and 3 */}
        {currentChoiceIndex >= 1 && (() => {
          const prevChoice = generatedScenario?.choices?.[currentChoiceIndex - 1];
          const prevSelectedId = playerChoices[currentChoiceIndex - 1]?.optionId;
          const prevTradeoff = prevChoice?.options?.find(o => o.id === prevSelectedId)?.consequences?.tradeoffLabel;
          if (!prevTradeoff) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginBottom: '18px', textAlign: 'center' }}
            >
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(232,224,208,0.45)', margin: '0 0 4px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                The weight of your last decision:
              </p>
              <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#c9a227', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                {prevTradeoff}
              </p>
            </motion.div>
          );
        })()}

        {/* Setup text */}
        <motion.div
          className={styles.setupBlock}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <TypewriterText
            text={choice.setupText ?? ''}
            speed={30}
            startDelay={400}
            onDone={handleSetupDone}
            tag="p"
            className={styles.setupText}
          />
        </motion.div>

        {/* Choice cards */}
        <div className={styles.cardsList}>
          {(choice.options ?? []).map((option, i) => (
            <AnimatePresence key={option.id ?? i}>
              {showCards && (
                <motion.button
                  className={styles.card}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => handleMouseEnter(option.id)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={() => handleTouchStart(option.id)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  initial={{ opacity: 0, y: 44 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.3,
                    type: 'spring',
                    stiffness: 220,
                    damping: 22,
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.optionLabel}>{option.id}</span>
                  <span className={styles.optionText}>{option.text}</span>

                  {/* Tooltip */}
                  <span
                    className={`${styles.tooltip} ${tooltipId === option.id ? styles.tooltipShow : ''}`}
                  >
                    {option.tooltip}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          ))}
        </div>

      </div>

      {/* Unheard Room trigger — bottom-left */}
      <motion.button
        className={styles.unheardTrigger}
        onClick={openUnheardRoom}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        title="Hear from those affected before you decide"
      >
        <span className={styles.doorIcon}>🚪</span>
        <span className={styles.unheardLabel}>
          The Unheard Room
          {visitedThisChoice && <span className={styles.visitedDot} />}
        </span>
      </motion.button>

      {/* White flash overlay */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            className={styles.flashOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, exit: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>

      {/* Unheard Room modal */}
      <AnimatePresence>
        {showUnheardRoom && (
          <UnheardRoom
            characters={characters}
            choiceNumber={choice.choiceNumber}
            onClose={() => setShowUnheardRoom(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
