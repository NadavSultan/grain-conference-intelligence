# Checkpoint 3 Report

## Status

Internal Checkpoint 3 gate is green. Tasks 5 and 6 are implemented on `feat/p0-remaining`. Independent review is not claimed. Checkpoint 4 was not started before this gate.

## Requirements implemented and independently executable

Task 5 delivers planned-meeting-first capture, identity resolution, match review, idempotent encounters, and typed relationship history.

- `/capture` lists planned meetings first. Met opens a prefilled form; Didn’t meet records only the plan outcome. Name, company, conference/date, and a short note are required; drafts are kept on validation errors. An unplanned path is available.
- `plannedMeetingId` is the idempotency key: repeating save creates exactly one `actual_encounter`.
- Exact verified email or LinkedIn matches automatically. Inferred email, name+domain similarity, conflicting identifiers, and namesakes go to review. Job change with an exact verified email updates the contact record and stores the new company on the new event without rewriting earlier events.
- Relationships show Research, Outreach sent, Reply, Planned meeting, and Met. Only actual meetings display an encounter ordinal. Entries link back to conferences.
- Eligibility: only actual saved meetings increment encounter count. Marcus begins `unclear` with counterevidence. Warming requires a captured reciprocal or concrete next step. Stalled requires three actual encounters spanning at least 180 days with no progression.

Task 6 delivers the strict Relationship Copilot contract, deterministic fallback, usage cookie, and a server-only OpenAI route.

- `RelationshipBrief` rejects confidence outside 0–1, unknown or foreign evidence IDs, warming when eligibility is not warming, stalled without three encounters over 180 days, and email drafts without a usable channel.
- Fallback never upgrades eligibility, names the actual encounter count, lists available evidence IDs, includes counterevidence, and produces no email draft for Priya or inferred-email Sam.
- `POST /api/relationship-brief` uses the OpenAI Responses API with `gpt-5.4-mini` and strict JSON schema. Invalid or missing output returns fallback. The five-call allowance is a signed HttpOnly cookie (`grain-ai-usage`) using `AI_USAGE_SECRET`. Call six returns `usage_exhausted` with fallback still usable.
- The same Copilot component renders on Prep and Relationships. Evidence IDs link to timeline or source cards. Mode, provider, model, time, state, confidence, fact/inference, action, and drafts are shown.
- A sanitized Marcus cached example is labelled cached, not live.

## Seeded / simulated behavior

- Seeded Marcus history still contains one prior actual meeting, outreach, reply, and a research observation. Capture of the planned second meeting is a local reducer action.
- Copilot fallback and the cached Marcus brief are deterministic/local. They are not live model output.
- Usage remaining is prototype cookie accounting, not account-grade authorization.

## Live behavior actually exercised

- Unit/integration tests and a local production `pnpm build` were exercised on this machine.
- No `OPENAI_API_KEY` / `AI_USAGE_SECRET` `.env.local` was present. No real OpenAI Responses call was made.

## NOT VERIFIED

- Live Relationship Copilot / one real Marcus brief from OpenAI.
- Browser desktop and 390×844 journeys. Playwright belongs to Task 7.
- Production Vercel URL and production-smoke of the deployed app.

## Deferred external deployment

Deployment to Vercel remains pending until separately authorized. Local production build succeeded. The application is not claimed as deployed.

## Test and gate evidence

Commands were run from `grain-conference-intelligence` with pnpm via Corepack. Production build used the repository’s real Windows path.

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `pnpm vitest run src/features/relationships src/workspace` after Task 5 | 0 | 3 files, 21 passed, 0 skipped |
| `pnpm typecheck` after Task 5 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after Task 5 | 0 | ESLint emitted no diagnostics |
| `pnpm vitest run src/features/copilot src/app/api/relationship-brief/route.test.ts` after Task 6 | 0 | 3 files, 17 passed, 0 skipped |
| `pnpm test:run` Checkpoint 3 | 0 | 11 files, 89 passed, 0 skipped |
| `pnpm typecheck` Checkpoint 3 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` Checkpoint 3 | 0 | ESLint emitted no diagnostics |
| `pnpm build` Checkpoint 3 | 0 | Next.js 16.3.4 compiled; routes include `/capture`, `/relationships`, `/api/relationship-brief` |

Zero-skip status: **PASS — 89 passed, 0 skipped.** No `.only` tests.

## Git

- Branch: `feat/p0-remaining`
- Baseline: `4c9a8b585a506640b094dd51221c2652032eec71`
- Task 5: `96a3f86 feat: connect prep leads to cross-conference history`
- Task 6: `997a526 feat: add evidence-bound relationship copilot`
- Protected planning documents were not edited.

## Limitations

- Live OpenAI validation is NOT VERIFIED because credentials were not present.
- CRM preview/simulation, Settings, Playwright, README, and DEMO_SCRIPT belong to Checkpoint 4 / Task 7.
