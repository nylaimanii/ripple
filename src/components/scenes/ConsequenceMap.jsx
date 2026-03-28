import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { useGame } from '../../context/GameContext';
import { getCoordinatesForRegion, generateAffectedRegions } from '../../services/rippleAI';
import styles from './ConsequenceMap.module.css';

const TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN;
const HAS_TOKEN = !!TOKEN && !TOKEN.includes('your_');

const BADGE_STYLES = {
  positive:   { bg: 'rgba(42,196,90,0.15)',  border: '#2ac45a', color: '#2ac45a' },
  negative:   { bg: 'rgba(196,58,58,0.15)',  border: '#c43a3a', color: '#c43a3a' },
  unresolved: { bg: 'rgba(196,176,42,0.15)', border: '#c4b02a', color: '#c4b02a' },
  origin:     { bg: 'rgba(26,107,138,0.15)', border: '#2a9bc4', color: '#2a9bc4' },
};

const BADGE_LABELS = {
  positive:   'POSITIVE IMPACT',
  negative:   'NEGATIVE IMPACT',
  unresolved: 'UNRESOLVED',
  origin:     'ORIGIN OF EVENT',
};

// ── Vanilla-JS popup — reads GeoJSON feature props, never touches React state ──

function showPopup(props) {
  const popup = document.getElementById('ripple-popup');
  if (!popup) return;

  const isOrigin   = props.type === 'origin';
  const impactType = props.type ?? 'unresolved';
  const badge      = BADGE_STYLES[impactType] ?? BADGE_STYLES.unresolved;

  document.getElementById('rp-title').textContent = props.regionName ?? '';

  const meta = document.getElementById('rp-meta');
  if (isOrigin && props.year && props.location) {
    meta.textContent   = `${props.year} · ${props.location}`;
    meta.style.display = 'block';
  } else {
    meta.style.display = 'none';
  }

  const typeBadge = document.getElementById('rp-badge-type');
  typeBadge.textContent       = BADGE_LABELS[impactType] ?? impactType.toUpperCase();
  typeBadge.style.background  = badge.bg;
  typeBadge.style.borderColor = badge.border;
  typeBadge.style.color       = badge.color;
  typeBadge.style.display     = 'inline-block';

  const histBadge = document.getElementById('rp-badge-history');
  // GeoJSON serialises booleans — handle both true and "true"
  const isHistorical = props.isHistorical === true || props.isHistorical === 'true';
  if (props.isHistorical !== null && props.isHistorical !== undefined) {
    histBadge.textContent       = isHistorical ? 'HISTORICALLY ACCURATE' : 'ALTERNATE HISTORY';
    histBadge.style.background  = isHistorical ? 'rgba(201,162,39,0.12)' : 'rgba(139,58,196,0.12)';
    histBadge.style.borderColor = isHistorical ? '#c9a227' : '#8b3ac4';
    histBadge.style.color       = isHistorical ? '#c9a227' : '#a855f7';
    histBadge.style.display     = 'inline-block';
  } else {
    histBadge.style.display = 'none';
  }

  document.getElementById('rp-summary').textContent = props.impactSummary ?? '';

  const period = document.getElementById('rp-period');
  if (!isOrigin && props.timePeriod) {
    period.textContent   = props.timePeriod;
    period.style.display = 'block';
  } else {
    period.style.display = 'none';
  }

  const role = document.getElementById('rp-role');
  if (props.playerRole && props.playerRole !== 'null') {
    role.textContent   = `You played as ${props.playerRole}`;
    role.style.display = 'block';
  } else {
    role.style.display = 'none';
  }

  popup.style.display   = 'flex';
  popup.style.transform = 'translateY(110%)';
  popup.style.opacity   = '0';
  requestAnimationFrame(() => {
    popup.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease';
    popup.style.transform  = 'translateY(0)';
    popup.style.opacity    = '1';
  });
}

function hidePopup() {
  const popup = document.getElementById('ripple-popup');
  if (!popup) return;
  popup.style.transition = 'transform 0.28s ease-in, opacity 0.2s ease';
  popup.style.transform  = 'translateY(110%)';
  popup.style.opacity    = '0';
  setTimeout(() => { popup.style.display = 'none'; }, 300);
}

// ── Component ──────────────────────────────────────────────────

export default function ConsequenceMap() {
  const {
    generatedScenario, playerChoices, setScreen,
    setAffectedRegions,
  } = useGame();

  const originCoords = useMemo(() => {
    const oc = generatedScenario?.originCoordinates;
    if (oc?.lat && oc?.lng) return oc;
    return getCoordinatesForRegion(generatedScenario?.location ?? '');
  }, [generatedScenario]);

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const timersRef       = useRef([]);

  const [allDone,         setAllDone]         = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowInstruction(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // ─── Mapbox init ──────────────────────────────────────────────
  useEffect(() => {
    if (!HAS_TOKEN || !mapContainerRef.current) {
      const t = setTimeout(() => setAllDone(true), 1200);
      timersRef.current.push(t);
      return;
    }

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container:   mapContainerRef.current,
      style:       'mapbox://styles/mapbox/dark-v11',
      center:      [originCoords.lng, originCoords.lat],
      zoom:        1.5,
      projection:  'globe',
      interactive: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.setMinZoom(0.5);
    map.setMaxZoom(8);

    map.on('load', () => {
      map.setProjection('globe');
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.touchZoomRotate.enable();
      map.touchPitch.enable();

      map.setFog({
        color:            '#0a0a0f',
        'high-color':     '#1a1a2e',
        'horizon-blend':  0.02,
        'space-color':    '#0a0a0f',
        'star-intensity': 0.8,
      });

      // ── Build origin feature ────────────────────────────────
      const originFeature = {
        type: 'Feature',
        properties: {
          id:           'origin',
          type:         'origin',
          regionName:   generatedScenario?.historicalMoment ?? generatedScenario?.location ?? 'Event Origin',
          impactSummary: generatedScenario?.narratorIntro ?? '',
          impactType:   'origin',
          isHistorical: true,
          timePeriod:   generatedScenario?.year ?? '',
          playerRole:   generatedScenario?.playerRole
            ? `${generatedScenario.playerRole.name}, ${generatedScenario.playerRole.title}`
            : null,
          year:     generatedScenario?.year     ?? '',
          location: generatedScenario?.location ?? '',
        },
        geometry: {
          type:        'Point',
          coordinates: [originCoords.lng, originCoords.lat],
        },
      };

      // ── Add GeoJSON source (origin only to start) ───────────
      map.addSource('regions', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [originFeature] },
      });

      // ── Pulse ring layer (behind circles) ───────────────────
      map.addLayer({
        id:     'region-pulse',
        type:   'circle',
        source: 'regions',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'type'], 'origin'], 22, 16],
          'circle-color': ['case',
            ['==', ['get', 'type'], 'origin'],    '#1a6b8a',
            ['==', ['get', 'type'], 'positive'],  '#1a6b3a',
            ['==', ['get', 'type'], 'negative'],  '#8a1a1a',
            '#8a7a1a',
          ],
          'circle-opacity':       0.2,
          'circle-stroke-width':  0,
        },
      });

      // ── Main circle layer ────────────────────────────────────
      map.addLayer({
        id:     'region-circles',
        type:   'circle',
        source: 'regions',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'type'], 'origin'], 14, 10],
          'circle-color': ['case',
            ['==', ['get', 'type'], 'origin'],    '#1a6b8a',
            ['==', ['get', 'type'], 'positive'],  '#1a6b3a',
            ['==', ['get', 'type'], 'negative'],  '#8a1a1a',
            '#8a7a1a',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity':      0.9,
        },
      });

      // ── Mapbox layer click — no DOM events, no React re-renders ──
      map.on('click', 'region-circles', (e) => {
        if (!e.features?.length) return;
        showPopup(e.features[0].properties);
      });

      map.on('mouseenter', 'region-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'region-circles', () => { map.getCanvas().style.cursor = ''; });

      // ── Fetch affected regions then update GeoJSON source ────
      generateAffectedRegions(
        generatedScenario?.historicalMoment ?? '',
        playerChoices,
      ).then(regions => {
        if (!regions?.length || !mapRef.current) return;

        setAffectedRegions(regions);

        const regionFeatures = regions.map((r, i) => ({
          type: 'Feature',
          properties: {
            id:           `region-${i}`,
            type:         r.impactType ?? 'unresolved',
            regionName:   r.regionName,
            impactSummary: r.impactSummary,
            impactType:   r.impactType ?? 'unresolved',
            isHistorical: r.isHistorical,
            timePeriod:   r.timePeriod ?? '',
            playerRole:   null,
            year:         '',
            location:     '',
          },
          geometry: {
            type:        'Point',
            coordinates: [r.lng, r.lat],
          },
        }));

        mapRef.current.getSource('regions')?.setData({
          type:     'FeatureCollection',
          features: [originFeature, ...regionFeatures],
        });

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([originCoords.lng, originCoords.lat]);
        regions.forEach(r => bounds.extend([r.lng, r.lat]));
        map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 4 });
      });

      const t = setTimeout(() => setAllDone(true), 1800);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {HAS_TOKEN ? (
        <div ref={mapContainerRef} className={styles.mapContainer} />
      ) : (
        <FallbackMap />
      )}

      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.header}>
        <span className={styles.headerLabel}>Consequence Map</span>
        <span className={styles.headerSub}>Tap a marker to see its impact</span>
      </div>

      <AnimatePresence>
        {showInstruction && (
          <>
            <motion.p
              className={styles.instructionText}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              Spin the globe. Tap a region to see its story.
            </motion.p>
            <motion.p
              className={styles.zoomHint}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Pinch to zoom · Drag to spin
            </motion.p>
          </>
        )}
      </AnimatePresence>

      {/* ── Vanilla popup — manipulated by showPopup/hidePopup, never re-renders ── */}
      <div
        id="ripple-popup"
        style={{
          display:              'none',
          position:             'fixed',
          bottom:               'max(108px, calc(env(safe-area-inset-bottom, 0px) + 108px))',
          left:                 '24px',
          right:                '24px',
          margin:               '0 auto',
          maxWidth:             '440px',
          zIndex:               10,
          background:           'rgba(10,10,22,0.94)',
          border:               '1px solid rgba(201,162,39,0.28)',
          borderRadius:         '18px',
          padding:              '22px 22px 20px',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          flexDirection:        'column',
          gap:                  '10px',
          boxShadow:            '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,162,39,0.08)',
        }}
      >
        <button
          onClick={hidePopup}
          style={{
            position:   'absolute',
            top:        '14px',
            right:      '16px',
            background: 'none',
            border:     'none',
            color:      'rgba(232,224,208,0.4)',
            fontSize:   '0.95rem',
            cursor:     'pointer',
            padding:    '4px 8px',
            lineHeight: 1,
          }}
          aria-label="Close"
        >✕</button>

        <h3 id="rp-title" style={{
          fontFamily:   'var(--font-display)',
          fontSize:     '1.15rem',
          color:        '#c9a227',
          margin:       0,
          paddingRight: '28px',
          lineHeight:   1.3,
        }} />

        <p id="rp-meta" style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   '0.7rem',
          color:      'rgba(232,224,208,0.45)',
          margin:     0,
          display:    'none',
        }} />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span id="rp-badge-type" style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding:       '3px 10px',
            borderRadius:  '100px',
            border:        '1px solid',
            boxSizing:     'border-box',
          }} />
          <span id="rp-badge-history" style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding:       '3px 10px',
            borderRadius:  '100px',
            border:        '1px solid',
            display:       'none',
            boxSizing:     'border-box',
          }} />
        </div>

        <p id="rp-summary" style={{
          fontFamily: 'var(--font-body)',
          fontSize:   '0.875rem',
          color:      'rgba(232,224,208,0.88)',
          lineHeight: 1.65,
          margin:     0,
        }} />

        <span id="rp-period" style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.7rem',
          color:         'rgba(232,224,208,0.38)',
          letterSpacing: '0.06em',
          display:       'none',
        }} />

        <p id="rp-role" style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   '0.7rem',
          color:      'rgba(232,224,208,0.45)',
          margin:     0,
          display:    'none',
        }} />
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            className={styles.buttonRow}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.button
              className={styles.continueBtn}
              onClick={() => setScreen('rippleScore')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              See Your Ripple Score →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── No-token fallback ──────────────────────────────────────────
function FallbackMap() {
  return (
    <div className={styles.fallback}>
      <svg viewBox="0 0 360 180" className={styles.globeSvg} aria-hidden="true">
        <ellipse cx="180" cy="90" rx="178" ry="88"
          fill="none" stroke="rgba(42,155,196,0.2)" strokeWidth="0.5" />
        {[-60,-30,0,30,60].map(lat => (
          <ellipse key={lat} cx="180" cy="90" rx="178"
            ry={Math.abs(Math.cos(lat * Math.PI / 180) * 88)}
            fill="none" stroke="rgba(42,155,196,0.07)" strokeWidth="0.4" />
        ))}
        {[-120,-60,0,60,120].map(lng => (
          <line key={lng} x1={lng+180} y1={2} x2={lng+180} y2={178}
            stroke="rgba(42,155,196,0.07)" strokeWidth="0.4" />
        ))}
      </svg>
      <p className={styles.fallbackNote}>
        Add <code>VITE_MAPBOX_TOKEN</code> in <code>.env</code> for the interactive map.
      </p>
    </div>
  );
}
