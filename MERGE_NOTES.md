# PRD merge notes

2026-09-09 — Reviewed the assignment, existing PRD, and full Prep feature brief before editing. The assignment governs scope; the merged PRD governs product behavior. No implementation work was performed.

## What changed and where

- Sections 1–6 now describe one workflow from conference selection and early outreach through field capture, relationship interpretation, and CRM preparation. AI is explicitly one system with two jobs: **find and cite; interpret and draft**.
- New **7.7 Pre-conference Prep** owns cached research, timestamps/diffs, the clickable four-number summary strip, independent attendance/ICP badges, claim evidence, unknowns, lead pages, statuses, outreach actions, and seed requirements. Previous 7.7–7.9 become 7.8–7.10.
- Sections 7.2–7.3 feed unique Confirmed Tier A decision-makers/influencers into 10 of the existing 25 buyer-role score points and show the count in planning. Missing research remains Unknown; scores are provisional and snapshot-labelled.
- Sections 7.5–7.6 connect Prep to “You planned to meet” and shared identity/history. Public observations can be the first timeline record, but only actual meetings increment encounter counts.
- Sections 7.8–7.9 share evidence/drafts between Prep and Relationships and join CRM ownership reads to reviewed create/sync writes. Ownership and open-deal checks include the account, not only the individual.
- Section 8 puts Prep inside Conferences. Sections 9–12 add provenance, fictional-origin labels, persistence, freshness, ownership, and failure behavior. Sections 13–16 set an honest delivery budget and acceptance gates. Section 17 holds unresolved questions.
- The four complete lead pages remain **unchanged and unshortened** in `pre_conference_prep_feature.md`, section 6a, explicitly referenced as the prototype seed specification by PRD 7.7. The original assignment and feature file remain untouched. PRD presentation rules explain how to render their caveats without deleting their demo content.

## What became thinner, and why

The assignment allows **4–6 focused hours within 3 days**, not the old PRD’s 6–8 implementation hours. The six-hour allocation includes verification, deployment, source packaging, and recording.

- Fully working demonstrated path: Prep list and four full lead pages → editing/status/coordination → field handoff/capture → identity/history → shared CRM preview and persisted simulation.
- Thin working support: 12 sourced conferences, deterministic scoring, monthly year list with owner/status and simple conflicts/clusters/gaps, basic Focus links, and one real AI interpretation/draft action.
- Seeded/simulated: two conferences’ research, snapshot replay/diff, fictional evidence exhibits, historical interactions, draft examples, and CRM ownership/deals/read/write/failure fixtures. Public conference discovery still contains 12 events.
- Deferred: separate calendar, general checklist, budgets, outcomes/ROI, richer Focus queues, voice, and continuous research. Companies grouping, full-list CSV export, and live HubSpot are P1; they cannot displace the complete core path.
- Removed the dependency on nonexistent `IMPLEMENTATION_PLAN.md` and its control-pack phases. The merged delivery section is sufficient for this planning handoff.

## Conflicts and resolutions

| Conflict | Resolution |
| --- | --- |
| Copilot versus research agent as “the AI feature” | One evidence-sharing AI system with two jobs. Research is cached/seeded; a real interpretation/draft action is required. AI credentials are an open dependency, not permission to claim simulation meets the assignment. |
| “Autonomous research” non-goal versus new research feature | Cached Prep is in scope; continuous monitoring/crawling is deferred. Opening pages never researches. Snapshot replay does not falsely update the research timestamp. |
| Direct attendance announcement is Confirmed in examples but Likely in the brief’s badge section | Direct named current-event announcements are Confirmed. Company sponsorship cannot confirm an employee. Side-event RSVP is Likely; a past speaker is a Probable returner. |
| “Attendees verified” includes Likely | Preserve the exact summary wording, with visible public-signal qualification and precise filter/count definitions. It does not mean checked-in attendees. |
| Prep observations called encounters; Marcus already called “2nd encounter” before meeting | First timeline record may be a sourced research observation. Mark Marcus’s second meeting as planned until captured. Public appearances, likes, and unanswered outbound messages do not count as actual meetings. |
| Marcus’s confident warming verdict versus evidence limits | Preserve the original example read as an illustrative hypothesis with counterevidence. Runtime warming requires reciprocal engagement or concrete progression; changed circumstances alone justify revisiting, not a claim of buying intent. |
| “Every claim sourced” versus fictional posts and unsupported example conclusions | Preserve every example, label fictional origin on pages/cards, use local evidence exhibits for invented sources, and distinguish factual premises from inference. Titles do not verify buying authority; corridor expansion does not prove most revenue or inadequate tooling. |
| “Never sends” versus David’s Send in Slack action | Copy coordination text/Open Slack only; user sends externally and records coordination. Draft actions respect the ownership gate. |
| One-click CRM creation versus existing preview and duplicate protection | Create opens the shared preview. Verified email supports exact identity; domain/name requires review; inferred or missing email does not authorize live create. CRM lookup failure displays Unknown. |
| New contact versus an already-owned company | Account owner/open deal also gates outreach. An absent person record does not establish an untouched account. |
| Summary suggests all relevant people are ready or need coordination | Define disjoint actionable subsets; unknown channels/CRM, unresolved identity, and already-contacted people may be relevant but neither ready nor coordination-needed. |
| Examples’ dates, authority labels, email guesses, and stated word counts conflict with trust/draft rules | Source pages stay complete. PRD requires illustrative schedule labels, inference flags, disabled unverified email actions, and actual editor word counts. Under-80-word guidance is nonblocking for preserved examples. |
| New qualified-person scoring input versus old fixed weights | Allocate 10 existing buyer-role points to a transparent capped unique-person count; preserve the 100-point total and tier thresholds. Explain coverage bias and keep fictional/demo scores separate. |

## Questions still open

See PRD section 17: available funded AI account/model; whether submission needs live HubSpot proof and a disposable account; whether bank exclusions have exceptions; actual coverage targets; and the intended year/session schedule for the illustrative June examples. These do not block this document merge. The AI credential question does block acceptance of a later build if no real response can be demonstrated.
