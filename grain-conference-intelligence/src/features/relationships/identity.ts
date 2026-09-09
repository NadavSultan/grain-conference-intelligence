export interface IdentityContact {
  id: string;
  name: string;
  company: string;
  domain?: string;
  email?: { value: string; confidence: "verified" | "inferred" };
  linkedIn?: { value: string; confidence: "verified" };
}

export interface IdentityCandidate {
  name: string;
  company?: string;
  domain?: string;
  email?: string;
  linkedIn?: string;
}

export type IdentityResult =
  | { kind: "exact"; contactId: string }
  | { kind: "review"; candidateIds: string[] }
  | { kind: "new" };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeLinkedIn(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function resolveIdentity(
  candidate: IdentityCandidate,
  contacts: IdentityContact[],
): IdentityResult {
  const emailMatches = candidate.email
    ? contacts.filter(
        (contact) =>
          contact.email?.confidence === "verified" &&
          contact.email.value &&
          normalizeEmail(contact.email.value) === normalizeEmail(candidate.email ?? ""),
      )
    : [];
  const linkedInMatches = candidate.linkedIn
    ? contacts.filter(
        (contact) =>
          contact.linkedIn?.confidence === "verified" &&
          normalizeLinkedIn(contact.linkedIn.value) === normalizeLinkedIn(candidate.linkedIn ?? ""),
      )
    : [];

  const exactIds = [...new Set([...emailMatches, ...linkedInMatches].map((item) => item.id))];
  if (exactIds.length === 1) return { kind: "exact", contactId: exactIds[0] };
  if (exactIds.length > 1) return { kind: "review", candidateIds: exactIds.sort() };

  const reviewIds = new Set<string>();
  if (candidate.email) {
    for (const contact of contacts) {
      if (
        contact.email &&
        normalizeEmail(contact.email.value) === normalizeEmail(candidate.email) &&
        contact.email.confidence !== "verified"
      ) {
        reviewIds.add(contact.id);
      }
    }
  }

  const candidateName = normalizeName(candidate.name);
  const candidateDomain = candidate.domain?.trim().toLowerCase();
  for (const contact of contacts) {
    const nameSimilar = normalizeName(contact.name) === candidateName;
    const domainSimilar =
      Boolean(candidateDomain && contact.domain && contact.domain.toLowerCase() === candidateDomain);
    const companySimilar = Boolean(
      candidate.company &&
        normalizeName(contact.company) &&
        (normalizeName(contact.company).includes(normalizeName(candidate.company ?? "")) ||
          normalizeName(candidate.company ?? "").includes(normalizeName(contact.company))),
    );
    if (nameSimilar && (domainSimilar || companySimilar || !candidate.email && !candidate.linkedIn)) {
      reviewIds.add(contact.id);
    }
  }

  if (reviewIds.size > 0) return { kind: "review", candidateIds: [...reviewIds].sort() };
  return { kind: "new" };
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
