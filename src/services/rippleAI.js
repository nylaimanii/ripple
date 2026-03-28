import Groq from "groq-sdk";

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are the narrative engine for RIPPLE, a societal impact educational game. Generate historically accurate, emotionally serious interactive scenarios that teach players about the weight of decisions. Always prioritize human impact. Never trivialize suffering. Use real documented statistics where possible. Ensure every choice has genuine tradeoffs — there is no perfect answer. The tone is cinematic, serious, and respectful. Be specific and historically accurate. Use full proper names for all people, places, and events. Never use vague placeholder language. Write as if narrating a serious documentary. Write all choice options as full informative sentences that explain WHAT the action is, WHY it matters, and WHAT it might cost or gain. Write setup text as a vivid scene description that puts the player in the moment. Make choices feel like real historical decisions with weight and consequence. Write as if you are a documentary narrator explaining a pivotal moment to someone who has never studied history.

CONSEQUENCE ACCURACY RULES: For each choice option, generate consequences that are SPECIFIC TO THAT CHOICE — not generic. If the player picks the historically accurate choice, describe what actually happened with real documented facts and statistics. If the player picks a different choice, describe HYPOTHETICAL consequences based on realistic historical extrapolation — what would have plausibly happened given the geopolitical, social, and economic context of that moment. Always label hypothetical consequences clearly in the tradeoffLabel with an 'In this alternate timeline...' prefix. Be factually accurate about real history. Never invent real statistics. Use phrases like 'historians estimate' or 'according to documented records' for real data.

HISTORICAL ACCURACY: The whatActuallyHappened section must always describe what the REAL historical figure actually did — not what the player chose. This section is always historically accurate regardless of player choices. The whatActuallyHappened.summary must cite real documented outcomes, real names, and real consequences.

Return ONLY the JSON object. No text before or after it. No markdown. No explanation. Just the raw JSON.`;

// ── Region → lat/lng lookup (50 common world locations) ───
const REGION_COORDS = {
  // United States
  'Montgomery, Alabama':    { lat: 32.37,  lng: -86.30 },
  'Birmingham, Alabama':    { lat: 33.52,  lng: -86.80 },
  'Selma, Alabama':         { lat: 32.41,  lng: -87.02 },
  'Washington, D.C.':       { lat: 38.90,  lng: -77.04 },
  'New York City':          { lat: 40.71,  lng: -74.01 },
  'Atlanta, Georgia':       { lat: 33.75,  lng: -84.39 },
  'Memphis, Tennessee':     { lat: 35.15,  lng: -90.05 },
  'Chicago, Illinois':      { lat: 41.88,  lng: -87.63 },
  'Los Angeles':            { lat: 34.05,  lng: -118.24 },
  'United States':          { lat: 38.00,  lng: -97.00 },
  'American South':         { lat: 33.00,  lng: -86.00 },
  'Oval Office':            { lat: 38.90,  lng: -77.04 },
  'Dallas, Texas':          { lat: 32.78,  lng: -96.80 },
  'Hiroshima, Japan':       { lat: 34.39,  lng: 132.45 },
  'Nagasaki, Japan':        { lat: 32.75,  lng: 129.88 },
  // Europe
  'Berlin, Germany':        { lat: 52.52,  lng: 13.40 },
  'London, England':        { lat: 51.51,  lng: -0.13 },
  'Paris, France':          { lat: 48.85,  lng: 2.35 },
  'Warsaw, Poland':         { lat: 52.23,  lng: 21.01 },
  'Vienna, Austria':        { lat: 48.21,  lng: 16.37 },
  'Moscow, Russia':         { lat: 55.75,  lng: 37.62 },
  'Kyiv, Ukraine':          { lat: 50.45,  lng: 30.52 },
  'Sarajevo, Bosnia':       { lat: 43.85,  lng: 18.36 },
  'Rome, Italy':            { lat: 41.90,  lng: 12.50 },
  'Auschwitz, Poland':      { lat: 50.03,  lng: 19.18 },
  'Normandy, France':       { lat: 49.37,  lng: -0.87 },
  // Americas
  'Havana, Cuba':           { lat: 23.14,  lng: -82.36 },
  'Bogotá, Colombia':       { lat: 4.71,   lng: -74.07 },
  'Buenos Aires':           { lat: -34.60, lng: -58.38 },
  'Mexico City':            { lat: 19.43,  lng: -99.13 },
  'Santiago, Chile':        { lat: -33.45, lng: -70.67 },
  // Africa
  'Johannesburg':           { lat: -26.20, lng: 28.04 },
  'Cape Town':              { lat: -33.93, lng: 18.42 },
  'Nairobi, Kenya':         { lat: -1.29,  lng: 36.82 },
  'Lagos, Nigeria':         { lat: 6.52,   lng: 3.38 },
  'Cairo, Egypt':           { lat: 30.04,  lng: 31.24 },
  'Kigali, Rwanda':         { lat: -1.94,  lng: 30.06 },
  // Asia
  'Beijing, China':         { lat: 39.91,  lng: 116.39 },
  'Shanghai, China':        { lat: 31.23,  lng: 121.47 },
  'Tokyo, Japan':           { lat: 35.68,  lng: 139.69 },
  'Seoul, South Korea':     { lat: 37.57,  lng: 126.98 },
  'Hanoi, Vietnam':         { lat: 21.03,  lng: 105.85 },
  'Saigon, Vietnam':        { lat: 10.82,  lng: 106.63 },
  'Phnom Penh, Cambodia':   { lat: 11.57,  lng: 104.92 },
  'New Delhi, India':       { lat: 28.61,  lng: 77.21 },
  'Mumbai, India':          { lat: 19.08,  lng: 72.88 },
  'Kabul, Afghanistan':     { lat: 34.53,  lng: 69.17 },
  'Baghdad, Iraq':          { lat: 33.34,  lng: 44.40 },
  'Tehran, Iran':           { lat: 35.69,  lng: 51.39 },
  // Middle East
  'Jerusalem':              { lat: 31.77,  lng: 35.22 },
  'Gaza':                   { lat: 31.51,  lng: 34.47 },
  'Beirut, Lebanon':        { lat: 33.89,  lng: 35.50 },
};

const DEFAULT_COORD = { lat: 20.00, lng: 0.00 }; // world center fallback

/**
 * Given an affectedRegion string from the AI, return a {lat, lng} coord.
 * Tries exact match first, then partial match on any key.
 */
export function getCoordinatesForRegion(regionString) {
  if (!regionString) return DEFAULT_COORD;

  // Exact match
  if (REGION_COORDS[regionString]) return REGION_COORDS[regionString];

  // Partial match — check if any lookup key is contained in the input or vice versa
  const lower = regionString.toLowerCase();
  for (const [key, coord] of Object.entries(REGION_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return coord;
    }
  }

  return DEFAULT_COORD;
}

// ── JSON extraction helpers ────────────────────────────────

const robustParse = (text) => {
  // Try direct parse first (json_object mode should return clean JSON)
  try { return JSON.parse(text.trim()); }
  catch(_) { /* fall through to brace-counting extractor */ }

  // Safety fallback: find valid JSON using brace counting
  const findValidJSON = (str) => {
    let depth = 0;
    let start = str.indexOf('{');
    if (start === -1) return null;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '{') depth++;
      if (str[i] === '}') depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
    return null;
  };

  const jsonStr = findValidJSON(text);
  if (!jsonStr) { console.error('robustParse: no valid JSON found'); return null; }

  try { return JSON.parse(jsonStr); }
  catch(e) { console.error('robustParse: parse failed', e.message); return null; }
};

// ── Main export ────────────────────────────────────────────

// ── Shared Groq caller ─────────────────────────────────────────
async function callGroq(userContent, maxTokens) {
  const response = await client.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    max_tokens:      maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
  });
  const raw = response.choices[0].message.content;
  return robustParse(raw);
}

export async function generateScenario(historicalInput) {

  try {
    // ── CALL 1: Basic scenario info (no choices) ────────────
    const basicInfo = await callGroq(
      `Return a JSON object with no markdown, no code blocks, no explanation. Just raw JSON. The JSON must have these exact fields: scenarioId, historicalMoment, year, location, playerRole (name, title), setting (description, ambiance), narratorIntro, originCoordinates (lat, lng), whoPays (civilianConflictZones, lowIncomeCommunities, youngPeopleFutureGenerations, politicalEconomicElites), whatActuallyHappened (summary, highestCostBorne, historicalFigureQuote), generationalView (year1, year5, year20, year50). Historical moment: ${historicalInput}.

Field guidance:
- scenarioId: unique kebab-case slug
- historicalMoment: full descriptive title
- year: "YYYY"
- location: "City, Country"
- playerRole.name: full proper name e.g. "Rosa Parks"
- playerRole.title: full title e.g. "Civil Rights Activist, Montgomery Alabama"
- setting.description: max 40 words, vivid and specific
- setting.ambiance: one of tense|solemn|urgent|hopeful|desperate
- narratorIntro: max 60 words, dramatic second-person
- generationalView.year1/year5/year20/year50: max 30 words each
- whatActuallyHappened.summary: max 60 words, historically accurate
- whatActuallyHappened.highestCostBorne: max 30 words
- whatActuallyHappened.historicalFigureQuote: string or empty string
- whoPays values: integers 0-100
- originCoordinates: exact lat/lng for the location`,
      1000,
    );

    if (!basicInfo) throw new Error("Call 1 (basicInfo) returned null");

    // ── CALL 2: The 3 choices ────────────────────────────────
    const choicesData = await callGroq(
      `Return a JSON object with no markdown. The JSON must have one field: choices (array of 3 choice objects). Historical moment: ${basicInfo.historicalMoment}, Year: ${basicInfo.year}, Location: ${basicInfo.location}, Player role: ${basicInfo.playerRole?.name}, ${basicInfo.playerRole?.title}.

Each choice object must have:
- choiceNumber: 1, 2, or 3
- setupText: 2-3 sentences describing the exact situation right now, what just happened, and what hangs in the balance
- unheardRoomCharacters: array of exactly 1 object with fields name, age, location, monologue (2-3 sentences from a specific person's perspective, personal and historically grounded)
- options: array of exactly 3 objects (ids A, B, C), each with:
  - id: "A", "B", or "C"
  - text: full sentence 15-25 words explaining WHAT the action is and WHY it matters
  - tooltip: one sentence — who benefits and who bears the cost
  - consequences: object with humanCost (0-100), economicImpact (0-100), environmentalConsequence (0-100), longTermStability (0-100), humanCostCount (integer, number of people affected), tradeoffLabel (complete sentence explaining the core tradeoff)`,
      2000,
    );

    if (!choicesData?.choices) throw new Error("Call 2 (choices) returned null or missing choices");

    return { ...basicInfo, choices: choicesData.choices };

  } catch (error) {
    console.error("generateScenario error:", error);
    return null;
  }
}

export const fetchHistoricalImage = async (searchTerm) => {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source || null;
  } catch(e) {
    // image fetch failed silently
    return null;
  }
}

// ── Affected regions — separate small call after all choices made ──
export async function generateAffectedRegions(historicalMoment, playerChoices) {
  const choicesSummary = playerChoices
    .map((pc, i) => `Choice ${i + 1}: option ${pc.optionId}`)
    .join(', ');

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      messages: [
        { role: "system", content: "Return ONLY raw JSON. No markdown. No explanation." },
        {
          role: "user",
          content: `Historical moment: ${historicalMoment}. Player decisions: ${choicesSummary}.

Return ONLY this JSON with exactly 5 regions spread across the world affected by this historical moment:
{
  "regions": [
    { "regionName": "string", "lat": 0, "lng": 0, "impactType": "positive|negative|unresolved", "impactSummary": "string max 25 words", "timePeriod": "string", "isHistorical": true }
  ]
}`,
        },
      ],
    });

    const raw = response.choices[0].message.content;
    const parsed = robustParse(raw);
    return parsed?.regions ?? [];

  } catch (error) {
    console.error("generateAffectedRegions error:", error);
    return [];
  }
}
