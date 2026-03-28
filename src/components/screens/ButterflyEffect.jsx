import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import styles from './ButterflyEffect.module.css';

const NODE_COLORS = ['#C9A84C', '#c43a3a', '#2ac45a'];

// Delays (seconds): node0=0.3, line0=1.1, node1=1.6, line1=2.4, node2=2.9, outcome=3.9, cta=5.0
const NODE_DELAYS  = [0.3, 1.6, 2.9];
const LINE_DELAYS  = [1.1, 2.4];
const OUTCOME_DELAY = 3.9;
const CTA_DELAY     = 5.0;

function PulseRing({ color, delay }) {
  return (
    <motion.span
      className={styles.pulseRing}
      style={{ borderColor: color }}
      initial={{ scale: 0.7, opacity: 0.7 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 1.1, delay: delay + 0.25, ease: 'easeOut' }}
    />
  );
}

function ConnectorLine({ delay }) {
  return (
    <motion.div
      className={styles.connector}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.45, delay, ease: 'easeIn' }}
      style={{ originY: 0 }}
    />
  );
}

export default function ButterflyEffect() {
  const { playerChoices, generatedScenario, setScreen } = useGame();

  const choices = generatedScenario?.choices ?? [];
  const outcomeSummary = (generatedScenario?.whatActuallyHappened?.summary ?? '').slice(0, 120);

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.header}>
        <p className={styles.eyebrow}>The Butterfly Effect</p>
        <h1 className={styles.title}>How Your Choices Rippled</h1>
      </div>

      <div className={styles.flowchart}>
        {[0, 1, 2].map(i => {
          const choice = choices[i];
          const selectedId = playerChoices[i]?.optionId;
          const selectedOption = choice?.options?.find(o => o.id === selectedId);
          const color = NODE_COLORS[i];

          if (!choice || !selectedOption) return null;

          return (
            <div key={i} className={styles.nodeGroup}>
              {/* Node */}
              <motion.div
                className={styles.node}
                style={{ borderColor: color }}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: NODE_DELAYS[i] }}
              >
                <PulseRing color={color} delay={NODE_DELAYS[i]} />

                <div className={styles.nodeNum} style={{ color }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                <p className={styles.setupText}>{choice.setupText}</p>

                <div className={styles.chosenOption} style={{ borderLeftColor: color }}>
                  <span className={styles.chosenLabel} style={{ color }}>You chose</span>
                  <span className={styles.chosenText}>{selectedOption.text}</span>
                </div>

                {selectedOption.consequences?.summary && (
                  <p className={styles.consequence}>
                    {selectedOption.consequences.summary}
                  </p>
                )}
              </motion.div>

              {/* Connector to next node */}
              {i < 2 && <ConnectorLine delay={LINE_DELAYS[i]} />}
            </div>
          );
        })}

        {/* Outcome node */}
        <motion.div
          className={styles.outcomeNode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: OUTCOME_DELAY, ease: 'easeOut' }}
        >
          <p className={styles.outcomeLabel}>Your Ripple</p>
          <p className={styles.outcomeText}>
            {outcomeSummary}{outcomeSummary.length === 120 ? '…' : ''}
          </p>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        className={styles.cta}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: CTA_DELAY }}
      >
        <motion.button
          className={styles.ctaBtn}
          onClick={() => setScreen('dna')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          See Your Decision DNA →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
