import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import GlassShatter from './components/ui/GlassShatter';
// Screens
import IntroScreen       from './components/screens/IntroScreen';
import LoadingScreen     from './components/screens/LoadingScreen';
import RoleIntroScreen   from './components/screens/RoleIntroScreen';
import RippleSummary     from './components/screens/RippleSummary';
import DecisionDNA       from './components/screens/DecisionDNA';
import RegretArchive     from './components/screens/RegretArchive';
import ButterflyEffect   from './components/screens/ButterflyEffect';
import HomepageScreen    from './components/screens/HomepageScreen';

// Scenes (sequential mid-game screens)
import ChoiceMoment      from './components/scenes/ChoiceMoment';
import HumanCostCounter  from './components/scenes/HumanCostCounter';
import ConsequenceMap    from './components/scenes/ConsequenceMap';
import RippleScoreUpdate from './components/scenes/RippleScoreUpdate';

import './styles/global.css';

// ── Screen registry ────────────────────────────────────────
const SCREENS = {
  intro:          <IntroScreen />,
  loading:        <LoadingScreen />,
  roleIntro:      <RoleIntroScreen />,
  choice:         <ChoiceMoment />,
  humanCost:      <HumanCostCounter />,
  consequenceMap: <ConsequenceMap />,
  rippleScore:    <RippleScoreUpdate />,
  summary:        <RippleSummary />,
  butterfly:      <ButterflyEffect />,
  dna:            <DecisionDNA />,
  archive:        <RegretArchive />,
};

// ── Inner app (needs access to useGame) ───────────────────
function AppInner() {
  const { currentScreen } = useGame();
  const [shatter, setShatter] = useState(false);
  const prevScreenRef = useRef(currentScreen);

  // Fire GlassShatter on every screen change
  useEffect(() => {
    if (prevScreenRef.current !== currentScreen) {
      setShatter(true);
      prevScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  const handleShatterComplete = useCallback(() => setShatter(false), []);

  const screen = SCREENS[currentScreen] ?? SCREENS.intro;

  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      {/* Glass shatter transition overlay */}
      <GlassShatter trigger={shatter} onComplete={handleShatterComplete} />

      {/* Persistent vignette — sits above screens, below overlays */}
      <div className="vignette" aria-hidden="true" />

      {/* Active screen — each manages its own enter animation */}
      {screen}
    </div>
  );
}

// ── Demo route — wraps full game in its own GameProvider ──
function DemoRoute() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}

// ── Root ──────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<HomepageScreen />} />
        <Route path="/demo"    element={<DemoRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
