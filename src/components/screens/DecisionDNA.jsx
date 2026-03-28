import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useGame } from '../../context/GameContext';
import GhostIcon from '../ui/GhostIcon';
import styles from './DecisionDNA.module.css';

const NARRATION =
  'You made your choices. History made its own. The distance between those two columns ' +
  'is not just history. It is the space where the future lives. ' +
  'What you do with that space is up to you.';

// ── Helix geometry (12 nodes, 2 full sine rotations) ──────
const CX   = 60;   // container half-width
const AMP  = 38;   // oscillation amplitude
const HELIX_NODES = Array.from({ length: 12 }, (_, i) => {
  const angle  = (i / 11) * Math.PI * 4;
  const leftX  = CX + Math.cos(angle) * AMP;
  const rightX = CX + Math.cos(angle + Math.PI) * AMP;
  return { leftX, rightX, y: 16 + i * 26 };
});

export default function DecisionDNA() {
  const {
    playerChoices,
    generatedScenario,
    unheardRoomVisited,
    humanCostTotal,
    setScreen,
    resetGame,
  } = useGame();

  const dnaRef = useRef(null);
  const [profileStep, setProfileStep] = useState(0);

  const scenarioChoices = generatedScenario?.choices ?? [];

  // ── Per-choice consequences ────────────────────────────
  const choiceConsequences = playerChoices.map(pc => {
    const choice = scenarioChoices[pc.choiceIndex];
    const option = choice?.options?.find(o => o.id === pc.optionId);
    return option?.consequences ?? {};
  });
  const n = Math.max(choiceConsequences.length, 1);

  // ── Profile 1: Time Horizon ────────────────────────────
  const lowLongTermCount  = choiceConsequences.filter(c => (c.longTermStability ?? 50) < 50).length;
  const isLongTermThinker = lowLongTermCount > 1;

  // ── Profile 2: Core Value ──────────────────────────────
  const avgHumanCost      = choiceConsequences.reduce((s, c) => s + (c.humanCost      ?? 50), 0) / n;
  const avgEconomicImpact = choiceConsequences.reduce((s, c) => s + (c.economicImpact ?? 50), 0) / n;
  const coreValueText =
    avgHumanCost      < 50 ? 'You protect people first'     :
    avgEconomicImpact < 50 ? 'You protect systems first'    :
                             'You weigh everything equally';

  // ── Profile 3: Did You Listen? ─────────────────────────
  const totalChoices = scenarioChoices.length || 3;
  const visitedCount = scenarioChoices.filter(c => unheardRoomVisited[c.choiceNumber]).length;
  const listened =
    visitedCount === totalChoices ? { text: 'You listened. Every voice mattered.', tone: 'green',  ghost: false } :
    visitedCount > 0              ? { text: 'You heard some. Not all.',             tone: 'yellow', ghost: false } :
                                    { text: 'You never opened the door.',           tone: 'red',    ghost: true  };

  // ── Mirror: split history summary into ≤3 bullets ─────
  const rawSummary    = generatedScenario?.whatActuallyHappened?.summary ?? '';
  const historyBullets = (rawSummary.match(/[^.!?]+[.!?]*/g) ?? [rawSummary])
    .map(s => s.trim()).filter(Boolean).slice(0, 3);

  // ── Stagger profiles 600ms apart ──────────────────────
  useEffect(() => {
    const timers = [0, 1, 2, 3].map(i =>
      setTimeout(() => setProfileStep(s => Math.max(s, i + 1)), 400 + i * 600)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // TODO: Replace with ElevenLabs
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const utter   = new SpeechSynthesisUtterance(NARRATION);
    utter.rate    = 0.8;
    window.speechSynthesis.cancel();
    const tid = setTimeout(() => window.speechSynthesis.speak(utter), 500);
    return () => {
      clearTimeout(tid);
      window.speechSynthesis.cancel();
    };
  }, []);

  function handleShare() {
    html2canvas(dnaRef.current).then(canvas => {
      const link = document.createElement('a');
      link.download = 'my-ripple.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  function handleReset() {
    resetGame(); // resets all state including currentScreen → 'intro'
  }

  return (
    <motion.div
      ref={dnaRef}
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Your Decision DNA</h1>
      </div>

      {/* ── Animated Double Helix ───────────────────────────── */}
      <div className={styles.helixScene}>
        <div className={styles.helixContainer}>
          {HELIX_NODES.map(({ leftX, rightX, y }, i) => (
            <div key={i}>
              {/* Connecting rung */}
              <div
                className={styles.helixRung}
                style={{
                  left:  Math.min(leftX, rightX),
                  top:   y - 0.5,
                  width: Math.abs(leftX - rightX),
                }}
              />
              {/* Left strand dot */}
              <div
                className={styles.helixDot}
                style={{ left: leftX - 6, top: y - 6, background: '#1a6b8a' }}
              />
              {/* Right strand dot */}
              <div
                className={styles.helixDot}
                style={{ left: rightX - 6, top: y - 6, background: '#8a1a1a' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile Labels ──────────────────────────────────── */}
      <div className={styles.profiles}>

        <motion.div
          className={styles.profileRow}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: profileStep >= 1 ? 1 : 0, x: profileStep >= 1 ? 0 : -32 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.profileLabel}>Time Horizon</span>
          <span className={styles.profileValue}>
            {isLongTermThinker ? 'Long-Term Thinker' : 'Short-Term Thinker'}
          </span>
        </motion.div>

        <motion.div
          className={styles.profileRow}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: profileStep >= 2 ? 1 : 0, x: profileStep >= 2 ? 0 : -32 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.profileLabel}>Core Value</span>
          <span className={styles.profileValue}>{coreValueText}</span>
        </motion.div>

        <motion.div
          className={styles.profileRow}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: profileStep >= 3 ? 1 : 0, x: profileStep >= 3 ? 0 : -32 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.profileLabel}>Did You Listen?</span>
          <span
            className={styles.profileValue}
            data-tone={listened.tone}
          >
            {listened.text}
            {listened.ghost && (
              <GhostIcon count={1} tooltip="You never heard the affected voices" />
            )}
          </span>
        </motion.div>

        <motion.div
          className={styles.profileRow}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: profileStep >= 4 ? 1 : 0, x: profileStep >= 4 ? 0 : -32 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.profileLabel}>Total Human Cost</span>
          <span className={styles.profileValue}>
            <strong className={styles.costNumber}>
              {humanCostTotal.toLocaleString()}
            </strong>
            <span className={styles.costSub}> people affected by your decisions across history</span>
          </span>
        </motion.div>

      </div>

      {/* ── Mirror Moment ───────────────────────────────────── */}
      <motion.section
        className={styles.mirror}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: profileStep >= 4 ? 1 : 0, y: profileStep >= 4 ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <h2 className={styles.mirrorTitle}>The Mirror Moment</h2>

        <div className={styles.mirrorGrid}>
          {/* Your Path */}
          <div className={styles.mirrorCol}>
            <p className={styles.mirrorColLabel}>Your Path</p>
            {scenarioChoices.map((choice, i) => {
              const pc     = playerChoices.find(c => c.choiceIndex === i);
              const option = choice.options?.find(o => o.id === pc?.optionId);
              return (
                <div key={i} className={styles.mirrorItem}>
                  <span className={styles.mirrorNum}>{i + 1}</span>
                  <p className={styles.mirrorText}>{option?.text ?? '—'}</p>
                </div>
              );
            })}
          </div>

          {/* Gold divider */}
          <div className={styles.mirrorDivider} aria-hidden="true" />

          {/* History's Path */}
          <div className={styles.mirrorCol}>
            <p className={styles.mirrorColLabel}>History's Path</p>
            {historyBullets.map((bullet, i) => (
              <div key={i} className={styles.mirrorItem}>
                <span className={styles.mirrorNum}>{i + 1}</span>
                <p className={styles.mirrorText}>{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final narration */}
        <div className={styles.narration}>
          <p className={styles.narrationText}>"{NARRATION}"</p>
        </div>
      </motion.section>

      {/* ── Action Buttons ──────────────────────────────────── */}
      <motion.div
        className={styles.actions}
        initial={{ opacity: 0 }}
        animate={{ opacity: profileStep >= 4 ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.button
          className={styles.resetBtn}
          onClick={handleReset}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Play Another Moment
        </motion.button>
        <motion.button
          className={styles.archiveBtn}
          onClick={() => setScreen('archive')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          The Regret Archive →
        </motion.button>
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: '#c9a227',
            color: '#1a1208',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Share Your Ripple
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
