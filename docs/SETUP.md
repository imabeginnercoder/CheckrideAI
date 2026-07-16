# CheckrideAI Setup

This guide contains the operational details for running a separate CheckrideAI environment. People using the hosted product can simply visit [pplproai.app](https://pplproai.app).

## Requirements

- Node.js 22
- A Supabase project
- An Anthropic API key
- A Vercel account for deployment

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Set the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

The Supabase URL and public key identify the project; Row Level Security controls data access. `ANTHROPIC_API_KEY` is secret and must never be committed or exposed to browser code.

## Database

1. Create a Supabase project and enable Email authentication.
2. Open the Supabase SQL Editor.
3. Run [`supabase/auth-and-user-data.sql`](../supabase/auth-and-user-data.sql).

The migration is idempotent, so it can be rerun after the file changes.

### Tables

| Table | Purpose |
| --- | --- |
| `profiles` | Name, aircraft, checkride date, and onboarding status |
| `quiz_scores` | Completed practice and exam scores |
| `question_results` | Per-question category performance |
| `checklist_items` | Completed checkride-planning items |
| `oral_sessions` | Transcripts and structured ACS assessments |
| `ai_usage` | Model, token, request, and estimated-cost records |

Each user-owned record references a Supabase account. Row Level Security policies limit reads and writes to the authenticated owner. Foreign-key cascades remove related records when an account is deleted. Indexes support user-history queries, and an auth trigger creates the initial profile after signup.

## Authentication URLs

In **Supabase > Authentication > URL Configuration**, set:

```text
Site URL: https://pplproai.app
```

Add these redirect URLs:

```text
https://pplproai.app/**
http://localhost:3000/**
```

Add the matching Vercel preview pattern when authentication needs to work in preview deployments.

## Authentication Emails

In **Supabase > Authentication > Emails > Templates**, update the confirmation and recovery links.

### Confirm Sign Up

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/auth/confirmed">
  Confirm email address
</a>
```

### Reset Password

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
  Reset password
</a>
```

The `/auth/confirm` route verifies the token on the server, stores the session in cookies, and redirects to the requested application page. `/auth/callback` supports Supabase's PKCE code-exchange flow.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Set `E2E_EMAIL` and `E2E_PASSWORD` to a dedicated test account to include authenticated Playwright workflows.

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Add the three application environment variables for Production and Preview.
3. Deploy the `main` branch.
4. Confirm the production domain is `https://pplproai.app`.
5. Redeploy after changing environment variables.

Vercel Web Analytics and Speed Insights are mounted in the root application layout.

## Continuous Integration

The GitHub Actions workflow runs lint, unit tests, a production build, and Playwright on pushes and pull requests to `main`. Add Supabase and Anthropic values as repository secrets for full integration coverage; build-only checks use safe placeholders.
