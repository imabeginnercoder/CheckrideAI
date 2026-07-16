# CheckrideAI

CheckrideAI is a full-stack private pilot checkride preparation app for students preparing for the oral and written portions of the checkride. It combines focused practice, mock exams, progress analytics, and an ACS-based AI oral examiner in one personalized study workspace.

**[Open the live app](https://pplproai.app)**

## Highlights

- Build focused practice sets by knowledge category
- Take timed, 60-question practice exams
- Rehearse oral questions with an aircraft-aware AI examiner
- Receive structured ACS scoring, readiness feedback, and targeted review areas
- Track score history, category mastery, and spaced-repetition suggestions
- Save a preferred aircraft, checkride date, checklist progress, and study history per account
- Follow an optional first-login product tour

## Tech Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- **Data and authentication:** Supabase Auth and PostgreSQL
- **AI:** Anthropic API with Zod-validated structured output
- **Testing:** Node.js test runner and Playwright
- **Delivery:** GitHub Actions and Vercel
- **Monitoring:** Vercel Web Analytics and Speed Insights

## Engineering

- Cookie-backed Supabase sessions protect authenticated pages on the server.
- PostgreSQL Row Level Security isolates every user's scores, profiles, checklists, and oral sessions.
- The AI endpoint independently verifies authentication, validates request limits, applies per-user rate limits, and keeps the Anthropic key server-only.
- Oral-exam responses use a structured schema for ACS categories, scores, strengths, and study recommendations instead of relying on free-form text parsing.
- AI request records store model usage, token counts, and estimated cost for operational visibility.
- GitHub Actions runs lint, unit tests, a production build, and desktop browser workflows on pushes and pull requests.

## Run Locally

```bash
git clone https://github.com/imabeginnercoder/CheckrideAI.git
cd CheckrideAI
npm install
cp .env.example .env.local
npm run dev
```

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
ANTHROPIC_API_KEY=your_secret_api_key
```

Detailed database, authentication-email, and deployment instructions are in [docs/SETUP.md](docs/SETUP.md).

## Testing

```bash
npm run lint       # ESLint and React/Next.js rules
npm test           # Analytics, oral scoring, cost, and profile unit tests
npm run build      # Optimized production build
npm run test:e2e   # Desktop and mobile Playwright workflows
```

Public browser tests cover landing-page navigation, password recovery, protected-route redirects, and unauthorized API access. An optional test account enables the complete authenticated workflow.

## Architecture

```text
app/
  api/chat/          Protected AI examiner endpoint
  auth/              Confirmation and session callbacks
  dashboard/         Analytics, countdown, and onboarding
  oral/              Oral session and ACS assessment UI
  profile/           Pilot preferences and AI usage
lib/
  oral-exam.ts       AI schemas, ACS context, limits, and cost calculation
  profile.ts         Profile synchronization and date helpers
  supabase/          Browser, server, and proxy clients
supabase/
  auth-and-user-data.sql
tests/
  e2e/               Playwright user workflows
proxy.ts             Session refresh and protected-route boundary
```

The dashboard is divided into focused widgets and shared types so data coordination, analytics, and presentation can evolve independently.
