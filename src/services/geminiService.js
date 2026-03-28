import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function getClient() {
  if (!API_KEY) return null;
  return new GoogleGenerativeAI(API_KEY);
}

// ── Historical Verdict — called at end of each game ───────────
export async function generateHistoricalVerdict({
  generatedScenario,
  playerChoices,
  rippleScore,
  humanCostTotal,
}) {
  const client = getClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const choiceSummary = (playerChoices ?? []).map((pc, i) => {
      const choice = generatedScenario?.choices?.[pc.choiceIndex ?? i];
      const option = choice?.options?.find(o => o.id === pc.optionId);
      return `Decision ${i + 1}: ${choice?.setupText ?? ''} → Chose: ${option?.text ?? pc.optionId}`;
    }).join('\n');

    const prompt = `You are a historian judging a player's decisions in a historical simulation.

Scenario: ${generatedScenario?.historicalMoment ?? ''}
Year: ${generatedScenario?.year ?? ''}
Player role: ${generatedScenario?.playerRole?.name ?? ''}, ${generatedScenario?.playerRole?.title ?? ''}

Decisions made:
${choiceSummary}

Ripple scores (0–100, higher = worse): Human Cost ${rippleScore?.humanCost ?? 50}, Economic Impact ${rippleScore?.economicImpact ?? 50}, Environmental ${rippleScore?.environmentalConsequence ?? 50}, Long-Term Stability ${rippleScore?.longTermStability ?? 50}
Total people affected: ${humanCostTotal ?? 0}

What history actually chose: ${generatedScenario?.whatActuallyHappened?.summary ?? ''}

Return ONLY a JSON object with exactly these three fields:
- "verdict": string, 2 sentences max — was this a historically good or harmful set of choices overall?
- "comparedToHistory": string, 1 sentence — how does this compare to what history actually chose?
- "legacyLabel": string, 3–5 words — a dramatic title for this playthrough (e.g. "The Cautious Peacemaker", "The Architect of Ruin")

No markdown. No explanation. Only the JSON object.`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('generateHistoricalVerdict error:', e);
    return null;
  }
}

// ── Growth Insights — Journal, parallel to Groq ───────────────
export async function generateGeminiInsights(ripples) {
  const client = getClient();
  if (!client || !ripples?.length) return null;

  try {
    const model  = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const last5  = ripples.slice(0, 5);

    const summary = last5.map((r, i) => {
      const s = r.ripple_score ?? {};
      return `Play ${i + 1}: "${r.historical_moment}" — Human Cost: ${s.humanCost ?? 50}, Economic: ${s.economicImpact ?? 50}, Environmental: ${s.environmentalConsequence ?? 50}, Stability: ${s.longTermStability ?? 50}`;
    }).join('\n');

    const prompt = `You are a psychologist analyzing a person's decision-making patterns across historical simulations.

Results:
${summary}

Return ONLY a JSON object with exactly these three fields:
- "reveals": string, 2–3 sentences about what this person's patterns reveal about their values and decision-making style
- "blindSpot": string, 1 sentence about what they consistently underestimate or overlook
- "challenge": string, 1 sentence suggesting a specific historical scenario to try next (format: "Try [event] — [why it challenges them]")

No markdown. No explanation. Only the JSON object.`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('generateGeminiInsights error:', e);
    return null;
  }
}
