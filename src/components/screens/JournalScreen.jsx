import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../../lib/supabase';
import {
  fetchUserRipples, generateGrowthInsights,
  computeJournalStats, rippleImpactBadge,
} from '../../services/journalService';
import styles from './JournalScreen.module.css';

const TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN;
const HAS_TOKEN = !!TOKEN && !TOKEN.includes('your_');

function formatDate(ts) {
  try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

// ── Mini globe — shows origin coords of every ripple ─────────
function JournalGlobe({ ripples }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!HAS_TOKEN || !containerRef.current || !ripples.length) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container:   containerRef.current,
      style:       'mapbox://styles/mapbox/dark-v11',
      center:      [0, 20],
      zoom:        0.9,
      projection:  'globe',
      interactive: true,
    });

    mapRef.current = map;
    map.setMinZoom(0.5);
    map.setMaxZoom(6);

    map.on('load', () => {
      map.setFog({
        color: '#0a0a0f', 'high-color': '#1a1a2e',
        'space-color': '#0a0a0f', 'star-intensity': 0.8,
      });

      const features = ripples
        .filter(r => r.origin_coordinates?.lat && r.origin_coordinates?.lng)
        .map(r => ({
          type: 'Feature',
          properties: { moment: r.historical_moment },
          geometry: { type: 'Point', coordinates: [r.origin_coordinates.lng, r.origin_coordinates.lat] },
        }));

      if (!features.length) return;

      map.addSource('moments', { type: 'geojson', data: { type: 'FeatureCollection', features } });

      map.addLayer({
        id: 'moment-glow',
        type: 'circle',
        source: 'moments',
        paint: {
          'circle-radius': 14,
          'circle-color': '#c9a227',
          'circle-opacity': 0.12,
          'circle-stroke-width': 0,
        },
      });

      map.addLayer({
        id: 'moment-dots',
        type: 'circle',
        source: 'moments',
        paint: {
          'circle-radius': 7,
          'circle-color': '#c9a227',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [ripples]);

  if (!HAS_TOKEN || !ripples.length) return null;

  return <div ref={containerRef} style={{ width: '100%', height: '280px' }} />;
}

// ── Main component ────────────────────────────────────────────
export default function JournalScreen() {
  const navigate = useNavigate();

  const [user,     setUser]     = useState(null);
  const [ripples,  setRipples]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/signin', { replace: true }); return; }
      setUser(session.user);
      loadRipples();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') navigate('/signin', { replace: true });
      if (session && !user) setUser(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRipples() {
    const data = await fetchUserRipples();
    setRipples(data);
    setLoading(false);

    // Trigger insights after ripples load (needs at least 1)
    if (data.length >= 1) {
      setInsightsLoading(true);
      const result = await generateGrowthInsights(data);
      setInsights(result);
      setInsightsLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
  }

  const stats = computeJournalStats(ripples);
  const totalPeople = ripples.reduce((s, r) => s + (r.human_cost_total ?? 0), 0);
  const uniqueCountries = [...new Set(ripples.map(r => r.location).filter(Boolean))].length;

  if (loading) {
    return (
      <div className={styles.root}>
        <p className={styles.loading}>Loading your journal…</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>~ RIPPLE</Link>
        <div className={styles.navRight}>
          {user && <span className={styles.navEmail}>{user.email}</span>}
          <Link to="/demo" className={styles.playBtn}>Play New Ripple →</Link>
          <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      <div className={styles.body}>

        {/* ── Impact Overview ─────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className={styles.sectionLabel}>Your impact overview</p>
          <div className={styles.overviewCard}>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{stats.count}</span>
                <span className={styles.overviewNumSub}>Ripples Played</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewNum}>{totalPeople.toLocaleString()}</span>
                <span className={styles.overviewNumSub}>People Affected</span>
              </div>
            </div>

            {stats.count > 0 && (
              <>
                <p className={styles.impactBarLabel}>Your Impact Balance</p>
                <div className={styles.impactBar}>
                  <motion.div
                    className={styles.impactBarPos}
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.positive}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                  <motion.div
                    className={styles.impactBarNeg}
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.negative}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <div className={styles.impactBarLegend}>
                  <span style={{ color: '#2ac45a' }}>{stats.positive}% Positive</span>
                  <span style={{ color: '#c43a3a' }}>{stats.negative}% Negative</span>
                </div>
              </>
            )}

            <div className={styles.dominantCard}>
              <p className={styles.dominantLabel}>Dominant Decision DNA</p>
              <p className={styles.dominantTrait}>{stats.dominant}</p>
            </div>
          </div>
        </motion.section>

        {/* ── Ripple History ───────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className={styles.sectionLabel}>Your history</p>
          <h2 className={styles.sectionTitle}>Ripple History</h2>

          {ripples.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyHeading}>No ripples yet.</p>
              <p className={styles.emptySub}>Complete a full scenario in the demo to see it here.</p>
              <Link to="/demo" className={styles.playBtn} style={{ margin: '0 auto' }}>
                Play Your First Ripple →
              </Link>
            </div>
          ) : (
            <div className={styles.ripplesList}>
              {ripples.map((ripple, i) => {
                const badge = rippleImpactBadge(ripple);
                const choices = ripple.player_choices ?? [];
                return (
                  <motion.div
                    key={ripple.id}
                    className={styles.rippleCard}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                  >
                    <div className={styles.rippleCardHeader}>
                      <div>
                        <p className={styles.rippleMoment}>{ripple.historical_moment}</p>
                        <p className={styles.rippleMeta}>
                          {[ripple.year, ripple.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span
                        className={styles.impactBadge}
                        style={{ color: badge.color, borderColor: badge.color, background: `${badge.color}18` }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {choices.length > 0 && (
                      <div className={styles.rippleChoices}>
                        {choices.slice(0, 3).map((c, ci) => (
                          <p key={ci} className={styles.rippleChoice}>
                            <strong>Choice {ci + 1}:</strong> Option {c.optionId ?? '—'}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className={styles.rippleCardFooter}>
                      <span className={styles.rippleDate}>{formatDate(ripple.created_at)}</span>
                      <Link to="/demo" className={styles.playAgainBtn}>Play Again →</Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ── Personal Growth Insights ─────────────────────── */}
        {(ripples.length >= 1) && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <p className={styles.sectionLabel}>AI analysis</p>
            <h2 className={styles.sectionTitle}>Personal Growth Insights</h2>
            <div className={styles.insightsCard}>
              {insightsLoading ? (
                <p className={styles.insightsLoading}>Analyzing your decision patterns…</p>
              ) : insights ? (
                <>
                  <div className={styles.insightBlock}>
                    <p className={styles.insightBlockLabel}>What your choices reveal</p>
                    <p className={styles.insightBlockText}>{insights.reveals}</p>
                  </div>
                  <div className={styles.insightBlock}>
                    <p className={styles.insightBlockLabel}>Your blind spot</p>
                    <p className={styles.insightBlockText}>{insights.blindSpot}</p>
                  </div>
                  <div className={styles.insightBlock}>
                    <p className={styles.insightBlockLabel}>A challenge for you</p>
                    <p className={styles.insightBlockText}>{insights.challenge}</p>
                  </div>
                </>
              ) : (
                <p className={styles.insightsLoading}>Play at least one full scenario to unlock growth insights.</p>
              )}
            </div>
          </motion.section>
        )}

        {/* ── Global Impact Map ───────────────────────────── */}
        {ripples.length > 0 && HAS_TOKEN && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <p className={styles.sectionLabel}>Your footprint</p>
            <h2 className={styles.sectionTitle}>Global Impact Map</h2>
            <div className={styles.globeCard}>
              <div className={styles.globeStats}>
                <span className={styles.globeStat}>
                  <strong>{totalPeople.toLocaleString()}</strong> people affected
                </span>
                <span className={styles.globeStat}>
                  <strong>{uniqueCountries}</strong> locations across history
                </span>
              </div>
              <JournalGlobe ripples={ripples} />
            </div>
          </motion.section>
        )}

      </div>
    </div>
  );
}
