import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { rippleScores } from '../../data/rippleScores';
import TypewriterText from '../ui/TypewriterText';
import ChoiceMoment from './ChoiceMoment';
import UnheardRoom from './UnheardRoom';
import HumanCostCounter from './HumanCostCounter';
import ConsequenceMap from './ConsequenceMap';
import RippleScoreUpdate from './RippleScoreUpdate';
import styles from './SceneWrapper.module.css';

/**
 * SceneWrapper — the core game loop for a single scene.
 *
 * Phase state machine per choice:
 *   'intro'          → narrator text + character portrait (only for first choice)
 *   'choice_setup'   → setup text for this choice + unheard room door visible
 *   'making_choice'  → choice buttons animate in
 *   'flash'          → brief white flash
 *   'cost_counter'   → HumanCostCounter full-screen moment
 *   'consequence_map'→ Mapbox consequence lines
 *   'score_update'   → RippleScoreUpdate sliding card
 *
 * After all 3 choices, navigate to /summary1 or /summary2.
 */
export default function SceneWrapper({ sceneData, sceneNum }) {
  const navigate = useNavigate();
  const { setScene, setChoice, visitUnheardRoom, updateRippleScore, addHumanCost, completeScene, unheardRoomVisited } = useGame();

  const [phase,          setPhase]          = useState('intro');
  const [choiceIndex,    setChoiceIndex]     = useState(0);
  const [selectedOption, setSelectedOption]  = useState(null);
  const [introTypingDone, setIntroTypingDone] = useState(false);
  const [setupTypingDone, setSetupTypingDone] = useState(false);
  const [unheardOpen,    setUnheardOpen]     = useState(false);
  const [skippedUnheard, setSkippedUnheard]  = useState(false);

  const currentChoice = sceneData.choices[choiceIndex];
  const unheardKey = `scene${sceneNum}_choice${choiceIndex}`;

  useEffect(() => {
    setScene(sceneNum);
  }, [sceneNum, setScene]);

  // Reset setup state when moving to a new choice
  useEffect(() => {
    setSetupTypingDone(false);
    setSelectedOption(null);
    setSkippedUnheard(false);
  }, [choiceIndex]);

  // ─── Phase: intro → choice_setup ───────────────────────────
  const handleIntroDone = useCallback(() => {
    setIntroTypingDone(true);
  }, []);

  function proceedFromIntro() {
    if (!introTypingDone) {
      setIntroTypingDone(true);
      return;
    }
    setPhase('choice_setup');
  }

  // ─── Phase: choice_setup → making_choice ────────────────────
  function proceedToChoice() {
    // If player hasn't opened Unheard Room, mark ghost
    if (!unheardRoomVisited[unheardKey] && !unheardOpen) {
      setSkippedUnheard(true);
    }
    setPhase('making_choice');
  }

  // ─── Option selected ────────────────────────────────────────
  function handleOptionSelect(optionIndex) {
    setSelectedOption(optionIndex);

    // Record choice
    setChoice(sceneNum, choiceIndex, optionIndex);

    // Update scores
    const scoreData = rippleScores[`scene${sceneNum}`]?.[`choice${choiceIndex}`]?.[`option${optionIndex}`];
    if (scoreData) {
      updateRippleScore({
        humanCost:               scoreData.humanCost / 6,
        economicImpact:          scoreData.economicImpact / 6,
        environmentalConsequence: scoreData.environmentalConsequence / 6,
        longTermStability:       scoreData.longTermStability / 6,
      });
      if (scoreData.humanCostNumber > 0) {
        addHumanCost(scoreData.humanCostNumber || currentChoice.options[optionIndex].humanCostNumber);
      }
    }

    // Human cost
    const hc = currentChoice.options[optionIndex].humanCostNumber || 0;
    if (hc > 0) addHumanCost(hc);

    setPhase('flash');
    setTimeout(() => setPhase('cost_counter'), 350);
  }

  // ─── After cost counter ──────────────────────────────────────
  function handleCostCounterDone() {
    setPhase('consequence_map');
  }

  // ─── After consequence map ───────────────────────────────────
  function handleMapDone() {
    setPhase('score_update');
  }

  // ─── After score update ──────────────────────────────────────
  function handleScoreDone() {
    if (choiceIndex < 2) {
      setChoiceIndex(c => c + 1);
      setPhase('choice_setup');
    } else {
      // Scene complete
      completeScene(sceneNum);
      navigate(`/summary${sceneNum}`);
    }
  }

  // ─── Unheard Room ────────────────────────────────────────────
  function openUnheardRoom() {
    visitUnheardRoom(unheardKey);
    setUnheardOpen(true);
  }

  function closeUnheardRoom() {
    setUnheardOpen(false);
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className={styles.scene} style={{ '--scene-bg': sceneData.character.placeholderColor }}>
      {/* Background layers — parallax illustrated scene */}
      <SceneBackground sceneNum={sceneNum} phase={phase} />

      <AnimatePresence mode="wait">

        {/* ── INTRO phase ── */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className={styles.introPanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <CharacterPortrait character={sceneData.character} />

            <div className={styles.narratorBox}>
              <span className={styles.sceneLabel}>Scene {sceneNum}</span>
              <h2 className={styles.sceneTitle}>{sceneData.title}</h2>
              <p className={styles.sceneSubtitle}>{sceneData.subtitle}</p>

              <TypewriterText
                text={sceneData.narratorIntro}
                speed={22}
                startDelay={400}
                className={styles.narratorText}
                onDone={handleIntroDone}
                tag="p"
              />


              <motion.button
                className={styles.continueBtn}
                onClick={proceedFromIntro}
                initial={{ opacity: 0 }}
                animate={{ opacity: introTypingDone ? 1 : 0.4 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {introTypingDone ? 'Continue →' : 'Tap to skip'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── CHOICE SETUP phase ── */}
        {phase === 'choice_setup' && (
          <motion.div
            key={`setup-${choiceIndex}`}
            className={styles.setupPanel}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.choiceHeader}>
              <span className={styles.choiceNum}>Choice {choiceIndex + 1} of 3</span>
              <h3 className={styles.choiceName}>{currentChoice.title}</h3>
            </div>

            <TypewriterText
              text={currentChoice.setupText}
              speed={24}
              className={styles.setupText}
              onDone={() => setSetupTypingDone(true)}
              tag="p"
            />

            {/* Unheard Room door */}
            <motion.button
              className={styles.unheardDoor}
              onClick={openUnheardRoom}
              animate={{ boxShadow: ['0 0 8px rgba(26,107,138,0.3)', '0 0 20px rgba(26,107,138,0.7)', '0 0 8px rgba(26,107,138,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              title="Enter the Unheard Room — hear from those affected"
            >
              🚪 The Unheard Room
            </motion.button>

            <motion.button
              className={styles.proceedBtn}
              onClick={proceedToChoice}
              initial={{ opacity: 0 }}
              animate={{ opacity: setupTypingDone ? 1 : 0.4 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Make your decision →
            </motion.button>
          </motion.div>
        )}

        {/* ── MAKING CHOICE phase ── */}
        {phase === 'making_choice' && (
          <ChoiceMoment
            key={`choice-${choiceIndex}`}
            choice={currentChoice}
            onSelect={handleOptionSelect}
            skippedUnheard={skippedUnheard}
          />
        )}

        {/* ── FLASH phase ── */}
        {phase === 'flash' && (
          <motion.div
            key="flash"
            className={styles.flashOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.35, times: [0, 0.3, 1] }}
          />
        )}

        {/* ── COST COUNTER phase ── */}
        {phase === 'cost_counter' && selectedOption !== null && (
          <HumanCostCounter
            key={`counter-${choiceIndex}`}
            count={currentChoice.options[selectedOption].humanCostNumber}
            onDone={handleCostCounterDone}
          />
        )}

        {/* ── CONSEQUENCE MAP phase ── */}
        {phase === 'consequence_map' && selectedOption !== null && (
          <ConsequenceMap
            key={`map-${choiceIndex}`}
            consequences={currentChoice.options[selectedOption].consequences}
            origin={sceneData.origin}
            onDone={handleMapDone}
          />
        )}

        {/* ── SCORE UPDATE phase ── */}
        {phase === 'score_update' && selectedOption !== null && (
          <RippleScoreUpdate
            key={`score-${choiceIndex}`}
            sceneNum={sceneNum}
            choiceIndex={choiceIndex}
            optionIndex={selectedOption}
            skippedUnheard={skippedUnheard}
            onDone={handleScoreDone}
          />
        )}

      </AnimatePresence>

      {/* Unheard Room modal */}
      <AnimatePresence>
        {unheardOpen && (
          <UnheardRoom
            characters={currentChoice.unheardRoom.characters}
            onClose={closeUnheardRoom}
          />
        )}
      </AnimatePresence>

      {/* Choice progress dots */}
      <ProgressDots current={choiceIndex} total={3} phase={phase} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function SceneBackground({ sceneNum, phase }) {
  return (
    <div className={`${styles.bg} ${styles[`bg${sceneNum}`]}`} aria-hidden="true">
      <div className={styles.bgLayer1} />
      <div className={styles.bgLayer2} />
      <div className={styles.bgLayer3} />
      {sceneNum === 1 && <CityLights />}
    </div>
  );
}

function CityLights() {
  return (
    <div className={styles.cityLights} aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className={styles.lightDot}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${40 + Math.random() * 55}%`,
            opacity: 0.3 + Math.random() * 0.6,
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function CharacterPortrait({ character }) {
  return (
    <motion.div
      className={styles.portrait}
      style={{ background: character.placeholderColor }}
      initial={{ opacity: 0, scale: 0.9, x: -30 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <span className={styles.portraitInitials}>{character.initials}</span>
      <span className={styles.portraitName}>{character.name}</span>
      <span className={styles.portraitRole}>{character.role}</span>
      {/* TODO: D-ID animated portrait — replace this placeholder div with:
       *   <video autoPlay muted loop src={didVideoUrl} className={styles.portraitVideo} />
       *   where didVideoUrl comes from polling the D-ID /talks/{id} endpoint.
       *   See scene1Data.js character comment for full API call structure.
       */}
    </motion.div>
  );
}

function ProgressDots({ current, total, phase }) {
  if (['cost_counter', 'consequence_map', 'score_update', 'flash'].includes(phase)) return null;
  return (
    <div className={styles.progressDots} aria-label={`Choice ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`${styles.dot} ${i < current ? styles.done : ''} ${i === current ? styles.active : ''}`}
        />
      ))}
    </div>
  );
}
