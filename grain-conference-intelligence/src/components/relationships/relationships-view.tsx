"use client";

import Link from "next/link";

import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import { useWorkspace } from "@/workspace/provider";

export function RelationshipsView() {
  const { state, dispatch } = useWorkspace();
  const pending = state.matchReviews.filter((review) => itemPending(review.status));

  return (
    <section className="page-stack" aria-labelledby="relationships-title">
      <div>
        <p className="eyebrow">Relationships</p>
        <h1 id="relationships-title">Contacts and match review</h1>
      </div>
      {pending.length > 0 ? (
        <section className="workspace-card compact">
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
              <div className="decision-row">
                {review.candidateIds.map((contactId) => (
                  <button
                    key={contactId}
                    type="button"
                    className="chip"
                    onClick={() => dispatch({ type: "match/accept", reviewId: review.id, contactId })}
                  >
                    Accept {contactId}
                  </button>
                ))}
                <button type="button" className="chip" onClick={() => dispatch({ type: "match/reject", reviewId: review.id })}>
                  Keep separate
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <ul className="conference-list">
        {state.contacts.map((contact) => {
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
                    {contact.role} · {contact.company} · {eligibility.state} · {eligibility.encounterCount} encounters
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function itemPending(status: string): boolean {
  return status === "pending";
}
