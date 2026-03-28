import { createContext, useContext, useReducer, useCallback } from 'react';

// ─── Initial state ────────────────────────────────────────────
const initialState = {
  currentScreen: 'intro',
  historicalInput: '',
  generatedScenario: null,
  isLoading: false,
  currentChoiceIndex: 0,
  playerChoices: [],
  unheardRoomVisited: {},
  rippleScore: {
    humanCost: 50,
    economicImpact: 50,
    environmentalConsequence: 50,
    longTermStability: 50,
  },
  humanCostTotal: 0,
  scenarioComplete: false,
  error: null,
  isMuted: false,
  affectedRegions: [],
  characterImage: null,
};

// ─── Actions ──────────────────────────────────────────────────
const A = {
  SET_SCREEN:           'SET_SCREEN',
  SET_HISTORICAL_INPUT: 'SET_HISTORICAL_INPUT',
  SET_SCENARIO:         'SET_SCENARIO',
  SET_LOADING:          'SET_LOADING',
  SET_CHOICE_INDEX:     'SET_CHOICE_INDEX',
  ADD_PLAYER_CHOICE:    'ADD_PLAYER_CHOICE',
  VISIT_UNHEARD_ROOM:   'VISIT_UNHEARD_ROOM',
  UPDATE_RIPPLE_SCORE:  'UPDATE_RIPPLE_SCORE',
  ADD_HUMAN_COST:       'ADD_HUMAN_COST',
  SET_SCENARIO_COMPLETE:'SET_SCENARIO_COMPLETE',
  SET_ERROR:             'SET_ERROR',
  SET_AFFECTED_REGIONS:  'SET_AFFECTED_REGIONS',
  SET_CHARACTER_IMAGE:   'SET_CHARACTER_IMAGE',
  TOGGLE_MUTE:           'TOGGLE_MUTE',
  RESET:                 'RESET',
};

// ─── Reducer ──────────────────────────────────────────────────
function gameReducer(state, action) {
  switch (action.type) {
    case A.SET_SCREEN:
      return { ...state, currentScreen: action.payload };

    case A.SET_HISTORICAL_INPUT:
      return { ...state, historicalInput: action.payload };

    case A.SET_SCENARIO:
      return { ...state, generatedScenario: action.payload };

    case A.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case A.SET_CHOICE_INDEX:
      return { ...state, currentChoiceIndex: action.payload };

    case A.ADD_PLAYER_CHOICE:
      return { ...state, playerChoices: [...state.playerChoices, action.payload] };

    case A.VISIT_UNHEARD_ROOM:
      return {
        ...state,
        unheardRoomVisited: { ...state.unheardRoomVisited, [action.payload]: true },
      };

    case A.UPDATE_RIPPLE_SCORE: {
      const p = action.payload;
      return {
        ...state,
        rippleScore: {
          humanCost:                Math.min(100, state.rippleScore.humanCost                + (p.humanCost                || 0)),
          economicImpact:           Math.min(100, state.rippleScore.economicImpact           + (p.economicImpact           || 0)),
          environmentalConsequence: Math.min(100, state.rippleScore.environmentalConsequence + (p.environmentalConsequence || 0)),
          longTermStability:        Math.min(100, state.rippleScore.longTermStability        + (p.longTermStability        || 0)),
        },
      };
    }

    case A.ADD_HUMAN_COST:
      return { ...state, humanCostTotal: state.humanCostTotal + action.payload };

    case A.SET_SCENARIO_COMPLETE:
      return { ...state, scenarioComplete: action.payload };

    case A.SET_ERROR:
      return { ...state, error: action.payload };

    case A.SET_AFFECTED_REGIONS:
      return { ...state, affectedRegions: action.payload };

    case A.SET_CHARACTER_IMAGE:
      return { ...state, characterImage: action.payload };

    case A.TOGGLE_MUTE:
      return { ...state, isMuted: !state.isMuted };

    case A.RESET:
      return initialState;

    default:
      return state;
  }
}

// ─── Context & Provider ───────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setScreen           = useCallback((s)       => dispatch({ type: A.SET_SCREEN,           payload: s }),       []);
  const setHistoricalInput  = useCallback((s)       => dispatch({ type: A.SET_HISTORICAL_INPUT, payload: s }),       []);
  const setScenario         = useCallback((s)       => dispatch({ type: A.SET_SCENARIO,         payload: s }),       []);
  const setLoading          = useCallback((b)       => dispatch({ type: A.SET_LOADING,          payload: b }),       []);
  const setChoiceIndex      = useCallback((n)       => dispatch({ type: A.SET_CHOICE_INDEX,     payload: n }),       []);
  const addPlayerChoice     = useCallback((c)       => dispatch({ type: A.ADD_PLAYER_CHOICE,    payload: c }),       []);
  const visitUnheardRoom    = useCallback((key)     => dispatch({ type: A.VISIT_UNHEARD_ROOM,   payload: key }),     []);
  const updateRippleScore   = useCallback((scores)  => dispatch({ type: A.UPDATE_RIPPLE_SCORE,  payload: scores }),  []);
  const addHumanCost        = useCallback((n)       => dispatch({ type: A.ADD_HUMAN_COST,       payload: n }),       []);
  const setScenarioComplete = useCallback((b)       => dispatch({ type: A.SET_SCENARIO_COMPLETE,payload: b }),       []);
  const setError            = useCallback((e)       => dispatch({ type: A.SET_ERROR,            payload: e }),       []);
  const setAffectedRegions  = useCallback((r)       => dispatch({ type: A.SET_AFFECTED_REGIONS,  payload: r }),       []);
  const setCharacterImage   = useCallback((img)     => dispatch({ type: A.SET_CHARACTER_IMAGE,   payload: img }),     []);
  const toggleMute          = useCallback(()        => dispatch({ type: A.TOGGLE_MUTE }),                            []);
  const resetGame           = useCallback(()        => dispatch({ type: A.RESET }),                                  []);

  return (
    <GameContext.Provider value={{
      ...state,
      setScreen, setHistoricalInput, setScenario,
      setLoading, setChoiceIndex, addPlayerChoice,
      visitUnheardRoom, updateRippleScore, addHumanCost,
      setScenarioComplete, setError, setAffectedRegions, setCharacterImage, toggleMute, resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
