# Checkpoint 1 Report

## Requirements implemented

Checkpoint 1 is limited to Tasks 1–2. It delivers a Next.js 16 App Router application with React, TypeScript, Tailwind CSS, ESLint, the requested dependencies and test tools, `src` layout, and `@/*` aliases. The foundation includes Grain extension tokens, Inter via `next/font/google`, a compact application shell and wordmark, visible focus styles, reduced-motion handling, responsive overflow protection, shared types/Zod schemas, a pure reducer, and a React workspace provider.

The versioned local workspace uses `grain-conference-intelligence:v1`. It validates persisted data, resets only this application's key on a schema/version mismatch, preserves a valid saved workspace during hydration, and falls back safely on invalid data. The schema-valid initializer activates the first cached Money20/20 snapshot and the EuroFinance snapshot, while keeping the second Money20/20 snapshot available for later simulated replay.

Trusted fixtures include 12 conference records, two cached Prep events, two Money20/20 demo snapshots, four complete fictional outreach profiles in the required `sam`, `david`, `priya`, `marcus` order, stable evidence identifiers, independently modelled evidence origin/tag, local labelled exhibits, fixed illustrative timing, actual draft word counts, presentation corrections, and all eight compact edge states. Marcus has one actual encounter, one planned second encounter, and separately typed outreach/reply/research history. Sam, David, Priya, and Marcus are identical across the two Money20/20 research snapshots. The added, changed, and cancelled/removed snapshot transitions are compact edge fixtures with stable IDs.

Displayed factual claims now map to EvidenceRecords, timeline entries, and local exhibit anchors that contain the exact displayed value or a clearly labelled inference/Unknown gap. Contact URLs and emails are stored as dedicated records. Headlines cite attendance, labelled company-tier classification premises, and CRM presence/ownership. Prep status remains user-facing profile content and is excluded from the factual claim inventory so it is not attributed to unrelated public or CRM evidence.

No conference pages, Prep UI, mobile capture, Relationship Copilot, CRM implementation, deployment, or Checkpoint 2 functionality was started.

## Conference source inventory

All records were verified on 2026-09-09 from organizer-controlled pages. Audience is `Unknown` when the selected official source did not support a current-edition total.

| Conference | Edition and verified schedule | Location | Audience | Official source |
| --- | --- | ---: | ---: | --- |
| Money20/20 Europe | 8–10 Jun 2027 | The RAI, Amsterdam | 7,400 | https://europe.money2020.com/attend |
| Money20/20 USA | 18–21 Oct 2026 | The Venetian, Las Vegas | 11,000 | https://us.money2020.com/attend/faq |
| Money20/20 Middle East | 14–16 Sep 2026 | Riyadh Exhibition & Convention Center, Malham | 38,000 | https://money2020middleeast.com/about-us/key-information |
| Money20/20 Asia | 27–29 Apr 2027 | QSNCC, Bangkok | 5,000 | https://asia.money2020.com/attend |
| Singapore FinTech Festival | 18–20 Nov 2026 | Singapore EXPO | Unknown | https://www.fintechfestival.sg/ |
| Sibos | 28 Sep–1 Oct 2026 | Miami Beach Convention Center | Unknown | https://www.sibos.com/attend/faq |
| EuroFinance International Treasury Management | 16–18 Sep 2026 | CCIB, Barcelona | Unknown | https://www.eurofinance.com/international-treasury-event/faq/ |
| Seamless Fintech Middle East | 22–24 Sep 2026 | Dubai World Trade Centre | 20,000 | https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/ |
| ITB Berlin | 16–18 Mar 2027 | Berlin Exhibition Grounds | Unknown | https://www.itb.com/en |
| SaaStr AI Annual | 11–12 May 2027 | San Francisco Bay Area | 10,000 | https://www.saastrannual.com/ |
| Business Travel Show Europe | 23–24 Jun 2027 | ExCeL London | Unknown | https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs |
| TravelTech Show | 23–24 Jun 2027 | ExCeL London | Unknown | https://traveltech-show.com/ |

The Money20/20 Europe record separately identifies the fictional `money20-eu-demo` scheduling frame and warns that its supplied 2–4 June references are illustrative, not the verified 2027 schedule. The Money20/20 Middle East 38,000 audience and buyer-density claim is stored against https://money2020middleeast.com/tickets-2026, the 2026 ticket page that states 38,000+ attendees.

## Fixture inventory

- Full pages: Sam Jones / Acme Payments; David Cohen / Northwind Travel Group; Priya Natarajan / Lumio Marketplace; Marcus Oyelaran / Payloom.
- Cached events: `money20-eu-demo` and `eurofinance-2026`.
- Money snapshots: `money20-eu-demo-snapshot-1` and `money20-eu-demo-snapshot-2`; Sam, David, Priya, and Marcus retain the same record IDs and fields. Compact edge fixtures demonstrate one added (`money-company-only`), one changed (`money-edge-changed`, likely to confirmed), and one cancelled/removed (`money-edge-cancelled`) record with stable IDs.
- Local exhibits: `sam.html`, `david.html`, `priya.html`, `marcus.html`, and `edge-fixtures.html`; every page begins with the required non-live fictional-evidence warning, and every evidence URL resolves to an actual HTML anchor whose text supports the cited claim.
- Claim inventory: every displayed fact, signal, quote, evidence gap, relationship statement, and factual draft premise for Sam, David, Priya, and Marcus maps only to the specific evidence or timeline entries that substantively support that claim. Contact claims require the exact LinkedIn URL or email value, or an explicit email Unknown gap that is not a CRM-relationship record. Headlines require attendance, labelled tier classification with company/FX/role premises, and CRM presence/ownership. Indiscriminate bulk assignment of every profile evidence record to every claim is tested to fail.
- Operational state: `prepStatus` remains on each profile (`To contact` / `Needs coordination`) and is not part of the factual claim inventory.
- Edge states: open deal, probable returner, company-only signal, cancelled speaker, unknown CRM, namesake/domain ambiguity, job change, and a stalled relationship with three actual encounters spanning 203 days and no progression.
- Workspace history: Marcus's actual encounter is separate from outreach, reply, research observation, and planned-meeting records, so the planned second meeting does not inflate encounter count.

## Test evidence

Final-remediation test-first RED evidence: `pnpm vitest run src/data` exited 1 with 5 failures and 25 passes before implementation. The failures identified prepStatus still listed as a factual claim, missing exact names/URLs/emails in cited exhibits, incomplete headline components, and displayed facts that were not present in the referenced evidence corpus.

Final evidence:

- `pnpm vitest run src/data` — exit 0; 1 file, 30 passed, 0 skipped.
- `pnpm test:run` — exit 0; 2 files, 37 passed, 0 skipped.
- `pnpm typecheck` — exit 0; no diagnostics.
- `pnpm lint` — exit 0; no diagnostics.

No `.only` or skipped tests are present.

## Build evidence

`pnpm build` exited 0 using Next.js 16.3.4 with Turbopack. Compilation and TypeScript completed successfully; page data collection completed; four static pages were generated; `/` and `/_not-found` were reported as static routes.

## Git status

- Branch: `feat/checkpoint-1-foundation`
- Final-remediation starting commit: `8a236b6c5dd93272c8db23a89b51ef155a181218`
- Final-remediation implementation commit: `d6cf9d053278f59b43527957b0460865f9fe2e34`
- Prior review-remediation implementation commit: `82ca369`
- Prior remediation implementation commit: `6a10960`
- Task 1: `58df089`
- Task 2: `e774db7`
- Governing Markdown files remain byte-for-byte unchanged relative to the baseline commit.
- Final status/log/diff evidence is refreshed after this report is committed; completion requires an empty `git status --short`.

## Deviations from the implementation plan

- The domain type/schema files were extended during Task 2 because the specified conference, evidence, and snapshot fixtures require validated shared contracts; this is within Checkpoint 1 and does not add later-checkpoint behavior.
- A `vitest` package-script alias was added so the binding command `pnpm vitest run ...` works reliably in this Windows pnpm environment. All required scripts remain present.
- Vercel's eventual Root Directory is recorded as `grain-conference-intelligence`, but it was not applied to an external project because no Vercel project was linked and deployment was explicitly prohibited.
- Prep status is retained as user-facing seed content and excluded from the factual claim inventory, because a workflow state is not proved by public attendance or CRM lookup records.

## Remaining risks

- Future conference facts and official pages may change after the 2026-09-09 verification snapshot.
- Unsupported audience totals and score components remain `null`/Unknown where the selected official page does not support a current-edition total.
- Local evidence exhibits prove fixture provenance and presentation boundaries, not real-world facts about the fictional people or companies.
- The stored second research snapshot has no simulated-run time until a later authorized UI action replays it; the immutable research timestamp and mutable simulation-run timestamp are intentionally separate.
- No live AI or CRM behavior is claimed at this checkpoint. Those later requirements remain pending their authorized checkpoints.
