# Checkpoint 2 Report

## Status

Internal Checkpoint 2 gate is green. Tasks 3 and 4 are implemented on `feat/p0-remaining`. Independent review is not claimed. Checkpoint 3 was not started before this gate.

## Requirements implemented and independently executable

Task 3 delivers explainable conference scoring, the twelve-event list, Overview, thin Planning, and Today’s Focus.

- Scoring uses the approved 100-point model: vertical fit 35, buyer-role density 25 (15 sourced audience-role + `min(10, Q)`), FX 20, meeting accessibility 10, trip efficiency 10.
- Q counts unique named current-edition Confirmed people at Tier A companies in decision-maker or influencer roles. Missing research stores `researchedRoomStatus: "unknown"` with 0 provisional room points; it does not claim that nobody relevant attends.
- Audience size is displayed as context only and does not change the score. Unknown component evidence stays labelled Unknown with 0 provisional points.
- Score snapshots append; a later snapshot does not overwrite the original stored score or the human attend/watch/skip decision.
- Conference list filters by search, month, geography, vertical, tier, and decision.
- Overview shows total, tier, component bars, rationale, source links, verification dates, Q, research time, coverage limitations, and editable owner/decision.
- Planning is a monthly year list with owner/status, same-owner date conflicts, same-city clusters within seven days, uncovered quarters, Q, and Prep links.
- Today’s Focus lists undecided upcoming conferences and direct cached Prep links. Opening these pages does not start research or AI.

Task 4 delivers cached Prep, labelled snapshot replay, summary filters, four complete outreach pages, action gates, statuses, and coordination.

- Prep summary counts attendees verified, relevant, ready to contact, and need coordination as disjoint filters with the public-signal qualification.
- Unknown CRM, missing channel, unresolved identity, and already-contacted people can be relevant without being ready or coordination-needed.
- Sort order is A+Confirmed, A+Likely, B+Confirmed, then remaining combinations.
- `Research again` plays the labelled progress sequence and loads the second stored snapshot. Stored `researchedAt` is preserved; `simulatedAt` is recorded separately. Replay failure leaves the prior snapshot untouched.
- Snapshot diff reports added, changed, and removed/cancelled records.
- David’s prospect drafts stay blocked until coordination is acknowledged. Acknowledgment unlocks drafts without changing CRM ownership.
- Sam cannot open email or create an exact CRM contact from an inferred email. Priya has no email action. Unknown CRM is never treated as new.
- Prep statuses persist per person/event. No button sends email, LinkedIn, Slack, or a live HubSpot write.

## Seeded / simulated behavior

- Twelve sourced conferences and their score evidence remain Checkpoint 1 fixtures.
- Two cached Prep events and two Money20/20 snapshots remain stored research; replay is a labelled simulation of stored data.
- Four complete fictional profiles and compact edge records remain labelled `Fictional demo scenario`.
- Seeded coverage plans demonstrate conflict (Alex on overlapping Middle East / EuroFinance dates), a London trip cluster, and uncovered quarters.
- CRM labels on Prep cards are seeded read-states. Create/View CRM is a gated control; persisted HubSpot simulation is Checkpoint 4.
- Illustrative 2–4 June Money20/20 outreach dates remain warnings, not the verified 2027 schedule.

## Live behavior actually exercised

- Unit/integration tests and a local production `pnpm build` were exercised on this machine.
- No live OpenAI call was made in Checkpoint 2. Copilot is not in this checkpoint.
- No live HubSpot, email, LinkedIn, or Slack send was exercised. None is implemented as a network write.

## NOT VERIFIED

- Browser desktop and 390×844 journeys. Playwright belongs to Task 7.
- Live Relationship Copilot / OpenAI. Task 6.
- Production Vercel URL and production-smoke of the deployed app.

## Deferred external deployment

Deployment to Vercel remains pending until separately authorized. Local production build succeeded. The application is not claimed as deployed.

## Test and gate evidence

Commands were run from `grain-conference-intelligence` with pnpm via Corepack. Production build must use the repository’s real Windows path; a subst/short-path working directory can make Next.js 16.3.4 fail while prerendering `/_global-error` or `/_not-found`.

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `pnpm vitest run src/features/conferences` after Task 3 | 0 | 2 files, 13 passed, 0 skipped |
| `pnpm typecheck` after Task 3 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after Task 3 | 0 | ESLint emitted no diagnostics |
| `pnpm vitest run src/features/prep` after Task 4 | 0 | 2 files, 8 passed, 0 skipped |
| `pnpm test:run` after Task 4 / Checkpoint 2 | 0 | 6 files, 58 passed, 0 skipped |
| `pnpm typecheck` Checkpoint 2 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` Checkpoint 2 | 0 | ESLint emitted no diagnostics |
| `pnpm build` Checkpoint 2 | 0 | Next.js 16.3.4 compiled; 6 routes generated (`/`, `/_not-found`, `/conferences`, `/planning` static; conference and prep person routes dynamic) |

Zero-skip status: **PASS — 58 passed, 0 skipped.** No `.only` tests.

## Git

- Branch: `feat/p0-remaining`
- Baseline: `4c9a8b585a506640b094dd51221c2652032eec71`
- Task 3: `890364c feat: add explainable conference planning`
- Task 4: `3d3f6ff feat: add sourced pre-conference outreach workflow`
- Follow-up build-path/shell commits are recorded after this report is committed.
- Protected planning documents were not edited.

## Deviations

- Workspace state gained `conferencePlans`, `scoreSnapshots`, and `outreachDrafts` so human decisions, original scores, and edited drafts persist. Schema v1 still resets on mismatch.
- Conference pages are thin server route files wrapping client views so the App Router page module stays a server component.
- `WorkspaceProvider` keeps a default context so isolated renders do not throw, still hydrates from `grain-conference-intelligence:v1`, and still persists only after hydration.
- CRM preview/simulation, capture, Copilot, Settings, Playwright, README/demo script, and Vercel deploy remain later-checkpoint work.

## Remaining blockers for later checkpoints

- Tasks 5–7 are unimplemented by design at this gate.
- Live AI credentials are not required until Task 6.
- External deployment is unauthorized.
