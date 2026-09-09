# Product Requirements Document — Grain Conference Intelligence

Status: DRAFT FOR USER REVIEW  
Owner: Nadav  
Prepared: 2026-09-09  
Target delivery: 4–6 focused hours, within 3 calendar days  
Governing brief: `Sales AI Builder — Home Assignment.md`  
Merge decisions: `MERGE_NOTES.md`  
Prototype seed specification: `pre_conference_prep_feature.md`, section 6a (all four pages, in full)

## 1. Executive summary

Grain Conference Intelligence is a web application for Grain’s sales team to decide which conferences deserve investment, coordinate annual coverage, research who is likely to attend weeks ahead, prepare personal outreach, capture conversations quickly in the field, understand relationships across events, and prepare qualified activity for HubSpot.

The product uses **one AI system with two jobs: find and cite; interpret and draft**. Pre-conference research turns public signals into a cached, sourced list of relevant people inside each conference’s **Prep** tab. The **Relationship Copilot** combines those signals with actual relationship history to explain the outreach angle, assess progression, and prepare an editable message. Both jobs share evidence and contact identity; neither decides identity or sends messages. Research snapshots are seeded for the assignment; one real AI interpretation/drafting path demonstrates meaningful AI use.

The first release is an evaluator-ready vertical slice rather than a complete event-management or CRM platform. It must demonstrate one coherent workflow from conference selection through follow-up and CRM synchronization.

## 2. Problem statement

Conference-related sales work is fragmented across spreadsheets, Slack conversations, CRM records, and individual notes. This creates six problems:

1. Conference attendance decisions are inconsistent and difficult to defend.
2. Annual coverage, conflicts, and trip-clustering opportunities are hard to see.
3. Lead capture on a busy conference floor is too slow or incomplete.
4. Repeat encounters are stored as isolated events rather than interpreted as a developing relationship.
5. Follow-up and HubSpot entry are inconsistent, delayed, or duplicated.
6. Reps discover relevant people too late to book meetings, and public attendance signals lack qualification, provenance, and CRM ownership context.

Grain needs one lightweight working surface that connects these decisions without asking salespeople to become analysts or data-entry specialists.

## 3. Product goals

### 3.1 Primary goals

- Help a salesperson identify the highest-value conferences for Grain.
- Make conference recommendations explainable and source-backed.
- Turn cached public attendance signals into a qualified, coordinated outreach list weeks before an event.
- Show annual coverage gaps, conflicts, and trip-clustering opportunities.
- Allow a salesperson to capture a useful encounter in under one minute on mobile.
- Reliably connect repeat encounters to the same person without unsafe automatic merging.
- Turn cross-conference history into a justified next action using AI.
- Provide a safe, visible, duplicate-resistant path into HubSpot.
- Deliver a complete demo experience without requiring evaluator credentials.

### 3.2 Product success for the assignment

The release is successful when an evaluator can complete the following journey without assistance:

1. Find and understand a high-priority conference.
2. Review why the conference received its score.
3. Assign coverage, open Prep, filter the summary strip, and inspect a sourced lead page with inline HubSpot ownership.
4. Edit a draft, record coordination where needed, add a planned contact to the field list, and capture the meeting from a mobile layout.
5. See the system connect the new encounter to prior history.
6. Review an evidence-backed Relationship Copilot assessment.
7. Edit a recommended follow-up.
8. Preview what would be synchronized to HubSpot.
9. Complete a safe demo synchronization.
10. Return to planning and see the event’s qualified-person count alongside coverage and trip clusters.

### 3.3 Non-goals

The first release is not intended to be:

- a complete CRM replacement;
- a generic AI chat assistant;
- a continuously running web/social monitoring agent or comprehensive attendee database;
- a badge-scanning or contact-enrichment platform;
- a full travel-booking or expense-management system;
- an automated revenue-attribution platform;
- a production multi-organization administration suite.

## 4. Target users

### 4.1 Primary user — Grain salesperson

Needs to decide where to invest time, prepare for events, capture conversations quickly, and know the appropriate follow-up without manually reconstructing relationship history.

### 4.2 Secondary user — Sales leader or conference planner

Needs to evaluate annual coverage, allocate owners and budget, identify gaps or conflicts, and learn whether previous event investments produced useful outcomes.

### 4.3 Evaluation user

Needs to understand the product immediately, complete the core workflow without setup, and distinguish demonstrated functionality from live integration functionality.

## 5. Jobs to be done

- **When planning the year**, help me compare conferences so I can invest in events with the strongest Grain ICP fit.
- **When assigning coverage**, show me conflicts, gaps, and possible trip clusters so the team uses travel efficiently.
- **Weeks before the event**, show me who is likely to attend, why they fit, what fact makes a conversation timely, and who owns the account so I can book meetings responsibly.
- **When I meet someone onsite**, let me capture the essential context quickly so it is not lost.
- **When I encounter someone again**, show me the full relationship history so I do not treat them like a new lead.
- **When deciding how to follow up**, interpret the relationship progression and show the evidence so I can act confidently.
- **When updating the CRM**, show me exactly what will be written and prevent duplicates so I can trust the integration.

## 6. Core user journey

1. The user opens **Today’s Focus** and sees the highest-priority unresolved work.
2. The user opens a conference, reviews the score and evidence, and chooses attend, watch, or skip.
3. The user assigns an owner and opens Prep. Cached research shows its timestamp, independent attendance and ICP badges, and HubSpot ownership. The user reviews an outreach page, coordinates if needed, edits and copies a draft, records outreach status, and adds the person to the field list.
4. At the event, the user opens “You planned to meet,” selects Met, and saves conversation notes; unplanned contacts can also be captured. Didn’t meet records a plan outcome without creating an encounter.
5. The system performs deterministic identity matching.
6. If the person is known, the encounter is added to the existing timeline. If the match is ambiguous, the system requests review.
7. The Relationship Copilot analyzes eligible encounter history and produces a structured, evidence-backed brief.
8. The user reviews the recommendation and edits the proposed follow-up message.
9. The user previews the HubSpot payload and synchronizes it in demo or live mode.
10. Planning shows saved coverage and qualified-person counts. A later release adds post-event outcome reporting without rewriting historical score snapshots.

## 7. Functional requirements

Priority definitions:

- **P0:** required for the submitted core experience;
- **P1:** required if external credentials and implementation time permit;
- **P2:** optional stretch work after all P0 gates pass.

### 7.1 Today’s Focus

| ID | Priority | Requirement |
| --- | --- | --- |
| FOC-01 | P2 | Display relationships with an overdue or due follow-up. |
| FOC-02 | P0 | Display upcoming conferences still awaiting an attend/watch/skip decision. |
| FOC-03 | P2 | Display attending conferences missing an owner or incomplete preparation. |
| FOC-04 | P2 | Display qualified encounters eligible for HubSpot synchronization. |
| FOC-05 | P0 | Every focus item links directly to the relevant actionable record. |
| FOC-06 | P0 | Focus items are calculated from persisted data and deterministic rules. |

### 7.2 Conference discovery and scoring

| ID | Priority | Requirement |
| --- | --- | --- |
| CON-01 | P0 | Provide 12 sample conferences relevant to fintech, payments, travel, treasury, or adjacent SaaS buyers. |
| CON-02 | P0 | Store an official source URL and verification date for each conference. |
| CON-03 | P0 | Allow filtering by month, geography, vertical, tier, and plan status. |
| CON-04 | P0 | Calculate a score from vertical fit, buyer-role density (including the qualified-person count below), FX relevance, meeting accessibility, and trip efficiency. |
| CON-05 | P0 | Show the points, explanation, evidence, and source for each scoring factor. |
| CON-06 | P0 | Display audience size only as context; it must not affect the score. |
| CON-07 | P0 | Convert scores into Tier A, B, or C using the approved thresholds. |
| CON-08 | P0 | Present an attend, watch, or skip recommendation that remains editable by the user. |
| CON-09 | P0 | Never present unsupported estimates as verified facts. |

Approved scoring weights:

| Factor | Maximum points |
| --- | ---: |
| ICP vertical fit | 35 |
| Buyer-role density | 25 |
| FX/cross-border relevance | 20 |
| Meeting accessibility | 10 |
| Trip efficiency | 10 |

Approved tiers:

- Tier A: 80–100;
- Tier B: 65–79;
- Tier C: below 65.

Within the existing 25 buyer-role points, allocate 15 to sourced audience-role evidence and 10 to the researched room: `min(10, Q)`, where Q is the number of unique, named, current-edition Confirmed people at Tier A companies in decision-maker or influencer roles. This is a transparent prototype heuristic, not a validated ROI model. Likely attendees, probable returners, company-only signals, duplicates, and excluded companies do not contribute to Q. Conference tiers and company ICP tiers are separate classifications.

Show Q, research timestamp, and source records beside the points. No research means `Unknown`, with 0 provisional evidence points, not a claim that nobody relevant attends. Thin research can undercount; show coverage limitations. A refreshed snapshot recalculates the current score and records its timestamp without overwriting the prior score or the rep’s decision. Fictional prep counts affect only explicitly labelled demo scores.

### 7.3 Coverage planning

| ID | Priority | Requirement |
| --- | --- | --- |
| PLN-01 | P0 | Provide a year list grouped by month; a separate visual calendar is P2. |
| PLN-02 | P0 | Allow assignment of attend/watch/skip status and a conference owner. |
| PLN-03 | P2 | Allow maintenance of a general pre-event checklist; P0 preparation is the Prep list and its statuses. |
| PLN-04 | P0 | Surface overlapping conference dates as potential conflicts. |
| PLN-05 | P0 | Surface conferences close enough in time and geography to consider one trip. |
| PLN-06 | P0 | Show uncovered quarters using the explicit rule below; regional investment targets await a product decision. |
| PLN-07 | P0 | Show qualified-person count Q and its research timestamp per event, linking to the same Prep records. |
| PLN-08 | P2 | Record estimated conference cost for planning context. |

For the thin working view, flag overlapping dates for the same assigned owner; suggest a trip cluster for events in the same city within seven days; flag a quarter with no attended event as uncovered. Regional investment targets remain an open decision; do not claim that an unrepresented region is strategically under-invested.

### 7.4 Post-event outcomes

| ID | Priority | Requirement |
| --- | --- | --- |
| OUT-01 | P2 | Record leads captured, qualified conversations, meetings booked, and opportunities influenced. |
| OUT-02 | P2 | Record an attend-again, reconsider, or insufficient-evidence recommendation. |
| OUT-03 | P2 | Display historical outcomes alongside future planning. |
| OUT-04 | P2 | Historical outcomes must not silently alter the original pre-event ICP score. |

### 7.5 Mobile lead capture

| ID | Priority | Requirement |
| --- | --- | --- |
| CAP-01 | P0 | Provide a touch-friendly layout usable on a typical phone viewport. |
| CAP-02 | P0 | Require name, company, conference/date (prefilled), and a short conversation note. Keep role, email, LinkedIn, signals, qualification, next step, and follow-up date optional. |
| CAP-03 | P0 | Keep only the minimum identity and encounter context required for a useful record. |
| CAP-04 | P0 | Preserve entered data and show a recoverable error if submission fails. |
| CAP-05 | P0 | Run identity matching immediately after successful submission. |
| CAP-06 | P2 | Allow optional voice-assisted note capture only after all P0 flows pass. |
| CAP-07 | P0 | Pre-load saved Prep leads into “You planned to meet,” including planned session/time and identity. Met opens prefilled capture; Didn’t meet updates only the plan. |
| CAP-08 | P0 | Link a saved meeting to its existing contact, prep record, and outreach history. Repeated taps must not duplicate encounters. |

### 7.6 Contact identity and encounter history

| ID | Priority | Requirement |
| --- | --- | --- |
| IDN-01 | P0 | Normalize email and LinkedIn identifiers before matching. |
| IDN-02 | P0 | Automatically link exact email or exact LinkedIn matches. |
| IDN-03 | P0 | Treat similar name plus company domain as a proposed match requiring confirmation. |
| IDN-04 | P0 | Never silently merge ambiguous contacts. |
| IDN-05 | P0 | Preserve company and role as encounter-time facts when a person changes jobs. |
| IDN-06 | P0 | Allow a user to accept or reject a proposed match. |
| IDN-07 | P0 | Display a chronological timeline of all confirmed encounters. |
| IDN-08 | P0 | A prep lead or past-edition speaker creates the first sourced timeline record, typed as research observation, not a meeting. Preserve event edition, source date, identity confidence, and company/role at that time. |
| IDN-09 | P0 | Distinguish research observations, rep-sent outreach, replies, planned meetings, and actual encounters. Only saved actual meetings increment the cross-conference encounter count. Reuse observation records across snapshot refreshes. |
| IDN-10 | P0 | Apply the same exact-match and review rules to research imports, capture, and CRM lookup. An inferred email or unconfirmed domain-plus-name candidate is not an exact identity match. |

### 7.7 Pre-conference Prep

Prep belongs to a conference, not a separate module. It answers who may be in the room and what the rep can responsibly do next.

| ID | Priority | Requirement |
| --- | --- | --- |
| PRE-01 | P0 | Open cached research immediately with `Last researched: <timestamp>`; opening Prep or a person never starts live research. Warn when the snapshot is older than 14 days. |
| PRE-02 | P0 | Provide a labelled simulated Research again action that loads a second stored snapshot and shows new/changed/removed evidence. Preserve the snapshot’s actual research time and separately show when the simulation ran. |
| PRE-03 | P0 | Show the clickable summary strip: `N attendees verified · N relevant · N ready to contact · N need coordination`, calculated from the records under the definitions below. |
| PRE-04 | P0 | Default to People: name, title, company/domain, attendance badge and evidence, company ICP tier, role fit, inline HubSpot owner/deal/last activity, prep status, and New badge since the last viewed snapshot. |
| PRE-05 | P0 | Filter by ICP tier, attendance confidence, HubSpot status, role fit, and prep status; sort Tier A + Confirmed, Tier A + Likely, Tier B + Confirmed, then remaining tier/confidence combinations. |
| PRE-06 | P0 | Persist To contact, Contacted, Replied, Meeting booked, and Not now per person/event. Needs coordination is a separate gate displayed alongside status, not evidence that outreach occurred. |
| PRE-07 | P0 | Open a lead outreach page with contact details, 3–5 sourced fit/attendance bullets, prior relationship history first when present, dated recent signals, one sourced angle, editable drafts, and the shared Copilot read. |
| PRE-08 | P0 | Support Copy message, Open LinkedIn, Open email when an address is verified, Mark contacted, Create/View in HubSpot, and Add to field list. No action sends prospect or colleague messages. |
| PRE-09 | P0 | Keep attendance confidence, company ICP tier, and claim evidence tags separate; display Unknown values and supporting source cards openly. |
| PRE-10 | P1 | Add a Companies grouping of the same records, including company-only evidence and a recommended target role where no person is known. |
| PRE-11 | P1 | Download the full list as CSV, preserving evidence, confidence, unknowns, and demo labels. |
| PRE-12 | P2 | Run background research and scheduled refreshes against accessible public sources; show real snapshot diffs. Continuous social monitoring is beyond the assignment. |

**Summary definitions.** Attendees verified counts unique named people with Confirmed or Likely current-event signals. Preserve the requested label, but display adjacent explanatory text: “Public signals, including likely attendance; not verified check-ins.” Relevant is that subset at Tier A/B companies in decision-maker or influencer roles. Ready to contact is relevant, To contact, with at least one usable contact channel, resolved identity, and a checked CRM result of not present or owned by me, with no contact/account open deal or ownership conflict. Need coordination is relevant and owned by another rep, associated with an open deal, or blocked by unresolved account ownership. Unchecked CRM, unknown channels, and already-contacted leads can be relevant without being ready; the final two counts need not sum to Relevant. Each number filters its exact subset.

**Attendance rules.** Confirmed means a named person directly announces attendance or is listed for the current edition as speaker, panelist, moderator, presenter, or booth staff. Likely includes person-level side-event RSVPs and indirect mentions. A company sponsor/exhibitor announcement supports company attendance only; it does not confirm a particular employee. Probable returner means evidence from the last one or two editions only. Inferred is weaker indirect evidence; Unknown means none. An awards shortlist alone does not confirm physical attendance. Removed or cancelled speaker evidence is flagged and confidence recomputed from remaining evidence.

**ICP rules.** Tier A requires a target vertical, clear multi-currency operations/FX exposure, and an identifiable decision-maker role. Tier B has relevant business/FX signals but a material qualification gap; Tier C is adjacent. Excluded covers competitors, banks as direct prospects, or evidenced lack of relevant exposure, with a reason. Unknown exposure is a qualification question, not proof of exclusion. Show company fit separately from the individual’s decision-maker, influencer, other, or Unknown role fit; title-based authority is an inference.

**Research and evidence contract.** Input is event name, edition/dates, official URL, and the same Grain ICP used for scoring. The eventual research job verifies company domain, gathers attendance signals, qualifies companies, identifies named people, and reviews relevant signals from the last 6–12 months. Sources may include agendas, staff directories, sponsor announcements, public social posts, side-event RSVPs, past programmes, transcripts, careers pages, and company filings. Store each claim with stable evidence ID, person/company and edition, claim, quote, source URL or internal record link, platform, publication date, discovery date, evidence tag, and real/fictional origin. Prefer primary sources. Flag signals older than 18 months; preserve them as history, not current news. Output is English. Inaccessible sources produce Unknown, never fabricated people, quotes, or access claims.

Evidence tags are Verified (direct primary-source support for the precise claim), Cited (secondary-source support), Inferred (reasoning with linked premises), and Unknown (no supporting evidence, with the gap explained). A primary source does not verify an inferred conclusion. Suggested angle contains one cited fact and one explicitly inferred sentence about its relevance; it does not assert unknown hedging practices or buying intent.

Drafts aim for under 80 words: one fact, one reason Grain is relevant, one concrete ask, in a peer-to-peer tone. Email and LinkedIn variants share the same evidence; omit email actions when the address is Unknown or inferred. Editing and copying never marks a message sent; the rep records Contacted after sending externally. Owner coordination precedes prospect draft actions and is recorded manually. The tool never sends email, DMs, or Slack messages.

**Prototype seed contract.** Retain and use all four complete example pages in [pre_conference_prep_feature.md, section 6a](pre_conference_prep_feature.md#6a-four-example-lead-pages): Sam Jones, David Cohen, Priya Natarajan, and Marcus Oyelaran. This referenced section is the seed-data specification, including every profile, signal, quote, timeline entry, angle, draft, coordination step, and next action; it must not be shortened. The rest of that feature brief is historical input; this merged PRD governs behavior. Preserve original text in the fixture specification while applying these visible presentation rules:

- All four pages and their source cards carry “Fictional demo scenario.” Their evidence tags describe the simulated evidence type, not verified real people. Use labelled local evidence exhibits for invented posts/reports; never imply a real URL proves fictional claims. Real conference evidence remains separately auditable.
- Use a fixed illustrative pre-event clock for relative dates. The example’s 2–4 June dates, Monday dinner, Thursday panel, and Friday suggestion are not a verified single calendar: retain the supplied copy as illustrative and flag those scheduling details for review before any real outreach.
- Sam’s address remains visibly inferred, with email opening/CRM identity matching disabled until verified; preserve his email draft as editable example copy. Priya has no email variant. Missing email is not a reason to guess one.
- David’s `Send in Slack` is presented as Copy coordination message/Open Slack, with no send integration. His title-based authority and “likely through a bank” are inferences; his account-owner gate precedes draft actions.
- Marcus has one actual prior conference meeting before the planned second meeting is saved. Display “Planned second encounter,” then “2nd encounter” after capture. His original warming read is preserved as an illustrative hypothesis with counterevidence (silence); corridor growth and a like alone do not establish purchase progression. Unsupported conclusions such as “most of the business” remain flagged as inference in editable example copy.
- Preserve the supplied draft word-count labels in the source specification; treat them as illustrative, not validated counts. Show actual counts in the editor and a nonblocking length warning.

Seed two conferences with cached Prep snapshots (one containing all four full pages), while retaining all 12 public-source conferences in discovery. Include small additional fixtures for an open-deal owner gate, probable returner, company-only signal, cancelled speaker, unknown CRM lookup, and a genuinely stalled relationship. Do not invent a fifth full outreach page to satisfy those states.

### 7.8 Relationship Copilot

| ID | Priority | Requirement |
| --- | --- | --- |
| AIC-01 | P0 | Produce a relationship state of warming, stalled, or unclear. |
| AIC-02 | P0 | Produce a confidence value, summary, recommended action, and editable follow-up draft. |
| AIC-03 | P0 | Reference valid encounter IDs for relationship claims and valid research evidence IDs for public-context claims, belonging to this person/company. |
| AIC-04 | P0 | Show warming only with documented repeat reciprocal engagement or explicit progression; repeat attendance, funding, and social likes alone are insufficient. Show supporting evidence and counterevidence. |
| AIC-05 | P0 | Require at least three actual encounters spanning 180 days and no documented progression for stalled; research observations and unanswered outbound messages do not satisfy the count. |
| AIC-06 | P0 | Use unclear when the deterministic eligibility rules do not support warming or stalled. |
| AIC-07 | P0 | Reject output containing unknown evidence IDs or an invalid response shape. |
| AIC-08 | P0 | Fall back to a deterministic brief when AI output is unavailable or invalid. |
| AIC-09 | P0 | Visibly distinguish demo-generated and live-AI output. |
| AIC-10 | P0 | Provide a working server-side AI interpretation/draft action and demonstrate at least one real structured response from the seeded evidence. Record provider/model, generation time, and evidence used. Cached examples alone do not satisfy the assignment’s AI requirement. |
| AIC-11 | P0 | Limit live AI use to five calls per anonymous workspace; a missing key or exhausted allowance retains the cached path. |

This is the interpret-and-draft job of the same AI system described in section 1, available from both Prep and Relationships. It uses research for timely context and actual encounters/replies for the relationship read. Without sufficient relationship evidence, use unclear and a qualification question. “Stalled” is the cautious user-facing equivalent of a possible tire-kicker, never a claim about motive. Marcus’s seeded historical reply and renewed context justify revisiting; a new captured concrete next step can establish warming in the demo.

The AI may interpret notes and public evidence and draft communication. It may not decide contact identity, invent evidence, override deterministic eligibility boundaries, or send anything. Live interpretation is an explicit action on already stored evidence; it does not run live research when a page opens.

Required output contract:

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
  followUpDraft: {
    subject: string;
    body: string;
  } | null;
  linkedInDraft: string | null;
};
```

### 7.9 HubSpot awareness and synchronization

| ID | Priority | Requirement |
| --- | --- | --- |
| HUB-01 | P0 | Show a readable payload preview before synchronization. |
| HUB-02 | P0 | Show which fields will be written and which protected fields will remain unchanged. |
| HUB-03 | P0 | Provide a complete demo synchronization with no external write. |
| HUB-04 | P1 | Search live HubSpot contacts by exact email. |
| HUB-05 | P1 | Create a contact when no exact match exists. |
| HUB-06 | P1 | Update only the approved safe contact fields. |
| HUB-07 | P1 | Never overwrite HubSpot lifecycle stage. |
| HUB-08 | P1 | Create an associated note containing the conference encounter. |
| HUB-09 | P1 | Store HubSpot contact and note identifiers. |
| HUB-10 | P1 | Prevent duplicate contact or note creation on repeated requests. |
| HUB-11 | P1 | Resume from the incomplete step after a partial failure. |
| HUB-12 | P1 | Limit live HubSpot writes to two per anonymous workspace. |
| HUB-13 | P0 | Read a seeded CRM table for contact and account status: not present, owned by me/another rep, last activity, and open deal with owner. Show ownership inline in Prep and on the outreach page, with last checked time. Unknown/failed lookup is never Not in HubSpot. |
| HUB-14 | P0 | Use verified exact email for a confirmed match; domain plus name is a review candidate. Unresolved candidates block create, and account ownership/open deals gate outreach even when the person is new. |
| HUB-15 | P0 | Create in HubSpot opens the shared preview from Prep or Relationships. In demo, persist the simulated contact/company association and a prep evidence or actual-encounter note, then update inline status to View in HubSpot (demo record). |
| HUB-16 | P0 | Demonstrate repeated sync without duplicate contacts/notes and contact-created/note-failed retry in the mock store. Never overwrite owner, lifecycle, or deal fields. |
| HUB-17 | P1 | Read live associated company ownership, last activity, and open-deal status; create or associate a company by reviewed domain and a contact by verified email. Do not enable live writes without the full ownership/match checks. |

The read and write sides use the same identity resolution and status model. A coordination acknowledgment records the rep’s decision without reassigning ownership or changing a deal. Live create is deferred when email is missing or inferred; the demo can show this disabled state. Public fictional fixtures must never be written to a real CRM. The guaranteed submission provides a working, persisted CRM simulation and payload path; a real HubSpot adapter is P1 and must be reported honestly as absent if not built.

### 7.10 Demo and live operation

| ID | Priority | Requirement |
| --- | --- | --- |
| MOD-01 | P0 | Default to demo mode. |
| MOD-02 | P0 | Allow the complete evaluator journey without external credentials. |
| MOD-03 | P0 | Ensure demo mode performs no external writes. |
| MOD-04 | P0 | Label simulated and live results clearly. |
| MOD-05 | P0 | Keep integration credentials out of client code and source control. |
| MOD-06 | P0 | Configure credentials through deployment environment variables. |
| MOD-07 | P0 | Disable only the unavailable live capability when a credential is missing. |

## 8. Information architecture

### Today’s Focus

Thin default entry point showing conferences awaiting a decision and links to their Prep tabs. Rich follow-up and operational queues are P2.

### Conferences

Conference list, filters, scores, recommendation, evidence, and detail pages with **Overview** and **Prep** tabs. Prep contains the cached people list and nested lead outreach pages; company grouping is P1. These pages use the same contacts, timeline, drafts, and CRM preview as Relationships.

### Planning

Annual list grouped by month, owner/status, conflicts, same-city trip clusters, uncovered quarters, and qualified-person counts linking to Prep. Calendar, budgets, general checklists, and outcomes are deferred.

### Capture

Mobile-first encounter creation, starting with “You planned to meet” and a quick option for an unplanned contact.

### Relationships

Contact list, identity-review queue, encounter timeline, Relationship Copilot brief, follow-up draft, and HubSpot preparation.

### Settings

Demo/live mode, integration availability, usage limits, and safe explanatory copy. Secret values are never displayed or entered here.

## 9. Data and trust requirements

- Shared conference records must be read-only to ordinary users.
- User-created plans, contacts, encounters, outcomes, briefs, and synchronization attempts must be isolated by anonymous workspace.
- Two anonymous workspaces must not be able to read or alter one another’s private records.
- Conference score evidence must include provenance and verification date.
- Encounter-time company and role must remain historically accurate after later profile changes.
- AI output must be stored separately from source encounters and labelled with mode and generation time.
- Store research snapshots, evidence, per-event prep status, planned contacts, and coordination acknowledgments separately from actual encounters, using shared stable contact/company IDs. Keep private CRM/rep overlays isolated by workspace even when conference research is shared.
- Store real/fictional provenance separately from evidence tags. Unknown claims show the missing evidence; inferred claims link to their premises. Refresh failure retains the previous snapshot and its timestamp.
- Demo CRM and contact writes persist across reloads within the workspace; seeded research is read-only and resettable. No continuous scraping or production enrichment is implied.
- HubSpot synchronization attempts must record completed steps without storing credentials.
- Sensitive values must not appear in browser payloads, logs, committed files, or demo fixtures.

## 10. Experience requirements

- A non-technical salesperson must understand the primary action in each view.
- The first viewport must expose useful work rather than a marketing introduction.
- Mobile capture controls must be touch-friendly and avoid unnecessary typing.
- Scores and AI conclusions must be understandable without hidden tooltips.
- Loading, empty, success, disabled, and recoverable-error states must be explicit.
- Essential actions must be keyboard accessible.
- The interface must remain usable on mobile and desktop without horizontal page overflow.
- The product must not imply that demo data, estimated data, or simulated integrations are live facts.

## 11. Success measures

For the assignment release, success is measured through observable product behavior rather than production analytics:

| Measure | Target |
| --- | --- |
| Core evaluator journey | Completed without setup or assistance |
| Mobile encounter capture | Achievable in under 60 seconds during a practiced demo |
| Conference score explainability | 100% of scoring factors show points, rationale, source, and verification date |
| Ambiguous identity matches | 0 silently merged |
| AI evidence integrity | All cited encounter/research IDs belong to the selected contact/company; at least one real AI response demonstrated |
| Prep trust | Cached open, visible timestamps, separate badges, and source/origin labels on every claim |
| Prep-to-field continuity | Planned contact becomes one actual encounter on the same timeline after capture |
| Ownership awareness | Other-owner/open-deal fixtures require coordination; unknown CRM never shown as new |
| Demo external writes | 0 |
| Repeated HubSpot synchronization | 0 duplicate contacts or notes in the tested journey |
| Required targeted checks | All identity, eligibility, summary/count, and sync checks pass; none reported passed when skipped |
| Production demonstration | Complete core journey works on desktop and mobile |

## 12. Failure and edge-case behavior

- Missing official conference evidence lowers certainty and must be visible; the application must not fabricate a value.
- A contact without email or LinkedIn can be saved, but possible duplicates require manual review.
- Conflicting exact identifiers must stop automatic linking and create a review item.
- A job change must create new encounter-time context rather than overwriting history.
- An AI timeout, invalid schema, or unsupported evidence reference triggers the deterministic fallback.
- Missing live credentials disables only the corresponding live action and explains how deployment configuration enables it.
- A HubSpot contact-created/note-failed sequence records the contact step and retries only the note.
- A repeated synchronization returns the stored result rather than creating another record.
- A failed research refresh preserves cached results; old snapshots (>14 days) and old signals (>18 months) have distinct warnings.
- A missing or cancelled speaker signal downgrades confidence; a company-only signal never invents a named attendee. Past editions stay historical observations.
- Conflicting domains, parent/brand relationships, or job titles remain visible with sources and require review before identity linking or CRM creation.
- Excluded companies remain filterable; a collapsed “also attending” presentation is P2. Missing email retains LinkedIn outreach where available.
- A persistence failure preserves unsaved form input where possible and offers a retry.

## 13. Dependencies and constraints

- Delivery is constrained to 4–6 focused hours total, including deployment and recording, completed within 3 days of receiving the brief.
- The tool must have a working live URL, shareable source, and a 5–10 minute walkthrough.
- The application must remain simple enough for a non-developer to host and configure.
- Prefer the existing Next.js, TypeScript, Supabase, and Vercel direction only if a familiar starter makes hosting and persistence quick. Architecture is subordinate to the time budget; do not build a control pack or administration system.
- OpenAI and HubSpot availability depend on valid environment configuration.
- The public evaluator experience must not depend on either integration being configured.
- The assignment brief remains authoritative if it conflicts with this PRD.

## 14. Delivery strategy

Protect one end-to-end path: select a conference → review Prep evidence and ownership → edit outreach → add to field list → capture a repeat meeting → interpret the relationship → preview and simulate CRM synchronization. No implementation plan currently exists in the supplied folder; this section owns the assignment delivery scope.

| Delivery depth | Scope |
| --- | --- |
| Built fully for the demonstrated path | Cached Prep list/filters/summary and all four complete lead pages; source cards and unknowns; editing/copying/status/coordination; field-list handoff and capture; exact matching plus ambiguous/conflicting review; typed history; CRM preview and persisted duplicate-safe simulation. |
| Thin but working | 12 sourced conferences and deterministic scores; monthly year list, owner/status, simple conflicts/clusters/gaps; basic Today’s Focus links; shared Copilot with eligibility checks, fallback, and one real AI interpretation/draft action; anonymous workspace persistence. |
| Seeded or simulated, visibly labelled | Two events’ research snapshots and a second snapshot for one event; public-source conference records plus fictional people/evidence exhibits; historical interactions, editable draft examples, CRM ownership/deals, and simulated CRM reads/writes/failure recovery. The research agent is represented by cached outputs, not claimed as a running crawler. |
| Deferred | Continuous/scheduled research, rich Companies view/CSV export (P1), live HubSpot integration (P1), full calendar, budgets/checklists, outcomes/ROI, rich Focus queues, voice input, and general account administration (P2). |

Suggested six-hour allocation, including submission work:

1. 45 minutes: familiar starter, persistence, 12 conference sources, seed/evidence fixtures.
2. 90 minutes: Prep list, four lead pages, summary, ownership gates, editable outreach, snapshot replay.
3. 60 minutes: field handoff, capture, matching/review, typed history.
4. 45 minutes: real AI interpretation, deterministic validation/fallback, CRM preview and mock persistence.
5. 30 minutes: scoring and thin coverage list with owner/status/conflict/cluster rules.
6. 60 minutes: core verification, deploy, README/source packaging, and 5–10 minute recording.

At the four-hour checkpoint, freeze expansion and use the remaining time for a complete deployed path and submission. Remove P1/P2 work first; never replace a required capture, planning, matching, AI, or CRM path with an inert button. Reuse one detail/timeline/preview flow across Prep and Relationships. If P0 cannot fit, record the unmet requirement honestly; do not declare the release accepted.

The video follows that path, explains score weights and research coverage bias, demonstrates name variation/job change and a real repeated meeting, distinguishes public context from buying progression, and identifies simulated research/CRM versus a real AI response. Include how AI helped and hindered the build, and next-week priorities: scheduled research/diffs, live HubSpot, and meeting-outcome feedback.

## 15. Key risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Scope exceeds the assignment window | Protect Prep-to-field-to-CRM continuity; thin planning and Focus, seed research/CRM, and defer outcomes and live CRM. |
| Conference data appears fabricated | Use official sources, verification dates, and explicit unknown states. |
| AI feels bolted on | Share evidence across the find-and-cite and interpret-and-draft jobs; demonstrate a real response on that evidence. |
| AI invents relationship evidence | Validate typed encounter/research references; public activity is context, not a meeting or proof of intent. |
| Prep overstates attendance or research coverage | Separate attendance/ICP/evidence badges; show Unknown, timestamps, and provisional count-based score points. |
| Fictional examples appear verified | Label every example and evidence exhibit as fictional; preserve supplied prose but flag unsupported inference and illustrative dates. |
| Contact matching causes harmful merges | Auto-link only exact identifiers; require review for fuzzy matches. |
| CRM demo creates unwanted records | Default to no-write demo mode and preview payloads before live synchronization. |
| Partial CRM failure creates duplicates | Persist step state and use stable idempotency keys. |
| Evaluator cannot configure integrations | Ensure the complete core journey works without credentials. |

## 16. Release acceptance

The assignment release is ready only when:

- every P0 requirement has executable or directly observable evidence;
- the primary desktop and mobile browser journeys pass;
- conference sources and score explanations are auditable;
- two cached Prep events and all four full fictional lead pages are usable; no page-open triggers research;
- summary counts filter the defined subsets, separate badges/Unknown/source labels are visible, and stale/changed/cancelled research states are demonstrated;
- an owner/open-deal gate prevents uncoordinated draft actions, while an unknown CRM result cannot masquerade as a new lead;
- adding a prep contact, editing a draft/status, reloading, and recording Met preserves identity and creates exactly one actual encounter; Didn’t meet creates none;
- identity matching demonstrates both exact and ambiguous cases;
- Relationship Copilot output cites valid typed evidence, visibly identifies its mode, and demonstrates a real AI response; fallback alone does not pass the AI gate;
- HubSpot preview and duplicate-safe demo synchronization work;
- targeted identity/eligibility/count/sync checks and the production build pass; run type checking if the chosen stack uses it, and do not mark skipped required checks as passed;
- the deployed demo works without user-provided credentials;
- README, known limitations, and walkthrough script match the delivered application.

P1 live HubSpot checks are reported separately; their absence must not be disguised as successful live verification. Cached AI results keep the credential-free evaluator path usable, but the delivered AI action must also have been exercised with a configured provider. If no AI credentials can be obtained, this is an unmet assignment requirement, not an accepted simulation. Acceptance covers the stated prototype depth, not a production research or CRM service.

## 17. Open product decisions

The merge settles the AI framing, Prep’s home, typed history, confidence conflicts, and the 4–6 hour scope. Remaining questions are recorded here rather than assumed resolved:

- **Real AI credentials:** which provider/model and funded deployment account are available? Cached evaluation is credential-free, but the real-AI acceptance gate requires configured credentials and one successful demonstration.
- **HubSpot depth:** is the clearly labelled working mock and payload preview sufficient for this submission, or does the evaluator expect a real contact creation? The assignment asks for a path; this PRD defaults to simulation at P0. If live proof is expected, identify a disposable account and replace stretch work within the same budget.
- **ICP exclusions:** should banks always be excluded as direct prospects, as the feature brief proposes, or can particular bank/partner segments qualify? Default to the brief’s exclusion with a visible reason; do not infer a broader Grain policy.
- **Coverage priorities:** which regions and minimum quarterly attendance targets reflect the team’s strategy? Until specified, show factual uncovered quarters, not invented investment targets.
- **Example calendar:** what year/session schedule should replace the internally inconsistent illustrative June dates for a real event demo? Until resolved, retain the full examples with the fixed fictional scenario label.
- **Implementation validation:** confirm deployment model availability, anonymous workspace isolation, and, only if live CRM is built, current API/scopes and account access. These are build-time checks, not completed work in this planning task.
