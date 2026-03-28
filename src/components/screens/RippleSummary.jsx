import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useGame } from '../../context/GameContext';
import GhostIcon from '../ui/GhostIcon';
import { generateHistoricalVerdict } from '../../services/geminiService';
import styles from './RippleSummary.module.css';

const WHO_PAYS_BARS = [
  { key: 'civilianConflictZones',       color: '#8a1a1a' },
  { key: 'lowIncomeCommunities',        color: '#8a4a1a' },
  { key: 'youngPeopleFutureGenerations', color: '#8a7a1a' },
  { key: 'politicalEconomicElites',     color: '#1a6b8a' },
];

const WHO_PAYS_LABELS = {
  civilianConflictZones: 'Civilians in Conflict Zones',
  lowIncomeCommunities: 'Low-Income Communities',
  youngPeopleFutureGenerations: 'Future Generations',
  politicalEconomicElites: 'Political & Economic Elites',
};

const GEN_STOPS = [
  { label: '1 Year',   key: 'year1'  },
  { label: '5 Years',  key: 'year5'  },
  { label: '20 Years', key: 'year20' },
  { label: '50 Years', key: 'year50' },
];

export default function RippleSummary() {
  const {
    playerChoices,
    generatedScenario,
    unheardRoomVisited,
    rippleScore,
    humanCostTotal,
    setScreen,
  } = useGame();

  const [genIdx,         setGenIdx]         = useState(0);
  const [verdict,        setVerdict]        = useState(null);
  const [verdictLoading, setVerdictLoading] = useState(true);

  useEffect(() => {
    setVerdictLoading(true);
    generateHistoricalVerdict({ generatedScenario, playerChoices, rippleScore, humanCostTotal })
      .then(result => {
        setVerdict(result);
        setVerdictLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const radarData = [
    { subject: 'Human Cost',          value: rippleScore.humanCost,                fullMark: 100 },
    { subject: 'Economic Impact',     value: rippleScore.economicImpact,           fullMark: 100 },
    { subject: 'Environmental',       value: rippleScore.environmentalConsequence, fullMark: 100 },
    { subject: 'Long-Term Stability', value: rippleScore.longTermStability,        fullMark: 100 },
  ];

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Your Ripple</h1>
        <p className={styles.subtitle}>Here is what your choices created.</p>
      </div>

      {/* ── Section 1: Choices ─────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Decisions</h2>
        <div className={styles.choicesList}>
          {[0, 1, 2].map(i => {
            const choice = generatedScenario?.choices?.[i];
            const selectedId = playerChoices[i]?.optionId;
            const selectedOption = choice?.options?.find(o => o.id === selectedId);
            if (!choice || !selectedOption) return null;
            return (
              <motion.div
                key={i}
                className={styles.choiceItem}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.15 }}
              >
                <div className={styles.choiceHeader}>
                  <span className={styles.choiceNum}>{i + 1}</span>
                  {!unheardRoomVisited[i + 1] && (
                    <GhostIcon count={1} tooltip="You skipped the Unheard Room for this decision" />
                  )}
                </div>
                <p className={styles.setupText}>{choice.setupText}</p>
                <div className={styles.selectedCard}>
                  <span className={styles.optionId}>{selectedId}</span>
                  <span className={styles.optionText}>{selectedOption.text}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: Radar Chart ─────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ripple Score</h2>
        <div className={styles.radarWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(232,224,208,0.55)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="rgba(201,168,76,0.9)"
                fill="rgba(201,168,76,0.4)"
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: '#0e0e18',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#e8e0d0',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Section 3: Who Bears the Cost? ─────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who Bears the Cost?</h2>
        <div className={styles.whoPaysBars}>
          {WHO_PAYS_BARS.map(({ key, color }, i) => {
            const raw = generatedScenario?.whoPays?.[key] ?? 0;
            return (
              <div key={key} className={styles.whoPaysRow}>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'rgba(232,224,208,0.55)',
                  margin: '0 0 5px 0',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {WHO_PAYS_LABELS[key]}
                </p>
                <div className={styles.whoPaysTrack}>
                  <motion.div
                    className={styles.whoPaysBar}
                    style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${raw}%` }}
                    transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: Generational View ───────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The Long View</h2>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={genIdx}
            onChange={e => setGenIdx(Number(e.target.value))}
            className={styles.slider}
            aria-label="Generational view selector"
          />
          <div className={styles.sliderLabels}>
            {GEN_STOPS.map(({ label }, i) => (
              <span
                key={label}
                className={`${styles.sliderLabel} ${i === genIdx ? styles.sliderLabelActive : ''}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={genIdx}
            className={styles.genText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {generatedScenario?.generationalView?.[GEN_STOPS[genIdx].key] ?? ''}
          </motion.p>
        </AnimatePresence>
      </section>

      {/* ── Section 5: What Actually Happened ──────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What History Actually Chose</h2>
        <div className={styles.historyBlock}>
          <p className={styles.historySummary}>
            {generatedScenario?.whatActuallyHappened?.summary ?? ''}
          </p>
          {generatedScenario?.whatActuallyHappened?.highestCostBorne && (
            <p className={styles.highestCost}>
              {generatedScenario.whatActuallyHappened.highestCostBorne}
            </p>
          )}
          {generatedScenario?.whatActuallyHappened?.historicalFigureQuote && (
            <blockquote className={styles.quote}>
              {generatedScenario.whatActuallyHappened.historicalFigureQuote}
            </blockquote>
          )}
        </div>
      </section>

      {/* ── Section 6: Historical Verdict ──────────────────── */}
      {(verdictLoading || verdict) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Historical Verdict</h2>
          {verdictLoading ? (
            <motion.div
              style={{
                background: 'var(--color-card-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{ height: '14px', borderRadius: '6px', background: 'rgba(201,168,76,0.15)', width: '55%' }} />
              <div style={{ height: '10px', borderRadius: '6px', background: 'rgba(232,224,208,0.07)', width: '100%' }} />
              <div style={{ height: '10px', borderRadius: '6px', background: 'rgba(232,224,208,0.07)', width: '85%' }} />
              <div style={{ height: '10px', borderRadius: '6px', background: 'rgba(232,224,208,0.05)', width: '70%', marginTop: '4px' }} />
            </motion.div>
          ) : verdict ? (
            <motion.div
              className={styles.historyBlock}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <blockquote className={styles.quote}>
                {verdict.legacyLabel}
              </blockquote>
              <p className={styles.historySummary}>{verdict.verdict}</p>
              <p className={styles.highestCost} style={{ color: 'rgba(232,224,208,0.45)', fontStyle: 'normal' }}>
                {verdict.comparedToHistory}
              </p>
            </motion.div>
          ) : null}
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────── */}
      <div className={styles.cta}>
        <motion.button
          className={styles.nextBtn}
          onClick={() => setScreen('butterfly')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          See Your Decision DNA →
        </motion.button>
      </div>
    </motion.div>
  );
}
