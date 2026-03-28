import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import { useGame } from '../../context/GameContext';
import { generateScenario, fetchHistoricalImage } from '../../services/rippleAI';
import styles from './IntroScreen.module.css';

const LETTERS = ['R', 'I', 'P', 'P', 'L', 'E'];

const ALL_SUGGESTIONS = [
  'Rosa Parks 1955',
  'Cuban Missile Crisis',
  'Chernobyl 1986',
  'Fall of the Berlin Wall',
  'Moon Landing 1969',
  'Signing of the Magna Carta',
  'Hiroshima 1945',
  'Nelson Mandela released from prison',
];

export default function IntroScreen() {
  const {
    historicalInput, setHistoricalInput,
    setScenario, setLoading, setScreen, setError, setCharacterImage,
    isLoading, error, isMuted,
  } = useGame();

  const suggestions = useMemo(() => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const ripplesRef = useRef([]);
  const soundRef   = useRef(null);

  // 0 = logo animating · 1 = tagline · 2 = subtitle · 3 = input + button
  const [step, setStep] = useState(0);

  // ─── Canvas ripple animation ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animating = true;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const spawnInterval = setInterval(() => {
      ripplesRef.current.push({
        x: canvas.width  / 2,
        y: canvas.height / 2,
        r: 0,
        maxR: Math.max(canvas.width, canvas.height) * 0.9,
        alpha: 0.35,
      });
    }, 1200);

    function draw() {
      if (!animating) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ripplesRef.current = ripplesRef.current.filter(rip => rip.alpha > 0.005);
      ripplesRef.current.forEach(rip => {
        rip.r     += 2.2;
        rip.alpha *= 0.978;
        const g = ctx.createRadialGradient(rip.x, rip.y, rip.r * 0.85, rip.x, rip.y, rip.r);
        g.addColorStop(0,   `rgba(26, 107, 138, 0)`);
        g.addColorStop(0.8, `rgba(26, 107, 138, ${rip.alpha * 0.5})`);
        g.addColorStop(1,   `rgba(42, 155, 196, ${rip.alpha})`);
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });
      rafRef.current = requestAnimationFrame(draw);
    }

    ripplesRef.current.push({ x: canvas.width / 2, y: canvas.height / 2, r: 0, maxR: 2000, alpha: 0.4 });
    draw();

    return () => {
      animating = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(spawnInterval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ─── Step sequencer ──────────────────────────────────────────
  // Last letter starts at 0.3 + 5 * 0.15 = 1.05s, finishes ~1.6s
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000), // tagline
      setTimeout(() => setStep(2), 3300), // subtitle
      setTimeout(() => setStep(3), 4300), // input + button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // ─── Ambient audio ───────────────────────────────────────────
  useEffect(() => {
    if (isMuted) return;
    soundRef.current = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
      loop: true,
      volume: 0.1,
      html5: true,
      onloaderror: () => { soundRef.current = null; },
    });
    soundRef.current.play();
    return () => {
      soundRef.current?.unload();
      soundRef.current = null;
    };
  }, [isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Submit handler ──────────────────────────────────────────
  async function handleEnterHistory() {
    if (!historicalInput.trim() || isLoading) return;
    setLoading(true);
    setError(null);
    setScreen('loading');
    try {
      const result = await generateScenario(historicalInput);

      if (!result) {
        throw new Error("generateScenario returned null — check console for Groq error details.");
      }

      setScenario(result);
      const img = await fetchHistoricalImage(result.playerRole.name);
      setCharacterImage(img);
      setScreen('roleIntro');
    } catch (err) {
      console.error("handleEnterHistory error:", err);
      setError('Could not generate scenario. Check your API key and try again.');
      setScreen('intro');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleEnterHistory();
  }

  const canSubmit = historicalInput.trim().length > 0 && !isLoading;

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ripple canvas */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Content */}
      <div className={styles.content}>

        {/* RIPPLE — letter by letter, 150 ms stagger */}
        <div className={styles.logoRow} aria-label="RIPPLE">
          {LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              className={styles.logoLetter}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.55,
                delay: 0.3 + i * 0.15,
                type: 'spring',
                stiffness: 200,
                damping: 18,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.p
              className={styles.tagline}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Every choice has a wave.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Subtitle */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Type any moment in history. Step inside it. Feel the weight.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Input + Button */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              className={styles.inputSection}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <input
                className={styles.historyInput}
                type="text"
                value={historicalInput}
                onChange={e => setHistoricalInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Try: Cuban Missile Crisis · Rosa Parks 1955 · The fall of Rome..."
                disabled={isLoading}
                autoComplete="off"
                spellCheck="false"
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setHistoricalInput(s)}
                    style={{
                      border: '1px solid #c9a227',
                      background: 'transparent',
                      color: '#c9a227',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.75rem',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <motion.button
                className={styles.enterBtn}
                onClick={handleEnterHistory}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.04 } : {}}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
              >
                {isLoading ? 'Generating…' : 'Enter History →'}
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.p
                    className={styles.errorMsg}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4 }}
                  >
                    ⚠ {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom credit */}
      <motion.p
        className={styles.credit}
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 3 ? 0.3 : 0 }}
        transition={{ duration: 1 }}
      >
        YHack Spring 2026 · Societal Impact
      </motion.p>
    </motion.div>
  );
}
