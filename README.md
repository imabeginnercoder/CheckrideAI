# CheckrideAI

CheckrideAI is a full-stack private pilot checkride preparation app. It combines FAA-style practice questions, timed mock exams, checklist tracking, learning analytics, and an AI oral-exam simulator for Private Pilot students.

> Deployment link: coming soon after Vercel setup.

## Features

- Authenticated user accounts with Supabase Auth
- Per-user practice scores, question results, checklist progress, and oral-session summaries
- Practice-question sets by category
- Timed 60-question FAA-style practice exam
- Dashboard with average scores, score-over-time chart, category mastery, and spaced repetition suggestions
- AI mock oral exam with beginner, intermediate, and checkride-ready modes
- Saved AI oral summaries on the dashboard
- Checkride document and planning checklist

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Anthropic API
- Node built-in test runner

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Run the development server:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Supabase Setup

1. Create a Supabase project.
2. Enable Email auth in Supabase Authentication settings.
3. Create the existing app tables if they are not already present:
   - `quiz_scores`
   - `question_results`
   - `checklist_items`
   - `questions`
4. Run the SQL in:

```bash
supabase/auth-and-user-data.sql
```

That SQL adds `user_id` ownership columns, creates the `oral_sessions` table, enables row-level security, and adds policies so users can only read and write their own saved data.

## Useful Commands

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Start a production server after building:

```bash
npm run start
```

## Deployment Notes

This app is ready for Vercel deployment once the Supabase database migration has been run.

On Vercel, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
```

After deployment, update the deployment link at the top of this README.

## Project Architecture

```text
app/
  api/chat/route.ts           AI oral-exam API route
  components/AuthProvider.tsx Supabase auth gate and user context
  components/Sidebar.tsx      App navigation and sign-out
  page.tsx                    Dashboard and learning analytics
  practice/page.tsx           Category practice flow
  exam/page.tsx               Timed practice exam
  oral/page.tsx               AI oral-exam simulator
  checklist/page.tsx          Checkride checklist

utils/
  analytics.js                Score, mastery, and recommendation helpers
  supabase.js                 Supabase browser client

supabase/
  auth-and-user-data.sql      Auth/RLS/user-data migration

tests/
  analytics.test.mjs          Automated tests for analytics helpers
```

## Resume Summary

Built CheckrideAI, a full-stack AI private pilot preparation platform using Next.js, TypeScript, Supabase, PostgreSQL, and the Anthropic API, with authenticated user progress tracking, practice exams, learning analytics, spaced repetition recommendations, and an AI oral-exam simulator.
