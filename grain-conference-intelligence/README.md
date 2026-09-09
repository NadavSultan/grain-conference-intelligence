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

Optional live Copilot (server-only; never entered in the browser):

```bash
cp .env.example .env.local
```

Set `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.4-mini`, and `AI_USAGE_SECRET`. Without those values the UI still works: Copilot uses deterministic fallback plus a cached Marcus example labelled as cached, not live.

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
- **Live:** the OpenAI Responses path in `POST /api/relationship-brief` when server credentials exist. Opening a page never starts research or AI.
- **Not included:** sending email/LinkedIn/Slack, live HubSpot writes, and Vercel deployment until separately authorized.

## Scoring and Q

Scores use a 100-point model: vertical fit 35, buyer-role density 25 (15 sourced audience-role + `min(10, Q)`), FX 20, meeting accessibility 10, trip efficiency 10. Q is unique named current-edition Confirmed people at Tier A companies in decision-maker or influencer roles. Missing research stores `researchedRoomStatus: "unknown"` with 0 provisional room points. Audience size is context only. Original score snapshots and human attend/watch/skip decisions are never overwritten by a later snapshot.

## Identity and history

Only verified exact email or LinkedIn auto-matches. Ambiguity goes to match review. Inferred email cannot open email or create an exact CRM contact. Repeated capture with the same `plannedMeetingId` creates one actual encounter. Only actual saved meetings increment encounter count. Planned meetings, research observations, outreach, and replies remain separate timeline types.

## AI reasoning

Relationship Copilot may cite only provided encounter IDs and research evidence IDs for the selected person/company. It cannot decide identity, invent evidence, upgrade deterministic eligibility, or send anything. Invalid or missing model output falls back safely. Five live calls per anonymous browser are tracked with a signed HttpOnly cookie.

## Storage

Workspace state is stored in this browser under `grain-conference-intelligence:v1` and survives reload. Reset on Settings removes only that key. Schema mismatches reset this application’s storage only.

## Known limitations

- Live OpenAI is NOT VERIFIED until credentials are present and one Marcus brief is exercised.
- HubSpot is a readable, persisted simulation. Live HubSpot is P1 / not included in P0.
- Illustrative 2–4 June Money20/20 outreach dates are warnings, not the verified 2027 schedule.
- Vercel deployment is pending separate authorization.

## Vercel

Root Directory: `grain-conference-intelligence`. Configure `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_USAGE_SECRET` as server env vars. Do not deploy until authorized. This repository does not claim a production URL.
