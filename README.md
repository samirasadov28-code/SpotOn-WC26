# SpotOn WC26

The ultimate World Cup 2026 prediction game for friends.

**PREDICT. COMPETE. WIN.**

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd SpotOn-WC26
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://your-app.vercel.app`) |
| `API_FOOTBALL_KEY` | RapidAPI key for api-football-v1 |
| `CRON_SECRET` | Secret string for protecting cron endpoints |

### 3. Database

Run the migrations against your Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or manually in the Supabase SQL editor:
# 1. Run supabase/migrations/001_schema.sql
# 2. Run supabase/migrations/002_seed.sql
```

### 4. Add logo files

Place these files in `public/`:
- `Logo 1254x1254.png`
- `Logo 512x512.png`
- `Logo 192x192.png`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

The `vercel.json` crons will automatically run:
- Squad refresh: daily at 06:00 UTC
- Lock reminders: hourly

## Making someone an admin

In Supabase SQL editor:
```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Then visit `/admin` to enter match results.

## Architecture

- **Next.js 14 App Router** — SSR + RSC
- **Supabase** — Postgres, Auth (magic links), Realtime
- **Tailwind CSS** — navy/green/red brand palette
- **Scoring engine** — `src/lib/scoring/` — pure functions, unit tested
- **Bracket builder** — `src/lib/bracket/` — group table computation with FIFA tiebreakers
- **PWA** — manifest + service worker for offline static assets
