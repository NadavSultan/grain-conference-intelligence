# Checkpoint 1 Report

## Requirements implemented

Checkpoint 1 is limited to Tasks 1–2. It delivers a Next.js 16 App Router application with React, TypeScript, Tailwind CSS, ESLint, the requested dependencies and test tools, `src` layout, and `@/*` aliases. The foundation includes Grain extension tokens, Inter via `next/font/google`, a compact application shell and wordmark, visible focus styles, reduced-motion handling, responsive overflow protection, shared types/Zod schemas, a pure reducer, and a React workspace provider.

The versioned local workspace uses `grain-conference-intelligence:v1`. It validates persisted data, resets only this application's key on a schema/version mismatch, preserves a valid saved workspace during hydration, and falls back safely on invalid data. The schema-valid initializer activates the first cached Money20/20 snapshot and the EuroFinance snapshot, while keeping the second Money20/20 snapshot available for later simulated replay.

Trusted fixtures include 12 conference records, two cached Prep events, two Money20/20 demo snapshots, four complete fictional outreach profiles in the required `sam`, `david`, `priya`, `marcus` order, stable evidence identifiers, independently modelled evidence origin/tag, local labelled exhibits, fixed illustrative timing, actual draft word counts, presentation corrections, and all eight compact edge states. Marcus has one actual encounter, one planned second encounter, and separately typed outreach/reply/research history.

No conference pages, Prep UI, mobile capture, Relationship Copilot, CRM implementation, deployment, or Checkpoint 2 functionality was started.

## Conference source inventory

All records were verified on 2026-09-09 from organizer-controlled pages. Audience is `Unknown` when the selected official source did not support a current-edition total.

| Conference | Edition and verified schedule | Location | Audience | Official source |
| --- | --- | --- | ---: | --- |
| Money20/20 Europe | 8–10 Jun 2027 | The RAI, Amsterdam | 7,400 | https://europe.money2020.com/attend |
| Money20/20 USA | 18–21 Oct 2026 | The Venetian, Las Vegas | 11,000 | https://us.money2020.com/attend/faq |
| Money20/20 Middle East | 14–16 Sep 2026 | Riyadh Exhibition & Convention Center, Malham | 38,000 | https://money2020middleeast.com/about-us/key-information |
| Money20/20 Asia | 27–29 Apr 2027 | QSNCC, Bangkok | 5,000 | https://asia.money2020.com/attend |
| Singapore FinTech Festival | 18–20 Nov 2026 | Singapore EXPO | Unknown | https://www.fintechfestival.sg/ |
| Sibos | 28 Sep–1 Oct 2026 | Miami Beach Convention Center | Unknown | https://www.sibos.com/attend/faq |
| EuroFinance International Treasury Management | 16–18 Sep 2026 | CCIB, Barcelona | Unknown | https://www.eurofinance.com/international-treasury-event/faq/ |
| Seamless Fintech Middle East | 22–24 Sep 2026 | Dubai World Trade Centre | 20,000 | https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/ |
| ITB Berlin | 16–18 Mar 2027 | Berlin Exhibition Grounds | Unknown | https://www.itb.com/en |
| SaaStr AI Annual | 11–12 May 2027 | San Francisco Bay Area | Unknown | https://www.saastrannual.com/buy-tickets-2026 |
| Business Travel Show Europe | 23–24 Jun 2027 | ExCeL London | Unknown | https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs |
| TravelTech Show | 23–24 Jun 2027 | ExCeL London | Unknown | https://traveltech-show.com/ |

The Money20/20 Europe record separately identifies the fictional `money20-eu-demo` scheduling frame and warns that its supplied 2–4 June references are illustrative, not the verified 2027 schedule.

## Fixture inventory

- Full pages: Sam Jones / Acme Payments; David Cohen / Northwind Travel Group; Priya Natarajan / Lumio Marketplace; Marcus Oyelaran / Payloom.
- Cached events: `money20-eu-demo` and `eurofinance-2026`.
- Money snapshots: `money20-eu-demo-snapshot-1` and `money20-eu-demo-snapshot-2`; stable record IDs are retained while Priya changes from likely to confirmed, Marcus becomes removed/cancelled, and one compact company-only record is added.
- Local exhibits: `sam.html`, `david.html`, `priya.html`, `marcus.html`, and `edge-fixtures.html`; every page begins with the required non-live fictional-evidence warning, and every evidence URL resolves to an actual HTML anchor.
- Claim inventory: every displayed fact, signal, quote, evidence gap, relationship statement, and factual draft premise for Sam, David, Priya, and Marcus has stable evidence or timeline references owned by the same person and company.
- Edge states: open deal, probable returner, company-only signal, cancelled speaker, unknown CRM, namesake/domain ambiguity, job change, and a stalled relationship with three actual encounters spanning 203 days and no progression.
- Workspace history: Marcus's actual encounter is separate from outreach, reply, research observation, and planned-meeting records, so the planned second meeting does not inflate encounter count.

## Test evidence

Remediation test-first RED evidence: `pnpm vitest run src/data` exited 1 with 4 failures and 18 passes before implementation. The failures identified the incorrect source ledger/component URL matrix, missing profile claim inventory, and absent added/changed/cancelled snapshot transitions. After conference remediation, the same focused suite had 2 failures and 20 passes, isolated to missing local anchors and snapshot transitions.

Final evidence:

- `pnpm vitest run src/data` — exit 0; 1 file, 22 passed, 0 skipped.
- `pnpm test:run` — exit 0; 2 files, 29 passed, 0 skipped.
- `pnpm typecheck` — exit 0; no diagnostics.
- `pnpm lint` — exit 0; no diagnostics.

## Build evidence

`pnpm build` exited 0 using Next.js 16.3.4 with Turbopack. Compilation and TypeScript completed successfully; page data collection completed; four static pages were generated; `/` and `/_not-found` were reported as static routes. An earlier restricted-network attempt exited 1 solely because Inter could not be fetched from Google Fonts; rerunning the unchanged command with network access passed.

## Git status

- Branch: `feat/checkpoint-1-foundation`
- Remediation starting commit: `1c6985bf0a6b4cbf570ea8e938dc51154c64c87a`
- Remediation implementation commit: `6a10960`
- Task 1: `58df089`
- Task 2: `e774db7`
- Governing Markdown files remain byte-for-byte unchanged relative to the baseline commit.
- Final status/log/diff evidence is refreshed after this report is committed; completion requires an empty `git status --short`.

## Deviations from the implementation plan

- The domain type/schema files were extended during Task 2 because the specified conference, evidence, and snapshot fixtures require validated shared contracts; this is within Checkpoint 1 and does not add later-checkpoint behavior.
- A `vitest` package-script alias was added so the binding command `pnpm vitest run ...` works reliably in this Windows pnpm environment. All required scripts remain present.
- Vercel's eventual Root Directory is recorded as `grain-conference-intelligence`, but it was not applied to an external project because no Vercel project was linked and deployment was explicitly prohibited.

## Remaining risks

- Future conference facts and official pages may change after the 2026-09-09 verification snapshot.
- Unsupported audience totals and score components remain `null`/Unknown; in particular, SaaStr's unsupported 12,500 value was removed rather than reconciled to the organizer's separate 10,000+ historical claim.
- Local evidence exhibits prove fixture provenance and presentation boundaries, not real-world facts about the fictional people or companies.
- The stored second research snapshot has no simulated-run time until a later authorized UI action replays it; the immutable research timestamp and mutable simulation-run timestamp are intentionally separate.
- No live AI or CRM behavior is claimed at this checkpoint. Those later requirements remain pending their authorized checkpoints.
