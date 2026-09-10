# Grain Conference Intelligence

A compact Next.js workspace for Grain’s sales team to plan conference coverage, replay cached Prep, capture field meetings, and interpret stored relationship evidence.

## Setup

```bash
cd grain-conference-intelligence
corepack enable
corepack pnpm install
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI works without any secrets: Demo mode is the default, Relationship Copilot returns a labelled deterministic brief, and HubSpot stays a local simulation.

## OpenAI credentials

Integration API keys are configurable by the application user and are never hardcoded.

### Session key (application user)

1. Open **Settings**.
2. Keep **Demo Mode** to generate briefs without calling OpenAI, or choose **Live Mode**.
3. Paste an OpenAI API key into the password field and choose **Connect**.
4. Use **Replace** or **Remove** to rotate or clear a session key.

The key is encrypted with AES-256-GCM and stored only in a short-lived HttpOnly session cookie (`Max-Age` one hour, `SameSite=Strict`, `Secure` in production). It is never written to workspace state, `localStorage`, `sessionStorage`, source code, or application logs. Enter credentials only on a deployment you trust.

### Deployment key (optional, host-owned)

A deployment owner may set `OPENAI_API_KEY` as a server environment variable. Live mode uses a valid user-session key first, and the deployment key only when no session key is present. A rejected session key is not silently replaced by the deployment key.

Also set `OPENAI_MODEL=gpt-5.4-mini` if you want to override the default model name.

### Required server secrets

| Variable | Purpose |
| --- | --- |
| `INTEGRATION_CREDENTIAL_SECRET` | Encrypts user-session OpenAI keys. Session configuration fails closed (503) if this is absent. |
| `AI_USAGE_SECRET` | Signs the five-call live usage cookie. Live usage accounting fails closed if this is absent. Never signed with an empty secret. |

Copy `.env.example` to `.env.local` for local hosting. Leave values empty unless you are intentionally configuring a deployment. Do not put a real API key in git, tests, fixtures, or this README.

```bash
corepack pnpm test:run
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm test:e2e
```

Playwright starts the Next.js dev server when needed. Install browsers once with `corepack pnpm exec playwright install chromium`.

## Demo vs live truth

- **Seeded:** twelve sourced conferences, two cached Prep snapshots, four fictional outreach pages, and compact edge fixtures. Unknown stays Unknown.
- **Simulated:** snapshot replay (`Research again`), HubSpot demo sync, usage-cookie accounting, and Copilot fallback.
- **Live:** the OpenAI Responses path in `POST /api/relationship-brief` when the user selects Live mode and a session or deployment OpenAI key is available. Opening a page never starts research or AI.
- **Not included:** sending email/LinkedIn/Slack, live HubSpot writes, and Vercel deployment until separately authorized.

HubSpot remains simulated. This application does not collect a HubSpot credential.

## Scoring and Q

Scores use a 100-point model: vertical fit 35, buyer-role density 25 (15 sourced audience-role + `min(10, Q)`), FX 20, meeting accessibility 10, trip efficiency 10. Q is unique named current-edition Confirmed people at Tier A companies in decision-maker or influencer roles. Missing research stores `researchedRoomStatus: "unknown"` with 0 provisional room points. Audience size is context only. Original score snapshots and human attend/watch/skip decisions are never overwritten by a later snapshot.

## Identity and history

Only verified exact email or LinkedIn auto-matches. Ambiguity goes to match review. Inferred email cannot open email or create an exact CRM contact. Repeated capture with the same `plannedMeetingId` creates one actual encounter. Only actual saved meetings increment encounter count. Planned meetings, research observations, outreach, and replies remain separate timeline types.

## AI reasoning

Relationship Copilot may cite only provided encounter IDs and research evidence IDs for the selected person/company. It cannot decide identity, invent evidence, upgrade deterministic eligibility, or send anything. Invalid or missing model output falls back safely. Five live calls per anonymous browser are tracked with a signed HttpOnly cookie. Demo mode never calls OpenAI and does not consume that allowance.

## Storage

Workspace state is stored in this browser under `grain-conference-intelligence:v1` and survives reload. Reset on Settings removes only that key. Schema mismatches reset this application’s storage only. OpenAI user keys are not stored in workspace state.

## Known limitations

- Live OpenAI is NOT VERIFIED until a trusted key is configured and one Marcus brief is exercised.
- HubSpot is a readable, persisted simulation. Live HubSpot is P1 / not included in P0.
- Illustrative 2–4 June Money20/20 outreach dates are warnings, not the verified 2027 schedule.
- Vercel deployment is pending separate authorization.

## Vercel

Root Directory: `grain-conference-intelligence`. Configure `INTEGRATION_CREDENTIAL_SECRET` and `AI_USAGE_SECRET` as server env vars. Optionally configure `OPENAI_API_KEY` and `OPENAI_MODEL` for a deployment-wide fallback. Do not deploy until authorized. This repository does not claim a production URL.
