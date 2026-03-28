/**
 * K2 Think V2 — core reasoning engine for RIPPLE
 *
 * K2 is a 70B open reasoning model purpose-built for complex multi-step
 * problem solving. In RIPPLE it powers scenario choice generation — the
 * hardest reasoning task in the app: modeling historical causality,
 * consequence specificity across 4 dimensions, and alternate timeline
 * plausibility for 9 consequence trees per scenario.
 *
 * API: https://api.k2think.ai/v1/chat/completions
 * Model: MBZUAI-IFM/K2-Think-v2
 */

const K2_ENDPOINT = 'https://api.k2think.ai/v1/chat/completions';
const K2_MODEL = 'MBZUAI-IFM/K2-Think-v2';

export function k2Available() {
  const key = import.meta.env.VITE_K2_API_KEY;
  return !!key && !key.includes('your_');
}

export async function callK2(systemPrompt, userContent, maxTokens = 2500) {
  const apiKey = import.meta.env.VITE_K2_API_KEY;
  if (!apiKey || apiKey.includes('your_')) return null;

  try {
    const response = await fetch(K2_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: K2_MODEL,
        stream: false,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`K2 API error ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error('callK2 error:', e);
    return null;
  }
}

/**
 * K2-powered scenario choices — the core reasoning call.
 * Given the basic scenario info, K2 reasons through the full
 * consequence space and returns the 3 choices with 9 consequence trees.
 * Falls back to null so rippleAI.js can fall through to Groq.
 */
export async function k2GenerateChoices(basicInfo) {
  const userContent = `Return a JSON object with no markdown. The JSON must have one field: choices (array of 3 choice objects).

Historical moment: ${basicInfo.historicalMoment}
Year: ${basicInfo.year}
Location: ${basicInfo.location}
Player role: ${basicInfo.playerRole?.name}, ${basicInfo.playerRole?.title}

Use your multi-step reasoning to model the full consequence space of this historical moment.
For each choice, reason through: what were the actual pressures on the decision-maker,
what were the real tradeoffs, what did history record as consequences, and what would
plausible alternate timelines look like.

Each of the 3 choice objects must have exactly these fields:
- choiceNumber: 1, 2, or 3
- setupText: 2-3 sentences — the exact situation right now, what just happened, what hangs in the balance
- unheardRoomCharacters: array of exactly 1 object with: name, age, location, monologue (2-3 sentences from a specific affected person, historically grounded and personal)
- options: array of exactly 3 objects (ids A, B, C), each with:
    - id: "A", "B", or "C"
    - text: 15-25 words explaining WHAT the action is and WHY it matters
    - tooltip: 1 sentence — who benefits and who bears the cost
    - consequences: object with:
        humanCost: integer 0-100 (higher = worse human cost)
        economicImpact: integer 0-100 (higher = worse economic damage)
        environmentalConsequence: integer 0-100 (higher = worse environmental harm)
        longTermStability: integer 0-100 (higher = worse long-term stability)
        humanCostCount: integer — realistic number of people affected, grounded in historical data
        tradeoffLabel: complete sentence explaining the core tradeoff of this specific choice

REASONING RULES:
- If the player picks the historically accurate option, consequences must reflect what actually happened with real documented facts
- If the player picks an alternate option, consequences must reflect PLAUSIBLE alternate history based on the geopolitical/social/economic context — prefix tradeoffLabel with "In this alternate timeline..."
- humanCostCount must be a realistic estimate grounded in documented history, not arbitrary
- Each option's consequences must be DISTINCT and SPECIFIC — not generic or interchangeable
- Reason through second and third-order effects, not just immediate outcomes`;

  const systemPrompt = `You are a multi-step historical reasoning engine. Your task is to model the full consequence space of historical decisions with accuracy, specificity, and analytical depth. You excel at reasoning through causality chains, distinguishing real history from plausible counterfactuals, and quantifying human impact. Return ONLY the raw JSON object. No markdown. No explanation. No code fences.`;

  const raw = await callK2(systemPrompt, userContent, 2500);
  if (!raw) return null;

  // Robust JSON extraction
  try {
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(clean);
    if (parsed?.choices?.length) return parsed;
  } catch (_) { /* fall through to brace extraction */ }

  try {
    let depth = 0;
    let start = raw.indexOf('{');
    if (start === -1) return null;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      if (raw[i] === '}') depth--;
      if (depth === 0) {
        const parsed = JSON.parse(raw.slice(start, i + 1));
        if (parsed?.choices?.length) return parsed;
        break;
      }
    }
  } catch (e) {
    console.error('k2GenerateChoices parse error:', e);
  }

  return null;
}
