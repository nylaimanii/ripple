import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/*
  SQL to run in Supabase SQL editor:

  CREATE TABLE user_ripples (
    id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    historical_moment  text NOT NULL,
    year               text,
    location           text,
    player_role        json,
    player_choices     json,
    ripple_score       json,
    human_cost_total   integer DEFAULT 0,
    origin_coordinates json,
    created_at         timestamptz DEFAULT now()
  );

  ALTER TABLE user_ripples ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "users read own ripples"
    ON user_ripples FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "users insert own ripples"
    ON user_ripples FOR INSERT
    WITH CHECK (auth.uid() = user_id);
*/

async function callGeminiInsights(summary) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze these historical simulation results and return a JSON object with exactly three string fields: "reveals" (2-3 sentences about what this person's decision patterns reveal about their values), "blindSpot" (1 sentence about what they consistently underestimate), "challenge" (1 sentence suggesting a specific historical scenario to try next, format: "Try [event] — [why it challenges them]").

Results:
${summary}

Return ONLY the raw JSON object. No markdown. No explanation.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.reveals && parsed.blindSpot && parsed.challenge) return parsed;
    return null;
  } catch (e) {
    console.error('callGeminiInsights error:', e);
    return null;
  }
}

const groqClient = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function saveRipple({ generatedScenario, playerChoices, rippleScore, humanCostTotal }) { // eslint-disable-line no-unused-vars
  // Auth removed — ripples are not persisted in this version
  return;
}

export async function fetchUserRipples() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_ripples')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('fetchUserRipples error:', error); return []; }
  return data ?? [];
}

export async function generateGrowthInsights(ripples) {
  if (!ripples?.length) return null;
  const last5 = ripples.slice(0, 5);
  const summary = last5.map((r, i) => {
    const s = r.ripple_score ?? {};
    return `Play ${i + 1}: "${r.historical_moment}" — Human Cost: ${s.humanCost ?? 50}, Economic: ${s.economicImpact ?? 50}, Environmental: ${s.environmentalConsequence ?? 50}, Stability: ${s.longTermStability ?? 50}`;
  }).join('\n');

  const geminiResult = await callGeminiInsights(summary);
  if (geminiResult) return geminiResult;

  try {
    const response = await groqClient.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      max_tokens:      350,
      response_format: { type: 'json_object' },
      messages: [
        {
          role:    'system',
          content: 'You are a thoughtful analyst studying decision patterns in historical simulations. Be honest, specific, and psychologically insightful. Return only raw JSON.',
        },
        {
          role:    'user',
          content: `Analyze these historical simulation results and return JSON with exactly three fields:
- "reveals": 2-3 sentences about what this person's patterns reveal about their values and thinking
- "blindSpot": 1 sentence about what they consistently underestimate or overlook
- "challenge": 1 sentence suggesting a specific historical scenario to play next (format: "Try [event] — [why it challenges them]")

Results:\n${summary}`,
        },
      ],
    });
    try { return JSON.parse(response.choices[0].message.content.trim()); }
    catch { return null; }
  } catch (e) {
    console.error('generateGrowthInsights error:', e);
    return null;
  }
}

export function computeJournalStats(ripples) {
  if (!ripples.length) return { positive: 50, negative: 50, dominant: 'No data yet', totalPeople: 0, count: 0 };

  const n = ripples.length;
  const avgHC  = ripples.reduce((s, r) => s + (r.ripple_score?.humanCost                ?? 50), 0) / n;
  const avgEC  = ripples.reduce((s, r) => s + (r.ripple_score?.economicImpact           ?? 50), 0) / n;
  const avgST  = ripples.reduce((s, r) => s + (r.ripple_score?.longTermStability        ?? 50), 0) / n;
  const total  = ripples.reduce((s, r) => s + (r.human_cost_total ?? 0), 0);

  const positive = Math.round((1 - avgHC / 100) * 100);
  const negative = 100 - positive;

  let dominant = 'Balanced Decisionmaker';
  if (avgHC < 38)      dominant = 'Protects People First';
  else if (avgHC > 65) dominant = 'Prioritizes Stability Over People';
  else if (avgST > 65) dominant = 'Long-Term Strategic Thinker';
  else if (avgEC < 38) dominant = 'Economic Pragmatist';

  return { positive, negative, dominant, totalPeople: total, count: n };
}

export function rippleImpactBadge(ripple) {
  const hc = ripple.ripple_score?.humanCost ?? 50;
  if (hc < 40) return { label: 'NET POSITIVE', color: '#2ac45a' };
  if (hc > 65) return { label: 'NET NEGATIVE', color: '#c43a3a' };
  return { label: 'MIXED', color: '#c4b02a' };
}
