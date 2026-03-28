import { useGame } from '../context/GameContext';
import { rippleScores } from '../data/rippleScores';

/**
 * Convenience hook for reading + computing Ripple Score data.
 */
export function useRippleScore() {
  const { scene1Choices, scene2Choices } = useGame();

  /** Raw score object for one specific choice + option. */
  function getChoiceScore(scene, choiceIndex, optionIndex) {
    return rippleScores[`scene${scene}`]
      ?.[`choice${choiceIndex}`]
      ?.[`option${optionIndex}`] ?? null;
  }

  /** Average score across all three choices for a scene. */
  function getSceneAverage(scene) {
    const choices = scene === 1 ? scene1Choices : scene2Choices;
    const all = choices
      .map((oi, ci) => (oi !== null ? getChoiceScore(scene, ci, oi) : null))
      .filter(Boolean);

    if (!all.length) return { humanCost: 0, economicImpact: 0, environmentalConsequence: 0, longTermStability: 0 };

    const avg = (key) => Math.round(all.reduce((s, o) => s + o[key], 0) / all.length);
    return {
      humanCost:               avg('humanCost'),
      economicImpact:          avg('economicImpact'),
      environmentalConsequence: avg('environmentalConsequence'),
      longTermStability:       avg('longTermStability'),
    };
  }

  /** Average "Who Pays?" distribution across all choices for a scene. */
  function getWhoPays(scene) {
    const choices = scene === 1 ? scene1Choices : scene2Choices;
    const all = choices
      .map((oi, ci) => (oi !== null ? getChoiceScore(scene, ci, oi)?.whoPays : null))
      .filter(Boolean);

    if (!all.length) return { civilians: 0, lowIncome: 0, youth: 0, elites: 0 };

    const avg = (key) => Math.round(all.reduce((s, w) => s + w[key], 0) / all.length);
    return {
      civilians: avg('civilians'),
      lowIncome: avg('lowIncome'),
      youth:     avg('youth'),
      elites:    avg('elites'),
    };
  }

  return { getChoiceScore, getSceneAverage, getWhoPays };
}
