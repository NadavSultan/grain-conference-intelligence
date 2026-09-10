"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, humanizeToken } from "@/components/ui/badge";
import { Button, ButtonRow } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StackList } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
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
        title="Contacts and match review"
        titleId="relationships-title"
      />
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
      <StackList className="conference-list">
        {contacts.map((contact) => {
          const eligibility = deriveRelationshipEligibility(
            state.timeline.filter((entry) => entry.personId === contact.id),
          );
          return (
            <li key={contact.id}>
              <article className="conference-card">
                <div>
                  <h2>
                    <Link href={`/relationships/${contact.id}`}>{contact.name}</Link>
                  </h2>
                  <p>
                    {contact.role} · {contact.company} · {humanizeToken(eligibility.state)} · {eligibility.encounterCount} encounters
                  </p>
                </div>
                <Badge>{humanizeToken(eligibility.state)}</Badge>
              </article>
            </li>
          );
        })}
      </StackList>
    </section>
  );
}

function itemPending(status: string): boolean {
  return status === "pending";
}
