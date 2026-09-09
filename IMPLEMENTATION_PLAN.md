# Grain Conference Intelligence P0 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one polished, deployed Grain sales workflow that moves from conference selection to sourced pre-event outreach, field capture, relationship interpretation, and duplicate-safe CRM simulation.

**Architecture:** Build a Next.js App Router application inside `grain-conference-intelligence/`. Use a versioned browser-local workspace for the credential-free prototype, pure domain modules for scoring/matching/counts, and one server-only OpenAI route for a real structured Relationship Copilot response. Seeded research and CRM records are clearly labelled simulations; the storage and CRM boundaries remain replaceable.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide React, Zod, Vitest, Testing Library, Playwright, OpenAI Responses API, Vercel.

**Spec:** `Updated PRD.md` is the product authority. `MERGE_NOTES.md` records conflict rulings. `pre_conference_prep_feature.md` section 6a is the verbatim four-profile fixture specification. `Sales AI Builder — Home Assignment.md` overrides all project documents when they conflict.

## Global Constraints

- Total delivery budget is 4–6 focused hours, including deployment, source preparation, and the 5–10 minute recording.
- Protect this P0 path: conference → Prep → outreach → field list → capture → typed relationship history → real AI interpretation → CRM preview/simulation.
- P0 includes 12 sourced conferences, two cached Prep events, two snapshots for one event, and all four complete fictional profile pages: Sam Jones, David Cohen, Priya Natarajan, and Marcus Oyelaran.
- Opening a conference, Prep tab, or profile never triggers research or an AI request.
- All fictional people, companies, quotes, and local evidence exhibits display `Fictional demo scenario`.
- Attendance confidence, company ICP tier, role fit, evidence tag, and real/fictional origin are independent fields and must never be collapsed into one badge.
- Unknown is an explicit state. Failed or unchecked research/CRM results never become `Not in HubSpot`, zero attendance, or exclusion.
- Only saved actual meetings count as encounters. Research observations, outreach, replies, and planned meetings remain separately typed timeline events.
- Exact verified email or LinkedIn may auto-link. Name/domain similarity creates a review candidate and never a silent merge.
- The application never sends email, LinkedIn, or Slack messages. It edits/copies text and opens external destinations only.
- A colleague-owned account or open deal blocks prospect outreach actions until coordination is manually acknowledged.
- Demo mode performs zero external CRM writes. Live AI is server-side and required for acceptance; live HubSpot is P1 and cannot displace P0.
- Environment variables are configurable through `.env.local` and Vercel; secrets never enter client bundles, fixtures, logs, or source control.
- No generic chat, autonomous crawler, badge scanner, calendar, budget tracker, general checklist, post-event ROI, voice input, or administration UI in P0.

## Brand and Experience Contract

Implement the approved **Grain Product Extension** direction using the public Grain site as a visual reference, not as a page template.

- Brand tokens: `#2B3674` primary ink, `#3D82F7` signature blue, `#116DFF` high-emphasis action, `#676E97` secondary text, `#FFFFFF` canvas, `#F5F8FF` wash, and `#E4EAF5` border.
- Use `Inter` through `next/font/google` as the licensed application font. Declare `"Suisse Intl"` first only when legitimate font files are supplied; do not scrape or hotlink Grain’s hosted font files.
- Use a text wordmark `grain` with `Conference intelligence` as the product descriptor unless an official reusable logo asset is supplied.
- Use a white application canvas, restrained pale-blue washes, navy headings, blue selected states, thin cool borders, 10–12px radii, and soft shadows only for overlays.
- Use compact app typography: 32px page title, 20–24px section title, 16px body, 14px labels, and 12px provenance metadata. Keep line height at least 1.4 for body copy.
- Use one top application bar on desktop and a compact scrollable route bar on mobile. Do not place a marketing hero before the working surface.
- Buttons use 8px radius. Primary actions use navy or blue; simulated/destructive/blocked states use labelled neutral, amber, or red treatments with text—not color alone.
- Use the public site’s blue-gradient motif only for small highlights such as the active route underline or Copilot accent. Do not copy its hero image, marketing composition, or promotional copy.
- Motion is limited to 150–200ms hover/focus transitions and the labelled simulated research progress sequence; honor `prefers-reduced-motion`.
- The application must work without horizontal page overflow at 360px and with keyboard navigation at desktop widths.

## P0 Data and Interface Map

```ts
type EvidenceOrigin = "real_public" | "fictional_demo" | "internal_demo";
type EvidenceTag = "verified" | "cited" | "inferred" | "unknown";
type AttendanceConfidence =
  | "confirmed"
  | "likely"
  | "probable_returner"
  | "inferred"
  | "unknown";
type CompanyTier = "A" | "B" | "C" | "excluded" | "unknown";
type RoleFit = "decision_maker" | "influencer" | "other" | "unknown";
type PrepStatus =
  | "to_contact"
  | "contacted"
  | "replied"
  | "meeting_booked"
  | "not_now";
type TimelineKind =
  | "research_observation"
  | "outreach_sent"
  | "reply"
  | "planned_meeting"
  | "actual_encounter";
type CrmState =
  | "not_present"
  | "owned_by_me"
  | "owned_by_other"
  | "open_deal"
  | "unknown";
```

```ts
type RelationshipBrief = {
  state: "warming" | "stalled" | "unclear";
  confidence: number;
  summary: string;
  evidenceEncounterIds: string[];
  evidenceSignalIds: string[];
  suggestedAngle: {
    fact: string;
    evidenceIds: string[];
    relevanceInference: string;
  };
  counterEvidence: string[];
  recommendedAction: string;
  followUpDraft: { subject: string; body: string } | null;
  linkedInDraft: string | null;
};
```

Primary routes:

| Route | Purpose |
| --- | --- |
| `/` | Thin Today’s Focus: undecided conferences and direct Prep links. |
| `/conferences` | Twelve-event searchable/filterable conference list. |
| `/conferences/[conferenceId]` | Overview and Prep tabs. |
| `/conferences/[conferenceId]/prep/[personId]` | Full sourced outreach profile. |
| `/planning` | Monthly year list with owner/status, conflicts, clusters, gaps, and qualified-person count. |
| `/capture` | Planned-meeting-first mobile capture plus unplanned contact path. |
| `/relationships` | Contacts, match-review queue, and typed history. |
| `/relationships/[contactId]` | Timeline, Copilot, drafts, and CRM preview. |
| `/settings` | Demo/live status, AI availability, usage, and disclosure labels. |
| `/api/relationship-brief` | Server-only validated OpenAI interpretation/draft action. |

## File Responsibility Map

| Area | Files | Responsibility |
| --- | --- | --- |
| Shell and brand | `src/app/layout.tsx`, `src/app/globals.css`, `src/components/app-shell.tsx`, `src/components/grain-wordmark.tsx` | Metadata, brand tokens, responsive navigation, common page frame. |
| Domain contracts | `src/domain/types.ts`, `src/domain/schemas.ts` | Shared TypeScript and Zod contracts; no UI or storage logic. |
| Seeds | `src/data/conferences.ts`, `src/data/prep-snapshots.ts`, `src/data/demo-workspace.ts` | Twelve sourced events, two cached Prep events, four full profiles, edge-state fixtures. |
| Workspace | `src/workspace/state.ts`, `src/workspace/reducer.ts`, `src/workspace/provider.tsx` | Versioned seeded state, pure transitions, local persistence, reset. |
| Conference logic | `src/features/conferences/scoring.ts`, `src/features/conferences/planning.ts` | Score snapshots, Q calculation, conflicts, clusters, uncovered quarters. |
| Prep logic | `src/features/prep/selectors.ts`, `src/features/prep/actions.ts` | Summary counts, filters, sort order, status and coordination gates. |
| Identity/history | `src/features/relationships/identity.ts`, `src/features/relationships/eligibility.ts` | Exact/review matching and deterministic relationship eligibility. |
| Copilot | `src/features/copilot/schema.ts`, `src/features/copilot/fallback.ts`, `src/app/api/relationship-brief/route.ts` | Strict response contract, evidence validation, fallback, live AI call. |
| CRM | `src/features/crm/preview.ts`, `src/features/crm/demo-sync.ts` | Safe payload, mock ownership/read states, idempotent staged write/retry. |
| Tests | `src/**/*.test.ts`, `tests/e2e/core-flow.spec.ts` | Pure behavior tests and one desktop/mobile demonstrated journey. |

---

### Task 1: Bootstrap the branded working surface and versioned workspace

**Files:**
- Create: `grain-conference-intelligence/package.json`
- Create: `grain-conference-intelligence/src/app/layout.tsx`
- Create: `grain-conference-intelligence/src/app/globals.css`
- Create: `grain-conference-intelligence/src/components/app-shell.tsx`
- Create: `grain-conference-intelligence/src/components/grain-wordmark.tsx`
- Create: `grain-conference-intelligence/src/domain/types.ts`
- Create: `grain-conference-intelligence/src/domain/schemas.ts`
- Create: `grain-conference-intelligence/src/workspace/state.ts`
- Create: `grain-conference-intelligence/src/workspace/reducer.ts`
- Create: `grain-conference-intelligence/src/workspace/provider.tsx`
- Create: `grain-conference-intelligence/src/data/demo-workspace.ts`
- Test: `grain-conference-intelligence/src/workspace/reducer.test.ts`

**Interfaces:**
- Produces: `WorkspaceStateV1`, `WorkspaceAction`, `WorkspaceProvider`, `useWorkspace()`, `resetWorkspace()`, and a schema-valid empty `createDemoWorkspace()` initializer.
- Persists under local-storage key `grain-conference-intelligence:v1`.
- A new browser starts from `createDemoWorkspace()`; a schema-version mismatch resets only this application key.

- [ ] **Step 1: Initialize the application and repository**

From the parent project folder, initialize Git at the parent so the assignment and planning documents ship with the application. Scaffold the empty `grain-conference-intelligence/` directory with Next.js App Router, TypeScript, Tailwind, ESLint, `src/`, and the `@/*` alias. Add `zod`, `lucide-react`, `clsx`, `tailwind-merge`, `openai`, Vitest, Testing Library, jsdom, and Playwright. Add scripts `typecheck`, `test`, `test:run`, and `test:e2e`.

- [ ] **Step 2: Write the failing workspace reducer tests**

Cover these literal outcomes:

```ts
it("adds a prep person to the field list only once", () => {
  const twice = reduceMany(seed, [
    { type: "field/add", conferenceId: "money20-eu-demo", personId: "marcus" },
    { type: "field/add", conferenceId: "money20-eu-demo", personId: "marcus" },
  ]);
  expect(twice.fieldList).toHaveLength(1);
});

it("does not turn a planned meeting into an encounter", () => {
  const next = workspaceReducer(seed, {
    type: "meeting/outcome",
    plannedMeetingId: "pm-marcus",
    outcome: "did_not_meet",
  });
  expect(next.timeline.filter((e) => e.kind === "actual_encounter")).toHaveLength(1);
});
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run `pnpm vitest run src/workspace/reducer.test.ts`. Expected failure: the workspace types/reducer do not exist.

- [ ] **Step 4: Implement the contracts, reducer, and persistence boundary**

Use a discriminated action union. Keep every mutation in `workspaceReducer`; the provider loads once after hydration and writes the complete versioned state after successful actions. Display a brief loading skeleton until hydration completes to avoid replacing stored data with seeds.

- [ ] **Step 5: Apply the Grain Product Extension design system**

Set the exact brand tokens in `globals.css`, implement the responsive shell, visible keyboard focus, reduced-motion handling, and the text wordmark. Use `Inter` and the compact type scale from the Brand Contract. The first viewport must begin with operational content beneath the navigation, not a hero.

- [ ] **Step 6: Verify and commit**

Run `pnpm test:run`, `pnpm typecheck`, and `pnpm lint`. Commit with `chore: scaffold branded conference intelligence workspace`.

---

### Task 2: Seed trusted conference, research, CRM, and relationship data

**Files:**
- Create: `grain-conference-intelligence/src/data/conferences.ts`
- Create: `grain-conference-intelligence/src/data/prep-snapshots.ts`
- Modify: `grain-conference-intelligence/src/data/demo-workspace.ts`
- Create: `grain-conference-intelligence/public/evidence/*.html`
- Test: `grain-conference-intelligence/src/data/seeds.test.ts`

**Interfaces:**
- Produces: `CONFERENCES`, `PREP_SNAPSHOTS`, and `createDemoWorkspace()`.
- Uses stable IDs across snapshots; repeated evidence uses the same evidence ID rather than producing duplicate history.
- `EvidenceOrigin` is independent from `EvidenceTag`.

- [ ] **Step 1: Write failing seed-integrity tests**

Assert:

```ts
expect(CONFERENCES).toHaveLength(12);
expect(new Set(CONFERENCES.map((c) => c.id)).size).toBe(12);
expect(CONFERENCES.every((c) => c.sourceUrl && c.verifiedAt)).toBe(true);
expect(PREP_SNAPSHOTS.filter((s) => s.conferenceId === "money20-eu-demo")).toHaveLength(2);
expect(FULL_PROFILE_IDS).toEqual(["sam", "david", "priya", "marcus"]);
expect(allFictionalEvidence.every((e) => e.origin === "fictional_demo")).toBe(true);
```

Also assert that Sam’s email is inferred, Priya’s email is absent, David requires coordination, and Marcus has exactly one pre-seeded `actual_encounter` plus one `planned_meeting`.

- [ ] **Step 2: Run the seed test and confirm RED**

Run `pnpm vitest run src/data/seeds.test.ts`. Expected failure: seed modules do not exist.

- [ ] **Step 3: Create the 12-event source ledger**

Use official event pages only for dates, locations, vertical descriptions, and audience claims. Include Money20/20 Europe as an explicitly labelled fictional scheduling frame for the four example profiles; do not present its illustrative 2–4 June schedule as a verified current date. Store `sourceUrl`, `verifiedAt`, and source-backed evidence per score component. Unknown audience values remain `null`.

- [ ] **Step 4: Transcribe the four complete profile fixtures**

Convert every field, signal, quote, timeline entry, angle, draft, coordination step, and next action from `pre_conference_prep_feature.md` section 6a without shortening the source content. Apply the presentation corrections from `Updated PRD.md` lines 246–255: fictional labels, inferred/unknown actions disabled, Marcus counterevidence, actual word counts, and illustrative-date warnings.

- [ ] **Step 5: Add edge fixtures without a fifth full profile**

Add compact records for an open-deal account gate, probable returner, company-only attendance, cancelled speaker, unknown CRM lookup, namesake domain conflict, job change, and a genuinely stalled relationship with three actual encounters over at least 180 days and no progression.

- [ ] **Step 6: Add local fictional evidence exhibits**

Create static local pages for invented posts/reports. Each exhibit begins with `Fictional demo evidence — not a live public source`, includes the quoted fixture text and date, and never redirects to a real profile or company.

- [ ] **Step 7: Verify and commit**

Run `pnpm vitest run src/data/seeds.test.ts` and `pnpm typecheck`. Commit with `feat: add sourced conference and labelled prep fixtures`.

---

### Task 3: Implement conference scoring, overview, planning, and thin focus

**Files:**
- Create: `grain-conference-intelligence/src/features/conferences/scoring.ts`
- Create: `grain-conference-intelligence/src/features/conferences/planning.ts`
- Create: `grain-conference-intelligence/src/app/page.tsx`
- Create: `grain-conference-intelligence/src/app/conferences/page.tsx`
- Create: `grain-conference-intelligence/src/app/conferences/[conferenceId]/page.tsx`
- Create: `grain-conference-intelligence/src/app/planning/page.tsx`
- Test: `grain-conference-intelligence/src/features/conferences/scoring.test.ts`
- Test: `grain-conference-intelligence/src/features/conferences/planning.test.ts`

**Interfaces:**
- Produces: `calculateConferenceScore(conference, snapshot?)`, `deriveTier(score)`, `deriveConflicts(plans)`, `deriveTripClusters(conferences)`, and `deriveUncoveredQuarters(plans)`.
- The score result stores component points, Q, snapshot ID/time, coverage warning, total, and tier.

- [ ] **Step 1: Write failing scoring tests**

Use hand-derived literals:

```ts
it("caps researched-room contribution at ten unique qualified people", () => {
  expect(roomEvidencePoints(makeQualifiedPeople(14))).toBe(10);
});

it("gives missing research zero provisional room points and marks it unknown", () => {
  expect(calculateConferenceScore(baseConference, undefined)).toMatchObject({
    researchedRoomPoints: 0,
    researchedRoomStatus: "unknown",
  });
});

it("does not count likely, Tier B, duplicate, or non-decision roles in Q", () => {
  expect(calculateQualifiedRoomCount(mixedPeopleFixture)).toBe(1);
});
```

- [ ] **Step 2: Write failing planning tests**

Assert that the same owner on overlapping dates creates a conflict, same-city events within seven days create one trip cluster, and a quarter with no `attend` decision is uncovered. Different owners do not create a conflict.

- [ ] **Step 3: Run the focused tests and confirm RED**

Run `pnpm vitest run src/features/conferences`. Expected failure: scoring and planning modules do not exist.

- [ ] **Step 4: Implement scoring and snapshot behavior**

Keep the 100-point model. Buyer-role density is 15 points from sourced audience-role evidence plus `min(10, Q)`. Count only unique, named, current-edition, Confirmed people at Tier A companies with decision-maker or influencer roles. A second snapshot produces a new score snapshot and never overwrites the original score or human plan decision.

- [ ] **Step 5: Build conference list and Overview tab**

Implement search and filters for month, geography, vertical, tier, and decision. Each detail view shows total, tier, component bars, rationale, source links, verification dates, Q, research time, coverage limitations, and editable attend/watch/skip status.

- [ ] **Step 6: Build the thin planning and Focus views**

Planning is a year list grouped by month, not a separate calendar. Show owner/status, conflicts, same-city clusters, uncovered quarters, Q, and Prep links. Today’s Focus contains undecided upcoming conferences and direct Prep links only; richer operational queues remain P2.

- [ ] **Step 7: Verify and commit**

Run both focused test files, `pnpm typecheck`, and `pnpm lint`. Commit with `feat: add explainable conference planning`.

---

### Task 4: Build cached Prep, summary counts, snapshot diff, and outreach actions

**Files:**
- Create: `grain-conference-intelligence/src/features/prep/selectors.ts`
- Create: `grain-conference-intelligence/src/features/prep/actions.ts`
- Create: `grain-conference-intelligence/src/components/prep/prep-list.tsx`
- Create: `grain-conference-intelligence/src/components/prep/research-status.tsx`
- Modify: `grain-conference-intelligence/src/app/conferences/[conferenceId]/page.tsx`
- Create: `grain-conference-intelligence/src/app/conferences/[conferenceId]/prep/[personId]/page.tsx`
- Test: `grain-conference-intelligence/src/features/prep/selectors.test.ts`
- Test: `grain-conference-intelligence/src/features/prep/actions.test.ts`

**Interfaces:**
- Produces: `calculatePrepSummary(records)`, `filterPrepRecords(records, filter)`, `sortPrepRecords(records)`, `diffSnapshots(previous, current)`, and `canProspect(record)`.
- Every summary number filters the exact subset used to calculate it.

- [ ] **Step 1: Write failing summary and ordering tests**

Create a literal mixed fixture and assert exact counts for attendees verified, relevant, ready to contact, and need coordination. Verify that unknown CRM, missing channel, unresolved identity, and already-contacted records may be relevant while belonging to neither actionable subset. Verify ordering: A+Confirmed, A+Likely, B+Confirmed, then remaining tier/confidence combinations.

- [ ] **Step 2: Write failing action-gate tests**

Assert that David cannot access prospect draft actions before coordination acknowledgment, Sam cannot open email or create an exact CRM contact from his inferred email, Priya sees no email action, and an unknown CRM lookup is never treated as new.

- [ ] **Step 3: Run the Prep tests and confirm RED**

Run `pnpm vitest run src/features/prep`. Expected failure: selectors/actions are absent.

- [ ] **Step 4: Implement Prep list behavior**

Render `Last researched`, stale warning after 14 days, the exact four-part clickable summary strip with the adjacent public-signal qualification, separate badges, explicit Unknown states, source/origin labels, filters, sorting, inline CRM ownership/deal status, prep status, and New badge.

- [ ] **Step 5: Implement labelled snapshot replay**

`Research again` shows the fixed progress sequence `Scanning event sources…`, `Checking company signals…`, `Matching against ICP…`, then loads the second stored snapshot. Preserve its stored `researchedAt`; separately record `simulatedAt`. Show added, changed, and removed/cancelled evidence. A refresh failure leaves the prior snapshot untouched.

- [ ] **Step 6: Implement all four outreach pages**

Display the complete fixture content with contact details, evidence cards, relationship history first when present, recent signals, sourced angle, actual word counts, editable email/LinkedIn drafts, and next action. Provide Copy, Open LinkedIn, verified-email-only Open email, Mark contacted, Create/View CRM, and Add to field list. No button sends a message.

- [ ] **Step 7: Persist statuses and coordination**

Persist `to_contact`, `contacted`, `replied`, `meeting_booked`, and `not_now` per person/event. Persist coordination acknowledgment separately; it unlocks draft actions without changing CRM ownership or deal state.

- [ ] **Step 8: Verify and commit**

Run Prep tests, `pnpm typecheck`, and `pnpm lint`. Commit with `feat: add sourced pre-conference outreach workflow`.

---

### Task 5: Connect field capture to safe identity matching and typed history

**Files:**
- Create: `grain-conference-intelligence/src/features/relationships/identity.ts`
- Create: `grain-conference-intelligence/src/features/relationships/eligibility.ts`
- Create: `grain-conference-intelligence/src/app/capture/page.tsx`
- Create: `grain-conference-intelligence/src/app/relationships/page.tsx`
- Create: `grain-conference-intelligence/src/app/relationships/[contactId]/page.tsx`
- Test: `grain-conference-intelligence/src/features/relationships/identity.test.ts`
- Test: `grain-conference-intelligence/src/features/relationships/eligibility.test.ts`

**Interfaces:**
- Produces: `resolveIdentity(candidate, contacts)`, `deriveRelationshipEligibility(timeline)`, and reducer actions `meeting/outcome`, `capture/save`, `match/accept`, `match/reject`.
- `resolveIdentity` returns `{ kind: "exact", contactId }`, `{ kind: "review", candidateIds }`, or `{ kind: "new" }`.

- [ ] **Step 1: Write the failing identity matrix**

Cover exact normalized email, exact normalized LinkedIn, case/whitespace normalization, fuzzy name plus reviewed domain, inferred email, conflicting exact identifiers, namesake domains, job change, and no identifiers. Only verified exact email/LinkedIn returns `exact`; all ambiguous/conflicting cases return `review`.

- [ ] **Step 2: Write failing typed-history and eligibility tests**

Assert that research observations, outbound messages, replies, and planned meetings do not increment encounter count. Assert stalled only for three actual encounters over at least 180 days with no progression. Assert Marcus begins `unclear` with counterevidence until a newly captured reciprocal/concrete next step makes him eligible for `warming`.

- [ ] **Step 3: Run relationship tests and confirm RED**

Run `pnpm vitest run src/features/relationships`. Expected failure: identity and eligibility modules do not exist.

- [ ] **Step 4: Build planned-meeting-first mobile capture**

At `/capture`, show `You planned to meet` first. `Met` opens a prefilled form; `Didn’t meet` records only the plan outcome. Require name, company, prefilled conference/date, and a short note. Keep role, verified contact identifiers, signals, qualification, next step, and follow-up optional. Preserve drafts on recoverable validation/storage errors.

- [ ] **Step 5: Implement idempotent capture and match review**

Use `plannedMeetingId` as the idempotency key so repeated taps cannot create another encounter. Exact matches append to the existing contact. Review candidates enter the Relationships queue and require explicit accept/reject. A job change stores the new company/role on the event without rewriting previous events.

- [ ] **Step 6: Build Relationships and timeline pages**

Show typed entries with distinct labels: Research, Outreach sent, Reply, Planned meeting, Met. Only actual meetings display the encounter ordinal. Link every entry back to its conference, prep record, or evidence source.

- [ ] **Step 7: Verify and commit**

Run relationship and workspace tests, `pnpm typecheck`, and `pnpm lint`. Commit with `feat: connect prep leads to cross-conference history`.

---

### Task 6: Implement the real Relationship Copilot with evidence enforcement

**Files:**
- Create: `grain-conference-intelligence/src/features/copilot/schema.ts`
- Create: `grain-conference-intelligence/src/features/copilot/fallback.ts`
- Create: `grain-conference-intelligence/src/features/copilot/prompt.ts`
- Create: `grain-conference-intelligence/src/app/api/relationship-brief/route.ts`
- Create: `grain-conference-intelligence/src/components/copilot/relationship-copilot.tsx`
- Modify: `grain-conference-intelligence/src/app/conferences/[conferenceId]/prep/[personId]/page.tsx`
- Modify: `grain-conference-intelligence/src/app/relationships/[contactId]/page.tsx`
- Create: `grain-conference-intelligence/.env.example`
- Test: `grain-conference-intelligence/src/features/copilot/schema.test.ts`
- Test: `grain-conference-intelligence/src/features/copilot/fallback.test.ts`
- Test: `grain-conference-intelligence/src/app/api/relationship-brief/route.test.ts`

**Interfaces:**
- Consumes: selected contact, typed timeline, research evidence, and deterministic eligibility.
- Produces: `{ ok: true, mode, brief, provider, model, generatedAt, usageRemaining }` or `{ ok: false, code, retryable, fallback, usageRemaining }`.
- Environment: `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.4-mini`, `AI_USAGE_SECRET`.

- [ ] **Step 1: Write failing schema and evidence-integrity tests**

Reject confidence outside 0–1, unknown encounter/signal IDs, IDs belonging to another contact/company, warming when deterministic eligibility is not warming, stalled without three actual encounters over 180 days, and unsupported draft claims. Accept a valid unclear brief with a qualification question and `followUpDraft: null` when no usable channel exists.

- [ ] **Step 2: Write failing fallback tests**

Assert that fallback never upgrades deterministic eligibility, names the actual encounter count, lists available evidence IDs, includes counterevidence, and produces no email draft for Priya or unverified-email-only Sam.

- [ ] **Step 3: Run Copilot tests and confirm RED**

Run `pnpm vitest run src/features/copilot src/app/api/relationship-brief/route.test.ts`. Expected failure: Copilot modules and route do not exist.

- [ ] **Step 4: Implement the strict output contract and prompt**

Use the approved `RelationshipBrief` schema. The system instruction states: use only provided IDs and facts; separate sourced fact from relevance inference; public activity is context, not buying progression; expose counterevidence; do not decide identity; do not send; return `unclear` when deterministic eligibility does not support another state.

- [ ] **Step 5: Implement the server-only OpenAI route**

Use the OpenAI Responses API with `gpt-5.4-mini` and strict structured output. Validate the request, call the model only on explicit user action, validate the parsed response again against allowed evidence IDs and eligibility, and return the deterministic fallback on missing key, timeout, invalid schema, or unsupported evidence. Store provider/model/time/evidence with the accepted brief in the browser workspace.

- [ ] **Step 6: Enforce the five-call browser allowance**

Use a signed HttpOnly cookie containing the anonymous browser allowance count; sign and verify it with `AI_USAGE_SECRET`. Reject call six with `usage_exhausted` and keep the cached/fallback path usable. Treat the cap as prototype cost control, not account-grade authorization.

- [ ] **Step 7: Build shared Copilot presentation**

Render the same component in Prep and Relationships. Show mode, model, generated time, state, confidence, summary, supporting evidence, counterevidence, fact plus inference, recommended action, and editable drafts. Clicking an evidence ID scrolls or links to the matching timeline/source card.

- [ ] **Step 8: Exercise one live response and commit**

With `OPENAI_API_KEY` configured, generate one real brief from the seeded Marcus evidence, verify every returned ID exists and the output is labelled live, then retain a sanitized cached example for the credential-free demo. Run all Copilot tests. Commit with `feat: add evidence-bound relationship copilot`.

---

### Task 7: Add CRM preview, duplicate-safe simulation, settings, and end-to-end delivery

**Files:**
- Create: `grain-conference-intelligence/src/features/crm/preview.ts`
- Create: `grain-conference-intelligence/src/features/crm/demo-sync.ts`
- Create: `grain-conference-intelligence/src/components/crm/sync-preview.tsx`
- Create: `grain-conference-intelligence/src/app/settings/page.tsx`
- Create: `grain-conference-intelligence/tests/e2e/core-flow.spec.ts`
- Create: `grain-conference-intelligence/playwright.config.ts`
- Create: `grain-conference-intelligence/README.md`
- Create: `DEMO_SCRIPT.md`
- Test: `grain-conference-intelligence/src/features/crm/demo-sync.test.ts`

**Interfaces:**
- Consumes: the shared `resolveIdentity` result before allowing contact creation.
- Produces: `buildCrmPreview(contact, source)`, `runDemoSync(state, request)`, and idempotency key `${contactId}:${sourceKind}:${sourceId}`.
- A simulated attempt stores independent `contactStep` and `noteStep` results so note retry never recreates the contact.

- [ ] **Step 1: Write failing CRM behavior tests**

Assert exact-email creation, unresolved-review blocking, account-owner/open-deal blocking, protected `owner/lifecycle/deal` omissions, unknown lookup blocking, repeated-request idempotency, and contact-created/note-failed recovery. The retry must reuse the first simulated contact ID and create one note only.

- [ ] **Step 2: Run the CRM test and confirm RED**

Run `pnpm vitest run src/features/crm/demo-sync.test.ts`. Expected failure: preview and sync modules do not exist.

- [ ] **Step 3: Implement one shared readable preview**

Open the same preview from Prep and Relationships. Show the reviewed identity, contact/company association, source note, conference context, fields to write, and protected fields not written. Fictional fixtures remain locked to Demo mode.

- [ ] **Step 4: Implement persisted CRM simulation**

The simulation updates inline CRM state from `Not in HubSpot` to `View in HubSpot (demo record)`, stores simulated IDs, demonstrates one contact-created/note-failed fixture, retries only the note, and returns the stored result on duplicates. It never performs a network request.

- [ ] **Step 5: Build Settings and disclosure states**

Show Demo as default, OpenAI live availability/remaining allowance, HubSpot live as `Not included in P0`, and clear explanations of seeded research, fictional evidence, local persistence, and reset behavior. Do not render secret input fields.

- [ ] **Step 6: Write the browser journey before final polish**

The Playwright test must:

1. Open `/` with a new browser context.
2. Filter conferences and open Money20/20’s Overview.
3. Inspect a sourced score and switch to Prep.
4. Click the summary filters and open David; confirm coordination blocks drafts, acknowledge it, then copy/edit.
5. Open Marcus, add him to the field list, and navigate to `/capture` at a 390×844 viewport.
6. Mark Met, save a concrete next step, repeat the save action, and assert exactly one actual encounter.
7. Open Marcus’s relationship, request/read the Copilot brief, and verify cited evidence links.
8. Open CRM preview, run demo sync twice, and assert one contact/note result.
9. Reload and verify prep status, encounter, brief, and CRM state persist.
10. Open `/planning` and verify Q, research time, owner/status, conflict/cluster/gap labels.

- [ ] **Step 7: Run final P0 verification**

Run, in order:

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
```

Required result: every command exits 0; all required tests execute; zero skipped tests; no console errors during the core browser flow.

- [ ] **Step 8: Complete documentation and delivery**

README covers setup, demo/live truth boundaries, scoring/Q methodology, identity rules, AI reasoning, storage trade-off, known limitations, and Vercel deployment. `DEMO_SCRIPT.md` follows the exact P0 journey and explicitly explains what is real, seeded, simulated, deferred, how AI helped/hindered, and next-week priorities.

- [ ] **Step 9: Deploy and production-smoke**

Deploy `grain-conference-intelligence/` to Vercel with `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_USAGE_SECRET`. In production, repeat the essential desktop flow and the 390×844 capture flow. Verify the credential-free cached path, one live AI call, reset behavior, and zero external CRM writes.

- [ ] **Step 10: Commit**

Commit with `feat: complete deployed conference intelligence demo`.

---

## P1 Only After the P0 Gate

P1 may begin only if the deployed P0 journey and recording assets are complete and at least 45 focused minutes remain.

1. Add Companies grouping using the same Prep records.
2. Add CSV export preserving evidence, confidence, origin, and Unknown values.
3. Add a live HubSpot adapter only with a disposable account and verified scopes. It must reuse identity review, account ownership/deal gates, preview, idempotency, and step-aware retry.

Do not begin calendar, budgets, general checklists, outcomes/ROI, rich Focus queues, voice input, background research, or continuous monitoring for this submission.

## Four-Hour Freeze Rule

At four focused hours, stop adding surface area. Finish the current P0 path, remove P1/P2 work, run the full gate, deploy, and record. If a P0 requirement remains incomplete, document it honestly rather than replacing it with a decorative or inert control.

## P0 Requirement Coverage

| PRD requirements | Implementation task |
| --- | --- |
| FOC-02, FOC-05–06 | Task 3: thin Focus links derived from stored decisions and Prep availability. |
| CON-01–09 | Tasks 2–3: sourced fixtures, score engine, filters, Overview evidence. |
| PLN-01–02, PLN-04–07 | Task 3: grouped year list, assignments, conflicts, clusters, gaps, Q. |
| CAP-01–05, CAP-07–08 | Task 5: planned-meeting-first mobile capture and idempotent save. |
| IDN-01–10 | Tasks 2 and 5: typed seed history, shared exact/review matching, review queue. |
| PRE-01–09 | Tasks 2 and 4: snapshots, counts, evidence, profiles, statuses, action gates. |
| AIC-01–11 | Tasks 5–6: deterministic eligibility, strict live AI, evidence validation, fallback. |
| HUB-01–03, HUB-13–16 | Tasks 4 and 7: inline CRM awareness, preview, persisted safe simulation and retry. |
| MOD-01–07 | Tasks 1, 6, and 7: credential-free demo, server secrets, live availability labels. |

## Definition of Ready for Submission

- The live URL opens directly into useful Grain-styled work without login.
- Twelve sourced conferences and explainable score snapshots are visible.
- Two cached Prep events, a labelled snapshot replay, exact summary filters, and all four complete fictional outreach pages work.
- David’s coordination gate, Sam/Priya contact-channel restrictions, Marcus’s planned-to-actual transition, and all Unknown/freshness/origin states are visible.
- A planned contact becomes exactly one actual encounter on the same typed timeline; an ambiguous contact remains unmerged.
- A real server-side AI response is demonstrated, evidence IDs validate, and fallback remains usable without credentials.
- CRM preview and persisted duplicate-safe simulation work; demo mode makes zero external CRM writes.
- Planning shows owner/status, conflicts, same-city clusters, uncovered quarters, and Q linked to Prep.
- Brand styling matches the approved Grain Product Extension contract across desktop and mobile.
- Targeted tests, typecheck, lint, build, and Playwright pass with zero skips.
- README, source package, live URL, and 5–10 minute walkthrough are ready and honest about real versus simulated behavior.
