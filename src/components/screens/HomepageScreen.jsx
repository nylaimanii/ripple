import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './HomepageScreen.module.css';

const PREVIEW_SCENARIOS = [
  { moment: 'Cuban Missile Crisis, 1962', role: 'President John F. Kennedy', loc: 'Washington D.C.' },
  { moment: 'Rosa Parks refuses to move, 1955', role: 'Rosa Parks, Civil Rights Activist', loc: 'Montgomery, Alabama' },
  { moment: 'The decision to bomb Hiroshima, 1945', role: 'Secretary of War Henry Stimson', loc: 'Washington D.C.' },
];

const FEATURES = [
  {
    icon: '🌍',
    title: 'AI-Generated Scenarios',
    desc: 'Type any moment in history and our AI instantly builds a fully playable, historically grounded scenario with real choices and real stakes.',
  },
  {
    icon: '🗺️',
    title: 'Consequence Map',
    desc: 'Watch your decisions ripple across an interactive globe. See exactly which cities, countries and populations were affected — and how.',
  },
  {
    icon: '🧬',
    title: 'Decision DNA',
    desc: 'Every choice you make builds your Decision DNA profile. Are you a long-term thinker? Do you protect people or systems first? History reveals who you are.',
  },
  {
    icon: '🎭',
    title: 'Cinematic Experience',
    desc: 'Glass-shatter transitions, typewriter narration, animated DNA helixes, and a live corkboard of anonymous reflections — history has never felt this visceral.',
  },
];

const POWERED_BY = [
  { name: 'K2 Think V2', desc: 'Primary reasoning engine — models the full historical consequence space across 9 causal trees per scenario.' },
  { name: 'Groq', desc: 'Lightning-fast AI inference for scenario generation fallback.' },
  { name: 'Mapbox', desc: 'Interactive globe visualization bringing the consequence map to life.' },
  { name: 'Google Gemini', desc: 'Powers the Historical Verdict and Decision DNA psychological insights.' },
];

const STEPS = [
  {
    num: 'Step 01',
    title: 'Choose Your Moment',
    desc: 'Type any historical event. The AI finds your role, sets the scene, and drops you inside it.',
  },
  {
    num: 'Step 02',
    title: 'Make the Decisions',
    desc: 'Face the real choices that changed history. Enter the Unheard Room. Hear from those affected. Then choose.',
  },
  {
    num: 'Step 03',
    title: 'See Your Ripple',
    desc: 'Watch consequences spread across the globe. Get your Ripple Score, Decision DNA, and personal growth insights.',
  },
];

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

export default function HomepageScreen() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [visible,     setVisible]     = useState(true);

  // Cycle preview scenarios
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setScenarioIdx(i => (i + 1) % PREVIEW_SCENARIOS.length);
        setVisible(true);
      }, 380);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  const s = PREVIEW_SCENARIOS[scenarioIdx];

  return (
    <div className={styles.root}>

      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>
          <span className={styles.navWave}>~</span> RIPPLE
        </Link>
        <ul className={styles.navLinks}>
          <li><a href="#features" className={styles.navLink}>Features</a></li>
          <li><a href="#how-it-works" className={styles.navLink}>How It Works</a></li>
        </ul>
        <div className={styles.navActions}>
          <Link to="/demo" className={styles.btnSolid}>Try Demo</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <motion.div className={styles.heroLeft} {...fadeUp} transition={{ duration: 0.7 }}>
          <h1 className={styles.heroHeadline}>
            The weight of <em>history</em><br />in your hands.
          </h1>
          <p className={styles.heroSub}>
            Step into any moment in history. Make the decisions that shaped the world. See exactly how your choices ripple across time, borders, and generations.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/demo" className={styles.btnSolid}>Try Demo →</Link>
          </div>
          <div className={styles.trustBadges}>
            <span className={styles.trustBadge}>✅&nbsp; Any moment in history</span>
            <span className={styles.trustBadge}>✅&nbsp; AI-powered consequences</span>
            <span className={styles.trustBadge}>✅&nbsp; Real historical data</span>
            <span className={styles.trustBadge}>🎭&nbsp; Cinematic & immersive</span>
            <span className={styles.trustBadge}>🌐&nbsp; ripple-history.com ready</span>
          </div>
        </motion.div>

        <motion.div className={styles.heroRight} {...fadeUp} transition={{ duration: 0.7, delay: 0.15 }}>
          <div className={styles.previewCard}>
            <div className={styles.previewCardHeader}>
              <span className={styles.previewGlobe}>🌐</span>
              <span className={styles.previewLabel}>Generating scenario…</span>
              <span className={styles.previewPulse} />
            </div>
            <div className={`${styles.previewScenario} ${visible ? '' : styles.faded}`}>
              <p className={styles.previewMoment}>{s.moment}</p>
              <p className={styles.previewRole}>{s.role}</p>
              <p className={styles.previewLoc}>{s.loc}</p>
            </div>
            <div className={styles.previewBar}>
              <div className={styles.previewBarFill} key={scenarioIdx} />
            </div>
          </div>

          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <p className={styles.statNum}>600+</p>
              <p className={styles.statLabel}>Historical Moments Played</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statNum}>∞</p>
              <p className={styles.statLabel}>Every Choice Has Consequences</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Social Proof ──────────────────────────────────── */}
      <div className={styles.socialProof}>
        <p className={styles.socialProofLabel}>Used by students and educators at</p>
        <div className={styles.socialProofLogos}>
          {['Yale University', 'Harvard', 'Stanford', 'MIT', 'Princeton'].map(n => (
            <span key={n} className={styles.socialProofLogo}>{n}</span>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className={styles.section}>
        <p className={styles.sectionLabel}>What you get</p>
        <h2 className={styles.sectionHeading}>History as you've never experienced it.</h2>
        <p className={styles.sectionSub}>Three tools that make every historical scenario feel real, consequential, and deeply personal.</p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section id="how-it-works" style={{ background: '#0e0e18', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className={styles.section} style={{ paddingBottom: 'clamp(60px, 8vw, 100px)' }}>
          <p className={styles.sectionLabel}>How it works</p>
          <h2 className={styles.sectionHeading}>Three steps. A lifetime of lessons.</h2>
          <div className={styles.stepsRow}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className={styles.step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <span className={styles.stepNum}>{step.num}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Powered By ────────────────────────────────────── */}
      <section className={styles.poweredBy}>
        <p className={styles.sectionLabel}>Powered by</p>
        <h2 className={styles.sectionHeading}>Technology that takes history seriously.</h2>
        <div className={styles.poweredByGrid}>
          {POWERED_BY.map(p => (
            <div key={p.name} className={styles.poweredByCard}>
              <p className={styles.poweredByName}>{p.name}</p>
              <p className={styles.poweredByDesc}>{p.desc}</p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '48px',
          padding: '28px 32px',
          background: 'rgba(201,162,39,0.05)',
          border: '1px solid rgba(201,162,39,0.2)',
          borderRadius: '16px',
          maxWidth: '640px',
          margin: '48px auto 0',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.65rem',
            color: 'rgba(232,224,208,0.4)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            🌐 GoDaddy Registry
          </p>
          <p style={{
            fontFamily: 'var(--font-display, serif)',
            fontSize: '1.2rem',
            color: '#c9a227',
            fontWeight: 700,
            margin: '0 0 8px 0',
          }}>
            ripple-history.com
          </p>
          <p style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: '0.875rem',
            color: 'rgba(232,224,208,0.6)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Every great story deserves a home. Ripple is domain-ready —
            <strong style={{ color: 'rgba(232,224,208,0.85)' }}> ripple-history.com </strong>
            registered via GoDaddy Registry, ready to deploy the moment the hackathon ends.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <section className={styles.bottomCta}>
        <h2 className={styles.ctaHeading}>
          Every decision leaves a ripple.<br /><em>What will yours say?</em>
        </h2>
        <div className={styles.ctaButtons}>
          <Link to="/demo" className={styles.btnSolid}>Try Demo →</Link>
        </div>
        <p className={styles.ctaFine}>No account required for demo &nbsp;•&nbsp; Free forever &nbsp;•&nbsp; Your choices matter</p>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div>
          <span className={styles.footerLogo}>~ RIPPLE</span>
          <span className={styles.footerTagline}>Every choice has a wave.</span>
        </div>
        <ul className={styles.footerLinks}>
          <li><Link to="/demo"    className={styles.footerLink}>Demo</Link></li>
          <li><a href="#features" className={styles.footerLink}>Features</a></li>
          <li><a href="#how-it-works" className={styles.footerLink}>How It Works</a></li>
        </ul>
        <p className={styles.footerCopyright}>
          © 2026 RIPPLE. Built for YHack Spring 2026 at Yale University.
        </p>
        <p className={styles.footerCopyright} style={{ marginTop: '4px', opacity: 0.6 }}>
          🌐 Domain: <strong style={{ color: '#c9a227' }}>ripple-history.com</strong> via GoDaddy Registry &nbsp;·&nbsp; Deployed on Vercel
        </p>
      </footer>

    </div>
  );
}
