# CheckrideAI

[CheckrideAI](https://pplproai.app) is a full-stack private pilot checkride preparation app for student pilots preparing for the oral and written portions of the checkride. It combines focused practice, timed mock exams, progress analytics, and an ACS-based AI oral examiner in one personalized study workspace.

**Live app:** [pplproai.app](https://pplproai.app)

## Highlights

- Secure email accounts with server-side Supabase sessions and protected application routes
- Per-user scores, question history, checklist progress, oral sessions, profile settings, and AI usage records
- Focused question sets and timed 60-question practice exams
- Score-over-time and category-mastery charts with suggested spaced-repetition review
- ACS-based AI oral examiner with aircraft-aware questions, structured scoring, readiness feedback, and exact ACS study areas
- Personalized profile with a preferred aircraft and checkride countdown
- Email confirmation, password recovery, and reset-password flows
- Vercel Web Analytics and Speed Insights
- Automated unit, mobile/desktop browser, build, and lint checks in GitHub Actions

## Tech Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL with Row Level Security
- Anthropic API with Zod-validated structured output
- Playwright and the Node.js test runner
- GitHub Actions, Vercel Analytics, and Vercel Speed Insights

## Run Locally

Requirements: Node.js 22 and a Supabase project.

```bash
git clone https://github.com/imabeginnercoder/CheckrideAI.git
cd CheckrideAI
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill in `.env.local` with real credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

The Supabase URL and public key are safe to use in browser code because database access is still enforced by authentication and Row Level Security. The Anthropic key is secret and is only read by the protected server API route. Never commit `.env.local`.

## Supabase Setup

1. Create a Supabase project and enable Email authentication.
2. Open the Supabase SQL editor.
3. Run [`supabase/auth-and-user-data.sql`](supabase/auth-and-user-data.sql). The migration is idempotent, so it can safely be run again when this file changes.
4. In **Authentication > URL Configuration**, set the Site URL to `https://pplproai.app`.
5. Add `https://pplproai.app/**` and `http://localhost:3000/**` to the allowed redirect URLs.
6. Add the three environment variables above to Vercel for Production and Preview, then redeploy.

For token-hash email links, use these paths in the Supabase email templates:

```text
Confirmation: /auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/auth/confirmed
Recovery:     /auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

Prefix each path with `{{ .SiteURL }}` in the template. The app also includes `/auth/callback` for Supabase's PKCE code-exchange flow.

## Database Schema

A database schema is the blueprint for how the app stores information. Each table represents one kind of record:

| Table | Purpose |
| --- | --- |
| `profiles` | Display name, checkride date, preferred aircraft, and tutorial completion for each account |
| `quiz_scores` | Completed practice or exam scores |
| `question_results` | Per-question results used to calculate category mastery |
| `checklist_items` | Completed checkride-planning checklist items |
| `oral_sessions` | AI oral transcripts and structured ACS assessments |
| `ai_usage` | Model, token counts, and estimated cost for each AI request |

Each user-owned row contains a Supabase user ID. A foreign key links it to the account, and `on delete cascade` removes that user's related data if the account is deleted. Row Level Security policies ensure authenticated users can only access rows that belong to them. Indexes make user-history queries faster, while the new-user trigger automatically creates a profile after signup.

The `assessment` and `transcript` columns use PostgreSQL `jsonb`. This stores structured objects and message arrays without flattening every nested value into a separate column.

## Authentication and API Security

`proxy.ts` refreshes the Supabase cookie session and redirects signed-out visitors away from protected pages. Server code independently verifies the signed cookie before accepting AI requests; hiding a page in the browser alone would not protect an API.

The AI route validates request size and shape, applies per-user rate limits, adds the user's preferred aircraft to the examiner context, asks Anthropic for a schema-validated assessment, and records token usage and estimated cost. API keys remain server-only.

## Testing

```bash
npm run lint       # Static code and React/Next.js rule checks
npm test           # Unit tests for analytics, scoring, cost, and profile helpers
npm run build      # Production compilation and route generation
npm run test:e2e   # Playwright workflows in desktop Chrome and Pixel 7 viewports
```

Public browser tests cover landing-page navigation, password visibility, password recovery, protected-route redirects, and unauthorized API access. To run the authenticated workflow too, set `E2E_EMAIL` and `E2E_PASSWORD` to a dedicated test account.

GitHub Actions runs lint, unit tests, a production build, and Playwright on pushes and pull requests to `main`. Add the Supabase and Anthropic values as GitHub Actions secrets for full integration coverage; safe placeholders are used for build-only checks.

## Project Structure

```text
app/
  api/chat/route.ts             Authenticated AI examiner endpoint
  auth/                         Email confirmation and OAuth/PKCE callbacks
  components/                   Shared auth shell and navigation
  dashboard/                    Dashboard page, countdown, and analytics widgets
  forgot-password/              Password recovery request
  login/                        Sign-in and personalized signup
  oral/                         Oral session UI and assessment results
  profile/                      Pilot preferences, countdown, and AI usage
  reset-password/               Secure password update flow
lib/
  oral-exam.ts                  ACS prompt, schemas, limits, and cost calculation
  profile.ts                    Profile options and date helpers
  supabase/                     Browser, server, and proxy Supabase clients
supabase/
  auth-and-user-data.sql        Tables, triggers, indexes, functions, and RLS
tests/
  e2e/                          Playwright user workflows
  *.test.*                      Unit tests
proxy.ts                        Session refresh and protected-route boundary
```

The dashboard was split into focused widgets and shared types so the page coordinates data while smaller components handle presentation. This keeps future features easier to test and change.

## Deployment

Vercel builds the production app from `main`. After changing environment variables, redeploy so the new build receives them. The production deployment is available at [pplproai.app](https://pplproai.app).

## Resume Summary

Built and deployed CheckrideAI, a full-stack private pilot checkride preparation platform using Next.js, TypeScript, Supabase, PostgreSQL, and the Anthropic API. Implemented server-validated authentication, per-user data isolation, ACS-based structured AI evaluation, usage and cost telemetry, responsive learning analytics, and automated CI/browser testing.
