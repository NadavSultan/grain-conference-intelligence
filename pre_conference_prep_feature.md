# Feature Brief: Pre-Conference Prep ("Who's in the room")

An addition to the Conference Intelligence tool. This document describes one feature end to end so a coding agent can integrate it into an existing plan. It is written for a prototype: fake what needs faking, but make the *thinking* visible. Show the near-perfect version of how this would work.

---

## 1. The idea in one paragraph

Weeks before a conference, a salesperson opens it in the tool and sees who is likely to be in the room: which relevant companies are attending, which named people from those companies, how confident we are and why, and whether each one is already in HubSpot. Clicking a person opens an outreach page with a suggested angle grounded in recent public signals about their company, plus an editable draft message to book a meeting at the event. The AI does the research and synthesis. The rep decides who to contact and owns every word that gets sent.

---

## 2. The business thinking behind it

- **Conference ROI is decided before the event.** Reps who arrive with 10 to 15 pre-booked meetings outperform reps who walk the floor cold. Booking takes weeks of outreach, so the research has to happen well ahead of time.
- **Official attendee lists arrive late or never.** Most events publish an attendee list two weeks before the event, if at all. But people announce themselves months earlier, all over the open web: a treasurer posts "heading to Money20/20, who's around?" on LinkedIn, a CFO tweets about their panel slot, a payments lead RSVPs to a side-event dinner, a company blog says "meet us at booth 42." Add speaker lists, sponsor pages, awards shortlists, and past editions' programmes, and the room is largely knowable weeks before the organiser tells you who is in it. Nobody reads all of that by hand. An agent can.
- **The rep's actual question is two questions.** "Who will be there that is worth my time?" and "What do I say to them?" A list of company logos answers neither. A named person, a reason they fit, and a fact-based opener answers both.
- **Volume matters.** Booking 15 to 20 meetings realistically requires 40 to 50 qualified contacts. Manual research caps out around a dozen. This is why AI belongs here: turning the unstructured public web into a structured, sourced contact list is slow for a human and fast for an agent.
- **Trust is the product.** Reps stop using tools that assert things confidently and turn out wrong. Every claim in this feature carries its source and a confidence level. "Unknown" is a valid answer and is shown as such.
- **Don't step on colleagues.** Half the "new" leads at any conference are already in the CRM, sometimes with an open deal. Showing HubSpot status inline prevents two reps contacting the same treasurer in the same week.

---

## 3. User flow

1. Rep opens a conference from the conference list and selects the **Prep** tab.
2. Header shows: `Last researched: 14 Aug 2026, 09:12 · [Research again]`. Research is cached. It is not run live when the rep clicks. A "Research again" button re-runs the agent and shows what is **new since last time**.
3. **Summary strip.** Four big numbers under the header, each clickable to filter the list:

   `125 attendees verified · 52 relevant · 45 ready to contact · 7 need coordination`

   - *Attendees verified* – named people with at least one Confirmed or Likely attendance signal.
   - *Relevant* – verified attendees at a Tier A or Tier B company, in a decision-maker or influencer role.
   - *Ready to contact* – relevant, and either not in HubSpot or owned by me, with no open deal. This is the rep's working list.
   - *Need coordination* – relevant, but owned by another rep or attached to an open deal. Talk to a colleague before acting.

4. **People view (default).** A ranked list of named people attending. Each row: name, title, company, attendance badge with the signal behind it ("LinkedIn, 3 days ago"), ICP tier, role fit, HubSpot status, prep status. `New` badge on anyone found since the rep last looked. A toggle switches to a **Companies view** that groups the same people under their company with the company-level fit reasons and signals.
5. Clicking a person opens the **Lead Outreach page** (section 6).
6. Rep works the list top down. Each lead has a prep status: `To contact → Contacted → Replied → Meeting booked → Not now`. Status is visible on the list so the rep sees their pipeline for that event at a glance.
7. Filters: ICP tier, attendance confidence, HubSpot status (new only / owned by me / owned by others), role fit, prep status.
8. A **Download full list** button exports everything as CSV. Reps consistently ask for the whole list, not just the top picks. They know their territory and want to apply their own judgement.

---

## 4. The research agent (the AI part)

**Input:** conference name, dates, event website URL, and the ICP definition used elsewhere in the tool.

**Step 1: Reconstruct the room.** The agent continuously listens to the open web for anything that says a company or a person will be at the event. Think of it as a radar that picks up every public "I'll be there," wherever it is said. In the ideal version it reads:

| Signal | Where it comes from | Attendance confidence it supports |
|---|---|---|
| A person announces they are attending | LinkedIn post, X post, Threads, Bluesky, personal newsletter | Confirmed (person-level) |
| A person is named speaker, panelist, or moderator | Agenda and speakers pages | Confirmed |
| A person is listed as booth or delegation staff | Exhibitor profiles in the event app or directory | Confirmed |
| Company announces "meet us at booth 42" or "our team will be at..." | Company blog, newsroom, LinkedIn company page, email newsletter | Likely (company yes, names sometimes) |
| Company is a sponsor or exhibitor | Sponsors and exhibitors pages | Likely (company yes, person unknown) |
| Case-study presenter, awards shortlist, startup pitch competition | Programme and awards pages | Confirmed |
| A person RSVPs to a side event, dinner, or rooftop party around the conference | Luma, Eventbrite, Partiful, partner-hosted pages | Likely |
| A person says it in a podcast, webinar, or interview ("we'll be in Amsterdam in June") | Transcripts, show notes | Likely |
| A person is tagged or pictured in someone else's "see you there" post | Social mentions and replies | Likely |
| Spoke, exhibited, or posted from the last one or two editions | Past programmes, past-year social posts, photo recaps | Probable returner |
| Person's calendar-style signals: "OOO at Money20/20", conference in their LinkedIn headline or banner | Profile fields, auto-replies quoted publicly | Likely |
| Press release "will exhibit at" or "will present at" | Company newsroom, wire services | Likely |
| Job posting or hiring note mentioning presence at the event ("meet our team at...") | Careers pages | Inferred |

Each signal is stored as `{ person_or_company, claim, quote, source_url, platform, date_posted, date_found }`.

**What a signal looks like to the rep.** Every signal is shown as a short, human-readable card with the quote and a link, so the rep can judge it in two seconds:

> **Sam Jones** · Head of Treasury, Acme Payments
> LinkedIn, 3 days ago: *"Heading to Money20/20 Amsterdam next week. Who else is going? Would love to swap notes on multi-currency settlement."*
> → Confirmed attending · Tier A company · Not in HubSpot

> **David Cohen** · CFO, Northwind Travel Group
> X, 9 days ago: *"Speaking on the treasury panel at ITB Berlin, Thursday 2pm. Come say hi."*
> → Confirmed attending (speaker) · Tier A company · In HubSpot, owned by another rep, last activity 14 months ago

> **Priya Natarajan** · VP Payments, Lumio Marketplace
> Luma RSVP, 5 days ago: *Going to "Fintech Founders Dinner, night before Money20/20"*
> → Likely attending · Tier B company · Not in HubSpot

> **Meridian Remit** (company, no named person yet)
> Company blog, 2 weeks ago: *"Our team will be at booth B14 all three days. Book a slot with us."*
> → Likely attending · Tier A company · Recommended target: Head of Treasury or Head of FX · Not in HubSpot

When a person announces attendance directly, that beats every other signal. It is the one case where the rep can open with "saw you're going to be there" and it is simply true.

**The radar keeps running.** In the ideal version the agent doesn't run once. It monitors, and the Prep tab shows a running feed: *"4 new people announced attendance since yesterday · 1 speaker cancelled · 2 title changes."* New arrivals surface at the top with a `New` badge so the rep can react while the signal is fresh, which is exactly when "saw your post" outreach works best.

**Step 2: Verify identity first.** Before enriching a company, the agent confirms the official website domain and stores it. Namesake confusion is the number one failure mode in this kind of research (a fintech called "Nova" and a healthcare company called "Nova" are not the same company). Getting the domain right up front prevents everything downstream from being about the wrong company.

**Step 3: Qualify against ICP.** For each company: vertical, cross-border footprint (markets served, currencies mentioned), size band, and any evidence of FX exposure or hedging (annual report language, earnings commentary about currency headwinds, treasury job postings). Output is a tier (A/B/C) **with the reasons listed**, not a black-box score. "Unknown" is allowed for any field.

**Step 4: Find the people.** For each relevant company, list the named people with evidence of attending, then the most relevant roles even without attendance evidence (Treasurer, CFO, Head of Payments, Head of FX). Mark clearly which people are confirmed attending and which are "the right person at a company that is attending."

**Step 5: Recent signals.** For each Tier A/B company, pull the last 6 to 12 months of public signals that matter for an FX conversation: expansion into new markets, new currencies or corridors, funding rounds, acquisitions, partnerships with payment providers, hiring a treasury team, annual report mentions of currency risk, earnings calls mentioning FX impact.

**Step 6: Synthesize the angle.** For each lead, produce one suggested angle: a single sourced fact plus one sentence on why it makes an FX risk conversation relevant now. Then a short draft message built around that angle (section 6).

**Rules the agent follows:**
- Every claim carries a quote and a URL. No source, no claim.
- Prefer primary sources (the company's own site, filings, the event's own pages) over aggregators.
- Freshness matters. A signal older than 18 months is flagged as stale. A "partnership" from years ago is not a current signal.
- Never invent a person, title, or quote. If the agent cannot find the right person, it says so.
- English-only output regardless of source language.

**Caching.** The rep never waits on live research. The agent works in the background, ideally continuously from about 10 weeks out, and the Prep tab always shows cached results with `Last researched: <timestamp>`. Each pass produces a diff: new people who announced attendance, new companies, changed titles, cancelled speakers. New items get a `New` badge. If the cache is older than 14 days, the Prep tab shows a gentle "research may be stale" warning. A `Research again` button triggers a fresh pass on demand.

---

## 5. Attendance confidence and ICP fit

Two independent dimensions, shown as two badges. A company can be a confirmed attendee with poor fit, or a perfect fit with weak attendance evidence. The rep needs to see both.

**Attendance confidence**
- `Confirmed` – named on the programme or exhibitor staff list
- `Likely` – company is sponsoring/exhibiting, or a person publicly said they are coming
- `Probable returner` – attended one or both of the last two editions
- `Inferred` – indirect signals only

**ICP fit** (company level, explainable)
- `Tier A` – target vertical (PSP, cross-border payments, travel wholesale, marketplaces, other FX-exposed businesses), clear multi-currency operations, decision-maker roles identifiable
- `Tier B` – target vertical or FX exposure, but one of the above is unclear
- `Tier C` – adjacent; worth a conversation if convenient
- `Excluded` – competitor, bank, or no FX exposure, with the reason shown

Default sort: Tier A + Confirmed first, then Tier A + Likely, then Tier B + Confirmed, and so on.

---

## 6. The Lead Outreach page

One page per person. Everything a rep needs to decide and act in under a minute.

**Header:** name, title, company, LinkedIn link, attendance badge with evidence on hover, ICP tier, HubSpot status, prep status selector.

**Why this person matters:** three to five bullets. Company fit reasons. Role fit. Attendance evidence. Each bullet has a source link and an evidence tag: `Verified` (primary source), `Cited` (secondary source), `Inferred`, or `Unknown`.

**Recent signals:** a short dated timeline of the last 6 to 12 months for the company. Each entry is one line plus a source.

**Suggested angle:** one sourced fact and one sentence on why it opens an FX conversation. Example shape: "Their Q2 update mentions expanding payouts into LATAM across six new currencies. That is a lot of new exposure, and most companies at that stage are still hedging manually or not at all."

**Draft message:** editable text box, pre-filled. Principles:
- Under 80 words.
- One fact about them, one reason Grain is relevant, one concrete ask ("15 minutes on Tuesday afternoon at the event?").
- Peer-to-peer tone. No hype, no feature list.
- Two variants: email and LinkedIn DM.
- The tool never sends anything. The rep copies, edits, and sends from their own inbox or LinkedIn. **The rep owns the words.** The AI's job is finding the fact, not speaking for the salesperson.

**Actions:** `Copy message` · `Open LinkedIn` · `Open email` · `Mark contacted` · `Create in HubSpot` (or `View in HubSpot` if they already exist) · `Add to field list` (pre-loads this person into the on-the-floor capture screen so at the event the rep gets a "Did you meet them?" prompt).

---

## 6a. Four example lead pages

Seed the prototype with pages like these. All people and companies below are fictional. The conference in the examples is Money20/20 Europe, Amsterdam, 2–4 June. Each page shows what the tool knows, how sure it is, and what it suggests the rep do. Evidence tags: `Verified` (primary source), `Cited` (secondary source), `Inferred`, `Unknown`.

---

### Example 1 — New lead, announced attendance himself

**Sam Jones** · Head of Treasury, Acme Payments
`Confirmed attending` · `Tier A` · `Not in HubSpot` · Prep status: **To contact**

**Contact**
- LinkedIn: linkedin.com/in/samjones-treasury `Verified`
- Email: sam.jones@acmepayments.com `Inferred` (matches the company's first.last pattern seen on two press contacts; not verified)

**Attendance evidence**
- LinkedIn, 3 days ago: *"Heading to Money20/20 Amsterdam next week. Who else is going? Would love to swap notes on multi-currency settlement."* `Verified`

**About Sam**
- Head of Treasury since Jan 2025, previously Treasury Manager at a UK e-commerce group (LinkedIn) `Verified`
- Posts roughly monthly, mostly about settlement timing, cash forecasting, and payment-rail costs `Cited`
- Role fit: **decision maker** for hedging and FX provider selection `Inferred` from title

**About Acme Payments**
- Payment service provider for mid-size European merchants selling cross-border. ~280 staff, HQ London, offices in Berlin and Lisbon `Verified` (company site, LinkedIn)
- Settles merchants in 14 currencies; added 6 in the last two quarters (PLN, CZK, SEK, NOK, MXN, BRL) `Verified` (Q1 product update on company blog)
- Hiring an "FX & Liquidity Analyst" – job post live 3 weeks `Verified`
- Current FX provider: `Unknown`
- Hedging today: `Unknown` – no public mention

**Relationship history**
- None. No HubSpot record for the person or the company.

**Recent signals**
- 3 days ago – Sam's LinkedIn post about attending
- 6 weeks ago – Blog: six new settlement currencies launched
- 3 weeks ago – Careers page: FX & Liquidity Analyst role opened

**Suggested angle**
Six new settlement currencies in two quarters, two of them emerging-market, plus hiring an FX analyst, says Acme's FX exposure just grew faster than their treasury tooling. Sam publicly asked to "swap notes on multi-currency settlement." Take him at his word and offer exactly that.

**Draft email** (72 words)
> Subject: Multi-currency settlement notes, Amsterdam
>
> Hi Sam, saw your post about Money20/20 and swapping notes on multi-currency settlement. Happy to. Six new settlement currencies in two quarters is a lot of new exposure, and most PSPs at that stage are still hedging manually or not at all. Grain helps payments companies lock rates on cross-border flows without a treasury desk. Would 15 minutes on Tuesday afternoon work? I'm around all three days. Best, [Rep]

**Draft LinkedIn DM** (41 words)
> Hi Sam, saw you're heading to Amsterdam and want to swap notes on multi-currency settlement. Same here. We work with PSPs on exactly the exposure that comes with adding currencies like MXN and BRL. Coffee Tuesday afternoon at the show?

**Next action:** send the LinkedIn DM today while his post is fresh. Email as a follow-up in 3 days if no reply.

---

### Example 2 — Speaker, already in HubSpot, owned by a colleague

**David Cohen** · CFO, Northwind Travel Group
`Confirmed attending (speaker)` · `Tier A` · `In HubSpot · owned by another rep · last activity 14 months ago` · Prep status: **Needs coordination**

**Contact**
- LinkedIn: linkedin.com/in/davidcohen-cfo `Verified`
- Email: d.cohen@northwindtravel.com `Verified` (in HubSpot)

**Attendance evidence**
- Agenda page: panel "Treasury in travel: managing volatility when you pay in one currency and sell in another", Thursday 14:00 `Verified`
- X, 9 days ago: *"Speaking on the treasury panel at Money20/20 Thursday 2pm. Come say hi."* `Verified`

**About David**
- CFO since 2022, previously Finance Director at a hotel bed bank `Verified`
- Role fit: **decision maker** `Verified` (CFO owns treasury; no separate treasurer on LinkedIn)

**About Northwind Travel Group**
- B2B travel wholesaler. Buys hotel and transfer inventory in EUR, USD, and THB, sells to agents in GBP, ILS, and ZAR. ~600 staff `Verified` (annual report)
- Annual report, FY2025: *"Adverse currency movements reduced gross margin by approximately 1.8 percentage points."* `Verified`
- Hedging today: *"The Group uses forward contracts on a portion of its committed inventory purchases."* `Verified` (same report) – so they hedge, but only partially and likely through a bank
- Current provider: `Unknown`

**Relationship history**
- HubSpot contact created 20 months ago by a colleague after an inbound webinar signup
- Last activity 14 months ago: a follow-up email, no reply
- Colleague's note: *"Said FX is handled by their bank, not a priority this year. Revisit."*
- No open deal

**Recent signals**
- 9 days ago – X post about the panel
- 4 months ago – Annual report: 1.8pp margin hit from FX, partial hedging
- 7 months ago – Press: acquired a small DMC in Thailand, adding THB cost base

**Suggested angle**
Fourteen months ago FX "wasn't a priority." Since then the annual report put a number on the pain and they added a Thai cost base. David is now speaking on a panel about exactly this. The topic has moved from "not a priority" to "on stage." The angle is the panel itself: ask a real question about it.

**Coordination step (shown before the drafts)**
> This contact is owned by [colleague]. Suggested message to them: *"David Cohen from Northwind is speaking on the treasury panel at Money20/20 Thursday. Your note from last year said revisit. I'll be there. OK if I reach out and reference the panel, or do you want to?"* `Send in Slack`

**Draft email** (78 words, unlocked once coordination is marked done)
> Subject: Your treasury panel on Thursday
>
> Hi David, I'll be at your panel on Thursday. The one-currency-in, another-currency-out problem is most of what we do at Grain for travel wholesalers. Your FY25 report mentioned forwards covering part of committed inventory. Curious how you decide what portion, especially with THB now in the mix. Would you have 15 minutes after the panel or on Friday morning? Happy to share what we're seeing across other bed banks. Best, [Rep]

**Next action:** coordinate with the owner first. Then email, not DM, since the relationship exists and he's a CFO.

---

### Example 3 — Likely attending, Tier B, lots of unknowns

**Priya Natarajan** · VP Payments, Lumio Marketplace
`Likely attending` · `Tier B` · `Not in HubSpot` · Prep status: **To contact**

**Contact**
- LinkedIn: linkedin.com/in/priyanatarajan `Verified`
- Email: `Unknown` – no public pattern found; two guesses possible, not shown

**Attendance evidence**
- Luma RSVP, 5 days ago: going to "Fintech Founders Dinner", the night before Money20/20 `Verified`
- Not on the speaker list. Company is not a sponsor. `Verified`

**About Priya**
- VP Payments for 18 months, previously led payouts at a gig-economy platform `Verified`
- Role fit: **influencer** – owns the payout product; hedging decisions likely sit with finance `Inferred`

**About Lumio Marketplace**
- Online marketplace for independent home-goods makers. Pays sellers in 30 countries. ~900 staff, HQ Dublin `Verified`
- Announced local-currency seller payouts in Brazil and Mexico 2 months ago `Verified` (product blog)
- Whether Lumio carries the FX itself or a payout provider absorbs it: `Unknown`. This is the question that decides whether they are Tier A or not relevant.
- Hedging today: `Unknown`
- Current provider: `Unknown`

**Relationship history**
- None.

**Recent signals**
- 5 days ago – Side-event RSVP
- 2 months ago – Local-currency payouts in BRL and MXN
- 5 months ago – Series C announced, expansion into LATAM and SE Asia stated as the use of funds

**Suggested angle**
Too many unknowns to pitch. The right move is a question, not a claim. Local-currency payouts in BRL and MXN mean someone is holding the FX between the buyer's currency and the seller's. Ask who. If it's Lumio, they're Tier A and this becomes a real conversation. If it's their payout provider, move on politely.

**Draft LinkedIn DM** (48 words)
> Hi Priya, looks like we'll both be at the Founders Dinner on Monday. Congrats on the BRL and MXN payouts. Quick question I'm curious about as someone who works on FX for marketplaces: does Lumio hold the currency exposure on those, or does your payout partner? Happy to compare notes at the dinner.

**Draft email:** not offered. No verified address, and a cold email with a guessed address to a Tier B lead isn't worth the risk.

**Next action:** DM before the dinner. Qualify in person. Update tier after.

---

### Example 4 — Second encounter, relationship history exists

**Marcus Oyelaran** · Treasury Director, Payloom
`Confirmed attending (speaker)` · `Tier A` · `In HubSpot · owned by me` · Prep status: **To contact**
**Cross-conference:** 2nd encounter · last met 12 months ago at this same event

**Contact**
- LinkedIn: linkedin.com/in/marcusoyelaran `Verified`
- Email: marcus@payloom.io `Verified` (in HubSpot, replied from it once)

**Attendance evidence**
- Speakers page: fireside chat "Building payouts into 40 markets", Wednesday 11:30 `Verified`
- Spoke at last year's edition too `Verified` (past programme)

**About Marcus**
- Treasury Director since 2023, built Payloom's treasury function from scratch `Verified`
- Role fit: **decision maker** `Verified` (told us so last year)

**About Payloom**
- Cross-border payouts platform for platforms and marketplaces. 40 payout markets, 28 currencies. ~350 staff, HQ Amsterdam `Verified`
- Series C, 7 months ago, "to expand into 12 new corridors across Africa and LATAM" `Verified`
- Hedging today: last year Marcus said they hedge "the big pairs with our bank, the rest we eat" `Verified` (field-capture note)
- Current provider: their bank, unnamed `Cited` (from that conversation)

**Relationship history**
- **12 months ago, this conference (field capture):** *"Good chat at the booth. Hedges majors with bank, eats the rest. Evaluating two fintech providers. Said revisit Q1."*
- **11 months ago:** follow-up email sent with a one-pager. He replied: *"Thanks, will come back to you in the new year."*
- **8 months ago:** second follow-up. No reply.
- **5 months ago:** he liked a Grain LinkedIn post about emerging-market corridors.
- No open deal. Lifecycle stage: Lead.

**Recent signals**
- Speaker at this event again
- 7 months ago – Series C, 12 new corridors in Africa and LATAM
- 3 months ago – Payloom job post: "Treasury Analyst, emerging markets FX"

**Relationship read (the cross-conference nudge)**
> Second encounter. Last time: evaluating, said revisit Q1, then went quiet after one reply. Since then: raised a round, committed to 12 emerging-market corridors, started hiring for EM FX, and liked our EM corridor post. His "we eat the rest" problem just got 12 corridors bigger. **Read: warming, not tire-kicking. The circumstances changed, not just the calendar. Ask directly for a meeting and reference last year without apology.**

**Suggested angle**
Last year he said the majors are hedged and the rest they absorb. The Series C means "the rest" is about to be most of the business. The fireside chat title is literally about that expansion. Reference last year's conversation as a starting point, not an excuse.

**Draft email** (79 words)
> Subject: Picking up from last year's Money20/20
>
> Hi Marcus, we spoke at Grain's booth last year. You were hedging the majors through your bank and absorbing the rest while you evaluated options. Since then you've raised and committed to 12 new corridors across Africa and LATAM, which sounds like "the rest" just became the main event. I'll be at your fireside chat Wednesday. Could we grab 20 minutes afterwards? I'd like to show you what we've built for exactly those corridors since we last spoke. Best, [Rep]

**Draft LinkedIn DM** (44 words)
> Hi Marcus, good to see you're speaking again this year. We spoke at the booth last time about hedging beyond the majors. With the 12 new corridors, that problem's probably grown. I'll be at your session Wednesday. Twenty minutes after for a coffee?

**Next action:** email now, he's replied to email before. DM the day before the event as a reminder. At the event, the field capture screen will show "You planned to meet Marcus – Wednesday 11:30 fireside chat" with a one-tap `Met / Didn't meet`.

---

## 7. HubSpot awareness

For every company and person, the tool checks HubSpot and shows one of:

- `Not in HubSpot` – green. A genuinely new lead. One click creates the contact and company with `Source: <conference name> prep` and the attendance evidence in the notes.
- `In HubSpot · owned by <name> · last activity 7 months ago` – amber. Exists but dormant. Talk to the owner before reaching out, or claim it if unowned.
- `In HubSpot · open deal` – red. Do not cold-outreach. Coordinate with the deal owner. The conference is a chance to advance the deal, not restart it.

Lookup is by email if known, otherwise company domain plus name. For the prototype this can run against a real HubSpot account with a user-supplied API key, or against a seeded mock CRM table that behaves the same way. Either is fine as long as the three states are shown and the "Create in HubSpot" action is demonstrated.

---

## 8. Prototype scope: what to build, what to fake

This is a prototype. The goal is to show the thinking, not to run a production research pipeline.

- **Seed two or three conferences** with pre-generated research results. Generate them once, offline, with whatever AI tool you like. Store as JSON. The tool displays them with the timestamp of when they were generated.
- **Mix real and illustrative signals.** Speaker and sponsor signals can point at real public pages so the evidence links work. Person-level social signals ("Sam Jones posted on LinkedIn...") can be illustrative, with fictional people at fictional-but-plausible companies, as long as they look and behave exactly like the real thing: platform icon, quote, date, link. The point is to show what the radar *would* catch, not to prove it caught it.
- **"Research again" can be simulated.** Show a progress state ("Scanning speaker pages… Checking sponsor list… Matching against ICP…") and then either reload the same data or load a second pre-generated snapshot that contains a few diffs, so the "new since last research" concept is visible.
- **Outreach angles and drafts can be pre-generated** for the seeded leads. Optionally wire one live "regenerate draft" button to an LLM with a user-supplied key to show it working for real.
- **HubSpot status** can come from a seeded mock table with a mix of the three states.
- **Keep evidence real where you can.** A demo where a rep hovers over a badge and sees an actual quote from an actual speaker page is far more convincing than lorem ipsum.

---

## 9. Edge cases worth handling, or at least naming in the video

- **Namesake companies.** Verify the domain before enriching. Show the domain on the company card.
- **Job changes.** The speaker page says "Head of Treasury at Company A" but LinkedIn now says Company B. Show both, flag the conflict, let the rep decide.
- **Subsidiaries and brands.** A company attends under a brand name. Map to the parent where known and show both.
- **Cancelled speakers.** A re-run finds the person removed from the agenda. Downgrade confidence and flag it.
- **Stale research.** Timestamp older than 14 days triggers a warning.
- **Already known.** If the rep has met this person before (from field capture at a previous event), the outreach page shows the history first and the suggested angle adapts: "you met at X in March, they were evaluating providers."
- **Right company, no named person.** Company is a confirmed exhibitor but nobody is named. Show the company with the recommended role to target and a "find the right person" note.
- **Competitors in the room.** Detect and exclude, but show them in a collapsed "also attending" section. Reps like knowing who else is pitching.

---

## 10. How this connects to the rest of the tool

- **The AI feature.** This is the meaningful AI feature: unstructured public web into a structured, sourced, ranked contact list with fact-based openers. AI is the right tool because the input is messy and scattered, the output needs judgement about relevance, and doing it by hand takes days per conference.
- **Cross-conference tracking.** Probable returners (people who spoke at the last two editions) are the first layer of cross-conference intelligence, before the rep has met anyone. Leads pushed from prep into the field list carry forward, so a person captured at the event links back to the prep record and the outreach history.
- **HubSpot path.** The status check is the read side. "Create in HubSpot" is the write side. Together they are the full path.
- **Conference scoring.** The number of Tier A confirmed people in the room is itself a conference prioritization signal, arguably a better one than audience size. A 2,000-person event with 40 Tier A treasurers beats a 20,000-person event with none. Feed this count back into the conference score.
- **Planning view.** Once prep runs for several events, the planning view can show "qualified people in the room" per event across the year, which is what a sales leader actually wants when deciding where to send people.
- **Field capture.** The prep list pre-loads into the field interface. On the show floor, the rep sees "You planned to meet these 12 people" with a one-tap "Met / Didn't meet" instead of typing names from scratch.

---

## 11. Talking points for the video

- Why the research is cached and timestamped rather than live: research is a job done weeks before the event, and a tool that is honest about *when* it last looked is more trustworthy than one that pretends to know right now.
- Why the angle is a sourced fact and the message is the rep's: the AI is excellent at finding and citing, and salespeople need to own what they say. Auto-sending AI prose is how companies lose deals and reputations.
- Why attendance confidence and ICP fit are separate badges: they are different questions and collapsing them into one score hides the reasoning.
- Why HubSpot status is on the list and not buried in a detail view: the most expensive mistake at a conference is two reps hitting the same account.
- Why "Unknown" is displayed rather than hidden: a list that admits its gaps gets used; a list that bluffs gets ignored after the first wrong claim.
- What you would build next: scheduled weekly re-runs with a diff digest, the rep's own past messages as templates for the drafts, and a post-conference retro that scores which prep leads turned into meetings, to improve the ranking over time.
