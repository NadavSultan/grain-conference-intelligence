"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, humanizeToken } from "@/components/ui/badge";
import { Button, ButtonRow, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StackList } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { CONFERENCES } from "@/data/conferences";
import { FULL_PROFILE_IDS, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import { useWorkspace } from "@/workspace/provider";

export function RelationshipsView() {
  const { state, dispatch } = useWorkspace();
  const [query, setQuery] = useState("");
  const pending = state.matchReviews.filter((review) => itemPending(review.status));
  const contacts = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return state.contacts;
    return state.contacts.filter((contact) =>
      `${contact.name} ${contact.company} ${contact.role}`.toLowerCase().includes(lowered),
    );
  }, [query, state.contacts]);

  return (
    <section className="page-stack" aria-labelledby="relationships-title">
      <PageHeader
        eyebrow="Relationships"
        title="Verified conference leads"
        titleId="relationships-title"
        description="People verified as attending upcoming conferences, with the context you need to book a meeting before the room gets busy."
      />
      <div className="relationship-summary-grid">
        <Card><span className="relationship-summary-label">Verified attending</span><strong>{contacts.length}</strong><span>Upcoming conference leads</span></Card>
        <Card><span className="relationship-summary-label">Ready to message</span><strong>{contacts.filter((contact) => profileFor(contact.id)?.drafts.linkedIn || profileFor(contact.id)?.drafts.email).length}</strong><span>Personalized drafts available</span></Card>
        <Card><span className="relationship-summary-label">Needs a next step</span><strong>{contacts.filter((contact) => deriveRelationshipEligibility(state.timeline.filter((entry) => entry.personId === contact.id)).state !== "warming").length}</strong><span>Relationships to qualify</span></Card>
      </div>
      {pending.length > 0 ? (
        <Card>
          <h2>Match review</h2>
          {pending.map((review) => (
            <article key={review.id}>
              <p>
                Captured{" "}
                {state.contacts.find((contact) => contact.id === review.capturedContactId)?.name ??
                  review.capturedContactId}{" "}
                may match{" "}
                {review.candidateIds
                  .map(
                    (contactId) =>
                      state.contacts.find((contact) => contact.id === contactId)?.name ?? contactId,
                  )
                  .join(", ")}
                .
              </p>
              <ButtonRow>
                {review.candidateIds.map((contactId) => (
                  <Button
                    key={contactId}
                    onClick={() => dispatch({ type: "match/accept", reviewId: review.id, contactId })}
                  >
                    Accept {contactId}
                  </Button>
                ))}
                <Button onClick={() => dispatch({ type: "match/reject", reviewId: review.id })}>
                  Keep separate
                </Button>
              </ButtonRow>
            </article>
          ))}
        </Card>
      ) : null}
      <Toolbar>
        <label className="field-label">
          Search
          <span className="toolbar-search">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or company" />
          </span>
        </label>
      </Toolbar>
      <StackList className="relationship-lead-list">
        {contacts.map((contact) => {
          const eligibility = deriveRelationshipEligibility(
            state.timeline.filter((entry) => entry.personId === contact.id),
          );
          const profile = profileFor(contact.id);
          const conference = CONFERENCES.find((item) => item.demoScenarioId === "money20-eu-demo");
          const latestSignal = profile?.recentSignals[0] ? cleanDemoCopy(profile.recentSignals[0]) : "No recent signal captured yet.";
          const priorCommunicationRaw = profile?.relationshipHistory.find((item) => !/^none\.?$/i.test(item));
          const priorCommunication = priorCommunicationRaw ? cleanDemoCopy(priorCommunicationRaw) : "No prior communication recorded.";
          return (
            <li key={contact.id}>
              <article className="relationship-lead-card">
                <div className="relationship-lead-identity">
                  <div className="profile-avatar" aria-hidden="true">{contact.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                  <div>
                    <div className="relationship-lead-title-row">
                      <h2><Link href={`/relationships/${contact.id}`}>{contact.name}</Link></h2>
                      <Badge tone="success">Verified attending</Badge>
                    </div>
                    <p>{contact.role} · {contact.company}</p>
                    <p className="relationship-conference-context">{conference?.name ?? "Upcoming conference"} · {conference?.startDate ?? "Date to confirm"}</p>
                  </div>
                </div>
                <div className="relationship-lead-insights">
                  <div><span>Latest signal</span><p>{latestSignal}</p></div>
                  <div><span>Prior communication</span><p>{priorCommunication}</p></div>
                  <div><span>Relationship</span><p>{humanizeToken(eligibility.state)} · {eligibility.encounterCount} actual {eligibility.encounterCount === 1 ? "meeting" : "meetings"}</p></div>
                </div>
                <div className="relationship-lead-actions">
                  <Badge tone={eligibility.state === "warming" ? "success" : "info"}>{humanizeToken(eligibility.state)}</Badge>
                  <Link href={`/relationships/${contact.id}`} className={buttonClassName("primary", "sm")}>Review message</Link>
                  <Link href={`/relationships/${contact.id}`} className={buttonClassName("ghost", "sm")}>View profile</Link>
                </div>
              </article>
            </li>
          );
        })}
      </StackList>
    </section>
  );
}

function profileFor(contactId: string) {
  return FULL_PROFILE_IDS.includes(contactId as FullProfileId) ? PROFILES[contactId as FullProfileId] : null;
}

function cleanDemoCopy(value: string): string {
  return value
    .replace(/—\s*Verified\s*fictional\s*exhibit/gi, "— Verified")
    .replace(/\bfictional\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/Verified exhibit/gi, "Verified")
    .trim()
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function itemPending(status: string): boolean {
  return status === "pending";
}
