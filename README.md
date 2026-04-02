# 🌊 RIPPLE — Every Choice Has a Wave

> Built for YHack Spring 2026 at Yale University | Societal Impact Track

## What is Ripple?
RIPPLE is an AI-powered interactive history experience. Type any moment in history, step inside it as a key decision-maker, and watch your choices ripple across the world.

The entire point: YOUR DECISIONS MATTER. They affect the people around you. They shape the world. History proves it. Every single time.

## How it works
1. Type any historical moment (Rosa Parks, Cuban Missile Crisis, Hiroshima...)
2. The AI drops you inside that moment as the key decision-maker
3. Face the real choices they faced — with full consequences
4. Watch your decisions ripple across an interactive globe
5. Get your Ripple Score and Decision DNA profile
6. Sign in to track your Ripple Journal and see your lifetime impact

## Tech Stack
- React + Vite
- **K2 Think V2** (MBZUAI-IFM/K2-Think-v2) — primary reasoning engine for scenario choice generation
- Groq AI (llama-3.3-70b-versatile) — fallback scenario engine
- Google Gemini 1.5 Flash — Historical Verdict + Decision DNA insights
- Mapbox GL JS — interactive globe consequence map
- Supabase — Regret Archive (real-time anonymous reflections + play counter)
- Framer Motion — cinematic screen transitions + animations
- Web Speech API — narrator voiceover
- html2canvas — shareable Decision DNA card

## Tracks
- 🎭 Entertainment
- 🌍 Societal Impact (Education)
- 🧠 Best Use of K2 Think V2
- 🏆 Best Solo Hack
- 🎨 Most Creative Hack
- 🌐 GoDaddy Registry

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` with your API keys (see `.env.example`)
4. Run `npm run dev`
