# Ripple — Production Deployment Checklist

Use this guide to deploy Ripple to a custom domain (e.g. `playripple.com`) and qualify for the MLH Best Domain from GoDaddy Registry prize.

---

## Step 1 — Register your domain on GoDaddy Registry

1. Go to [GoDaddy Registry](https://www.godaddy.com/domains) and search for your domain (e.g. `playripple.com`).
2. Purchase and register the domain.
3. Keep the GoDaddy dashboard open — you'll point DNS to Vercel in Step 3.

---

## Step 2 — Deploy to Vercel

**Option A — Vercel CLI**
```bash
npm i -g vercel   # if not already installed
vercel --prod
```

**Option B — GitHub Integration**
1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com), import the repo, and deploy.

Vercel will pick up `vercel.json` automatically. The SPA rewrite rule it contains ensures all client-side routes (`/`, `/demo`, `/signin`, `/journal`) are served correctly:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## Step 3 — Add your custom domain in Vercel

1. In your Vercel project → **Settings → Domains**.
2. Add your domain (e.g. `playripple.com`).
3. Vercel will show you DNS records to add. In your GoDaddy DNS settings, add:
   - An **A record** pointing `@` → Vercel's IP (shown in dashboard), **or**
   - A **CNAME record** pointing `www` → `cname.vercel-dns.com`
4. Wait for DNS propagation (usually a few minutes, up to 48 hours).

---

## Step 4 — Add environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add all five:

| Variable | Value |
|---|---|
| `VITE_GROQ_API_KEY` | Your Groq API key |
| `VITE_MAPBOX_TOKEN` | Your Mapbox public token |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ELEVENLABS_API_KEY` | Your ElevenLabs API key (when implemented) |

> **Do NOT commit real values to `.env`** — that file is gitignored for a reason.
> Vercel injects these at build time; no code changes are needed between dev and prod.

After adding vars, trigger a **Redeploy** from the Vercel dashboard so they take effect.

---

## Step 5 — Configure Supabase Auth URLs

In your [Supabase dashboard](https://supabase.com/dashboard) → your project → **Authentication → URL Configuration**:

1. **Site URL** — set to your production domain:
   ```
   https://playripple.com
   ```

2. **Redirect URLs** — add all allowed callback URLs:
   ```
   https://playripple.com/journal
   https://playripple.com/**
   http://localhost:5173/journal
   http://localhost:5173/**
   ```

> The app uses `window.location.origin` for all auth redirects, so it automatically
> uses `localhost` in dev and your production domain in prod — no code changes needed.

---

## Step 6 — Add production redirect URI to Google Cloud Console

If using Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**.
2. Click your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
   (This URI is the same for dev and prod — Supabase handles the final redirect to your app.)
4. Save and wait ~5 minutes for changes to propagate.

---

## Quick verification checklist

- [ ] `playripple.com` loads the homepage
- [ ] `playripple.com/demo` loads the demo (no 404)
- [ ] `playripple.com/signin` loads the sign-in screen
- [ ] Google sign-in redirects back to `playripple.com/journal`
- [ ] Email magic link redirects back to `playripple.com/journal`
- [ ] Mapbox globe renders correctly
- [ ] AI scenario generation works (Groq key active)
- [ ] RegretArchive loads community entries (Supabase connected)
